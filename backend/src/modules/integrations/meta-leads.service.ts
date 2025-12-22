import { metaWebhookSchema } from './meta.validation.js';
import { createLead } from '../leads/leads.service.js';
import { PipelineModel } from '../pipelines/pipeline.model.js';
import { StageModel } from '../pipelines/stage.model.js';

export async function ingestMetaPayload(body: unknown) {
  const parsed = metaWebhookSchema.parse(body);
  const name = parsed.field_data?.find((f) => f.name === 'full_name')?.values[0] ?? 'Lead Instagram';
  const email = parsed.field_data?.find((f) => f.name === 'email')?.values[0];
  const phone = parsed.field_data?.find((f) => f.name === 'phone_number')?.values[0];

const pipeline = await PipelineModel.findOne({ key: 'default'});

  if (!pipeline) {
    throw new Error('Pipeline com key "default" não encontrado.');
  }

  const stage = await StageModel.findOne({
    pipelineId: pipeline._id, 
    key: 'novo', 
   });

  if (!stage) {
    throw new Error(`stage com key: 'novo' não encontrado no pipeline ${pipeline.name}.`);
  }
  
  const lead = await createLead({
    name,
    email,
    phone,
    origin: 'Instagram',
    pipelineId: pipeline._id.toString(), 
    stageId: stage._id.toString()
  });
  return lead;
}
