import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { asyncHandler, AppError } from '../../common/http.js';
import { createLead, updateLead, addActivity } from '../leads/leads.service.js';
import { PipelineModel } from '../pipelines/pipeline.model.js';
import { StageModel } from '../pipelines/stage.model.js';
import { LeadModel } from '../leads/lead.model.js';

export const linktreeHandler = asyncHandler(async (req: Request, res: Response) => {
  const { 
    name, email, phone, 
    city, state, livesCount, ageBuckets, 
    hasCnpj, cnpjType, currentPlan, hasCurrentPlan, avgPrice,
    preferredHospitals
  } = req.body;

  if (!name || !phone) {
    throw new AppError('Os campos Nome e Telefone são obrigatórios.', StatusCodes.BAD_REQUEST);
  }

  // Prepara dados básicos
  const count = Number(livesCount) || 1;
  const price = Number(avgPrice) || 0;
  const temCnpj = !!hasCnpj;
  const temPlano = !!hasCurrentPlan;

  // 1. VERIFICAR SE O LEAD JÁ EXISTE
  const existingLead = await LeadModel.findOne({
    $or: [{ email: email }, { phone: phone }]
  });

  // ===============================================================
  // LÓGICA DE ATUALIZAÇÃO (SE JÁ EXISTIR)
  // ===============================================================
  if (existingLead) {
    console.log(`[Linktree] Atualizando Lead Existente: ${existingLead.name}`);

    const historicoAntigo = `
\n========================================
\nARQUIVADO EM ${new Date().toLocaleDateString('pt-BR')} (ORIGEM: SITE)
\n========================================
\nNome Anterior: ${existingLead.name}
\nVidas: ${existingLead.livesCount} |  Valor: ${existingLead.avgPrice}
\nLocal: ${existingLead.city}/${existingLead.state}
\nObs Antiga: ${existingLead.notes ? existingLead.notes.split('========================================')[0].trim() : '-'}
`.trim();

    const notasAtualizadas = historicoAntigo + '\n\n' + (existingLead.notes || '');
    
    // Bypass de TypeScript para campos opcionais
    const leadAny = existingLead as any; 

    const updatedLead = await updateLead(existingLead._id.toString(), {
      name,
      phone,
      email: email || existingLead.email,
      
      livesCount: count,
      avgPrice: price,
      hasCnpj: temCnpj,
      cnpjType: cnpjType || leadAny.cnpjType,
      hasCurrentPlan: temPlano,
      currentPlan: currentPlan || leadAny.currentPlan,
      ageBuckets: ageBuckets || leadAny.ageBuckets,
      preferredHospitals: preferredHospitals || leadAny.preferredHospitals,
      
      city: city || existingLead.city,
      state: state || existingLead.state,
      
      notes: notasAtualizadas,
      lastActivity: new Date(),
    });

    await addActivity(existingLead._id.toString(), 'Sistema', {
      description: 'Lead RE-CONVERTIDO via Site/Linktree: Dados atualizados.',
      payload: req.body
    });

    // --- MUDANÇA AQUI: Usamos CREATED (201) para enganar o Frontend ---
    // Assim o alerta de erro some e o site acha que deu tudo certo.
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
\nLEAD VINDO DO SITE:
\n---------------------------
\nCNPJ: ${temCnpj ? 'SIM' : 'NÃO'} ${cnpjType ? '(' + cnpjType + ')' : ''}
\nPlano Atual: ${temPlano ? 'SIM' : 'NÃO'} ${currentPlan ? '(' + currentPlan + ')' : ''}
\nHospitais: ${preferredHospitals ? preferredHospitals.join(', ') : '-'}
\nFaixas Etárias: ${ageBuckets ? ageBuckets.join(', ') : '-'}
  `.trim();

  const lead = await createLead({
    name,
    phone,
    email: email || '', 
    origin: 'Linktree', 
    pipelineId: pipeline._id.toString(),
    stageId: stage._id.toString(),
    rank: 'b' + Date.now().toString(),

    city: city || 'Não Informado',
    state: state || 'SP',
    livesCount: count,
    ageBuckets: ageBuckets || [], 
    
    hasCnpj: temCnpj,
    cnpjType: cnpjType || undefined, 
    
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