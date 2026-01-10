import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { asyncHandler, AppError } from '../../common/http.js';
import { createLead } from '../leads/leads.service.js'; // Só precisamos do createLead, ele se vira!
import { PipelineModel } from '../pipelines/pipeline.model.js';
import { StageModel } from '../pipelines/stage.model.js';

const textoParaBooleano = (texto: any): boolean => {
  if (!texto) return false;
  const t = String(texto).toLowerCase().trim();
  return t === 'sim' || t === 'yes' || t === 'true' || t === 's';
};

export const webhookHandler = asyncHandler(async (req: Request, res: Response) => {
  const { 
    nome, email, telefone, origem, quantidadeVidas, observacoes,
    cidade, estado, investimento, possuiCNPJ, jaTemPlano, hospitalPreferencia
  } = req.body;

  console.log('[WEBHOOK] Payload recebido:', req.body);

  if (!nome || !telefone) {
    return res.status(StatusCodes.BAD_REQUEST).json({ 
      error: 'Nome e Telefone são obrigatórios.' 
    });
  }

  // --- 1. TRATAMENTO DE DADOS ---
  const lives = Number(quantidadeVidas) || 1;
  const temCnpj = textoParaBooleano(possuiCNPJ);
  const temPlano = textoParaBooleano(jaTemPlano);
  const valorEstimado = Number(investimento) || 0;

  // IMPORTANTE: Transforma a string do formulário em Array para o banco
  // Isso faz aparecer a etiqueta no Modal do CRM
  const listaHospitais = hospitalPreferencia ? [hospitalPreferencia] : [];

  // --- 2. PREPARAÇÃO DO FUNIL ---
  const pipeline = await PipelineModel.findOne({ key: 'default' }) || await PipelineModel.findOne();
  const stage = await StageModel.findOne({ pipelineId: pipeline?._id, key: 'novo' }) || await StageModel.findOne({ pipelineId: pipeline?._id });

  if (!pipeline || !stage) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: 'Configuração de Funil ausente.' });
  }

  // --- 3. FORMATAÇÃO DAS NOTAS ---
  // (Nota: O Service vai adicionar o histórico antigo se for duplicado, 
  // aqui mandamos apenas o que veio AGORA neste formulário)
  const notasEnvio = `
${observacoes || ''}

DETALHES DO FORMULÁRIO:
---------------------------
Investimento: ${investimento || '-'}
Hospital: ${hospitalPreferencia || '-'}
CNPJ: ${temCnpj ? 'SIM' : 'NÃO'}
Plano Atual: ${temPlano ? 'SIM' : 'NÃO'}
  `.trim();

  // --- 4. CHAMADA AO SERVICE INTELIGENTE ---
  // O createLead agora decide se cria um novo ou atualiza o existente (Upsert)
  const resultLead = await createLead({
    name: nome,
    phone: telefone,
    email: email || '',
    origin: origem || 'Meta Ads', 
    pipelineId: pipeline._id.toString(),
    stageId: stage._id.toString(),
    livesCount: lives,
    hasCnpj: temCnpj,
    avgPrice: valorEstimado,
    notes: notasEnvio, // Vai para observações (concatenado se for update)
    city: cidade || 'A verificar',
    state: estado || 'SP',
    owners: [], 
    rank: 'c' + Date.now(),
    
    // --- CAMPOS QUE FALTAVAM ---
    preferredHospitals: listaHospitais, // Array corrigido
    ageBuckets: [] // Array vazio para evitar erro no modal
  });

  // Verificação de Segurança
  if (!resultLead) {
    throw new AppError('Erro ao processar o Lead no sistema.', StatusCodes.INTERNAL_SERVER_ERROR);
  }

  return res.status(StatusCodes.CREATED).json({
    success: true,
    action: 'processed',
    leadId: resultLead._id,
    message: 'Lead processado (Criado ou Atualizado)'
  });
});