import { Request, Response } from 'express';
import { asyncHandler } from '../../common/http.js';
import { z } from 'zod';
import { createUser, deleteUser, getUser, listUsers, updateUser } from './user.service.js';
import { LeadModel } from '../leads/lead.model.js';

const userSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  password: z.string().min(6),
  currentPassword: z.string().optional(),
  role: z.string(),
  active: z.boolean().optional(),
  phone: z.string().optional(),
  jobTitle: z.string().optional(),
  emailSignature: z.string().optional(),
  photoUrl: z.string().optional().nullable()
});

export const listUsersHandler = asyncHandler(async (_req: Request, res: Response) => {
  const users = await listUsers();
  res.json(users);
});

export const createUserHandler = asyncHandler(async (req: Request, res: Response) => {
  const body = userSchema.parse(req.body);
  const user = await createUser(body);
  res.status(201).json(user);
});

export const getUserHandler = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const user = await getUser(id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json(user);
});

export const updateUserHandler = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const currentUser = (req as any).user;
  const body = userSchema.partial().parse(req.body);

  if (body.password && !body.currentPassword) {
    return res.status(400).json({ message: "Para alterar a senha, informe a senha atual." });
  }

  if (currentUser?.role !== 'admin') {
    if (body.jobTitle) delete body.jobTitle;
    if (body.email) delete body.email;
  }

  try {
    const user = await updateUser(id, body);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (error: any) {
    if (error.message === 'A senha atual está incorreta.') {
      return res.status(400).json({ message: error.message });
    }
    throw error;
  }
});

export const deleteUserHandler = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const user = await deleteUser(id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json(user);
});

// Estatísticas de vendedores - APENAS ADMIN
export const getSellersStatsHandler = asyncHandler(async (_req: Request, res: Response) => {
  // Buscar todos os usuários vendedores
  const users = await listUsers();
  const sellers = users.filter((u: any) => u.role === 'vendedor');
  
  // Buscar todos os leads
  const leads = await LeadModel.find().lean();
  
  const hoje = new Date();
  const trintaDiasAtras = new Date(hoje.getTime() - 30 * 24 * 60 * 60 * 1000);
  
  // Calcular estatísticas por vendedor
  const sellersStats = sellers.map((seller: any) => {
    const sellerId = seller._id.toString();
    
    // Filtrar leads do vendedor (owner ou owners array)
    const sellerLeads = leads.filter((lead: any) => {
      const ownerId = lead.owner?.toString();
      const ownersIds = (lead.owners || []).map((o: any) => o.toString());
      return ownerId === sellerId || ownersIds.includes(sellerId);
    });
    
    const leadsQualificados = sellerLeads.filter(
      (l: any) => l.qualificationStatus === 'qualificado' || l.qualificationStatus === 'proposta_enviada' || l.qualificationStatus === 'negociacao'
    );
    
    const leadsConvertidos = sellerLeads.filter(
      (l: any) => l.qualificationStatus === 'fechado_ganho'
    );
    
    const valorTotal = sellerLeads.reduce(
      (acc: number, l: any) => acc + (l.avgPrice || l.valorProposta || 0), 0
    );
    
    const valorConvertido = leadsConvertidos.reduce(
      (acc: number, l: any) => acc + (l.valorFechado || l.avgPrice || 0), 0
    );
    
    const leadsRecentes = sellerLeads.filter(
      (l: any) => new Date(l.createdAt) >= trintaDiasAtras
    );
    
    const taxaConversao = sellerLeads.length > 0 
      ? (leadsConvertidos.length / sellerLeads.length) * 100 
      : 0;
    
    const ticketMedio = leadsConvertidos.length > 0
      ? valorConvertido / leadsConvertidos.length
      : 0;
    
    // Determinar tendência
    const tendencia = 
      leadsRecentes.length > sellerLeads.length * 0.3 ? 'up' :
      leadsRecentes.length < sellerLeads.length * 0.1 ? 'down' : 'stable';
    
    return {
      id: sellerId,
      nome: seller.name,
      email: seller.email,
      foto: seller.photoUrl || null,
      ativo: seller.active !== false,
      perfil: 'Vendedor',
      ultimoAcesso: seller.lastLoginAt || seller.updatedAt,
      totalLeads: sellerLeads.length,
      leadsQualificados: leadsQualificados.length,
      leadsConvertidos: leadsConvertidos.length,
      valorTotalPipeline: valorTotal,
      valorConvertido,
      taxaConversao: Math.round(taxaConversao * 10) / 10,
      ticketMedio: Math.round(ticketMedio * 100) / 100,
      leadsUltimos30Dias: leadsRecentes.length,
      tendencia
    };
  });
  
  // Ordenar por valor total no pipeline
  sellersStats.sort((a, b) => b.valorTotalPipeline - a.valorTotalPipeline);
  
  // Calcular totais gerais
  const totals = {
    totalVendedores: sellers.length,
    vendedoresAtivos: sellers.filter((s: any) => s.active !== false).length,
    totalLeadsEquipe: sellersStats.reduce((acc, s) => acc + s.totalLeads, 0),
    totalConvertidos: sellersStats.reduce((acc, s) => acc + s.leadsConvertidos, 0),
    valorTotalEquipe: sellersStats.reduce((acc, s) => acc + s.valorTotalPipeline, 0),
    valorConvertidoEquipe: sellersStats.reduce((acc, s) => acc + s.valorConvertido, 0),
    mediaConversao: sellersStats.length > 0 
      ? Math.round((sellersStats.reduce((acc, s) => acc + s.taxaConversao, 0) / sellersStats.length) * 10) / 10
      : 0
  };
  
  res.json({
    sellers: sellersStats,
    totals
  });
});
