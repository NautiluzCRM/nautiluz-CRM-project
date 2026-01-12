import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { asyncHandler, AppError } from '../../common/http.js';
import { createLead, updateLead, addActivity, findNextResponsible } from '../leads/leads.service.js';
import { PipelineModel } from '../pipelines/pipeline.model.js';
import { StageModel } from '../pipelines/stage.model.js';
import { LeadModel } from '../leads/lead.model.js';
import { UserModel } from '../users/user.model.js';
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

const formatarFaixasEtarias = (buckets: number[]): string => {
  if (!buckets || buckets.length === 0) return '-';
  const labels = [
    '0 a 18', '19 a 23', '24 a 28', '29 a 33', '34 a 38',
    '39 a 43', '44 a 48', '49 a 53', '54 a 58', '59 ou mais'
  ];
  return buckets.map((qtd, index) => {
    const label = labels[index] || `Faixa ${index + 1}`;
    return `${label} = ${qtd}`;
  }).join('\n');
};

const converterFaixasEtariasParaObjeto = (buckets: number[]) => {
  const b = buckets || [];
  return {
    ate18: b[0] || 0,
    de19a23: b[1] || 0,
    de24a28: b[2] || 0,
    de29a33: b[3] || 0,
    de34a38: b[4] || 0,
    de39a43: b[5] || 0,
    de44a48: b[6] || 0,
    de49a53: b[7] || 0,
    de54a58: b[8] || 0,
    acima59: b[9] || 0
  };
};

const gerarResumoTecnico = (dados: any) => {
  const { temCnpj, safeCnpjType, temPlano, currentPlan, preferredHospitals, textoFaixas } = dados;
  return `
 DADOS TÉCNICOS DO FORMULÁRIO:

 CNPJ: ${temCnpj ? 'SIM' : 'NÃO'} ${safeCnpjType ? '(' + safeCnpjType + ')' : ''}
 Plano Atual: ${temPlano ? 'SIM' : 'NÃO'} ${currentPlan ? '(' + currentPlan + ')' : ''}
 Hospitais: ${preferredHospitals && preferredHospitals.length ? preferredHospitals.join(', ') : '-'}
 Faixas Etárias:
${textoFaixas}
`.trim();
};

