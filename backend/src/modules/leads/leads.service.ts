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

const cleanEmptyFields = (obj: any) => {
  const newObj = { ...obj };
  Object.keys(newObj).forEach(key => {
    if (newObj[key] === '' || newObj[key] === undefined || newObj[key] === null) {
      delete newObj[key];
    }
  });
  return newObj;
};

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

  if (filter.pipelineId) query.pipelineId = filter.pipelineId;
  if (filter.stageId) query.stageId = filter.stageId;

  // BUSCA NO BANCO
  const leads = await LeadModel.find(query)
    .sort({ createdAt: -1 })
    .populate('owners', 'name email photoUrl photoBase64') 
    .populate('owner', 'name email photoUrl photoBase64')
    .lean(); 

  return leads;
}

export function getLead(id: string) {
  return LeadModel.findById(id)
    .populate('owners', 'name email photoUrl photoBase64')
    .populate('owner', 'name email photoUrl photoBase64')
    .lean();
}

export async function findNextResponsible(lives: any, hasCnpj: boolean) {
  const livesNumber = Number(lives) || 0;

  const cnpjFilter = hasCnpj 
    ? { $in: ['required', 'both'] } 
    : { $in: ['forbidden', 'both'] };

  const assignToSeller = async (seller: any, matchType: string) => {
    console.log(`[DISTRIBUIÇÃO] [${matchType}] Lead (${livesNumber} vidas, CNPJ: ${hasCnpj}) → ${seller.name}`);
    
    await UserModel.updateOne(
      { _id: seller._id },
      { $set: { 'distribution.lastLeadReceivedAt': new Date() } }
    );
    
    return seller._id.toString();
  };

  const perfectMatch = await UserModel.findOne({
    active: true,                       
    'distribution.active': true,        
    'distribution.minLives': { $lte: livesNumber }, 
    'distribution.maxLives': { $gte: livesNumber }, 
    'distribution.cnpjRule': cnpjFilter       
  }).sort({ 'distribution.lastLeadReceivedAt': 1, _id: 1 }).select('_id name distribution');

  if (perfectMatch) return assignToSeller(perfectMatch, 'MATCH PERFEITO');

  const cnpjOnlyMatch = await UserModel.findOne({
    active: true,                       
    'distribution.active': true,        
    'distribution.cnpjRule': cnpjFilter       
  }).sort({ 'distribution.lastLeadReceivedAt': 1, _id: 1 }).select('_id name distribution');

  if (cnpjOnlyMatch) return assignToSeller(cnpjOnlyMatch, 'FALLBACK CNPJ');

  const livesOnlyMatch = await UserModel.findOne({
    active: true,                       
    'distribution.active': true,        
    'distribution.minLives': { $lte: livesNumber }, 
    'distribution.maxLives': { $gte: livesNumber }
  }).sort({ 'distribution.lastLeadReceivedAt': 1, _id: 1 }).select('_id name distribution');

  if (livesOnlyMatch) return assignToSeller(livesOnlyMatch, 'FALLBACK VIDAS');

  const anyActiveSeller = await UserModel.findOne({
    active: true,                       
    'distribution.active': true
  }).sort({ 'distribution.lastLeadReceivedAt': 1, _id: 1 }).select('_id name distribution');

  if (anyActiveSeller) return assignToSeller(anyActiveSeller, 'FALLBACK GERAL');

  const anyActiveUser = await UserModel.findOne({
    active: true,
    role: { $in: ['vendedor', 'admin', 'gerente'] }
  }).sort({ 'distribution.lastLeadReceivedAt': 1, _id: 1 }).select('_id name distribution');

  if (anyActiveUser) {
    console.warn(`[DISTRIBUIÇÃO] [ÚLTIMO RECURSO] Usando: ${anyActiveUser.name}`);
    await UserModel.updateOne({ _id: anyActiveUser._id }, { $set: { 'distribution.lastLeadReceivedAt': new Date() } });
    return anyActiveUser._id.toString();
  }

  return null; 
}

