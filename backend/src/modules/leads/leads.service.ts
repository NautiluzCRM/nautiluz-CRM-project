import { LeadModel } from './lead.model.js';
import { ActivityModel } from './activity.model.js'; 
import { PipelineModel } from '../pipelines/pipeline.model.js';
import { StageModel } from '../pipelines/stage.model.js';
import { AppError } from '../../common/http.js';
import { StatusCodes } from 'http-status-codes';
import mongoose from 'mongoose';
import { ActivityService } from '../../services/activity.service.js';
import { UserModel } from '../users/user.model.js';

// --- ID FIXO DO SISTEMA ---
const SYSTEM_ID = '000000000000000000000000';

// Interfaces
interface UserAuth {
  sub: string;
  role: string;
}

interface LeadFilter {
  owners?: string;
  search?: string;
  name?: string;
  qualificationStatus?: string;
  origin?: string;
  startDate?: string;
  endDate?: string;
  pipelineId?: string;
  stageId?: string;
}

export async function listLeads(filter: LeadFilter = {}, user?: UserAuth) {
  const query: any = {};

  if (user && user.role !== 'admin') {
    query.owners = user.sub;
  } 
  else if (filter.owners) {
    query.owners = filter.owners;
  }

  if (filter.search || filter.name) {
    const searchTerm = filter.search || filter.name;
    const regex = { $regex: searchTerm, $options: 'i' };
    query.$or = [
      { name: regex },
      { email: regex },
      { phone: regex }
    ];
  }

  if (filter.qualificationStatus && filter.qualificationStatus !== 'all') {
    query.qualificationStatus = filter.qualificationStatus;
  }

  if (filter.origin && filter.origin !== 'all') {
    query.origin = filter.origin;
  }

  if (filter.startDate || filter.endDate) {
    query.createdAt = {};
    if (filter.startDate) {
      query.createdAt.$gte = new Date(filter.startDate);
    }
    if (filter.endDate) {
      const endDate = new Date(filter.endDate);
      endDate.setDate(endDate.getDate() + 1); 
      query.createdAt.$lte = endDate;
    }
  }

  if (filter.pipelineId) {
    query.pipelineId = filter.pipelineId;
  }

  if (filter.stageId) {
    query.stageId = filter.stageId;
  }

  return LeadModel.find(query)
    .sort({ createdAt: -1 })
    .populate('owners', 'name email photoUrl photoBase64') 
    .populate('owner', 'name email photoUrl photoBase64');
}

export function getLead(id: string) {
  return LeadModel.findById(id)
    .populate('owners', 'name email photoUrl photoBase64')
    .populate('owner', 'name email photoUrl photoBase64')
    .lean();
}

/**
 * Sistema de Distribuição de Leads - Round Robin com Fallback
 * 
 * Garante que nenhum vendedor fique sem lead seguindo a ordem:
 * 1. Busca vendedor que atende TODOS os critérios (vidas + CNPJ)
 * 2. Fallback 1: Busca vendedor que atende apenas o critério de CNPJ (ignora vidas)
 * 3. Fallback 2: Busca vendedor que atende apenas o critério de vidas (ignora CNPJ)
 * 4. Fallback 3: Busca qualquer vendedor ativo com distribuição ativa
 * 
 * Em todos os casos, usa round-robin baseado em lastLeadReceivedAt
 */
