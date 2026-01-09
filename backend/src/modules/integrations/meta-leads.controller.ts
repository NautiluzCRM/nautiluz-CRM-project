import { Request, Response } from 'express';
import { asyncHandler } from '../../common/http.js';
import { 
  ingestMetaPayload, 
  processMetaLeadgenWebhook,
  verifyMetaSignature,
  listIntegrations,
  getIntegration,
  createIntegration,
  updateIntegration,
  deleteIntegration,
  generateWebhookUrl
} from './meta-leads.service.js';
import { IntegrationModel } from './integration.model.js';
import { integrationConfigSchema } from './meta.validation.js';
import { logger } from '../../config/logger.js';
import { env } from '../../config/env.js';

// Verificação do webhook do Meta (GET request para challenge)
export const metaWebhookVerify = asyncHandler(async (req: Request, res: Response) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  logger.info(`Meta Webhook Verification: mode=${mode}, token=${token}`);

  if (mode === 'subscribe') {
    // Buscar integração com este verify_token
    const integration = await IntegrationModel.findOne({
      'config.verifyToken': token,
      active: true
    });

    if (integration) {
      logger.info(`Webhook verificado para integração: ${integration.name}`);
      return res.status(200).send(challenge);
    }
    
    // Verificar token padrão do ambiente (fallback)
    const defaultToken = process.env.META_VERIFY_TOKEN;
    if (defaultToken && token === defaultToken) {
      logger.info('Webhook verificado com token padrão');
      return res.status(200).send(challenge);
    }
  }

  logger.warn('Verificação de webhook falhou');
  res.status(403).json({ error: 'Verificação falhou' });
});

// Receber webhook do Meta (POST)
export const metaWebhookHandler = asyncHandler(async (req: Request, res: Response) => {
  // Responder rapidamente ao Meta (evitar timeout)
  res.status(200).json({ received: true });

  try {
    const signature = req.headers['x-hub-signature-256'] as string;
    const body = req.body;

    logger.info(`Webhook Meta recebido: ${JSON.stringify(body).substring(0, 500)}`);

    // Se tiver objeto 'entry', é o formato real do Meta
    if (body.object === 'page' && body.entry) {
      await processMetaLeadgenWebhook(body);
    } else {
      // Formato simplificado (Make, Zapier, etc.)
      await ingestMetaPayload(body);
    }
  } catch (error) {
    logger.error(`Erro ao processar webhook Meta: ${error instanceof Error ? error.message : String(error)}`);
    // Atualizar estatísticas de erro
    await IntegrationModel.updateOne(
      { type: 'meta_lead_ads', active: true },
      { $inc: { 'stats.errors': 1 } }
    );
  }
});

// Webhook com ID específico da integração
export const metaWebhookByIdHandler = asyncHandler(async (req: Request, res: Response) => {
  const { integrationId } = req.params;
  
  // Responder rapidamente
  res.status(200).json({ received: true });

  try {
    const body = req.body;
    logger.info(`Webhook Meta (${integrationId}): ${JSON.stringify(body).substring(0, 500)}`);

    await ingestMetaPayload(body, integrationId);
  } catch (error) {
    logger.error(`Erro ao processar webhook Meta (${integrationId}): ${error instanceof Error ? error.message : String(error)}`);
    await IntegrationModel.findByIdAndUpdate(integrationId, {
      $inc: { 'stats.errors': 1 }
    });
  }
});

// CRUD de Integrações

// Listar integrações
export const listIntegrationsHandler = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.sub;
  const integrations = await listIntegrations(userId);
  res.json(integrations);
});

// Obter integração por ID
export const getIntegrationHandler = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const integration = await getIntegration(id);
  
  if (!integration) {
    return res.status(404).json({ error: 'Integração não encontrada' });
  }
  
  // Adicionar URL do webhook
  const baseUrl = process.env.API_BASE_URL || `http://localhost:${env.PORT}`;
  const webhookUrl = generateWebhookUrl(baseUrl, id);
  
  res.json({
    ...integration.toObject(),
    webhookUrl
  });
});

// Criar integração
export const createIntegrationHandler = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.sub;
  const data = integrationConfigSchema.parse(req.body);
  
  const integration = await createIntegration(data, userId);
  
  // Gerar URL do webhook
  const baseUrl = process.env.API_BASE_URL || `http://localhost:${env.PORT}`;
  const webhookUrl = generateWebhookUrl(baseUrl, integration._id.toString());
  
  logger.info(`Integração criada: ${integration.name} (${integration._id})`);
  
  res.status(201).json({
    ...integration.toObject(),
    webhookUrl
  });
});

