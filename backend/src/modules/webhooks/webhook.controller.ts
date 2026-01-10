import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { asyncHandler, AppError } from '../../common/http.js';
import { createLead, updateLead, findNextResponsible } from '../leads/leads.service.js';
import { PipelineModel } from '../pipelines/pipeline.model.js';
import { StageModel } from '../pipelines/stage.model.js';
import { LeadModel } from '../leads/lead.model.js';
import { UserModel } from '../users/user.model.js';
// 👇 IMPORTANTE: Verifique se o caminho está correto para o seu projeto
import { Note } from '../../models/Note.model.js'; 

const SYSTEM_ID = '000000000000000000000000';

// --- FUNÇÕES AUXILIARES ---

const normalizarTelefone = (phone: string): string => {
  if (!phone) return '';
  let cleaned = phone.replace(/[^\d+]/g, '');
  if (cleaned.startsWith('55') && !cleaned.startsWith('+')) cleaned = '+' + cleaned;
  if (!cleaned.startsWith('+') && cleaned.length <= 11) cleaned = '+55' + cleaned;
  return cleaned;
};

const textoParaBooleano = (texto: any): boolean => {
  if (!texto) return false;
  const t = String(texto).toLowerCase().trim();
  return t === 'sim' || t === 'yes' || t === 'true' || t === 's' || t === '1';
};

