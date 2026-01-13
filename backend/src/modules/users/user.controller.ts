import { Request, Response } from 'express';
import { asyncHandler } from '../../common/http.js';
import { z } from 'zod';
import { createUser, deleteUser, getUser, listUsers, updateUser, uploadPhoto, removePhoto } from './user.service.js';
import { LeadModel } from '../leads/lead.model.js';

// Schema de Distribuição
const distributionSchema = z.object({
  active: z.boolean().optional(),
  minLives: z.number().optional(),
  maxLives: z.number().optional(),
  cnpjRule: z.enum(['required', 'forbidden', 'both']).optional()
});

// Schema Base (Campos comuns a todos)
const baseUserSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  role: z.string(),
  active: z.boolean().optional(),
  phone: z.string().optional(),
  jobTitle: z.string().optional(),
  emailSignature: z.string().optional(),
  photoUrl: z.string().optional().nullable(),
  photoBase64: z.string().optional().nullable(),
  distribution: distributionSchema.optional(),
});

// Schema para CRIAÇÃO (Senha Obrigatória)
const createUserSchema = baseUserSchema.extend({
  password: z.string().min(6),
});

// Schema para ATUALIZAÇÃO (Senha Opcional + Atual)
const updateUserSchema = baseUserSchema.extend({
  password: z.string().min(6).optional(),
  currentPassword: z.string().optional(),
});

const preferencesSchema = z.object({
  notificationPreferences: z.object({
    email: z.boolean().optional(),
    sla: z.boolean().optional(),
    sms: z.boolean().optional()
  }).optional(),
  preferences: z.object({
    darkMode: z.boolean().optional(),
    autoSave: z.boolean().optional()
  }).optional()
});

export const listUsersHandler = asyncHandler(async (_req: Request, res: Response) => {
  const users = await listUsers();
  res.json(users);
});

export const createUserHandler = asyncHandler(async (req: Request, res: Response) => {
  const body = createUserSchema.parse(req.body);
  const user = await createUser(body as any);
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
  
  // 🔍 LOG ESPIÃO 1
  console.log('---  DEBUG UPDATE ---');
  console.log('1. User Logado:', currentUser?.email, '| Role:', currentUser?.role);
  console.log('2. Body Bruto:', JSON.stringify(req.body.distribution, null, 2));

  const body = req.body.notificationPreferences || req.body.preferences 
    ? preferencesSchema.parse(req.body)
    : updateUserSchema.partial().parse(req.body);

  console.log('3. Body Pós-Zod:', JSON.stringify((body as any).distribution, null, 2));

  if ('password' in body && body.password && !('currentPassword' in body && body.currentPassword)) {
    return res.status(400).json({ message: "Para alterar a senha, informe a senha atual." });
  }

  // Verificação de segurança
  if (currentUser?.role !== 'admin') {
    if ('distribution' in body) {
       console.log(' ALERTA: Removendo distribution pois role não é admin. Role atual:', currentUser?.role);
       delete (body as any).distribution;
    }
    if ('jobTitle' in body) delete (body as any).jobTitle;
    if ('email' in body) delete (body as any).email;
  }

  try {
    const user = await updateUser(id, body as any);
    
    // 🔍 LOG ESPIÃO 3
    console.log('4. Salvo no Banco:', JSON.stringify(user?.distribution, null, 2));
    console.log('---------------------');

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

// Upload de foto de perfil (base64)
export const uploadPhotoHandler = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const currentUser = (req as any).user;
  
  // Verificação de ID segura
  const currentUserId = currentUser.sub || currentUser._id || currentUser.id;
  
  if (currentUserId !== id && currentUser.role !== 'admin') {
    return res.status(403).json({ message: 'Você não tem permissão para alterar a foto deste usuário' });
  }
  
  const { photoBase64 } = req.body;
  
  if (!photoBase64) {
    return res.status(400).json({ message: 'Foto em base64 é obrigatória' });
  }
  
  // Validação simples de formato (o app.ts já cuida do tamanho de 50mb)
  if (!photoBase64.startsWith('data:image')) {
    return res.status(400).json({ message: 'Formato de imagem inválido.' });
  }
  
  try {
    const user = await uploadPhoto(id, photoBase64);
    
    if (!user) return res.status(404).json({ message: 'Usuário não encontrado' });
    
    // Retorna o base64 para o frontend atualizar a tela imediatamente
    res.json({ message: 'Foto atualizada com sucesso', photoBase64: user.photoBase64 });
  } catch (error: any) {
    console.error('Erro ao atualizar foto:', error);
    res.status(500).json({ message: `Erro ao atualizar foto: ${error.message}` });
  }
});

// Remover foto de perfil
export const removePhotoHandler = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const currentUser = (req as any).user;
  
  const currentUserId = currentUser.sub || currentUser._id || currentUser.id;

  if (currentUserId !== id && currentUser.role !== 'admin') {
    return res.status(403).json({ message: 'Você não tem permissão para remover a foto deste usuário' });
  }
  
  try {
    const user = await removePhoto(id);
    
    if (!user) return res.status(404).json({ message: 'Usuário não encontrado' });
    res.json({ message: 'Foto removida com sucesso' });
  } catch (error: any) {
    console.error('Erro ao remover foto:', error);
    res.status(500).json({ message: 'Erro ao remover foto de perfil' });
  }
});

// Estatísticas de vendedores
export const getSellersStatsHandler = asyncHandler(async (_req: Request, res: Response) => {
  const users = await listUsers();
  const sellers = users.filter((u: any) => u.role === 'vendedor');
  const leads = await LeadModel.find().lean();
  
  const hoje = new Date();
  const trintaDiasAtras = new Date(hoje.getTime() - 30 * 24 * 60 * 60 * 1000);
  
  const sellersStats = sellers.map((seller: any) => {
    const sellerId = seller._id.toString();
    const sellerLeads = leads.filter((lead: any) => {
      const ownerId = lead.owner?.toString();
      const ownersIds = (lead.owners || []).map((o: any) => o.toString());
      return ownerId === sellerId || ownersIds.includes(sellerId);
    });
    
    const leadsQualificados = sellerLeads.filter(
      (l: any) => ['qualificado', 'proposta_enviada', 'negociacao'].includes(l.qualificationStatus)
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
    const tendencia = 
      leadsRecentes.length > sellerLeads.length * 0.3 ? 'up' :
      leadsRecentes.length < sellerLeads.length * 0.1 ? 'down' : 'stable';
    
    return {
      id: sellerId,
      nome: seller.name,
      email: seller.email,
      foto: seller.photoUrl || null,
      ativo: seller.active !== false,
      cargo: seller.jobTitle || "",
      perfil: seller.role === 'admin' ? 'Administrador' : 
              seller.role === 'gerente' ? 'Gerente' : 'Vendedor',  
      distribution: seller.distribution,    
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
  
  sellersStats.sort((a, b) => b.valorTotalPipeline - a.valorTotalPipeline);
  
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
  
  res.json({ sellers: sellersStats, totals });
});