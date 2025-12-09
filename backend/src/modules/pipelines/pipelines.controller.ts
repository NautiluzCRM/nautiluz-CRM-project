import { Request, Response } from 'express';
import { asyncHandler } from '../../common/http.js';
import { z } from 'zod';
import {
  createPipeline,
  createStage,
  deletePipeline,
  deleteStage,
  listPipelines,
  listStages,
  updatePipeline,
  updateStage
} from './pipelines.service.js';

const pipelineSchema = z.object({ name: z.string(), key: z.string(), description: z.string().optional() });
const stageSchema = z.object({ name: z.string(), order: z.number(), key: z.string() });

export const listPipelinesHandler = asyncHandler(async (_req: Request, res: Response) => {
  res.json(await listPipelines());
});

export const createPipelineHandler = asyncHandler(async (req: Request, res: Response) => {
  const body = pipelineSchema.parse(req.body);
  const pipeline = await createPipeline(body);
  res.status(201).json(pipeline);
});

export const updatePipelineHandler = asyncHandler(async (req: Request, res: Response) => {
  const body = pipelineSchema.partial().parse(req.body);
  const pipeline = await updatePipeline(req.params.id, body);
  if (!pipeline) return res.status(404).json({ message: 'Pipeline not found' });
  res.json(pipeline);
});

export const deletePipelineHandler = asyncHandler(async (req: Request, res: Response) => {
  const pipeline = await deletePipeline(req.params.id);
  if (!pipeline) return res.status(404).json({ message: 'Pipeline not found' });
  res.json({ ok: true });
});

export const listStagesHandler = asyncHandler(async (req: Request, res: Response) => {
  res.json(await listStages(req.params.id));
});

export const createStageHandler = asyncHandler(async (req: Request, res: Response) => {
  const body = stageSchema.parse(req.body);
  const stage = await createStage(req.params.id, body);
  res.status(201).json(stage);
});

export const updateStageHandler = asyncHandler(async (req: Request, res: Response) => {
  const body = stageSchema.partial().parse(req.body);
  const stage = await updateStage(req.params.id, body);
  if (!stage) return res.status(404).json({ message: 'Stage not found' });
  res.json(stage);
});

export const deleteStageHandler = asyncHandler(async (req: Request, res: Response) => {
  const stage = await deleteStage(req.params.id);
  if (!stage) return res.status(404).json({ message: 'Stage not found' });
  res.json({ ok: true });
});
