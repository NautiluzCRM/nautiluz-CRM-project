import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { asyncHandler, AppError } from '../../common/http.js';
import { createLead, updateLead, findNextResponsible } from '../leads/leads.service.js';
import { PipelineModel } from '../pipelines/pipeline.model.js';
import { StageModel } from '../pipelines/stage.model.js';
import { LeadModel } from '../leads/lead.model.js';
import { UserModel } from '../users/user.model.js';
import { Note } from '../../models/Note.model.js'; 

const SYSTEM_ID = '000000000000000000000000';

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
  const { investimento, hospitalPreferencia, temCnpj, temPlano, cidade, estado, tipoCNPJ, operadora } = dados;
  return `
DADOS TÉCNICOS (WEBHOOK):
---------------------------
Investimento: R$ ${investimento || '0,00'}
Hospital: ${hospitalPreferencia || '-'}
CNPJ: ${temCnpj ? 'SIM' : 'NÃO'} ${tipoCNPJ ? `(${tipoCNPJ})` : ''}
Plano Atual: ${temPlano ? 'SIM' : 'NÃO'} ${operadora ? `(${operadora})` : ''}
Local: ${cidade || '-'} / ${estado || '-'}
`.trim();
};

export const webhookHandler = asyncHandler(async (req: Request, res: Response) => {
  
  const webhookSecret = process.env.WEBHOOK_SECRET || 'minha_senha_super_secreta';
  const requestToken = req.headers['x-webhook-token'] || req.query.token;

  if (requestToken !== webhookSecret) {
    console.log(`[ALERTA] Bloqueio de Segurança Webhook.`);
    return res.status(403).json({ error: 'Acesso negado.' });
  }

  const { 
    nome, email, telefone, origem, quantidadeVidas, observacoes,
    cidade, estado, investimento, possuiCNPJ, jaTemPlano, hospitalPreferencia,
    distribuicaoVidas, tipoCNPJ, operadora
  } = req.body;

  console.log('[WEBHOOK] Payload recebido:', req.body);

  if (!nome || !telefone) {
    return res.status(StatusCodes.BAD_REQUEST).json({ 
      error: 'Nome e Telefone são obrigatórios.' 
    });
  }

  // --- 1. PROCESSAMENTOS ---
  const phoneClean = normalizarTelefone(telefone);
  
  let emailClean = email ? email.trim().toLowerCase() : '';
  if (emailClean === '-' || emailClean === 'nao' || emailClean.length < 5 || !emailClean.includes('@')) {
     emailClean = ''; 
  }

  // Processa as faixas etárias PRIMEIRO
  const { faixas, idadesArray } = processarFaixasEtarias(distribuicaoVidas);

  let lives = Number(quantidadeVidas);
  if (!lives || isNaN(lives) || lives === 0) {
    const somaVidas = idadesArray.reduce((acc, curr) => acc + curr, 0);
    lives = somaVidas > 0 ? somaVidas : 1;
    console.log(`[WEBHOOK] Vidas calculadas via distribuição: ${lives}`);
  }

  const temCnpj = textoParaBooleano(possuiCNPJ);
  const temPlano = textoParaBooleano(jaTemPlano);
  const valorEstimado = Number(investimento) || 0;
  const listaHospitais = hospitalPreferencia ? [hospitalPreferencia] : [];

  const dadosFormatados = { 
    investimento: valorEstimado, 
    hospitalPreferencia, 
    temCnpj, 
    temPlano, 
    cidade, 
    estado,
    tipoCNPJ,   
    operadora  
  };

  const searchConditions: any[] = [{ phone: phoneClean }];
  if (emailClean && emailClean !== '') {
    searchConditions.push({ email: emailClean });
  }

  const existingLead = await LeadModel.findOne({
    $or: searchConditions
  });

  // ===============================================================
  // CASO 1: ATUALIZAÇÃO
  // ===============================================================
  if (existingLead) {
    console.log(`[WEBHOOK] Atualizando Lead: ${existingLead.name}`);

    let novoDono = existingLead.owners || [];
    let houveRedistribuicao = false;
    
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
    const tituloAtividade = houveRedistribuicao 
      ? ' Lead RE-CONVERTIDO e REDISTRIBUÍDO' 
      : ' Lead RE-CONVERTIDO (Mantido)';
      
    const logUnificado = `${tituloAtividade}\n----------------------------------------\n Dados Anteriores: ${existingLead.livesCount} vidas\n----------------------------------------\n${resumoTecnico}`;

    const leadAny = existingLead as any;

    const updatedLead = await updateLead(existingLead._id.toString(), {
      name: nome,
      phone: phoneClean,
      email: (emailClean && emailClean !== '') ? emailClean : existingLead.email,
      livesCount: lives,
      avgPrice: valorEstimado,
      hasCnpj: temCnpj,
      hasCurrentPlan: temPlano,
      preferredHospitals: listaHospitais.length ? listaHospitais : leadAny.preferredHospitals,
      city: cidade || existingLead.city,
      state: estado || existingLead.state,
      owners: novoDono,
      
      faixasEtarias: faixas,
      ageBuckets: idadesArray,

      lastActivity: new Date(),
      customUpdateLog: logUnificado 
    });

    return res.status(StatusCodes.CREATED).json({
      success: true,
      action: 'updated',
      leadId: updatedLead?._id,
      message: 'Lead Atualizado com sucesso.'
    });
  }

  // ===============================================================
  // CASO 2: CRIAÇÃO
  // ===============================================================
  const pipeline = await PipelineModel.findOne({ key: 'default' }) || await PipelineModel.findOne();
  const stage = await StageModel.findOne({ pipelineId: pipeline?._id, key: 'novo' }) || await StageModel.findOne({ pipelineId: pipeline?._id });

  if (!pipeline || !stage) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: 'Configuração de Funil ausente.' });
  }

  const donoInicial = await findNextResponsible(lives, temCnpj);
  const ownersList = donoInicial ? [donoInicial] : []; 

  const logTecnicoUnificado = `Lead criado via Webhook.\n\n${gerarResumoTecnicoWebhook(dadosFormatados)}`;

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
    city: cidade || 'A verificar',
    state: estado || 'SP',
    owners: ownersList,
    rank: 'c' + Date.now(),
    hasCurrentPlan: temPlano,
    preferredHospitals: listaHospitais,
    
    faixasEtarias: faixas,
    ageBuckets: idadesArray,

    customCreationLog: logTecnicoUnificado
  });

  if (!resultLead) {
    throw new AppError('Erro ao processar o Lead no sistema.', StatusCodes.INTERNAL_SERVER_ERROR);
  }

  if (observacoes && observacoes.trim() !== '') {
    await Note.create({
      leadId: resultLead._id,
      conteudo: `[Observação Inicial]: ${observacoes}`,
      userId: SYSTEM_ID as any,
      userName: 'Webhook (Site)',
      isPinned: true
    });
  }

  return res.status(StatusCodes.CREATED).json({
    success: true,
    action: 'created',
    leadId: resultLead._id,
    message: 'Lead Criado com sucesso'
  });
});