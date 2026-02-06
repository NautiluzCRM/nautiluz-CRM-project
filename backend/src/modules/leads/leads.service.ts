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

// --- FUNÇÃO AUXILIAR PARA LIMPAR CAMPOS VAZIOS ---
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

  if (filter.pipelineId) {
    query.pipelineId = filter.pipelineId;
  }

  if (filter.stageId) {
    query.stageId = filter.stageId;
  }

  // 👇 AJUSTE AQUI: Adicionei log e garanti retorno total
  // O .find() traz tudo, mas se o schema estiver confuso, isso garante.
  const leads = await LeadModel.find(query)
    .sort({ createdAt: -1 })
    .populate('owners', 'name email photoUrl photoBase64') 
    .populate('owner', 'name email photoUrl photoBase64');
    
  // LOG DE DIAGNÓSTICO (Para você ver no terminal se o dado existe)
  const leadsComProposta = leads.filter(l => l.proposalUrl);
  if (leadsComProposta.length > 0) {
     console.log(`✅ [LIST LEADS] Encontrados ${leadsComProposta.length} leads com proposta.`);
     console.log(`   Exemplo: ${leadsComProposta[0].name} -> ${leadsComProposta[0].proposalUrl}`);
  }

  return leads;
}

export function getLead(id: string) {
  return LeadModel.findById(id)
    .populate('owners', 'name email photoUrl photoBase64')
    .populate('owner', 'name email photoUrl photoBase64')
    .lean(); // .lean() converte para objeto puro JSON
}

/**
 * Sistema de Distribuição de Leads
 */
export async function findNextResponsible(lives: any, hasCnpj: boolean) {
  const livesNumber = Number(lives) || 0;

  const cnpjFilter = hasCnpj 
    ? { $in: ['required', 'both'] } 
    : { $in: ['forbidden', 'both'] };

  const assignToSeller = async (seller: any, matchType: string) => {
    // console.log(`[DISTRIBUIÇÃO] [${matchType}] Lead (${livesNumber} vidas, CNPJ: ${hasCnpj}) → ${seller.name}`);
    await UserModel.updateOne(
      { _id: seller._id },
      { $set: { 'distribution.lastLeadReceivedAt': new Date() } }
    );
    return seller._id.toString();
  };

  // 1. MATCH PERFEITO
  const perfectMatch = await UserModel.findOne({
    active: true,                       
    'distribution.active': true,        
    'distribution.minLives': { $lte: livesNumber }, 
    'distribution.maxLives': { $gte: livesNumber }, 
    'distribution.cnpjRule': cnpjFilter       
  })
  .sort({ 'distribution.lastLeadReceivedAt': 1, _id: 1 }) 
  .select('_id name distribution');

  if (perfectMatch) return assignToSeller(perfectMatch, 'MATCH PERFEITO');

  // 2. FALLBACK 1: Apenas CNPJ
  const cnpjOnlyMatch = await UserModel.findOne({
    active: true,                       
    'distribution.active': true,        
    'distribution.cnpjRule': cnpjFilter       
  })
  .sort({ 'distribution.lastLeadReceivedAt': 1, _id: 1 }) 
  .select('_id name distribution');

  if (cnpjOnlyMatch) return assignToSeller(cnpjOnlyMatch, 'FALLBACK CNPJ');

  // 3. FALLBACK 2: Apenas Vidas
  const livesOnlyMatch = await UserModel.findOne({
    active: true,                       
    'distribution.active': true,        
    'distribution.minLives': { $lte: livesNumber }, 
    'distribution.maxLives': { $gte: livesNumber }
  })
  .sort({ 'distribution.lastLeadReceivedAt': 1, _id: 1 }) 
  .select('_id name distribution');

  if (livesOnlyMatch) return assignToSeller(livesOnlyMatch, 'FALLBACK VIDAS');

  // 4. FALLBACK 3: Qualquer vendedor ativo
  const anyActiveSeller = await UserModel.findOne({
    active: true,                       
    'distribution.active': true
  })
  .sort({ 'distribution.lastLeadReceivedAt': 1, _id: 1 }) 
  .select('_id name distribution');

  if (anyActiveSeller) return assignToSeller(anyActiveSeller, 'FALLBACK GERAL');

  // 5. ÚLTIMO RECURSO
  const anyActiveUser = await UserModel.findOne({
    active: true,
    role: { $in: ['vendedor', 'admin', 'gerente'] }
  })
  .sort({ 'distribution.lastLeadReceivedAt': 1, _id: 1 }) 
  .select('_id name distribution');

  if (anyActiveUser) {
    await UserModel.updateOne(
      { _id: anyActiveUser._id },
      { $set: { 'distribution.lastLeadReceivedAt': new Date() } }
    );
    return anyActiveUser._id.toString();
  }

  return null; 
}