// Atualizar integração
export const updateIntegrationHandler = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const data = req.body;
  
  const integration = await updateIntegration(id, data);
  
  if (!integration) {
    return res.status(404).json({ error: 'Integração não encontrada' });
  }
  
  logger.info(`Integração atualizada: ${integration.name} (${id})`);
  res.json(integration);
});

// Deletar integração
export const deleteIntegrationHandler = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  
  const integration = await deleteIntegration(id);
  
  if (!integration) {
    return res.status(404).json({ error: 'Integração não encontrada' });
  }
  
  logger.info(`Integração deletada: ${integration.name} (${id})`);
  res.json({ message: 'Integração deletada com sucesso' });
});

// Testar integração
export const testIntegrationHandler = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  
  const integration = await getIntegration(id);
  
  if (!integration) {
    return res.status(404).json({ error: 'Integração não encontrada' });
  }
  
  // Criar lead de teste
  try {
    const testPayload = {
      leadgen_id: `test_${Date.now()}`,
      form_id: 'test_form',
      created_time: new Date().toISOString(),
      field_data: [
        { name: 'full_name', values: ['Lead de Teste - Meta'] },
        { name: 'email', values: ['teste@metaleadads.com'] },
        { name: 'phone_number', values: ['+5511999999999'] }
      ]
    };
    
    const lead = await ingestMetaPayload(testPayload, id);
    
    res.json({
      success: true,
      message: 'Lead de teste criado com sucesso',
      lead: {
        id: lead._id,
        name: lead.name,
        email: lead.email
      }
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Obter estatísticas da integração
export const getIntegrationStatsHandler = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  
  const integration = await getIntegration(id);
  
  if (!integration) {
    return res.status(404).json({ error: 'Integração não encontrada' });
  }
  
  res.json({
    stats: integration.stats,
    active: integration.active,
    lastUpdated: integration.updatedAt
  });
});

// ==========================================
// CONEXÃO DIRETA COM FACEBOOK
// ==========================================

import { 
  validateFacebookCredentials, 
  subscribePageWebhook, 
  fetchPageLeadForms 
} from './meta-leads.service.js';

// Validar credenciais do Facebook
export const validateCredentialsHandler = asyncHandler(async (req: Request, res: Response) => {
  const { accessToken, pageId } = req.body;
  
  if (!accessToken) {
    return res.status(400).json({ valid: false, error: 'Access Token é obrigatório' });
  }
  
  const result = await validateFacebookCredentials(accessToken, pageId);
  res.json(result);
});

// Ativar conexão direta (registrar webhook)
export const activateDirectConnectionHandler = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  
  const integration = await getIntegration(id);
  if (!integration) {
    return res.status(404).json({ error: 'Integração não encontrada' });
  }
  
  const { accessToken, pageId } = integration.config;
  if (!accessToken || !pageId) {
    return res.status(400).json({ 
      error: 'Credenciais incompletas. Configure App ID, Access Token e Page ID.' 
    });
  }
  
  // 1. Validar credenciais
  const validation = await validateFacebookCredentials(accessToken, pageId);
  if (!validation.valid) {
    return res.status(400).json({ 
      error: validation.error,
      details: validation 
    });
  }
  
  // 2. Gerar URL do webhook para esta integração
  const baseUrl = process.env.API_BASE_URL || `http://localhost:${env.PORT}`;
  const webhookUrl = `${baseUrl}/api/integrations/meta/webhook/${id}`;
  
  // 3. Registrar webhook na página do Facebook
  const subscribeResult = await subscribePageWebhook(pageId, accessToken, webhookUrl);
  if (!subscribeResult.success) {
    return res.status(400).json({ 
      error: `Falha ao registrar webhook: ${subscribeResult.error}`,
      hint: 'Certifique-se de que o App do Facebook está configurado corretamente no Meta for Developers'
    });
  }
  
  // 4. Atualizar integração como "ativada"
  await updateIntegration(id, { 
    active: true,
    'config.webhookRegistered': true,
    'config.webhookRegisteredAt': new Date()
  });
  
  logger.info(`✅ Conexão direta ativada para integração ${id}`);
  
  res.json({
    success: true,
    message: 'Conexão direta ativada com sucesso!',
    webhookUrl,
    pageInfo: validation.pageInfo
  });
});

// Buscar formulários de Lead Ads da página
export const getLeadFormsHandler = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  
  const integration = await getIntegration(id);
  if (!integration) {
    return res.status(404).json({ error: 'Integração não encontrada' });
  }
  
  const { accessToken, pageId } = integration.config;
  if (!accessToken || !pageId) {
    return res.status(400).json({ error: 'Credenciais não configuradas' });
  }
  
  const result = await fetchPageLeadForms(pageId, accessToken);
  res.json(result);
});
