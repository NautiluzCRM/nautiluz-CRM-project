import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { asyncHandler, AppError } from '../../common/http.js';
import { createLead } from '../leads/leads.service.js';
import { PipelineModel } from '../pipelines/pipeline.model.js';
import { StageModel } from '../pipelines/stage.model.js';

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

  const pipeline = await PipelineModel.findOne({ key: 'default' });
  if (!pipeline) throw new AppError('Pipeline default não encontrado.', StatusCodes.INTERNAL_SERVER_ERROR);

  const stage = await StageModel.findOne({ pipelineId: pipeline._id, key: 'novo' });
  if (!stage) throw new AppError('Stage novo não encontrado.', StatusCodes.INTERNAL_SERVER_ERROR);

  const lead = await createLead({
    name,
    phone,
    email, 
    origin: 'Linktree', 
    pipelineId: pipeline._id.toString(),
    stageId: stage._id.toString(),
    rank: 'b' + Date.now().toString(),

    city: city || 'Não Informado',
    state: state || 'SP',
    livesCount: livesCount || 1,
    ageBuckets: ageBuckets || [], 
    hasCnpj: hasCnpj,
    cnpjType: cnpjType,
    currentPlan: currentPlan,
    hasCurrentPlan: hasCurrentPlan,
    avgPrice: avgPrice || 0,
    preferredHospitals: preferredHospitals || []
  });

  return res.status(StatusCodes.CREATED).json({
    success: true,
    leadId: lead._id
  });
});