import { metaWebhookSchema, simpleWebhookSchema, metaLeadgenWebhookSchema } from './meta.validation.js';
import { createLead } from '../leads/leads.service.js';
import { PipelineModel } from '../pipelines/pipeline.model.js';
import { StageModel } from '../pipelines/stage.model.js';
import { IntegrationModel, IIntegration } from './integration.model.js';
import crypto from 'crypto';
import { logger } from '../../config/logger.js';

// Verificar assinatura do Meta (X-Hub-Signature-256)
export function verifyMetaSignature(
  payload: string,
  signature: string,
  appSecret: string
): boolean {
  if (!signature || !appSecret) return false;
  
  const expectedSignature = 'sha256=' + crypto
    .createHmac('sha256', appSecret)
    .update(payload)
    .digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

// Buscar dados do lead via Graph API com retry
export async function fetchLeadData(leadgenId: string, accessToken: string, retries = 3) {
  const url = `https://graph.facebook.com/v21.0/${leadgenId}?access_token=${accessToken}`;
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        const error = await response.text();
        logger.error(`Erro ao buscar lead do Meta (tentativa ${attempt}): ${error}`);
        if (attempt === retries) return null;
        await new Promise(r => setTimeout(r, 1000 * attempt));
        continue;
      }
      const data = await response.json();
      logger.info(`Lead data fetched successfully: ${leadgenId}`);
      return data;
    } catch (error) {
      logger.error(`Erro ao buscar dados do lead (tentativa ${attempt}): ${error instanceof Error ? error.message : String(error)}`);
      if (attempt === retries) return null;
      await new Promise(r => setTimeout(r, 1000 * attempt));
    }
  }
  return null;
}

// Buscar informações do formulário Lead Ads
export async function fetchFormInfo(formId: string, accessToken: string) {
  const url = `https://graph.facebook.com/v21.0/${formId}?fields=name,questions,status&access_token=${accessToken}`;
  
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    logger.error(`Erro ao buscar info do formulário: ${error instanceof Error ? error.message : String(error)}`);
    return null;
  }
}

// Extrair campo do field_data ou diretamente do payload
function extractField(
  fieldData: Array<{ name: string; values: string[] }> | undefined,
  directData: Record<string, any>,
  fieldName: string,
  mapping?: Record<string, string>
): string | undefined {
  // Verificar mapeamento customizado
  const mappedName = mapping?.[fieldName] || fieldName;
  
  // Tentar extrair do field_data
  if (fieldData) {
    const field = fieldData.find(f => 
      f.name === mappedName || 
      f.name === fieldName ||
      f.name.toLowerCase() === fieldName.toLowerCase() ||
      f.name.toLowerCase().includes(fieldName.toLowerCase())
    );
    if (field?.values?.[0]) return field.values[0];
  }
  
  // Tentar extrair diretamente do payload (Make, Zapier, etc.)
  const directFields = [fieldName, mappedName, ...getFieldAliases(fieldName)];
  for (const key of directFields) {
    if (directData[key]) return directData[key];
    // Tentar também com underscore e camelCase
    const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
    const camelKey = key.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
    if (directData[snakeKey]) return directData[snakeKey];
    if (directData[camelKey]) return directData[camelKey];
  }
  
  return undefined;
}

// Aliases comuns para campos do Instagram/Facebook Lead Ads
function getFieldAliases(fieldName: string): string[] {
  const aliases: Record<string, string[]> = {
    name: ['full_name', 'nome', 'nome_completo', 'first_name', 'FULL_NAME', 'nome_do_lead'],
    email: ['e-mail', 'email_address', 'emailAddress', 'EMAIL', 'e_mail', 'endereco_email'],
    phone: ['phone_number', 'telefone', 'celular', 'whatsapp', 'mobile', 'PHONE', 
            'numero_telefone', 'tel', 'numero_whatsapp', 'contato'],
    company: ['empresa', 'company_name', 'companyName', 'organization', 'COMPANY_NAME', 
              'nome_empresa', 'razao_social'],
    city: ['cidade', 'CITY', 'municipio'],
    state: ['estado', 'STATE', 'uf', 'provincia'],
    job_title: ['cargo', 'JOB_TITLE', 'funcao', 'profissao', 'ocupacao']
  };
  return aliases[fieldName] || [];
}