export const linktreeHandler = asyncHandler(async (req: Request, res: Response) => {
  
  const rawBody = req.body;
  const mensagemUsuario = rawBody.notes || rawBody.observations || rawBody.message || rawBody.mensagem || rawBody.obs || '';

  let { 
    name, email, phone, 
    city, state, livesCount, ageBuckets, 
    hasCnpj, cnpjType, currentPlan, hasCurrentPlan, avgPrice,
    preferredHospitals,
    modo_teste 
  } = req.body;

  if (!name || !phone) {
    throw new AppError('Os campos Nome e Telefone são obrigatórios.', StatusCodes.BAD_REQUEST);
  }

  // --- TRATAMENTO DE DADOS ---
  const phoneClean = normalizarTelefone(phone);
  
  // Se for vazio, traço ou muito curto, consideramos inválido.
  let emailClean = email ? email.trim().toLowerCase() : '';
  if (emailClean === '-' || emailClean === 'nao' || emailClean.length < 5 || !emailClean.includes('@')) {
     emailClean = ''; 
  }

  const count = Number(livesCount) || 1;
  const price = Number(avgPrice) || 0;
  const temCnpj = !!hasCnpj;
  const temPlano = !!hasCurrentPlan;
  const safeCnpjType = (temCnpj && cnpjType && cnpjType.trim() !== '') ? cnpjType : undefined;
  
  const bucketsArray = Array.isArray(ageBuckets) ? ageBuckets : [];
  const textoFaixas = formatarFaixasEtarias(bucketsArray);
  const faixasEtariasObj = converterFaixasEtariasParaObjeto(bucketsArray);

  const dadosFormatados = { temCnpj, safeCnpjType, temPlano, currentPlan, preferredHospitals, textoFaixas };

  // --- BUSCA LEAD  ---
  // Montamos a lista de condições dinamicamente
  const searchConditions: any[] = [{ phone: phoneClean }];
  
  // Só busca por email se o email for VÁLIDO (não vazio)
  if (emailClean && emailClean !== '') {
    searchConditions.push({ email: emailClean });
  }

  const existingLead = await LeadModel.findOne({
    $or: searchConditions
  });

  // ===============================================================
  // ATUALIZAÇÃO
  // ===============================================================
  if (existingLead) {
    console.log(`[Linktree] Atualizando Lead: ${existingLead.name}`);

    let novoDono = existingLead.owners || [];
    let houveRedistribuicao = false;

    // Proteção de Carteira
    const donoAtualId = (existingLead.owners && existingLead.owners.length > 0) ? existingLead.owners[0] : null;
    let manterDonoAtual = false;

    if (donoAtualId) {
      const regraCnpj = temCnpj ? { $in: ['required', 'both'] } : { $in: ['forbidden', 'both'] };
      const donoQualificado = await UserModel.findOne({
        _id: donoAtualId,
        active: true,
        'distribution.active': true,
        'distribution.minLives': { $lte: count },
        'distribution.maxLives': { $gte: count },
        'distribution.cnpjRule': regraCnpj
      });

      if (donoQualificado) manterDonoAtual = true;
    }

    if (!manterDonoAtual) {
      const donoDistribuido = await findNextResponsible(count, temCnpj);
      if (donoDistribuido) {
        novoDono = [donoDistribuido as any];
        houveRedistribuicao = true;
      }
    }

    // --- NOVA INTEGRAÇÃO COM SISTEMA DE NOTAS ---
    if (mensagemUsuario && mensagemUsuario.trim() !== '') {
      await Note.create({
        leadId: existingLead._id,
        conteudo: `[Mensagem do Site]: ${mensagemUsuario}`,
        userId: SYSTEM_ID as any, 
        userName: 'Cliente (Site)', 
        isPinned: true            
      });
    }

    // Log Técnico
    const resumoTecnico = gerarResumoTecnico(dadosFormatados);
    const tituloAtividade = houveRedistribuicao 
      ? ' Lead RE-CONVERTIDO e REDISTRIBUÍDO' 
      : ' Lead RE-CONVERTIDO (Mantido)';
      
    const logUnificado = `${tituloAtividade}\n----------------------------------------\n Dados Anteriores: ${existingLead.livesCount} vidas\n----------------------------------------\n${resumoTecnico}`;

    const leadAny = existingLead as any; 

    const updatedLead = await updateLead(existingLead._id.toString(), {
      name,
      phone: phoneClean,
      //  SÓ ATUALIZA O EMAIL SE O NOVO FOR VÁLIDO. SE FOR VAZIO, MANTÉM O ANTIGO.
      email: (emailClean && emailClean !== '') ? emailClean : existingLead.email,
      
      livesCount: count,
      avgPrice: price,
      hasCnpj: temCnpj,
      cnpjType: safeCnpjType || leadAny.cnpjType, 
      hasCurrentPlan: temPlano,
      currentPlan: currentPlan || leadAny.currentPlan,
      faixasEtarias: faixasEtariasObj, 
      idades: bucketsArray,
      preferredHospitals: preferredHospitals || leadAny.preferredHospitals,
      city: city || existingLead.city,
      state: state || existingLead.state,
      
      owners: novoDono, 
      
      lastActivity: new Date(),
      customUpdateLog: logUnificado
    });

    return res.status(StatusCodes.CREATED).json({ success: true, leadId: updatedLead?._id, message: 'Lead atualizado.' });
  }

  // ===============================================================
  // CRIAÇÃO
  // ===============================================================
  const pipeline = await PipelineModel.findOne({ key: 'default' }) || await PipelineModel.findOne();
  if (!pipeline) throw new AppError('Pipeline default não encontrado.', StatusCodes.INTERNAL_SERVER_ERROR);

  const stage = await StageModel.findOne({ pipelineId: pipeline._id, key: 'novo' }) || await StageModel.findOne({ pipelineId: pipeline._id });
  if (!stage) throw new AppError('Stage novo não encontrado.', StatusCodes.INTERNAL_SERVER_ERROR);

  const logTecnicoUnificado = `Lead criado via Site.\n\n${gerarResumoTecnico(dadosFormatados)}`;

  const lead = await createLead({
    name, 
    phone: phoneClean, 
    email: emailClean, 
    origin: 'Linktree', 
    pipelineId: pipeline._id.toString(), 
    stageId: stage._id.toString(), 
    rank: 'b' + Date.now().toString(),
    city: city || 'Não Informado', 
    state: state || 'SP',
    livesCount: count, 
    faixasEtarias: faixasEtariasObj, 
    idades: bucketsArray,
    hasCnpj: temCnpj, 
    cnpjType: safeCnpjType, 
    currentPlan: currentPlan || '', 
    hasCurrentPlan: temPlano, 
    avgPrice: price, 
    preferredHospitals: preferredHospitals || [],
    
    owners: [],
    customCreationLog: logTecnicoUnificado
  });

  if (!lead) throw new AppError('Erro inesperado ao criar lead.', StatusCodes.INTERNAL_SERVER_ERROR);

  if (mensagemUsuario && mensagemUsuario.trim() !== '') {
    await Note.create({
      leadId: lead._id,
      conteudo: `[Mensagem Inicial]: ${mensagemUsuario}`,
      userId: SYSTEM_ID as any, 
      userName: 'Cliente (Site)',
      isPinned: true
    });
  }

  return res.status(StatusCodes.CREATED).json({ success: true, leadId: lead._id, assignedToOwners: lead.owners });
});