export async function createLead(input: any, user?: UserAuth) {
  const criteriosBusca: any[] = [{ phone: input.phone }];
  if (input.email && input.email.trim() !== '') {
    criteriosBusca.push({ email: input.email });
  }

  const existingLead = await LeadModel.findOne({ $or: criteriosBusca });

  if (existingLead) {
    const cleanInput = cleanEmptyFields(input);
    const updatedLead = await LeadModel.findByIdAndUpdate(
      existingLead._id,
      { ...cleanInput, lastActivity: new Date(), updatedBy: user?.sub || SYSTEM_ID },
      { new: true }
    );
    return updatedLead;
  }

  if (input.cnpjType === '') delete input.cnpjType;
  
  const pipeline = await PipelineModel.findById(input.pipelineId);
  if (!pipeline) throw new AppError('Pipeline inválido', StatusCodes.BAD_REQUEST);
  
  const stage = await StageModel.findById(input.stageId);
  if (!stage) throw new AppError('Stage inválido', StatusCodes.BAD_REQUEST);

  const rank = input.rank || '0|hzzzzz:';
  
  let ownersList: string[] = [];
  
  if (user) {
    if (user.role === 'vendedor') ownersList = [user.sub];
    else if (input.owners && input.owners.length > 0) ownersList = input.owners;
    else ownersList = [user.sub];
  } else {
    if (input.owners && input.owners.length > 0) ownersList = input.owners;
    else {
      const distributedOwner = await findNextResponsible(input.livesCount || 0, input.hasCnpj || false);
      if (distributedOwner) ownersList = [distributedOwner];
    }
  }

  const createdById = (user?.sub && mongoose.Types.ObjectId.isValid(user.sub)) ? user.sub : SYSTEM_ID;
  const dataCriacao = input.createdAt || new Date();

  // === CRIAÇÃO COM DATA UNIFICADA ===
  const lead = await LeadModel.create({ 
    ...input, 
    owners: ownersList,
    rank, 
    createdBy: createdById, 
    active: true,
    createdAt: dataCriacao,
    lastActivity: dataCriacao,
    
    // 👇 GARANTIA DE COMPATIBILIDADE 👇
    stageChangedAt: dataCriacao, 
    enteredStageAt: dataCriacao 
  });

  const creatorId = user?.sub;
  let userName = 'Sistema';
  if (creatorId && mongoose.Types.ObjectId.isValid(creatorId)) {
     const userDoc = await UserModel.findById(creatorId);
     if (userDoc) userName = userDoc.name;
  }

  await ActivityService.createActivity({
    leadId: lead._id.toString(),
    tipo: 'lead_criado',
    descricao: input.customCreationLog || `Lead criado por ${userName}`,
    userId: creatorId || SYSTEM_ID, 
    userName: userName
  });

  return lead;
}

