import { z } from 'zod';

// Schema para o payload real do Meta Lead Ads (formato Leadgen Webhook)
export const metaLeadgenWebhookSchema = z.object({
  object: z.literal('page').optional(),
  entry: z.array(z.object({
    id: z.string(), // Page ID
    time: z.number(),
    changes: z.array(z.object({
      field: z.literal('leadgen'),
      value: z.object({
        form_id: z.string(),
        leadgen_id: z.string(),
        created_time: z.number(),
        page_id: z.string(),
        adgroup_id: z.string().optional(),
        ad_id: z.string().optional(),
        campaign_id: z.string().optional(),
        adset_id: z.string().optional()
      })
    }))
  }))
});

// Schema para dados do lead obtidos via Graph API
export const metaLeadDataSchema = z.object({
  id: z.string(),
  created_time: z.string(),
  form_id: z.string().optional(),
  field_data: z.array(z.object({
    name: z.string(),
    values: z.array(z.string())
  })).optional(),
  ad_id: z.string().optional(),
  adset_id: z.string().optional(),
  campaign_id: z.string().optional(),
  platform: z.string().optional(), // 'fb' ou 'ig'
  is_organic: z.boolean().optional()
});

// Schema simplificado para webhooks diretos (Make, Zapier, etc.)
// Muito flexível para aceitar vários formatos de integração
export const simpleWebhookSchema = z.object({
  // IDs do Meta
  leadgen_id: z.string().optional(),
  form_id: z.string().optional(),
  created_time: z.string().optional(),
  ad_id: z.string().optional(),
  adset_id: z.string().optional(),
  campaign_id: z.string().optional(),
  
  // Dados do formulário Lead Ads
  field_data: z.array(z.object({
    name: z.string(),
    values: z.array(z.string())
  })).optional(),
  
  // Campos diretos - Nome
  name: z.string().optional(),
  full_name: z.string().optional(),
  nome: z.string().optional(),
  nome_completo: z.string().optional(),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  
  // Campos diretos - Contato
  email: z.string().optional(),
  phone: z.string().optional(),
  phone_number: z.string().optional(),
  telefone: z.string().optional(),
  celular: z.string().optional(),
  whatsapp: z.string().optional(),
  
  // Campos diretos - Empresa/Trabalho
  company: z.string().optional(),
  company_name: z.string().optional(),
  empresa: z.string().optional(),
  job_title: z.string().optional(),
  cargo: z.string().optional(),
  
  // Campos diretos - Localização
  city: z.string().optional(),
  cidade: z.string().optional(),
  state: z.string().optional(),
  estado: z.string().optional(),
  zip_code: z.string().optional(),
  cep: z.string().optional(),
  
  // Outros
  message: z.string().optional(),
  mensagem: z.string().optional()
}).passthrough(); // Permite campos extras não definidos

// Schema antigo para compatibilidade
export const metaWebhookSchema = z.object({
  leadgen_id: z.string(),
  form_id: z.string().optional(),
  created_time: z.string().optional(),
  ad_id: z.string().optional(),
  campaign_id: z.string().optional(),
  field_data: z.array(z.object({ name: z.string(), values: z.array(z.string()) })).optional()
}).passthrough();

// Schema para configuração da integração
export const integrationConfigSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  type: z.enum(['meta_lead_ads', 'google_ads', 'webhook_generico']),
  active: z.boolean().default(true),
  config: z.object({
    // Credenciais Meta
    appId: z.string().optional(),
    appSecret: z.string().optional(),
    accessToken: z.string().optional(),
    
    // IDs da campanha
    pageId: z.string().optional(),
    formId: z.string().optional(),
    adAccountId: z.string().optional(),
    campaignId: z.string().optional(),
    
    // Webhook
    verifyToken: z.string().optional(),
    
    // Mapeamento de campos do formulário Lead Ads
    fieldMapping: z.record(z.string()).optional(),
    
    // Destino no CRM
    defaultPipelineId: z.string().optional(),
    defaultStageId: z.string().optional(),
    defaultOwnerId: z.string().optional(),
    origin: z.string().optional(),
    
    // Configurações extras
    autoReply: z.boolean().optional(),
    autoReplyMessage: z.string().optional()
  })
});

export type MetaLeadgenWebhook = z.infer<typeof metaLeadgenWebhookSchema>;
export type MetaLeadData = z.infer<typeof metaLeadDataSchema>;
export type SimpleWebhook = z.infer<typeof simpleWebhookSchema>;
export type IntegrationConfig = z.infer<typeof integrationConfigSchema>;
