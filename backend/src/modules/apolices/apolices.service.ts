import { ApoliceModel, Apolice, ApoliceStatus } from './apolice.model.js';
import { LeadModel } from '../leads/lead.model.js';
import { UserModel } from '../users/user.model.js';
import { AppError } from '../../common/http.js';
import { StatusCodes } from 'http-status-codes';
import mongoose from 'mongoose';

interface UserAuth {
  sub: string;
  role: string;
}

interface ApoliceFilter {
  status?: ApoliceStatus | 'all';
  operadora?: string;
  vendedorId?: string;
  empresaNome?: string;
  dataVencimentoInicio?: string;
  dataVencimentoFim?: string;
  vencendoEm?: number; // dias
  search?: string;
}

/**
 * Lista apólices com filtros
 */
export async function listApolices(filter: ApoliceFilter = {}, user?: UserAuth) {
  const query: any = {};
  
  // Vendedor só vê as próprias apólices
  if (user?.role === 'vendedor') {
    query.vendedorId = user.sub;
  }
  
  // Filtro por status
  if (filter.status && filter.status !== 'all') {
    query.status = filter.status;
  }
  
  // Filtro por operadora
  if (filter.operadora) {
    query.operadora = filter.operadora;
  }
  
  // Filtro por vendedor
  if (filter.vendedorId && user?.role !== 'vendedor') {
    query.vendedorId = filter.vendedorId;
  }
  
  // Busca textual
  if (filter.search) {
    query.$or = [
      { empresaNome: { $regex: filter.search, $options: 'i' } },
      { titularNome: { $regex: filter.search, $options: 'i' } },
      { numeroApolice: { $regex: filter.search, $options: 'i' } },
      { empresaCnpj: { $regex: filter.search, $options: 'i' } }
    ];
  }
  
  // Filtro por empresa
  if (filter.empresaNome) {
    query.empresaNome = { $regex: filter.empresaNome, $options: 'i' };
  }
  
  // Filtro por intervalo de vencimento
  if (filter.dataVencimentoInicio || filter.dataVencimentoFim) {
    query.dataVencimento = {};
    if (filter.dataVencimentoInicio) {
      query.dataVencimento.$gte = new Date(filter.dataVencimentoInicio);
    }
    if (filter.dataVencimentoFim) {
      query.dataVencimento.$lte = new Date(filter.dataVencimentoFim);
    }
  }
  
  // Filtro para apólices vencendo em X dias
  if (filter.vencendoEm) {
    const hoje = new Date();
    const limite = new Date();
    limite.setDate(hoje.getDate() + filter.vencendoEm);
    query.dataVencimento = {
      $gte: hoje,
      $lte: limite
    };
  }
  
  return ApoliceModel.find(query)
    .sort({ dataVencimento: 1 })
    .populate('vendedorId', 'name email')
    .populate('leadId', 'name company')
    .populate('createdBy', 'name');
}

/**
 * Obtém uma apólice por ID
 */
export async function getApolice(id: string, user?: UserAuth) {
  const apolice = await ApoliceModel.findById(id)
    .populate('vendedorId', 'name email phone')
    .populate('leadId', 'name company email phone')
    .populate('createdBy', 'name')
    .populate('updatedBy', 'name');
  
  if (!apolice) {
    throw new AppError('Apólice não encontrada', StatusCodes.NOT_FOUND);
  }
  
  // Vendedor só pode ver suas próprias apólices
  if (user?.role === 'vendedor' && apolice.vendedorId?.toString() !== user.sub) {
    throw new AppError('Acesso negado', StatusCodes.FORBIDDEN);
  }
  
  return apolice;
}

/**
 * Cria uma nova apólice
 */
export async function createApolice(input: Partial<Apolice>, user?: UserAuth) {
  // Valida se o lead existe (se informado)
  if (input.leadId) {
    const lead = await LeadModel.findById(input.leadId);
    if (!lead) {
      throw new AppError('Lead não encontrado', StatusCodes.BAD_REQUEST);
    }
  }
  
  // Valida se o vendedor existe (se informado)
  if (input.vendedorId) {
    const vendedor = await UserModel.findById(input.vendedorId);
    if (!vendedor) {
      throw new AppError('Vendedor não encontrado', StatusCodes.BAD_REQUEST);
    }
  }
  
  // Gera número da apólice se não informado
  if (!input.numeroApolice) {
    const count = await ApoliceModel.countDocuments();
    const ano = new Date().getFullYear();
    input.numeroApolice = `AP${ano}${String(count + 1).padStart(6, '0')}`;
  }
  
  const apolice = await ApoliceModel.create({
    ...input,
    createdBy: user?.sub
  });
  
  return apolice;
}

/**
 * Atualiza uma apólice
 */
export async function updateApolice(id: string, input: Partial<Apolice>, user?: UserAuth) {
  const existingApolice = await ApoliceModel.findById(id);
  if (!existingApolice) {
    throw new AppError('Apólice não encontrada', StatusCodes.NOT_FOUND);
  }
  
  // Vendedor não pode editar apólices (apenas visualizar as suas)
  if (user?.role === 'vendedor') {
    throw new AppError('Você não tem permissão para editar apólices', StatusCodes.FORBIDDEN);
  }
  
  const apolice = await ApoliceModel.findByIdAndUpdate(
    id,
    { ...input, updatedBy: user?.sub },
    { new: true }
  )
    .populate('vendedorId', 'name email')
    .populate('leadId', 'name company');
  
  return apolice;
}