export async function createLead(input: any, user?: UserAuth) {

  // VERIFICAÇÃO DE DUPLICIDADE
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
    await ActivityService.createActivity({
      leadId: existingLead._id.toString(),
      tipo: 'lead_atualizado' as any, 
      descricao: 'Lead atualizado via nova submissão (Duplicidade)',
      userId: user?.sub || SYSTEM_ID,
      userName: user?.sub ? 'Usuário' : 'Sistema'
    });
    return updatedLead;
  }

  // CRIAÇÃO DE NOVO LEAD
  if (input.cnpjType === '') delete input.cnpjType;
  
  const pipeline = await PipelineModel.findById(input.pipelineId);
  if (!pipeline) throw new AppError('Pipeline inválido', StatusCodes.BAD_REQUEST);
  
  const stage = await StageModel.findById(input.stageId);
  if (!stage) throw new AppError('Stage inválido', StatusCodes.BAD_REQUEST);

  const rank = input.rank || '0|hzzzzz:';
  
  let ownersList: string[] = [];
  
  if (user) {
    if (user.role === 'vendedor') {
      ownersList = [user.sub];
    } else if (input.owners && input.owners.length > 0) {
      ownersList = input.owners;
    } else {
      ownersList = [user.sub];
    }
  } else {
    if (input.owners && input.owners.length > 0) {
      ownersList = input.owners;
    } else {
      const distributedOwner = await findNextResponsible(input.livesCount || 0, input.hasCnpj || false);
      if (distributedOwner) ownersList = [distributedOwner];
    }
  }

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

  // LOG DE CRIAÇÃO
  const creatorId = user?.sub;
  let userName = 'Sistema';
  const finalUserId = (creatorId && mongoose.Types.ObjectId.isValid(creatorId)) ? creatorId : SYSTEM_ID;

  if (creatorId && mongoose.Types.ObjectId.isValid(creatorId)) {
     const userDoc = await UserModel.findById(creatorId);
     if (userDoc) userName = userDoc.name;
  }

  const descricaoLog = input.customCreationLog || `Lead criado por ${userName}`;

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
  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError('ID do Lead inválido', StatusCodes.BAD_REQUEST);
  }

  const objectId = new mongoose.Types.ObjectId(id);
  const existingLead = await LeadModel.findById(objectId);
  
  if (!existingLead) {
    throw new AppError('Lead não encontrado', StatusCodes.NOT_FOUND);
  }

  if (user && user.role !== 'admin') {
    const owners = existingLead.owners || [];
    const isOwner = owners.some((ownerId: any) => ownerId.toString() === user.sub);
    if (!isOwner) throw new AppError('Permissão negada.', StatusCodes.FORBIDDEN);
  }

  const updatedById = user?.sub || SYSTEM_ID;
  const cleanInput = cleanEmptyFields(input);
  if (cleanInput.pipelineId === '') delete cleanInput.pipelineId;
  if (cleanInput.stageId === '') delete cleanInput.stageId;

  try {
    const lead = await LeadModel.findByIdAndUpdate(
        objectId, 
        { ...cleanInput, updatedBy: updatedById }, 
        { new: true, runValidators: true } 
      )
      .populate('owners', 'name email photoUrl photoBase64')
      .populate('owner', 'name email photoUrl photoBase64');

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
     if (!isOwner) throw new AppError('Permissão negada.', StatusCodes.FORBIDDEN);
  }

  return LeadModel.findByIdAndDelete(id);
}

export async function addActivity(leadId: string, type: string, payload: any, userId?: string) {
  const finalUserId = (userId && mongoose.Types.ObjectId.isValid(userId)) ? userId : SYSTEM_ID;
  let finalUserName = 'Sistema';
  
  if (userId && userId !== SYSTEM_ID && mongoose.Types.ObjectId.isValid(userId)) {
    try {
      const user = await UserModel.findById(userId);
      if (user) finalUserName = user.name;
    } catch (err) { }
  }

  let novoTipo = type;
  if (type === 'Sistema' || type === 'Alteração') novoTipo = 'lead_atualizado'; 

  return ActivityService.createActivity({
    leadId,
    tipo: novoTipo as any, 
    descricao: payload.description || payload.descricao || 'Nova atividade',
    userId: finalUserId,
    userName: finalUserName,
    metadata: payload
  });
}