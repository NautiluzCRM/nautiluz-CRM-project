import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { asyncHandler } from '../../common/http.js';
import { createLead, updateLead, addActivity } from '../leads/leads.service.js'; 
import { PipelineModel } from '../pipelines/pipeline.model.js';
import { StageModel } from '../pipelines/stage.model.js';
import { LeadModel } from '../leads/lead.model.js';

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

  console.log(' [WEBHOOK] Payload recebido:', req.body);

  if (!nome || !telefone) {
    return res.status(StatusCodes.BAD_REQUEST).json({ 
      error: 'Nome e Telefone são obrigatórios.' 
    });
  }

  // Tratamento de dados novos
  const lives = Number(quantidadeVidas) || 1;
  const temCnpj = textoParaBooleano(possuiCNPJ);
  const temPlano = textoParaBooleano(jaTemPlano);
  const valorEstimado = Number(investimento) || 0;

  // 1. VERIFICAR SE O LEAD JÁ EXISTE
  const existingLead = await LeadModel.findOne({
    $or: [{ email: email }, { phone: telefone }]
  });

  // ===============================================================
  // LÓGICA DE ATUALIZAÇÃO (INVERTIDA: NOVO NO CARD, VELHO NA OBS)
  // ===============================================================
  if (existingLead) {
    console.log(`Atualizando Lead Existente: ${existingLead.name}`);

    // Limpeza: Se a nota antiga já for muito grande, pegamos só o essencial ou mantemos tudo
    // Aqui formatamos o bloco de histórico para ficar bem separado
    const historicoAntigo = `
\n========================================
 \nARQUIVADO EM ${new Date().toLocaleDateString('pt-BR')} (RE-CONVERSÃO)
\n========================================
 \nNome Anterior: ${existingLead.name}
 \nVidas: ${existingLead.livesCount} |  Valor: ${existingLead.avgPrice}
 \nLocal: ${existingLead.city}/${existingLead.state}
 \nObs Antiga: ${existingLead.notes ? existingLead.notes.split('========================================')[0].trim() : '-'}
`.trim(); 
// O split acima ajuda a não duplicar infinitamente o cabeçalho se o lead converter 10 vezes

    // Adiciona 2 quebras de linha (\n\n) para garantir separação visual
    const notasAtualizadas = historicoAntigo + '\n\n' + (existingLead.notes || '');

    await updateLead(existingLead._id.toString(), {
      name: nome,
      livesCount: lives,
      avgPrice: valorEstimado,
      city: cidade || existingLead.city,
      state: estado || existingLead.state,
      hasCnpj: temCnpj,
      hasCurrentPlan: temPlano,
      notes: notasAtualizadas, // Salva o histórico formatado
      lastActivity: new Date(), 
      phone: telefone,
      email: email || existingLead.email
    });

    await addActivity(existingLead._id.toString(), 'Sistema', {
      description: 'Lead RE-CONVERTIDO: Dados atualizados.',
      payload: req.body
    });

    return res.status(StatusCodes.OK).json({ 
      message: 'Lead atualizado.', 
      leadId: existingLead._id,
      updated: true
    });
  }

  // ===============================================================
  // LÓGICA DE CRIAÇÃO (Se é novo)
  // ===============================================================
  const pipeline = await PipelineModel.findOne({ key: 'default' }) || await PipelineModel.findOne();
  const stage = await StageModel.findOne({ pipelineId: pipeline?._id, key: 'novo' }) || await StageModel.findOne({ pipelineId: pipeline?._id });

  if (!pipeline || !stage) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: 'Configuração de Funil ausente.' });
  }

  // Formatação Limpa para Lead Novo
  const notasIniciais = `
${observacoes || ''}

 \nDETALHES DO FORMULÁRIO:
\n---------------------------
 \nInvestimento: ${investimento || '-'}
 \nHospital: ${hospitalPreferencia || '-'}
 \nCNPJ: ${temCnpj ? 'SIM' : 'NÃO'}
 \nPlano Atual: ${temPlano ? 'SIM' : 'NÃO'}
  `.trim();

  const newLead = await createLead({
    name: nome,
    phone: telefone,
    email: email || '',
    origin: origem || 'Meta Ads', 
    pipelineId: pipeline._id.toString(),
    stageId: stage._id.toString(),
    livesCount: lives,
    hasCnpj: temCnpj,
    avgPrice: valorEstimado,
    notes: notasIniciais,
    city: cidade || 'A verificar',
    state: estado || 'SP',
    owners: [], 
    rank: 'c' + Date.now() 
  });

  return res.status(StatusCodes.CREATED).json({
    success: true,
    leadId: newLead?._id // Adicionei o ?._id antes, mas aqui sabemos que newLead existe
  });
});