export async function updateLead(id: string, input: any, user?: UserAuth) {
  if (!id || !mongoose.Types.ObjectId.isValid(id)) throw new AppError('ID inválido', StatusCodes.BAD_REQUEST);
  const objectId = new mongoose.Types.ObjectId(id);

  const existingLead = await LeadModel.findById(objectId);
  if (!existingLead) throw new AppError('Lead não encontrado', StatusCodes.NOT_FOUND);

  if (user && user.role !== 'admin') {
    const owners = existingLead.owners || [];
    const isOwner = owners.some((ownerId: any) => ownerId.toString() === user.sub);
    if (!isOwner) throw new AppError('Permissão negada.', StatusCodes.FORBIDDEN);
  }

  const updatedById = user?.sub || SYSTEM_ID;
  const cleanInput = cleanEmptyFields(input);
  if (cleanInput.pipelineId === '') delete cleanInput.pipelineId;
  if (cleanInput.stageId === '') delete cleanInput.stageId;

  // === ATUALIZAÇÃO DO RELÓGIO DE SLA (RESET TOTAL) ===
  if (cleanInput.stageId && cleanInput.stageId !== existingLead.stageId?.toString()) {
     const agora = new Date();
     cleanInput.stageChangedAt = agora; // Atualiza o novo
     cleanInput.enteredStageAt = agora; // Atualiza o antigo (Substitui o valor velho!)
  }

  try {
    const lead = await LeadModel.findByIdAndUpdate(
        objectId, 
        { ...cleanInput, updatedBy: updatedById }, 
        { new: true, runValidators: true } 
      )
      .populate('owners', 'name email photoUrl photoBase64')
      .populate('owner', 'name email photoUrl photoBase64');

    // LOGS DE ATIVIDADE
    const updatorId = user?.sub;
    const userDoc = updatorId ? await UserModel.findById(updatorId) : null;
    const userName = userDoc?.name || 'Sistema';
    const finalUserId = updatorId || SYSTEM_ID;

    if (cleanInput.stageId && cleanInput.stageId !== existingLead.stageId?.toString()) {
      const oldStage = await StageModel.findById(existingLead.stageId);
      const newStage = await StageModel.findById(cleanInput.stageId);
      
      await ActivityService.createActivity({
        leadId: id,
        tipo: 'lead_movido' as any,
        descricao: `${userName} moveu o lead de "${oldStage?.name || 'N/A'}" para "${newStage?.name || 'N/A'}"`,
        userId: finalUserId, userName,
        metadata: { from: oldStage?.name, to: newStage?.name }
      });
    }

    if (cleanInput.qualificationStatus && cleanInput.qualificationStatus !== existingLead.qualificationStatus) {
      await ActivityService.createActivity({
        leadId: id,
        tipo: 'status_alterado' as any,
        descricao: `${userName} alterou o status para "${cleanInput.qualificationStatus}"`,
        userId: finalUserId, userName
      });
    }

    const isSpecificAction = cleanInput.stageId || cleanInput.qualificationStatus;
    if (!isSpecificAction || cleanInput.customUpdateLog) {
       await ActivityService.createActivity({
        leadId: id,
        tipo: 'lead_atualizado',
        descricao: cleanInput.customUpdateLog || `${userName} atualizou os dados`,
        userId: finalUserId, userName
      });
    }

    return lead;

  } catch (err) {
    console.error(`[SERVICE] Erro no updateLead:`, err);
    throw err;
  }
}

export async function deleteLead(id: string, user?: UserAuth) {
  const existingLead = await LeadModel.findById(id);
  if (!existingLead) return; 

  if (user && user.role !== 'admin') {
     const owners = existingLead.owners || [];
     const isOwner = owners.some((ownerId: any) => ownerId.toString() === user.sub);
     if (!isOwner) throw new AppError('Sem permissão.', StatusCodes.FORBIDDEN);
  }
  return LeadModel.findByIdAndDelete(id);
}

export async function addActivity(leadId: string, type: string, payload: any, userId?: string) {
  const lead = await LeadModel.findById(leadId);
  if (!lead) throw new AppError('Lead não encontrado', StatusCodes.NOT_FOUND);
  
  const descricao = payload.description || payload.descricao || 'Nova atividade';
  const finalUserId = (userId && mongoose.Types.ObjectId.isValid(userId)) ? userId : SYSTEM_ID;
  
  let finalUserName = 'Sistema';
  if (userId && userId !== SYSTEM_ID) {
    try { const u = await UserModel.findById(userId); if (u) finalUserName = u.name; } catch (e) {}
  }

  let novoTipo = type === 'Sistema' || type === 'Alteração' ? 'lead_atualizado' : type;

  return ActivityService.createActivity({
    leadId, tipo: novoTipo as any, descricao, userId: finalUserId, userName: finalUserName, metadata: payload
  });
}