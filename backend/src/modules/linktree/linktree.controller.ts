import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { asyncHandler, AppError } from '../../common/http.js';
import { createLead } from '../leads/leads.service.js';
import { PipelineModel } from '../pipelines/pipeline.model.js';
import { StageModel } from '../pipelines/stage.model.js';

// --- CONSTANTES DE IDs (Gerados pelo Seed) ---
// Isso evita ir no banco de dados toda vez
const ID_VENDEDOR_JUNIOR = '695d5c1b8b178cd065a74d1b'; 
const ID_VENDEDOR_SENIOR = '695d5c1b8b178cd065a74d1c';

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

  // 1. Busca Pipeline e Stage
  const pipeline = await PipelineModel.findOne({ key: 'default' });
  if (!pipeline) throw new AppError('Pipeline default não encontrado.', StatusCodes.INTERNAL_SERVER_ERROR);

  const stage = await StageModel.findOne({ pipelineId: pipeline._id, key: 'novo' });
  if (!stage) throw new AppError('Stage novo não encontrado.', StatusCodes.INTERNAL_SERVER_ERROR);

  // 2. Lógica de Distribuição OTIMIZADA
  const count = Number(livesCount) || 1;
  let assignedOwners: string[] = [];

  if (count <= 2) {
    assignedOwners = [ID_VENDEDOR_JUNIOR];
    console.log(`Distribution: Lead de ${count} vidas -> Júnior (${ID_VENDEDOR_JUNIOR})`);
  } else {
    assignedOwners = [ID_VENDEDOR_SENIOR];
    console.log(`Distribution: Lead de ${count} vidas -> Sênior (${ID_VENDEDOR_SENIOR})`);
  }

  // 3. Criação do Lead
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
    hasCnpj: !!hasCnpj,
    cnpjType: cnpjType || '',
    currentPlan: currentPlan || '',
    hasCurrentPlan: !!hasCurrentPlan,
    avgPrice: avgPrice || 0,
    preferredHospitals: preferredHospitals || [],
    
    owners: assignedOwners // Passa o array preenchido
  });

  return res.status(StatusCodes.CREATED).json({
    success: true,
    leadId: lead._id,
    assignedTo: count <= 2 ? 'Júnior' : 'Sênior'
  });
});