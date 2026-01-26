import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { asyncHandler, AppError } from '../../common/http.js';
import { createLead, updateLead, findNextResponsible, addActivity } from '../leads/leads.service.js';
import { PipelineModel } from '../pipelines/pipeline.model.js';
import { StageModel } from '../pipelines/stage.model.js';
import { LeadModel } from '../leads/lead.model.js';
import { UserModel } from '../users/user.model.js';
import { Note } from '../../models/Note.model.js'; 

const SYSTEM_ID = process.env.SYSTEM_USER_ID || '000000000000000000000000';

const TIPOS_CNPJ_VALIDOS = [
  "MEI", "ME", "EI", "EPP", "SLU", "LTDA", "SS", "SA", 
  "Média", "Grande", "Outro", "Outros"
];

const normalizarTelefone = (phone: string): string => {
  if (!phone) return '';
  let cleaned = phone.replace(/[^\d+]/g, '');
  if (cleaned.startsWith('55') && !cleaned.startsWith('+')) cleaned = '+' + cleaned;
  if (!cleaned.startsWith('+') && cleaned.length <= 11) cleaned = '+55' + cleaned;
  return cleaned;
};

const textoParaBooleano = (texto: any): boolean => {
  if (!texto) return false;
  const t = String(texto).toLowerCase().trim();
  return t === 'sim' || t === 'yes' || t === 'true' || t === 's' || t === '1';
};

const formatarFaixasEtarias = (buckets: number[]): string => {
  if (!buckets || buckets.length === 0) return '-';
  const labels = [
    '0 a 18', '19 a 23', '24 a 28', '29 a 33', '34 a 38',
    '39 a 43', '44 a 48', '49 a 53', '54 a 58', '59 ou mais'
  ];
  return buckets.map((qtd, index) => {
    const label = labels[index] || `Faixa ${index + 1}`;
    return `${label} = ${qtd}`;
  }).join('\n');
};

const processarFaixasEtarias = (textoInput: string) => {
  const faixas = {
    ate18: 0, de19a23: 0, de24a28: 0, de29a33: 0, de34a38: 0,
    de39a43: 0, de44a48: 0, de49a53: 0, de54a58: 0, acima59: 0
  };
  const idadesArray = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

  if (!textoInput || typeof textoInput !== 'string') {
    return { faixas, idadesArray };
  }

  const mapaDeChaves: Record<number, keyof typeof faixas> = {
    1: 'ate18', 2: 'de19a23', 3: 'de24a28', 4: 'de29a33', 5: 'de34a38',
    6: 'de39a43', 7: 'de44a48', 8: 'de49a53', 9: 'de54a58', 10: 'acima59'
  };

  const partes = textoInput.split(',');

  partes.forEach(parte => {
    const [codigoStr, qtdStr] = parte.trim().split(':');
    const codigo = parseInt(codigoStr);
    const qtd = parseInt(qtdStr);

    if (!isNaN(codigo) && !isNaN(qtd) && codigo >= 1 && codigo <= 10) {
      const chave = mapaDeChaves[codigo];
      if (chave) faixas[chave] = qtd;
      idadesArray[codigo - 1] = qtd;
    }
  });

  return { faixas, idadesArray };
};

const gerarResumoTecnicoWebhook = (dados: any) => {
  const { temCnpj, tipoCNPJ, temPlano, operadora, hospitalPreferencia, textoFaixas } = dados;
  
  const detalheCnpj = temCnpj && tipoCNPJ ? `(${tipoCNPJ})` : '';
  const detalhePlano = temPlano && operadora ? `(${operadora})` : '';

  return `
DADOS TÉCNICOS DO FORMULÁRIO:

 CNPJ: ${temCnpj ? 'SIM' : 'NÃO'} ${detalheCnpj}
 Plano Atual: ${temPlano ? 'SIM' : 'NÃO'} ${detalhePlano}
 Hospitais: ${hospitalPreferencia && hospitalPreferencia.length ? hospitalPreferencia : 'Não informado'}
 Faixas Etárias:
${textoFaixas}
`.trim();
};

