import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { asyncHandler } from '../../common/http.js';
import { createLead, listLeads } from '../leads/leads.service.js'; 
import { PipelineModel } from '../pipelines/pipeline.model.js';
import { StageModel } from '../pipelines/stage.model.js';
import { LeadModel } from '../leads/lead.model.js';

export const webhookHandler = asyncHandler(async (req: Request, res: Response) => {
  const { 
    nome, 
    email, 
    telefone, 
    origem, 
    quantidadeVidas, 
    observacoes 
  } = req.body;

  console.log('Webhook recebido do Make:', req.body);

  if (!nome || !telefone) {
    return res.status(StatusCodes.BAD_REQUEST).json({ 
      error: 'Nome e Telefone são obrigatórios para integração.' 
    });
  }


  const existingLead = await LeadModel.findOne({
    $or: [{ email: email }, { phone: telefone }]
  });

  if (existingLead) {
    console.log(`⚠️ Lead duplicado detectado: ${existingLead.name}. Ignorando criação.`);
    return res.status(StatusCodes.OK).json({ 
      message: 'Lead já existente. Dados atualizados.', 
      leadId: existingLead._id 
    });
  }

  const pipeline = await PipelineModel.findOne({ key: 'default' }) || await PipelineModel.findOne();
  const stage = await StageModel.findOne({ pipelineId: pipeline?._id, key: 'novo' }) || await StageModel.findOne({ pipelineId: pipeline?._id });

  if (!pipeline || !stage) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: 'Configuração de Funil ausente no sistema.' });
  }


  const lives = Number(quantidadeVidas) || 1;
  
  const ID_JUNIOR = '695d5c1b8b178cd065a74d1b'; 
  const ID_SENIOR = '695d5c1b8b178cd065a74d1c';
  
  let assignedOwners = [ID_JUNIOR]; 
  if (lives >= 3) {
    assignedOwners = [ID_SENIOR];
  }

  const newLead = await createLead({
    name: nome,
    phone: telefone,
    email: email || '',
    origin: origem || 'Meta Ads', 
    pipelineId: pipeline._id.toString(),
    stageId: stage._id.toString(),
    livesCount: lives,
    notes: observacoes || 'Importado via Integração Make',
    owners: assignedOwners,
    
    
    city: 'A verificar',
    state: 'SP',
    rank: 'c' + Date.now() 
  });

  return res.status(StatusCodes.CREATED).json({
    success: true,
    leadId: newLead._id,
    message: 'Lead processado com sucesso.'
  });
});