// Processar payload do webhook (formato simples - Make, Zapier, etc.)
export async function ingestMetaPayload(body: unknown, integrationId?: string) {
  let integration: IIntegration | null = null;
  
  // Buscar integração ativa
  if (integrationId) {
    integration = await IntegrationModel.findById(integrationId);
  } else {
    integration = await IntegrationModel.findOne({ 
      type: 'meta_lead_ads', 
      active: true 
    });
  }
  
  // Parse do payload - tentar múltiplos formatos
  let parsed: any;
  try {
    parsed = simpleWebhookSchema.parse(body);
  } catch {
    try {
      parsed = metaWebhookSchema.parse(body);
    } catch {
      // Aceitar qualquer objeto como fallback para flexibilidade com Make/Zapier
      parsed = body as any;
      logger.info('Usando payload raw (formato não padrão)');
    }
  }
  
  // Configurações da integração ou padrões
  const fieldMapping: Record<string, string> = (integration?.config?.fieldMapping as Record<string, string>) || {};
  const origin = integration?.config?.origin || 'Instagram Lead Ads';
  
  // Log do payload para debug
  logger.info(`Processando lead do Instagram Ads: ${JSON.stringify(parsed).substring(0, 300)}`);
  
  // Extrair dados do lead - tentar múltiplos campos
  const name = extractField(parsed.field_data, parsed, 'name', fieldMapping) || 
               extractField(parsed.field_data, parsed, 'full_name', fieldMapping) ||
               'Lead Instagram';
  const email = extractField(parsed.field_data, parsed, 'email', fieldMapping);
  const phone = extractField(parsed.field_data, parsed, 'phone', fieldMapping) ||
                extractField(parsed.field_data, parsed, 'phone_number', fieldMapping);
  const company = extractField(parsed.field_data, parsed, 'company', fieldMapping) ||
                  extractField(parsed.field_data, parsed, 'company_name', fieldMapping);
  
  // Campos extras do Lead Ads
  const city = extractField(parsed.field_data, parsed, 'city', fieldMapping);
  const state = extractField(parsed.field_data, parsed, 'state', fieldMapping);
  const jobTitle = extractField(parsed.field_data, parsed, 'job_title', fieldMapping);
  
  // Construir endereço se tiver cidade/estado
  const address = [city, state].filter(Boolean).join(', ') || undefined;
  
  // Buscar pipeline e stage
  let pipelineId = integration?.config?.defaultPipelineId?.toString();
  let stageId = integration?.config?.defaultStageId?.toString();
  
  if (!pipelineId || !stageId) {
    const pipeline = await PipelineModel.findOne({ key: 'default' });
    if (!pipeline) {
      throw new Error('Pipeline com key "default" não encontrado.');
    }
    pipelineId = pipeline._id.toString();
    
    const stage = await StageModel.findOne({
      pipelineId: pipeline._id,
      key: 'novo'
    });
    if (!stage) {
      throw new Error(`Stage com key: 'novo' não encontrado no pipeline ${pipeline.name}.`);
    }
    stageId = stage._id.toString();
  }
  
  // Criar o lead com dados expandidos
  const lead = await createLead({
    name,
    email,
    phone,
    company,
    origin,
    pipelineId,
    stageId,
    owners: integration?.config?.defaultOwnerId 
      ? [integration.config.defaultOwnerId.toString()] 
      : undefined,
    notes: parsed.message ? `Mensagem: ${parsed.message}` : undefined,
    externalId: parsed.leadgen_id,
    metadata: {
      source: 'instagram_lead_ads',
      formId: parsed.form_id,
      leadgenId: parsed.leadgen_id,
      createdTime: parsed.created_time,
      integrationId: integration?._id?.toString(),
      adId: parsed.ad_id,
      campaignId: parsed.campaign_id,
      adsetId: parsed.adset_id,
      city,
      state,
      jobTitle,
      rawPayload: JSON.stringify(parsed).substring(0, 1000) // Guardar payload para debug
    }
  });
  
  // Atualizar estatísticas da integração
  if (integration) {
    await IntegrationModel.findByIdAndUpdate(integration._id, {
      $inc: { 'stats.leadsReceived': 1, 'stats.leadsCreated': 1 },
      $set: { 'stats.lastLeadAt': new Date() }
    });
  }
  
  logger.info(`✅ Lead criado via Instagram Lead Ads: ${lead._id} - ${name} (${email || phone || 'sem contato'})`);
  return lead;
}