/**
 * Exclui uma apólice (apenas admin)
 */
export async function deleteApolice(id: string, user?: UserAuth) {
  if (user?.role !== 'admin') {
    throw new AppError('Apenas administradores podem excluir apólices', StatusCodes.FORBIDDEN);
  }
  
  const apolice = await ApoliceModel.findById(id);
  if (!apolice) {
    throw new AppError('Apólice não encontrada', StatusCodes.NOT_FOUND);
  }
  
  await ApoliceModel.findByIdAndDelete(id);
  return { message: 'Apólice excluída com sucesso' };
}

/**
 * Lista apólices que estão próximas do vencimento (alertas)
 */
export async function getApolicesVencendo(diasAntecedencia: number = 30, user?: UserAuth) {
  const hoje = new Date();
  const limite = new Date();
  limite.setDate(hoje.getDate() + diasAntecedencia);
  
  const query: any = {
    status: { $in: ['ativa', 'vencendo'] },
    dataVencimento: {
      $gte: hoje,
      $lte: limite
    }
  };
  
  // Vendedor só vê suas apólices
  if (user?.role === 'vendedor') {
    query.vendedorId = user.sub;
  }
  
  return ApoliceModel.find(query)
    .sort({ dataVencimento: 1 })
    .populate('vendedorId', 'name email')
    .populate('leadId', 'name company');
}

/**
 * Obtém estatísticas das apólices
 */
export async function getApolicesStats(user?: UserAuth) {
  const matchStage: any = {};
  
  if (user?.role === 'vendedor') {
    matchStage.vendedorId = new mongoose.Types.ObjectId(user.sub);
  }
  
  const hoje = new Date();
  const em30Dias = new Date();
  em30Dias.setDate(hoje.getDate() + 30);
  
  const stats = await ApoliceModel.aggregate([
    { $match: matchStage },
    {
      $facet: {
        porStatus: [
          { $group: { _id: '$status', count: { $sum: 1 }, valorTotal: { $sum: '$valorMensal' } } }
        ],
        porOperadora: [
          { $group: { _id: '$operadora', count: { $sum: 1 }, valorTotal: { $sum: '$valorMensal' } } }
        ],
        vencendo30Dias: [
          {
            $match: {
              status: { $in: ['ativa', 'vencendo'] },
              dataVencimento: { $gte: hoje, $lte: em30Dias }
            }
          },
          { $count: 'total' }
        ],
        totais: [
          {
            $group: {
              _id: null,
              totalApolices: { $sum: 1 },
              totalVidas: { $sum: '$quantidadeVidas' },
              receitaMensal: { $sum: '$valorMensal' },
              comissaoTotal: { $sum: '$comissao' }
            }
          }
        ]
      }
    }
  ]);
  
  return {
    porStatus: stats[0].porStatus,
    porOperadora: stats[0].porOperadora,
    vencendoEm30Dias: stats[0].vencendo30Dias[0]?.total || 0,
    totais: stats[0].totais[0] || {
      totalApolices: 0,
      totalVidas: 0,
      receitaMensal: 0,
      comissaoTotal: 0
    }
  };
}

/**
 * Vincula uma apólice a um lead
 */
export async function vincularApoliceAoLead(apoliceId: string, leadId: string, user?: UserAuth) {
  const apolice = await ApoliceModel.findById(apoliceId);
  if (!apolice) {
    throw new AppError('Apólice não encontrada', StatusCodes.NOT_FOUND);
  }
  
  const lead = await LeadModel.findById(leadId);
  if (!lead) {
    throw new AppError('Lead não encontrado', StatusCodes.NOT_FOUND);
  }
  
  apolice.leadId = new mongoose.Types.ObjectId(leadId);
  apolice.updatedBy = user?.sub ? new mongoose.Types.ObjectId(user.sub) : undefined;
  await apolice.save();
  
  return apolice.populate('leadId', 'name company');
}

/**
 * Atualiza status das apólices vencidas (para ser chamado por cron/job)
 */
export async function atualizarStatusApolicesVencidas() {
  const hoje = new Date();
  
  // Marca como vencidas as que passaram da data
  await ApoliceModel.updateMany(
    {
      status: { $in: ['ativa', 'vencendo', 'pendente'] },
      dataVencimento: { $lt: hoje }
    },
    {
      $set: { status: 'vencida' }
    }
  );
  
  // Marca como "vencendo" as que vencem em 30 dias
  const em30Dias = new Date();
  em30Dias.setDate(hoje.getDate() + 30);
  
  await ApoliceModel.updateMany(
    {
      status: 'ativa',
      dataVencimento: { $gte: hoje, $lte: em30Dias }
    },
    {
      $set: { status: 'vencendo' }
    }
  );
  
  return { message: 'Status das apólices atualizado' };
}
