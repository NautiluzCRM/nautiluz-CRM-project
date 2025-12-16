import { Request, Response } from 'express';
import { asyncHandler } from '../../common/http.js';
import { z } from 'zod';
import { addActivity, createLead, deleteLead, getLead, listLeads, updateLead } from './leads.service.js';

const leadSchema = z.object({
  // Campos Obrigatórios com mensagens personalizadas
  name: z.string({ required_error: "O nome completo é obrigatório." }).min(3, "O nome deve ter pelo menos 3 caracteres."),
  
  phone: z.string({ required_error: "O celular é obrigatório." }).min(10, "O celular deve ter DDD e número válidos."),
  
  origin: z.string({ required_error: "A origem do lead é obrigatória." }),
  
  city: z.string({ required_error: "A cidade é obrigatória." }).min(2, "Informe o nome da cidade."),
  
  state: z.string({ required_error: "O estado (UF) é obrigatório." }).length(2, "Selecione um estado válido (UF)."),
  
  livesCount: z.number({ required_error: "A quantidade de vidas é obrigatória." }).min(1, "A quantidade de vidas deve ser maior que zero."),
  
  avgPrice: z.number({ required_error: "O valor estimado é obrigatório." }).min(0, "O valor estimado não pode ser negativo."),

  pipelineId: z.string(),
  stageId: z.string(),
  
  // Campos Opcionais (mas com validação se forem preenchidos)
  email: z.string().email("O email informado é inválido. Verifique se tem '@' e '.com'").optional().or(z.literal('')),
  
  company: z.string().optional(),
  hasCnpj: z.boolean().optional(),
  hasCurrentPlan: z.boolean().optional(),
  currentPlan: z.string().optional(),
  ageBuckets: z.array(z.number()).optional(), 
  createdAt: z.string().datetime().optional(),
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