export async function findNextResponsible(lives: any, hasCnpj: boolean) {
  const livesNumber = Number(lives) || 0;

  const cnpjFilter = hasCnpj 
    ? { $in: ['required', 'both'] } 
    : { $in: ['forbidden', 'both'] };

  // Função auxiliar para atualizar o timestamp e retornar o ID
  const assignToSeller = async (seller: any, matchType: string) => {
    console.log(`[DISTRIBUIÇÃO] [${matchType}] Lead (${livesNumber} vidas, CNPJ: ${hasCnpj}) → ${seller.name}`);
    console.log(`    Última vez que recebeu: ${seller.distribution?.lastLeadReceivedAt || 'NUNCA'}`);

    await UserModel.updateOne(
      { _id: seller._id },
      { $set: { 'distribution.lastLeadReceivedAt': new Date() } }
    );
    
    return seller._id.toString();
  };

  // ========== TENTATIVA 1: MATCH PERFEITO (Vidas + CNPJ) ==========
  const perfectMatch = await UserModel.findOne({
    active: true,                       
    'distribution.active': true,        
    'distribution.minLives': { $lte: livesNumber }, 
    'distribution.maxLives': { $gte: livesNumber }, 
    'distribution.cnpjRule': cnpjFilter       
  })
  .sort({ 'distribution.lastLeadReceivedAt': 1, _id: 1 }) 
  .select('_id name distribution');

  if (perfectMatch) {
    return assignToSeller(perfectMatch, 'MATCH PERFEITO');
  }

  console.log(`[DISTRIBUIÇÃO] Nenhum match perfeito para: ${livesNumber} vidas | CNPJ: ${hasCnpj}. Tentando fallbacks...`);

  // ========== FALLBACK 1: Apenas CNPJ (ignora vidas) ==========
  const cnpjOnlyMatch = await UserModel.findOne({
    active: true,                       
    'distribution.active': true,        
    'distribution.cnpjRule': cnpjFilter       
  })
  .sort({ 'distribution.lastLeadReceivedAt': 1, _id: 1 }) 
  .select('_id name distribution');

  if (cnpjOnlyMatch) {
    return assignToSeller(cnpjOnlyMatch, 'FALLBACK CNPJ');
  }

  // ========== FALLBACK 2: Apenas Vidas (ignora CNPJ) ==========
  const livesOnlyMatch = await UserModel.findOne({
    active: true,                       
    'distribution.active': true,        
    'distribution.minLives': { $lte: livesNumber }, 
    'distribution.maxLives': { $gte: livesNumber }
  })
  .sort({ 'distribution.lastLeadReceivedAt': 1, _id: 1 }) 
  .select('_id name distribution');

  if (livesOnlyMatch) {
    return assignToSeller(livesOnlyMatch, 'FALLBACK VIDAS');
  }

  // ========== FALLBACK 3: Qualquer vendedor ativo ==========
  const anyActiveSeller = await UserModel.findOne({
    active: true,                       
    'distribution.active': true
  })
  .sort({ 'distribution.lastLeadReceivedAt': 1, _id: 1 }) 
  .select('_id name distribution');

  if (anyActiveSeller) {
    return assignToSeller(anyActiveSeller, 'FALLBACK GERAL');
  }

  // ========== ÚLTIMO RECURSO: Qualquer vendedor/admin ativo ==========
  const anyActiveUser = await UserModel.findOne({
    active: true,
    role: { $in: ['vendedor', 'admin', 'gerente'] }
  })
  .sort({ 'distribution.lastLeadReceivedAt': 1, _id: 1 }) 
  .select('_id name distribution');

  if (anyActiveUser) {
    console.warn(`[DISTRIBUIÇÃO] [ÚLTIMO RECURSO] Nenhum vendedor com distribuição ativa. Usando: ${anyActiveUser.name}`);
    await UserModel.updateOne(
      { _id: anyActiveUser._id },
      { $set: { 'distribution.lastLeadReceivedAt': new Date() } }
    );
    return anyActiveUser._id.toString();
  }

  console.error(`[DISTRIBUIÇÃO] CRÍTICO: Nenhum usuário disponível no sistema!`);
  return null; 
}