// Gera o resumo técnico específico para os campos do Webhook
const gerarResumoTecnicoWebhook = (dados: any) => {
  const { investimento, hospitalPreferencia, temCnpj, temPlano, cidade, estado } = dados;
  return `
📋 DADOS TÉCNICOS (WEBHOOK):
---------------------------
💰 Investimento: R$ ${investimento || '0,00'}
🏥 Hospital: ${hospitalPreferencia || '-'}
🏢 CNPJ: ${temCnpj ? 'SIM' : 'NÃO'}
🩺 Plano Atual: ${temPlano ? 'SIM' : 'NÃO'}
📍 Local: ${cidade || '-'} / ${estado || '-'}
`.trim();
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
  const phoneClean = normalizarTelefone(telefone);
  
  // Tratamento rigoroso de email (igual Linktree)
  let emailClean = email ? email.trim().toLowerCase() : '';
  if (emailClean === '-' || emailClean === 'nao' || emailClean.length < 5 || !emailClean.includes('@')) {
     emailClean = ''; 
  }

  const lives = Number(quantidadeVidas) || 1;
  const temCnpj = textoParaBooleano(possuiCNPJ);
  const temPlano = textoParaBooleano(jaTemPlano);
  const valorEstimado = Number(investimento) || 0;
  
  // Transforma hospital em Array para o banco
  const listaHospitais = hospitalPreferencia ? [hospitalPreferencia] : [];

  const dadosFormatados = { 
    investimento: valorEstimado, 
    hospitalPreferencia, 
    temCnpj, 
    temPlano, 
    cidade, 
    estado 
  };

  // --- 2. BUSCA INTELIGENTE (EXISTE?) ---
  const searchConditions: any[] = [{ phone: phoneClean }];
  if (emailClean && emailClean !== '') {
    searchConditions.push({ email: emailClean });
  }

  const existingLead = await LeadModel.findOne({
    $or: searchConditions
  });

  // ===============================================================
  // CASO 1: ATUALIZAÇÃO (LEAD EXISTENTE)
  // ===============================================================
  if (existingLead) {
    console.log(`[WEBHOOK] Atualizando Lead: ${existingLead.name}`);

    let novoDono = existingLead.owners || [];
    let houveRedistribuicao = false;

    // --- PROTEÇÃO DE CARTEIRA (STICKY ROUTING) ---
    const donoAtualId = (existingLead.owners && existingLead.owners.length > 0) ? existingLead.owners[0] : null;
    let manterDonoAtual = false;

    if (donoAtualId) {
      const regraCnpj = temCnpj ? { $in: ['required', 'both'] } : { $in: ['forbidden', 'both'] };
      
      const donoQualificado = await UserModel.findOne({
        _id: donoAtualId,
        active: true,
        'distribution.active': true,
        'distribution.minLives': { $lte: lives },
        'distribution.maxLives': { $gte: lives },
        'distribution.cnpjRule': regraCnpj
      });

      if (donoQualificado) {
        console.log(`[WEBHOOK] Dono atual qualificado. Mantendo.`);
        manterDonoAtual = true;
      }
    }

    // Se o dono atual não serve mais, redistribui
    if (!manterDonoAtual) {
      const donoDistribuido = await findNextResponsible(lives, temCnpj);
      if (donoDistribuido) {
        novoDono = [donoDistribuido as any];
        houveRedistribuicao = true;
      }
    }

    // --- CRIAÇÃO DE NOTA VISUAL (Se houver observações) ---
    if (observacoes && observacoes.trim() !== '') {
      await Note.create({
        leadId: existingLead._id,
        conteudo: `[Observação do Formulário]: ${observacoes}`,
        userId: SYSTEM_ID as any, 
        userName: 'Webhook (Site)', 
        isPinned: true            
      });
    }

    // --- LOG UNIFICADO ---
    const resumoTecnico = gerarResumoTecnicoWebhook(dadosFormatados);
    const tituloAtividade = houveRedistribuicao 
      ? '🔄 Lead RE-CONVERTIDO e REDISTRIBUÍDO (Webhook)' 
      : '🔄 Lead RE-CONVERTIDO (Mantido - Webhook)';
      
    const logUnificado = `${tituloAtividade}\n----------------------------------------\n👤 Dados Anteriores: ${existingLead.livesCount} vidas\n----------------------------------------\n${resumoTecnico}`;

    const leadAny = existingLead as any;

    const updatedLead = await updateLead(existingLead._id.toString(), {
      name: nome,
      phone: phoneClean,
      email: (emailClean && emailClean !== '') ? emailClean : existingLead.email,
      
      livesCount: lives,
      avgPrice: valorEstimado,
      hasCnpj: temCnpj,
      hasCurrentPlan: temPlano,
      preferredHospitals: listaHospitais.length ? listaHospitais : leadAny.preferredHospitals,
      
      city: cidade || existingLead.city,
      state: estado || existingLead.state,
      
      owners: novoDono,
      lastActivity: new Date(),
      
      // Passamos o log pronto para o Service não criar log genérico
      customUpdateLog: logUnificado 
    });

    return res.status(StatusCodes.CREATED).json({
      success: true,
      action: 'updated',
      leadId: updatedLead?._id,
      message: 'Lead Atualizado com sucesso.'
    });
  }

  // ===============================================================
  // CASO 2: CRIAÇÃO (NOVO LEAD)
  // ===============================================================
  
  const pipeline = await PipelineModel.findOne({ key: 'default' }) || await PipelineModel.findOne();
  const stage = await StageModel.findOne({ pipelineId: pipeline?._id, key: 'novo' }) || await StageModel.findOne({ pipelineId: pipeline?._id });

  if (!pipeline || !stage) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: 'Configuração de Funil ausente.' });
  }

  const logTecnicoUnificado = `Lead criado via Webhook.\n\n${gerarResumoTecnicoWebhook(dadosFormatados)}`;

  const resultLead = await createLead({
    name: nome,
    phone: phoneClean,
    email: emailClean,
    origin: origem || 'Meta Ads', 
    pipelineId: pipeline._id.toString(),
    stageId: stage._id.toString(),
    livesCount: lives,
    hasCnpj: temCnpj,
    avgPrice: valorEstimado,
    
    // Deixa notes limpo, usaremos a Note visual abaixo
    notes: '', 
    
    city: cidade || 'A verificar',
    state: estado || 'SP',
    owners: [], 
    rank: 'c' + Date.now(),
    
    hasCurrentPlan: temPlano,
    preferredHospitals: listaHospitais,
    ageBuckets: [],
    
    // Log Inteligente na criação
    customCreationLog: logTecnicoUnificado
  });

  if (!resultLead) {
    throw new AppError('Erro ao processar o Lead no sistema.', StatusCodes.INTERNAL_SERVER_ERROR);
  }

  // Cria a nota visual se tiver observação
  if (observacoes && observacoes.trim() !== '') {
    await Note.create({
      leadId: resultLead._id,
      conteudo: `[Observação Inicial]: ${observacoes}`,
      userId: SYSTEM_ID as any,
      userName: 'Webhook (Site)',
      isPinned: true
    });
  }

  return res.status(StatusCodes.CREATED).json({
    success: true,
    action: 'created',
    leadId: resultLead._id,
    message: 'Lead Criado com sucesso'
  });
});