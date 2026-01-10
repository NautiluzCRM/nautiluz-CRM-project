import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { asyncHandler, AppError } from '../../common/http.js';
// Certifique-se que o leads.service.ts já foi corrigido com o 'export' na função findNextResponsible
import { createLead, updateLead, addActivity, findNextResponsible } from '../leads/leads.service.js';
import { PipelineModel } from '../pipelines/pipeline.model.js';
import { StageModel } from '../pipelines/stage.model.js';
import { LeadModel } from '../leads/lead.model.js';

// --- 1. FUNÇÃO DE LIMPEZA DE TELEFONE ---
const normalizarTelefone = (phone: string): string => {
  if (!phone) return '';
  let cleaned = phone.replace(/[^\d+]/g, '');
  
  if (cleaned.startsWith('55') && !cleaned.startsWith('+')) {
    cleaned = '+' + cleaned;
  }
  
  if (!cleaned.startsWith('+') && cleaned.length <= 11) {
     cleaned = '+55' + cleaned;
  }

  return cleaned;
};

// --- FUNÇÃO AUXILIAR: FORMATAR FAIXAS ETÁRIAS ---
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

// --- AQUI ESTÁ O EXPORT QUE O ERRO DIZ QUE FALTA ---
export const linktreeHandler = asyncHandler(async (req: Request, res: Response) => {
  let { 
    name, email, phone, 
    city, state, livesCount, ageBuckets, 
    hasCnpj, cnpjType, currentPlan, hasCurrentPlan, avgPrice,
    preferredHospitals,
    modo_teste 
  } = req.body;

  if (!name || !phone) {
    throw new AppError('Os campos Nome e Telefone são obrigatórios.', StatusCodes.BAD_REQUEST);
  }

  // --- 2. TRATAMENTO E LIMPEZA DE DADOS ---
  const phoneClean = normalizarTelefone(phone);
  const emailClean = email ? email.trim().toLowerCase() : '';
  const count = Number(livesCount) || 1;
  const price = Number(avgPrice) || 0;
  const temCnpj = !!hasCnpj;
  const temPlano = !!hasCurrentPlan;
  
  const safeCnpjType = (temCnpj && cnpjType && cnpjType.trim() !== '') ? cnpjType : undefined;
  const textoFaixas = formatarFaixasEtarias(ageBuckets || []);

  // 3. VERIFICAR SE O LEAD JÁ EXISTE
  const existingLead = await LeadModel.findOne({
    $or: [{ email: emailClean }, { phone: phoneClean }]
  });

  // ===============================================================
  // LÓGICA DE ATUALIZAÇÃO (SE JÁ EXISTIR)
  // ===============================================================
if (existingLead) {
    console.log(`[Linktree] Atualizando Lead Existente: ${existingLead.name}`);

    // --- NOVA LÓGICA: REDISTRIBUIÇÃO ---
    const donoDistribuido = await findNextResponsible(count, temCnpj);
    
    // Inicializa com o dono atual
    let novoDono = existingLead.owners; 

    // Se achou novo dono, substitui (com carteirada 'as any' para não dar erro de tipo)
    if (donoDistribuido) {
      console.log(`[Linktree] Redistribuição: Alterando dono para ${donoDistribuido}`);
      novoDono = [donoDistribuido as any]; // <--- CORREÇÃO AQUI
    }

    const historicoAntigo = `
========================================
📅 RE-CONVERSÃO EM ${new Date().toLocaleDateString('pt-BR')} (ORIGEM: SITE)
========================================
👤 Nome Anterior: ${existingLead.name}
🔢 Vidas: ${existingLead.livesCount} | 💰 Valor: ${existingLead.avgPrice}
📍 Local: ${existingLead.city}/${existingLead.state}
📝 Obs Antiga: ${existingLead.notes ? existingLead.notes.split('========================================')[0].trim() : '-'}
`.trim();

    const notasAtualizadas = historicoAntigo + '\n\n' + (existingLead.notes || '');
    
    // Casting para any para acessar propriedades dinâmicas sem erro
    const leadAny = existingLead as any; 

    const updatedLead = await updateLead(existingLead._id.toString(), {
      name,
      phone: phoneClean,
      email: emailClean || existingLead.email,
      livesCount: count,
      avgPrice: price,
      hasCnpj: temCnpj,
      cnpjType: safeCnpjType || leadAny.cnpjType, 
      hasCurrentPlan: temPlano,
      currentPlan: currentPlan || leadAny.currentPlan,
      ageBuckets: ageBuckets || leadAny.ageBuckets,
      preferredHospitals: preferredHospitals || leadAny.preferredHospitals,
      city: city || existingLead.city,
      state: state || existingLead.state,
      
      owners: novoDono, // Agora passa sem erro
      
      notes: notasAtualizadas,
      lastActivity: new Date(),
    });

    const msgAtividade = donoDistribuido 
      ? 'Lead RE-CONVERTIDO e REDISTRIBUÍDO para novo vendedor.'
      : 'Lead RE-CONVERTIDO (Mantido com vendedor atual).';

    await addActivity(existingLead._id.toString(), 'Sistema', {
      description: msgAtividade,
      payload: req.body
    });

    return res.status(StatusCodes.CREATED).json({
      success: true,
      leadId: updatedLead?._id,
      message: 'Lead atualizado com sucesso.'
    });
  }

  // ===============================================================
  // LÓGICA DE CRIAÇÃO (SE FOR NOVO)
  // ===============================================================

  const pipeline = await PipelineModel.findOne({ key: 'default' }) || await PipelineModel.findOne();
  if (!pipeline) throw new AppError('Pipeline default não encontrado.', StatusCodes.INTERNAL_SERVER_ERROR);

  const stage = await StageModel.findOne({ pipelineId: pipeline._id, key: 'novo' }) || await StageModel.findOne({ pipelineId: pipeline._id });
  if (!stage) throw new AppError('Stage novo não encontrado.', StatusCodes.INTERNAL_SERVER_ERROR);

  const notasIniciais = `
📋 LEAD VINDO DO SITE:
---------------------------
🏢 CNPJ: ${temCnpj ? 'SIM' : 'NÃO'} ${safeCnpjType ? '(' + safeCnpjType + ')' : ''}

🩺 Plano Atual: ${temPlano ? 'SIM' : 'NÃO'} ${currentPlan ? '(' + currentPlan + ')' : ''}

🏥 Hospitais: ${preferredHospitals && preferredHospitals.length ? preferredHospitals.join(', ') : '-'}

👥 Faixas Etárias:
${textoFaixas}
  `.trim();

  const lead = await createLead({
    name,
    phone: phoneClean,
    email: emailClean, 
    origin: 'Linktree', 
    pipelineId: pipeline._id.toString(),
    stageId: stage._id.toString(),
    rank: 'b' + Date.now().toString(),
    city: city || 'Não Informado',
    state: state || 'SP',
    livesCount: count,
    ageBuckets: ageBuckets || [], 
    hasCnpj: temCnpj,
    cnpjType: safeCnpjType, 
    currentPlan: currentPlan || '',
    hasCurrentPlan: temPlano,
    avgPrice: price,
    preferredHospitals: preferredHospitals || [],
    
    notes: notasIniciais, 
    
    owners: [] 
  });

  if (!lead) {
    throw new AppError('Erro inesperado ao criar lead.', StatusCodes.INTERNAL_SERVER_ERROR);
  }

  if (lead.owners && lead.owners.length > 0) {
    console.log(`[Linktree] Lead criado e atribuído: ${lead._id}`);
  } else {
    console.log('[Linktree] Lead criado SEM DONO (Aguardando distribuição).');
  }

  return res.status(StatusCodes.CREATED).json({
    success: true,
    leadId: lead._id,
    assignedToOwners: lead.owners 
  });
});