export async function createLead(input: any, user?: UserAuth) {


  // 1. VERIFICAÇÃO DE DUPLICIDADE (BUSCA INTELIGENTE)
  const criteriosBusca: any[] = [{ phone: input.phone }];
  if (input.email && input.email.trim() !== '') {
    criteriosBusca.push({ email: input.email });
  }

  const existingLead = await LeadModel.findOne({ $or: criteriosBusca });

  if (existingLead) {
    const updatedLead = await LeadModel.findByIdAndUpdate(
      existingLead._id,
      {
        ...input,
        lastActivity: new Date(),
        updatedBy: user?.sub || SYSTEM_ID 
      },
      { new: true }
    );

    await ActivityService.createActivity({
      leadId: existingLead._id.toString(),
      tipo: 'lead_atualizado' as any, 
      descricao: 'Lead atualizado via nova submissão (Duplicidade)',
      userId: user?.sub || SYSTEM_ID,
      userName: user?.sub ? 'Usuário' : 'Sistema'
    });

    console.log(`Lead atualizado (Duplicado): ${updatedLead?.name}`);
    return updatedLead;
  }

  // ... (Validações de Pipeline, Stage, Distribuição continuam iguais) ...
  
  if (input.cnpjType === '') delete input.cnpjType;
  const pipeline = await PipelineModel.findById(input.pipelineId);
  if (!pipeline) throw new AppError('Pipeline inválido', StatusCodes.BAD_REQUEST);
  const stage = await StageModel.findById(input.stageId);
  if (!stage) throw new AppError('Stage inválido', StatusCodes.BAD_REQUEST);

  const rank = input.rank || '0|hzzzzz:';
  
  // ========== LÓGICA DE ATRIBUIÇÃO DE RESPONSÁVEL ==========
  // 
  // LEAD MANUAL (user existe): 
  //   - Se o usuário selecionou responsáveis (input.owners), usa eles
  //   - Se não selecionou, atribui para o próprio usuário criador
  //   - Vendedores sempre ficam como responsáveis do próprio lead
  //
  // LEAD AUTOMÁTICO (user não existe - webhook/integração):
  //   - Usa o sistema de distribuição com fallback inteligente
  //   - Garante que sempre haverá um responsável
  // =========================================================
  
  let ownersList: string[] = [];
  
  if (user) {
    // === LEAD MANUAL ===
    if (user.role === 'vendedor') {
      // Vendedor sempre fica como responsável do lead que ele cria
      ownersList = [user.sub];
    } else if (input.owners && input.owners.length > 0) {
      // Admin/Gerente selecionou responsáveis manualmente
      ownersList = input.owners;
    } else {
      // Admin/Gerente não selecionou ninguém, fica como responsável
      ownersList = [user.sub];
    }
    console.log(`[LEAD MANUAL] Criado por ${user.role}. Responsáveis: ${ownersList.length}`);
  } else {
    // === LEAD AUTOMÁTICO (Webhook/Integração) ===
    if (input.owners && input.owners.length > 0) {
      // Já veio com responsável definido (raro, mas possível)
      ownersList = input.owners;
      console.log(`[LEAD AUTOMÁTICO] Responsável pré-definido: ${ownersList.length}`);
    } else {
      // Usa o sistema de distribuição com fallback
      const distributedOwner = await findNextResponsible(input.livesCount || 0, input.hasCnpj || false);
      if (distributedOwner) {
        ownersList = [distributedOwner];
      }
      console.log(`[LEAD AUTOMÁTICO] Distribuído para: ${distributedOwner || 'NINGUÉM'}`);
    }
  }

  
  // Verifica se o user.sub é um ObjectId válido do Mongo. Se não for, usa o SYSTEM_ID.
  const isValidCreatorId = user?.sub && mongoose.Types.ObjectId.isValid(user.sub);
  const createdById = isValidCreatorId ? user.sub : SYSTEM_ID;

  const lead = await LeadModel.create({ 
    ...input, 
    owners: ownersList,
    rank, 
    createdBy: createdById, 
    active: true,
    createdAt: input.createdAt || new Date(),
    lastActivity: input.createdAt || new Date()
  });

  // Prepara dados para o Log de Atividade
  const creatorId = user?.sub;
  let userName = 'Sistema';
  
  // Valida o ID final que vai para o ActivityService
  // Se o creatorId não for válido (ex: undefined ou string estranha), usa SYSTEM_ID
  const finalUserId = (creatorId && mongoose.Types.ObjectId.isValid(creatorId)) 
    ? creatorId 
    : SYSTEM_ID;

  if (creatorId && mongoose.Types.ObjectId.isValid(creatorId)) {
     const userDoc = await UserModel.findById(creatorId);
     if (userDoc) userName = userDoc.name;
  }

  const descricaoLog = input.customCreationLog || `Lead criado por ${userName}`;

  // Cria a atividade com garantia de ID válido
  await ActivityService.createActivity({
    leadId: lead._id.toString(),
    tipo: 'lead_criado',
    descricao: descricaoLog,
    userId: finalUserId, 
    userName: userName
  });

  return lead;
}