export const webhookHandler = asyncHandler(async (req: Request, res: Response) => {
  
  // --- SEGURANÇA CORRIGIDA ---
  // A senha padrão agora bate com a do seu Make
  const webhookSecret = process.env.WEBHOOK_SECRET || 'SenhaDificilQueVoceColocouNoMake';
  const requestToken = req.headers['x-webhook-token'] || req.query.token;

  // Se as senhas não forem idênticas, bloqueia
  if (requestToken !== webhookSecret) {
    console.log(`[WEBHOOK BLOCK] Tentativa com token inválido: ${requestToken}`);
    return res.status(403).json({ error: 'Acesso negado. Token inválido.' });
  }
  // ---------------------------

  const { 
    nome, email, telefone, origem, quantidadeVidas, observacoes,
    cidade, city, City, 
    estado, state, State, 
    investimento, possuiCNPJ, jaTemPlano, hospitalPreferencia,
    distribuicaoVidas, tipoCNPJ, operadora
  } = req.body;

  console.log('[WEBHOOK] Payload recebido:', req.body);

  if (!nome || !telefone) {
    return res.status(StatusCodes.BAD_REQUEST).json({ 
      error: 'Nome e Telefone são obrigatórios.' 
    });
  }

  // --- TRATAMENTO ---
  let phoneClean = normalizarTelefone(telefone);

  const isTestLead = nome.toLowerCase().includes('test lead') || 
                     nome.toLowerCase().includes('dummy data') ||
                     telefone.includes('dummy data');

  if (phoneClean.length < 5 && isTestLead) {
      console.log('[WEBHOOK] Lead de Teste detectado: Injetando telefone fictício válido.');
      phoneClean = '+5511999999999'; 
  }
  
  let emailClean = email ? email.trim().toLowerCase() : '';
  if (emailClean === '-' || emailClean === 'nao' || emailClean.length < 5 || !emailClean.includes('@')) {
     emailClean = ''; 
  }
  if (isTestLead && (!emailClean || emailClean === '')) {
      emailClean = 'teste_facebook@exemplo.com';
  }

  let cnpjTypeFinal = '';
  if (tipoCNPJ && TIPOS_CNPJ_VALIDOS.includes(tipoCNPJ)) {
    cnpjTypeFinal = tipoCNPJ;
  }

  const cidadeFinal = [cidade, city, City].find(val => val && val.trim().length > 0) || 'A verificar';
  const estadoFinal = [estado, state, State].find(val => val && val.trim().length > 0) || 'SP';

  const { faixas, idadesArray } = processarFaixasEtarias(distribuicaoVidas);
  const somaFaixas = idadesArray.reduce((acc, curr) => acc + curr, 0);

  let livesFromField = 0;
  if (quantidadeVidas) {
    const stringVidas = String(quantidadeVidas);
    const numerosEncontrados = stringVidas.match(/\d+/g); 
    if (numerosEncontrados) {
      livesFromField = numerosEncontrados.reduce((acc, num) => acc + Number(num), 0);
    }
  }

  let lives = Math.max(somaFaixas, livesFromField);
  if (lives === 0) lives = 1;

  const textoFaixas = formatarFaixasEtarias(idadesArray);

  const temCnpj = textoParaBooleano(possuiCNPJ);
  const temPlano = textoParaBooleano(jaTemPlano);
  const valorEstimado = Number(investimento) || 0;
  const listaHospitais = hospitalPreferencia ? [hospitalPreferencia] : [];

  const dadosFormatados = { 
    investimento: valorEstimado, 
    hospitalPreferencia: listaHospitais.join(', '), 
    temCnpj, 
    temPlano, 
    cidade: cidadeFinal, 
    estado: estadoFinal, 
    tipoCNPJ: cnpjTypeFinal,   
    operadora,
    textoFaixas
  };

  const searchConditions: any[] = [{ phone: phoneClean }];
  if (emailClean && emailClean !== '') {
    searchConditions.push({ email: emailClean });
  }

  const existingLead = await LeadModel.findOne({ $or: searchConditions });

  // CASO 1: ATUALIZAÇÃO
  if (existingLead) {
    console.log(`[WEBHOOK] Atualizando Lead: ${existingLead.name}`);

    const pipelineDefault = await PipelineModel.findOne({ key: 'default' }) || await PipelineModel.findOne();
    const stageNovo = await StageModel.findOne({ pipelineId: pipelineDefault?._id, key: 'novo' });

    let novoDono = existingLead.owners || [];
    let houveRedistribuicao = false;
    
    // Sticky Routing
    const donoAtualId = (existingLead.owners && existingLead.owners.length > 0) ? existingLead.owners[0] : null;
    let manterDonoAtual = false;
    if (donoAtualId) {
      const regraCnpj = temCnpj ? { $in: ['required', 'both'] } : { $in: ['forbidden', 'both'] };
      const donoQualificado = await UserModel.findOne({
        _id: donoAtualId,
        active: true,
        'distribution.active': true,
        'distribution.minLives': { $lte: lives },
        'distribution.maxLives': { $gte: lives },
        'distribution.cnpjRule': regraCnpj
      });
      if (donoQualificado) manterDonoAtual = true;
    }
    
    if (!manterDonoAtual) {
      const donoDistribuido = await findNextResponsible(lives, temCnpj);
      if (donoDistribuido) {
        novoDono = [donoDistribuido as any];
        houveRedistribuicao = true;
      }
    }

    if (observacoes && observacoes.trim() !== '') {
      await Note.create({
        leadId: existingLead._id,
        conteudo: `[Observação do Formulário]: ${observacoes}`,
        userId: SYSTEM_ID as any, 
        userName: 'Webhook (Site)', 
        isPinned: true            
      });
    }

    const resumoTecnico = gerarResumoTecnicoWebhook(dadosFormatados);
    const logUnificado = houveRedistribuicao 
      ? `Lead atualizado via Webhook (REDISTRIBUÍDO).\n\n${resumoTecnico}` 
      : `Lead atualizado via Webhook.\n\n${resumoTecnico}`;

    const leadAny = existingLead as any;

    await updateLead(existingLead._id.toString(), {
      name: nome,
      phone: phoneClean,
      email: (emailClean && emailClean !== '') ? emailClean : existingLead.email,
      livesCount: lives,
      avgPrice: valorEstimado,
      hasCnpj: temCnpj,
      hasCurrentPlan: temPlano,
      preferredHospitals: listaHospitais.length ? listaHospitais : leadAny.preferredHospitals,
      city: (cidadeFinal !== 'A verificar' || !existingLead.city) ? cidadeFinal : existingLead.city,
      state: estadoFinal || existingLead.state,
      owners: novoDono,
      faixasEtarias: faixas,
      ageBuckets: idadesArray,
      cnpjType: cnpjTypeFinal, 
      currentPlan: operadora || '', 
      pipelineId: pipelineDefault?._id.toString(),
      stageId: stageNovo ? stageNovo._id.toString() : existingLead.stageId,
      lastActivity: new Date()
    });

    await addActivity(
      existingLead._id.toString(),
      'lead_atualizado', 
      { descricao: logUnificado }, 
      SYSTEM_ID
    );

    return res.status(StatusCodes.CREATED).json({ success: true, action: 'updated' });
  }

  // CASO 2: CRIAÇÃO
  const pipeline = await PipelineModel.findOne({ key: 'default' }) || await PipelineModel.findOne();
  const stage = await StageModel.findOne({ pipelineId: pipeline?._id, key: 'novo' }) || await StageModel.findOne({ pipelineId: pipeline?._id });

  if (!pipeline || !stage) return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: 'Configuração de Funil ausente.' });

  const donoInicial = await findNextResponsible(lives, temCnpj);
  const ownersList = donoInicial ? [donoInicial] : []; 
  
  const logTecnicoUnificado = `Lead criado via Site.\n\n${gerarResumoTecnicoWebhook(dadosFormatados)}`;

  const resultLead = await createLead({
    name: nome,
    phone: phoneClean,
    email: emailClean,
    origin: origem || 'Meta Ads', 
    pipelineId: pipeline._id.toString(),
    stageId: stage._id.toString(),
    livesCount: lives,
    hasCnpj: temCnpj,
    avgPrice: valorEstimado,
    notes: '', 
    city: cidadeFinal, 
    state: estadoFinal, 
    owners: ownersList,
    rank: 'c' + Date.now(),
    hasCurrentPlan: temPlano,
    preferredHospitals: listaHospitais,
    faixasEtarias: faixas,
    ageBuckets: idadesArray,
    cnpjType: cnpjTypeFinal,
    currentPlan: operadora || '', 
    customCreationLog: logTecnicoUnificado
  });

  if (!resultLead) throw new AppError('Erro ao processar o Lead.', StatusCodes.INTERNAL_SERVER_ERROR);

  if (observacoes && observacoes.trim() !== '') {
    await Note.create({
      leadId: resultLead._id,
      conteudo: `[Observação Inicial]: ${observacoes}`,
      userId: SYSTEM_ID as any,
      userName: 'Webhook (Site)',
      isPinned: true
    });
  }

  return res.status(StatusCodes.CREATED).json({ success: true, action: 'created', leadId: resultLead._id });
});