// Processar webhook real do Meta (formato Leadgen)
export async function processMetaLeadgenWebhook(body: unknown) {
  const parsed = metaLeadgenWebhookSchema.parse(body);
  const results: any[] = [];
  
  logger.info(`Processando webhook Meta com ${parsed.entry.length} entries`);
  
  for (const entry of parsed.entry) {
    const pageId = entry.id;
    
    // Buscar integração para esta página (ou qualquer integração ativa)
    let integration = await IntegrationModel.findOne({
      type: 'meta_lead_ads',
      active: true,
      'config.pageId': pageId
    });
    
    // Fallback: usar qualquer integração ativa se não encontrar pela pageId
    if (!integration) {
      integration = await IntegrationModel.findOne({
        type: 'meta_lead_ads',
        active: true
      });
      
      if (!integration) {
        logger.warn(`Nenhuma integração ativa para pageId: ${pageId}`);
        continue;
      }
      logger.info(`Usando integração fallback: ${integration.name} (${integration._id})`);
    }
    
    for (const change of entry.changes) {
      if (change.field !== 'leadgen') continue;
      
      const { leadgen_id, form_id, ad_id, campaign_id } = change.value;
      
      logger.info(`Processando lead ${leadgen_id} do form ${form_id}`);
      
      // Se temos accessToken, buscar dados completos do lead
      if (integration.config.accessToken) {
        const leadData = await fetchLeadData(leadgen_id, integration.config.accessToken);
        if (leadData) {
          const lead = await ingestMetaPayload({
            ...leadData,
            leadgen_id,
            form_id,
            ad_id,
            campaign_id
          }, integration._id.toString());
          results.push(lead);
        } else {
          // Fallback: criar lead com dados básicos se falhar fetch
          logger.warn(`Fallback: criando lead sem dados completos para ${leadgen_id}`);
          const lead = await ingestMetaPayload({
            leadgen_id,
            form_id,
            ad_id,
            campaign_id,
            created_time: new Date(change.value.created_time * 1000).toISOString()
          }, integration._id.toString());
          results.push(lead);
        }
      } else {
        // Criar lead com dados básicos
        const lead = await ingestMetaPayload({
          leadgen_id,
          form_id,
          ad_id,
          campaign_id,
          created_time: new Date(change.value.created_time * 1000).toISOString()
        }, integration._id.toString());
        results.push(lead);
      }
    }
  }
  
  logger.info(`Processados ${results.length} leads do webhook Meta`);
  return results;
}

// CRUD de Integrações
export async function listIntegrations(userId: string) {
  return IntegrationModel.find().sort({ createdAt: -1 });
}

export async function getIntegration(id: string) {
  return IntegrationModel.findById(id);
}

export async function createIntegration(data: any, userId: string) {
  // Gerar verifyToken único se não fornecido
  if (!data.config?.verifyToken) {
    data.config = {
      ...data.config,
      verifyToken: crypto.randomBytes(32).toString('hex')
    };
  }
  
  // Limpar strings vazias dos ObjectIds para evitar erro de cast
  if (data.config) {
    if (!data.config.defaultPipelineId || data.config.defaultPipelineId === '') {
      delete data.config.defaultPipelineId;
    }
    if (!data.config.defaultStageId || data.config.defaultStageId === '') {
      delete data.config.defaultStageId;
    }
    if (!data.config.defaultOwnerId || data.config.defaultOwnerId === '') {
      delete data.config.defaultOwnerId;
    }
  }
  
  const integration = new IntegrationModel({
    ...data,
    createdBy: userId
  });
  
  return integration.save();
}

export async function updateIntegration(id: string, data: any) {
  // Limpar strings vazias dos ObjectIds para evitar erro de cast
  if (data.config) {
    if (data.config.defaultPipelineId === '') {
      data.config.defaultPipelineId = undefined;
    }
    if (data.config.defaultStageId === '') {
      data.config.defaultStageId = undefined;
    }
    if (data.config.defaultOwnerId === '') {
      data.config.defaultOwnerId = undefined;
    }
  }
  return IntegrationModel.findByIdAndUpdate(id, data, { new: true });
}

export async function deleteIntegration(id: string) {
  return IntegrationModel.findByIdAndDelete(id);
}

// Gerar URL do webhook para o usuário
export function generateWebhookUrl(baseUrl: string, integrationId?: string) {
  if (integrationId) {
    return `${baseUrl}/api/integrations/meta/webhook/${integrationId}`;
  }
  return `${baseUrl}/api/integrations/meta/webhook`;
}