export async function updateLead(id: string, input: any, user?: UserAuth) {
  const existingLead = await LeadModel.findById(id);
  if (!existingLead) throw new AppError('Lead não encontrado', StatusCodes.NOT_FOUND);

  if (user && user.role !== 'admin') {
    const owners = existingLead.owners || [];
    const isOwner = owners.some((ownerId: any) => ownerId.toString() === user.sub);
    
    if (!isOwner) {
      throw new AppError('Você não tem permissão para editar este lead.', StatusCodes.FORBIDDEN);
    }
  }

  const updatedById = user?.sub || SYSTEM_ID;

  const lead = await LeadModel.findByIdAndUpdate(
      id, 
      { ...input, updatedBy: updatedById }, 
      { new: true }
    )
    .populate('owners', 'name email photoUrl photoBase64')
    .populate('owner', 'name email photoUrl photoBase64');

  const updatorId = user?.sub;
  const userDoc = updatorId ? await UserModel.findById(updatorId) : null;
  const userName = userDoc?.name || 'Sistema';
  const finalUserId = updatorId || SYSTEM_ID;

  // 1. Mudança de stage
  if (input.stageId && input.stageId !== existingLead.stageId?.toString()) {
    const oldStage = await StageModel.findById(existingLead.stageId);
    const newStage = await StageModel.findById(input.stageId);
    
    await ActivityService.createActivity({
      leadId: id,
      tipo: 'lead_movido' as any,
      descricao: `${userName} moveu o lead de "${oldStage?.name || 'N/A'}" para "${newStage?.name || 'N/A'}"`,
      userId: finalUserId,
      userName: userName,
      metadata: {
        from: oldStage?.name || 'N/A',
        to: newStage?.name || 'N/A'
      }
    });
  }

  // 2. Mudança de responsáveis
  const oldOwners = existingLead.owners?.map((o: any) => o.toString()).sort() || [];
  const newOwners = input.owners?.map((o: any) => o.toString()).sort() || [];
  
  if (input.owners && JSON.stringify(oldOwners) !== JSON.stringify(newOwners)) {
    await ActivityService.createActivity({
      leadId: id,
      tipo: 'responsavel_alterado' as any,
      descricao: `${userName} alterou os responsáveis pelo lead`,
      userId: finalUserId,
      userName: userName
    });
  }

  // 3. Mudança de status
  if (input.qualificationStatus && input.qualificationStatus !== existingLead.qualificationStatus) {
    await ActivityService.createActivity({
      leadId: id,
      tipo: 'status_alterado' as any,
      descricao: `${userName} alterou o status de qualificação para "${input.qualificationStatus}"`,
      userId: finalUserId,
      userName: userName,
      metadata: {
        from: existingLead.qualificationStatus || 'N/A',
        to: input.qualificationStatus
      }
    });
  }

  // 4. Atividade genérica
  const descricaoLog = input.customUpdateLog || `${userName} atualizou os dados do lead`;
  
  const isSpecificAction = input.stageId || input.owners || input.qualificationStatus;

  if (!isSpecificAction || input.customUpdateLog) {
    await ActivityService.createActivity({
      leadId: id,
      tipo: 'lead_atualizado',
      descricao: descricaoLog, 
      userId: finalUserId,
      userName: userName
    });
  }
  
  return lead;
}

export async function deleteLead(id: string, user?: UserAuth) {
  const existingLead = await LeadModel.findById(id);
  if (!existingLead) return; 

  if (user && user.role !== 'admin') {
     const owners = existingLead.owners || [];
     const isOwner = owners.some((ownerId: any) => ownerId.toString() === user.sub);
     
     if (!isOwner) {
       throw new AppError('Você não tem permissão para excluir este lead.', StatusCodes.FORBIDDEN);
     }
  }

  return LeadModel.findByIdAndDelete(id);
}

export async function addActivity(leadId: string, type: string, payload: any, userId?: string) {
  const lead = await LeadModel.findById(leadId);
  if (!lead) throw new AppError('Lead não encontrado', StatusCodes.NOT_FOUND);
  
  const descricao = payload.description || payload.descricao || 'Nova atividade registrada';

  const finalUserId = (userId && mongoose.Types.ObjectId.isValid(userId)) ? userId : SYSTEM_ID;
  
  let finalUserName = 'Sistema';
  if (userId && userId !== SYSTEM_ID && mongoose.Types.ObjectId.isValid(userId)) {
    try {
      const user = await UserModel.findById(userId);
      if (user) finalUserName = user.name;
    } catch (err) { }
  }

  let novoTipo = type;
  if (type === 'Sistema' || type === 'Alteração') {
    novoTipo = 'lead_atualizado'; 
  }

  return ActivityService.createActivity({
    leadId,
    tipo: novoTipo as any, 
    descricao,
    userId: finalUserId,
    userName: finalUserName,
    metadata: payload
  });
}