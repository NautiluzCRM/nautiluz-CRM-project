import { Request, Response } from 'express';
import { asyncHandler } from '../../common/http.js';
import { z } from 'zod';
import { addActivity, createLead, deleteLead, getLead, listLeads, updateLead } from './leads.service.js';

const leadSchema = z.object({
  name: z.string(),
  company: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  origin: z.string(),
  pipelineId: z.string(),
  stageId: z.string(),
  
  // Financeiro e Vidas
  livesCount: z.number().optional(),
  avgPrice: z.number().optional(),
  hasCnpj: z.boolean().optional(),
  hasCurrentPlan: z.boolean().optional(),
  currentPlan: z.string().optional(),
  ageBuckets: z.array(z.number()).optional(), 
  
  // NOVOS CAMPOS ADICIONADOS AGORA:
  city: z.string().optional(),
  state: z.string().length(2).optional(), // Ex: SP, RJ
  createdAt: z.string().datetime().optional(), // Permite data retroativa

  preferredHospitals: z.array(z.string()).optional(),

  notes: z.string().optional(),
  qualificationStatus: z.string().optional(),
  rank: z.string().optional()
});

export const listLeadsHandler = asyncHandler(async (req: Request, res: Response) => {
  const leads = await listLeads(req.query);
  res.json(leads);
});

export const createLeadHandler = asyncHandler(async (req: Request, res: Response) => {
  const body = leadSchema.parse(req.body);
  const lead = await createLead(body, (req as any).user?.sub);
  res.status(201).json(lead);
});

export const getLeadHandler = asyncHandler(async (req: Request, res: Response) => {
  const lead = await getLead(req.params.id);
  if (!lead) return res.status(404).json({ message: 'Lead não encontrado' });
  res.json(lead);
});

export const updateLeadHandler = asyncHandler(async (req: Request, res: Response) => {
  const body = leadSchema.partial().parse(req.body);
  const lead = await updateLead(req.params.id, body, (req as any).user?.sub);
  res.json(lead);
});

export const deleteLeadHandler = asyncHandler(async (req: Request, res: Response) => {
  await deleteLead(req.params.id);
  res.json({ ok: true });
});

export const addActivityHandler = asyncHandler(async (req: Request, res: Response) => {
  const schema = z.object({ type: z.string(), payload: z.any().optional() });
  const body = schema.parse(req.body);
  const activity = await addActivity(req.params.id, body.type, body.payload, (req as any).user?.sub);
  res.status(201).json(activity);
});
