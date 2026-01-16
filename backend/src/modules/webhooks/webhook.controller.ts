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

// --- NOVA LÓGICA DE IDADES ---
// Recebe: "10, 20, 30" ou "10 20 30"
// Retorna: Objeto de Faixas + Array de Idades
const calcularFaixasPorIdadesIndividuais = (textoInput: string) => {
  const faixas = {
    ate18: 0, de19a23: 0, de24a28: 0, de29a33: 0, de34a38: 0,
    de39a43: 0, de44a48: 0, de49a53: 0, de54a58: 0, acima59: 0
  };
  
  if (!textoInput || typeof textoInput !== 'string') {
    return { faixas, idadesArray: [] as number[] };
  }

  // 1. Limpa tudo que não é número e separa
  // Ex: "10, 20. 30" -> "10 20 30" -> [10, 20, 30]
  const idadesArray = textoInput
    .replace(/[^0-9]/g, ' ') // Troca virgulas, pontos e letras por espaço
    .split(' ')
    .map(n => parseInt(n.trim()))
    .filter(n => !isNaN(n) && n > 0 && n < 120); // Filtra números válidos

  // 2. Distribui nas caixinhas
  idadesArray.forEach(idade => {
    if (idade <= 18) faixas.ate18++;
    else if (idade <= 23) faixas.de19a23++;
    else if (idade <= 28) faixas.de24a28++;
    else if (idade <= 33) faixas.de29a33++;
    else if (idade <= 38) faixas.de34a38++;
    else if (idade <= 43) faixas.de39a43++;
    else if (idade <= 48) faixas.de44a48++;
    else if (idade <= 53) faixas.de49a53++;
    else if (idade <= 58) faixas.de54a58++;
    else faixas.acima59++;
  });

  return { faixas, idadesArray };
};

const gerarResumoTecnicoWebhook = (dados: any) => {
  const { temCnpj, formacao, idadesList } = dados;
  
  return `
DADOS TÉCNICOS (Facebook Ads):
 CNPJ: ${temCnpj ? 'SIM' : 'NÃO'}
 Formação/Estudando: ${formacao ? 'SIM' : 'NÃO'}
 Idades informadas: ${idadesList.join(', ') || 'Nenhuma'}
`.trim();
};

export const webhookHandler = asyncHandler(async (req: Request, res: Response) => {
  
  const webhookSecret = process.env.WEBHOOK_SECRET || 'minha_senha_super_secreta';
  const requestToken = req.headers['x-webhook-token'] || req.query.token;

  if (requestToken !== webhookSecret) {
    return res.status(403).json({ error: 'Acesso negado.' });
  }

  console.log('[WEBHOOK] Payload recebido:', req.body);

  // ==================================================================
  // 1. MAPEAMENTO DOS CAMPOS (Tradução das perguntas)
  // ==================================================================
  // Ajuste as chaves ('tem_cnpj', etc) conforme o JSON real que chega do Facebook
  const rawBody = req.body;

  const input = {
    nome: rawBody.nome_completo || rawBody.nome || rawBody.full_name,
    email: rawBody.email,
    telefone: rawBody.telefone || rawBody.phone_number,
    
    // Perguntas específicas
    temCnpj: rawBody.tem_cnpj || rawBody.possui_cnpj,
    temFormacao: rawBody.tem_formacao_academica || rawBody.formacao || rawBody.estudando,
    qtdVidas: rawBody.quantidade_de_vidas || rawBody.vidas,
    listaIdades: rawBody.quantos_anos_cada_pessoa_tem || rawBody.idades,
    
    // Campos que não vem na pergunta (Defaults)
    origem: rawBody.origem || 'Meta Ads',
    cidade: rawBody.cidade || rawBody.city || '-',
    estado: rawBody.estado || rawBody.state || '-',
  };

  if (!input.nome || !input.telefone) {
    return res.status(StatusCodes.BAD_REQUEST).json({ 
      error: 'Nome e Telefone são obrigatórios.' 
    });
  }

  // ==================================================================
  // 2. TRATAMENTO E HIGIENIZAÇÃO
  // ==================================================================
  let phoneClean = normalizarTelefone(input.telefone);

  // Tratamento de Email
  let emailClean = input.email ? input.email.trim().toLowerCase() : '';
  if (emailClean === '-' || !emailClean.includes('@')) emailClean = '';

  // Tratamento Booleano
  const hasCnpj = textoParaBooleano(input.temCnpj);
  const hasFormacao = textoParaBooleano(input.temFormacao);

  // Tratamento de Idades e Vidas
  const { faixas, idadesArray } = calcularFaixasPorIdadesIndividuais(input.listaIdades);
  
  // Se o usuário digitou qtdVidas, usa. Se não, conta as idades digitadas.
  let livesCount = parseInt(String(input.qtdVidas).replace(/[^0-9]/g, ''));
  if (isNaN(livesCount) || livesCount === 0) {
    livesCount = idadesArray.length > 0 ? idadesArray.length : 1;
  }
  // Garante sincronia (ex: digitou 2 vidas mas colocou 3 idades -> usa o maior)
  livesCount = Math.max(livesCount, idadesArray.length);

  // Preparar Observações (Junta Formação + Dados técnicos)
  const infoFormacao = `Possui formação/estudando: ${hasFormacao ? 'SIM' : 'NÃO'}`;
  const dadosFormatados = { temCnpj: hasCnpj, formacao: hasFormacao, idadesList: idadesArray };
  const resumoTecnico = gerarResumoTecnicoWebhook(dadosFormatados);
  
  // ==================================================================
  // 3. BUSCA POR DUPLICIDADE
  // ==================================================================
  const searchConditions: any[] = [{ phone: phoneClean }];
  if (emailClean) searchConditions.push({ email: emailClean });

  const existingLead = await LeadModel.findOne({ $or: searchConditions });

  // ==================================================================
  // CASO 1: ATUALIZAÇÃO (Lead já existe)
  // ==================================================================
  if (existingLead) {
    console.log(`[WEBHOOK] Atualizando Lead: ${existingLead.name}`);

    // Sticky Routing (Tenta manter o dono atual se ele ainda puder atender)
    let novoDono = existingLead.owners || [];
    let houveRedistribuicao = false;
    const donoAtualId = novoDono.length > 0 ? novoDono[0] : null;

    if (donoAtualId) {
      const regraCnpj = hasCnpj ? { $in: ['required', 'both'] } : { $in: ['forbidden', 'both'] };
      // Verifica se o dono atual aceita a nova quantidade de vidas/cnpj
      const donoQualificado = await UserModel.findOne({
        _id: donoAtualId,
        active: true,
        'distribution.active': true,
        'distribution.minLives': { $lte: livesCount },
        'distribution.maxLives': { $gte: livesCount },
        'distribution.cnpjRule': regraCnpj
      });
      
      // Se não qualificado, redistribui
      if (!donoQualificado) {
        const donoDistribuido = await findNextResponsible(livesCount, hasCnpj);
        if (donoDistribuido) {
          novoDono = [donoDistribuido as any];
          houveRedistribuicao = true;
        }
      }
    } else {
       // Se não tinha dono, distribui
       const donoDistribuido = await findNextResponsible(livesCount, hasCnpj);
       if (donoDistribuido) {
         novoDono = [donoDistribuido as any];
         houveRedistribuicao = true;
       }
    }

    // Cria Nota com a info extra (Formação)
    await Note.create({
      leadId: existingLead._id,
      conteudo: `[Webhook Update] ${infoFormacao}`,
      userId: SYSTEM_ID as any, 
      userName: 'Facebook Ads', 
      isPinned: false            
    });

    const leadAny = existingLead as any;

    await updateLead(existingLead._id.toString(), {
      name: input.nome,
      phone: phoneClean,
      email: emailClean || existingLead.email,
      livesCount: livesCount,
      hasCnpj: hasCnpj,
      
      // Preenche com "-" se o lead atual não tiver dado e o form não mandou
      city: input.cidade !== '-' ? input.cidade : (existingLead.city || '-'),
      state: input.estado !== '-' ? input.estado : (existingLead.state || '-'),
      
      // Dados que não vieram na pergunta, resetamos para padrão ou mantemos
      hasCurrentPlan: leadAny.hasCurrentPlan || false, // Mantem anterior ou false
      currentPlan: leadAny.currentPlan || '-',
      avgPrice: leadAny.avgPrice || 0,
      
      // Atualiza idades e faixas
      faixasEtarias: faixas, // Objeto { ate18: 1, ... }
      ageBuckets: idadesArray, // Array [10, 20, 30]
      idades: idadesArray,     // Compatibilidade

      owners: novoDono,
      cnpjType: 'Outros', // Default pois a pergunta não especificou
      
      lastActivity: new Date()
    });

    // Log de atividade
    await addActivity(
      existingLead._id.toString(),
      'lead_atualizado', 
      { descricao: houveRedistribuicao ? `Atualizado via Facebook (Redistribuído).\n${resumoTecnico}` : `Atualizado via Facebook.\n${resumoTecnico}` }, 
      SYSTEM_ID
    );

    return res.status(StatusCodes.CREATED).json({ success: true, action: 'updated' });
  }

  // ==================================================================
  // CASO 2: CRIAÇÃO (Lead Novo)
  // ==================================================================
  const pipeline = await PipelineModel.findOne({ key: 'default' }) || await PipelineModel.findOne();
  const stage = await StageModel.findOne({ pipelineId: pipeline?._id, key: 'novo' }) || await StageModel.findOne({ pipelineId: pipeline?._id });

  if (!pipeline || !stage) return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: 'Erro de configuração interna (Pipeline).' });

  const donoInicial = await findNextResponsible(livesCount, hasCnpj);
  const ownersList = donoInicial ? [donoInicial] : []; 
  
  const resultLead = await createLead({
    name: input.nome,
    phone: phoneClean,
    email: emailClean,
    origin: input.origem, 
    
    pipelineId: pipeline._id.toString(),
    stageId: stage._id.toString(),
    
    livesCount: livesCount,
    hasCnpj: hasCnpj,
    cnpjType: 'Outros', // Campo obrigatório preenchido com default
    
    // Idades processadas
    faixasEtarias: faixas,
    ageBuckets: idadesArray,
    idades: idadesArray,

    // Campos Defaults (preenchidos com "-" ou 0)
    city: input.cidade, 
    state: input.estado,
    avgPrice: 0,
    hasCurrentPlan: false,
    currentPlan: '-',
    preferredHospitals: [],
    
    owners: ownersList,
    rank: 'c' + Date.now(),
    
    // Observação vai no log de criação
    customCreationLog: `Lead criado via Facebook Ads.\n\n${resumoTecnico}\n\n${infoFormacao}`
  });

  if (!resultLead) throw new AppError('Erro ao criar Lead.', StatusCodes.INTERNAL_SERVER_ERROR);

  // Cria nota destacada com a info de Formação
  await Note.create({
    leadId: resultLead._id,
    conteudo: `[Dados Iniciais] ${infoFormacao}`,
    userId: SYSTEM_ID as any,
    userName: 'Facebook Ads',
    isPinned: true
  });

  return res.status(StatusCodes.CREATED).json({ success: true, action: 'created', leadId: resultLead._id });
});