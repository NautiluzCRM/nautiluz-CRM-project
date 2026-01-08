import { Lead, Pipeline, Coluna } from "@/types/crm";

// @ts-ignore - Vite env typing
export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:10000/api";
const storages = [localStorage, sessionStorage];

const getStoredValue = (key: string) => localStorage.getItem(key) ?? sessionStorage.getItem(key);

const clearAuthStorage = () => {
  for (const storage of storages) {
    storage.removeItem("authToken");
    storage.removeItem("refreshToken");
    storage.removeItem("authUser");
  }
};

const getAuthStorage = () => {
  if (localStorage.getItem("refreshToken")) return localStorage;
  if (sessionStorage.getItem("refreshToken")) return sessionStorage;
  if (localStorage.getItem("authToken")) return localStorage;
  if (sessionStorage.getItem("authToken")) return sessionStorage;
  return localStorage;
};

const setAccessToken = (token: string) => {
  const storage = getAuthStorage();
  storage.setItem("authToken", token);
  const other = storage === localStorage ? sessionStorage : localStorage;
  other.removeItem("authToken");
};

function getAuthHeaders(tokenOverride?: string) {
  const token = tokenOverride || getStoredValue("authToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function refreshAccessToken() {
  const storage = getAuthStorage();
  const refreshToken = storage.getItem("refreshToken") ?? getStoredValue("refreshToken");
  if (!refreshToken) return null;

  const res = await fetch(`${API_URL}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token: refreshToken }),
  });

  if (!res.ok) {
    clearAuthStorage();
    return null;
  }

  const data = await res.json();
  if (data?.accessToken) {
    setAccessToken(data.accessToken);
    return data.accessToken as string;
  }
  return null;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = {
    "Content-Type": "application/json",
    ...getAuthHeaders(),
    ...(options.headers || {}),
  };

  let res = await fetch(`${API_URL}${path}`, { ...options, headers });

  if (res.status === 401) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      const retryHeaders = {
        ...headers,
        ...getAuthHeaders(newToken),
      };
      res = await fetch(`${API_URL}${path}`, { ...options, headers: retryHeaders });
    } else {
      // Refresh falhou - limpa auth e redireciona para login
      clearAuthStorage();
      // Só redireciona se não estiver já na página de login
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
      throw new Error('Sessão expirada');
    }
  }

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Erro HTTP ${res.status}`);
  }
  return (await res.json()) as T;
}

export async function loginApi(email: string, password: string, remember = false) {
  return request<{ accessToken: string; refreshToken: string; user: any }>(
    "/auth/login",
    {
      method: "POST",
      body: JSON.stringify({ email, password, remember }),
    }
  );
}

export async function fetchPipelines() {
  return request<any[]>("/pipelines");
}

export async function fetchStages(pipelineId: string) {
  return request<any[]>(`/pipelines/${pipelineId}/stages`);
}

export async function createLeadApi(data: any) {
  const payload = {
    name: data.nome,
    email: data.email,
    phone: data.celular,
    origin: data.origem || "Indicação",
    pipelineId: data.pipelineId,
    stageId: data.stageId,
    
    company: data.empresa,
    livesCount: Number(data.quantidadeVidas || 0),
    avgPrice: Number(data.valorMedio || 0),
    hasCnpj: Boolean(data.possuiCnpj),
    
    cnpjType: data.possuiCnpj ? data.tipoCnpj : undefined,
    owners: data.owners, // Envia array de IDs

    hasCurrentPlan: Boolean(data.possuiPlano),
    currentPlan: data.planoAtual,
    ageBuckets: data.idades,
    city: data.cidade,
    state: data.uf,
    createdAt: data.dataCriacao ? new Date(data.dataCriacao).toISOString() : undefined,

    notes: data.observacoes,
    preferredHospitals: data.hospitaisPreferencia
  };

  return request("/leads", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function fetchLeads(filters?: Record<string, string>) {
  const params = new URLSearchParams();
  
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });
  }

  const queryString = params.toString();
  const endpoint = queryString ? `/leads?${queryString}` : "/leads";
  
  return request<any[]>(endpoint);
}

export async function moveLeadApi(
  leadId: string, 
  toStageId: string, 
  beforeId?: string, 
  afterId?: string
) {
  return request("/kanban/move", {
    method: "POST",
    body: JSON.stringify({ leadId, toStageId, beforeId, afterId }),
  });
}

export async function updateLeadApi(leadId: string, payload: Partial<Lead>) {
  return request(`/leads/${leadId}`, {
    method: "PATCH",
    body: JSON.stringify(mapLeadToApiPayload(payload)),
  });
}

export async function deleteLeadApi(leadId: string) {
  return request(`/leads/${leadId}`, {
    method: "DELETE",
  });
}

export async function exportLeadsXlsx(filter: Record<string, unknown> = {}) {
  return request<{ url: string; file: string }>("/exports/xlsx", {
    method: "POST",
    body: JSON.stringify(filter),
  });
}

export function mapApiStageToColuna(stage: any): Coluna {
  const stageId = stage._id || stage.id;
  return {
    id: typeof stageId === 'object' ? stageId.toString() : stageId,
    nome: stage.name,
    cor: stage.color || "#3B82F6",
    ordem: stage.order,
    wipLimit: stage.wipLimit,
    sla: stage.sla,
  };
}

export function mapApiLeadToLead(api: any): Lead {
  // LÓGICA DE MAPEAMENTO DE DONOS (Objetos ou Strings)
  
  // 1. Pega o array bruto (pode vir owners ou owner)
  const rawOwners = api.owners && api.owners.length > 0 ? api.owners : (api.owner ? [api.owner] : []);

  // 2. Normaliza para garantir que temos um array de objetos { id, nome }
  // Se o backend populou, 'u' é objeto. Se não, 'u' é string (ID).
  const normalizedOwners = rawOwners.map((u: any) => {
    if (typeof u === 'string') {
        return { id: u, nome: "Carregando..." }; // Fallback caso não tenha populado
    }
    return { 
        id: u._id || u.id, 
        nome: u.name || u.nome || "Sem Nome" 
    };
  });

  // 3. Cria uma string de exibição (Ex: "Douglas, João") para lugares simples
  const responsavelDisplay = normalizedOwners.map((o: any) => o.nome.split(' ')[0]).join(', ');

  // 4. Extrai IDs para uso no formulário de edição (checkboxes)
  const ownersIds = normalizedOwners.map((o: any) => o.id);

  // 5. Garante que os IDs são strings
  const leadId = api._id || api.id;
  const stageId = api.stageId || api.colunaAtual;

  return {
    id: typeof leadId === 'object' ? leadId.toString() : leadId,
    nome: api.name || api.nome || "Lead",
    empresa: api.company,
    celular: api.phone || api.celular || "",
    email: api.email || "",
    possuiCnpj: api.hasCnpj ?? false,
    tipoCnpj: api.cnpjType || "Outros",
    quantidadeVidas: api.livesCount || api.quantidadeVidas || 0,
    idades: api.ageBuckets || api.idades || [],
    possuiPlano: api.hasCurrentPlan ?? false,
    planoAtual: api.currentPlan,
    valorMedio: api.avgPrice,
    hospitaisPreferencia: api.preferredHospitals || [],
    origem: api.origin || "Outros",
    informacoes: api.notes,
    uf: api.state,
    cidade: api.city,
    
    // Passamos a lista de objetos completos para o Modal de Detalhes renderizar Avatars
    owners: normalizedOwners, 
    
    // Passamos a lista de IDs para o Modal de Edição saber quais checkboxes marcar
    ownersIds: ownersIds,

    // Mantemos compatibilidade visual com string
    responsavel: responsavelDisplay || "Não atribuído",
    
    statusQualificacao: api.qualificationStatus || "Qualificado",
    motivoPerda: api.lostReason,
    colunaAtual: typeof stageId === 'object' ? stageId.toString() : stageId,
    dataCriacao: api.createdAt ? new Date(api.createdAt) : new Date(),
    ultimaAtividade: api.lastActivityAt ? new Date(api.lastActivityAt) : new Date(),
    arquivos: [],
    atividades: api.activities || [],
  } as unknown as Lead;
}

export function mapLeadToApiPayload(lead: Partial<Lead>) {
  return {
    name: lead.nome,
    company: lead.empresa,
    phone: lead.celular,
    email: lead.email,
    hasCnpj: lead.possuiCnpj,
    cnpjType: lead.tipoCnpj,
    livesCount: lead.quantidadeVidas,
    ageBuckets: lead.idades,
    hasCurrentPlan: lead.possuiPlano,
    currentPlan: lead.planoAtual,
    avgPrice: lead.valorMedio,
    preferredHospitals: lead.hospitaisPreferencia,
    origin: lead.origem,
    notes: lead.informacoes,
    state: lead.uf,
    city: lead.cidade,
    
    // IMPORTANTE: Aqui pegamos o array de IDs que o CreateLeadModal enviou
    owners: (lead as any).owners, 
    
    qualificationStatus: lead.statusQualificacao,
    lostReason: lead.motivoPerda,
    stageId: lead.colunaAtual,
  };
}

export async function fetchPipelineData(): Promise<Pipeline> {
  const [pipelines, leads] = await Promise.all([fetchPipelines(), fetchLeads()]);
  const pipeline = pipelines[0];

  if (!pipeline) {
    return {
      id: '',
      nome: 'Pipeline não configurado',
      colunas: [],
      leads: [],
    };
  }

  const stages = await fetchStages(pipeline._id || pipeline.id);

  return {
    id: pipeline._id || pipeline.id,
    nome: pipeline.name,
    colunas: stages.map(mapApiStageToColuna),
    leads: leads.map(mapApiLeadToLead),
  };
}

// --- Funções de Usuários ---

export async function fetchUsers() {
  const data = await request<any[]>("/users");
  return data.map(mapApiUserToUsuario);
}

// Estatísticas de vendedores - APENAS ADMIN
export async function fetchSellersStats() {
  return request<{
    sellers: Array<{
      id: string;
      nome: string;
      email: string;
      foto: string | null;
      ativo: boolean;
      perfil: string;
      ultimoAcesso: string;
      totalLeads: number;
      leadsQualificados: number;
      leadsConvertidos: number;
      valorTotalPipeline: number;
      valorConvertido: number;
      taxaConversao: number;
      ticketMedio: number;
      leadsUltimos30Dias: number;
      tendencia: 'up' | 'down' | 'stable';
    }>;
    totals: {
      totalVendedores: number;
      vendedoresAtivos: number;
      totalLeadsEquipe: number;
      totalConvertidos: number;
      valorTotalEquipe: number;
      valorConvertidoEquipe: number;
      mediaConversao: number;
    };
  }>("/users/sellers/stats");
}

function mapApiUserToUsuario(apiUser: any) {
  let perfil = 'Vendedor';
  if (apiUser.role === 'admin') perfil = 'Administrador';
  else if (apiUser.role === 'financial') perfil = 'Financeiro';

  return {
    id: apiUser._id || apiUser.id,
    nome: apiUser.name || apiUser.nome || "Sem Nome",
    email: apiUser.email,
    perfil: perfil as "Administrador" | "Financeiro" | "Vendedor",
    ativo: apiUser.active !== false,
    foto: apiUser.photoUrl || apiUser.avatar || null,
    ultimoAcesso: apiUser.lastLoginAt ? new Date(apiUser.lastLoginAt) : new Date(),
    phone: apiUser.phone,
    jobTitle: apiUser.jobTitle,
    emailSignature: apiUser.emailSignature
  };
}

export async function createUserApi(dados: {
  nome: string;
  email: string;
  perfil: string;
  telefone?: string;
  cargo?: string;
  assinatura?: string;
}) {
  const payload = {
    name: dados.nome,
    email: dados.email,
    password: "demo123",
    role: dados.perfil === 'Administrador' ? 'admin' : 
          dados.perfil === 'Financeiro' ? 'financeiro' : 'vendedor',
    active: true,
    phone: dados.telefone,
    jobTitle: dados.cargo,
    emailSignature: dados.assinatura
  };

  return request("/users", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateUserApi(id: string, dados: { 
  nome?: string; 
  email?: string; 
  perfil?: string; 
  ativo?: boolean;
  senha?: string;
  senhaAtual?: string;
  foto?: string;
  telefone?: string;
  cargo?: string;
  assinatura?: string;
}) {
  const payload: any = {};
  if (dados.nome) payload.name = dados.nome;
  if (dados.email) payload.email = dados.email;
  if (dados.ativo !== undefined) payload.active = dados.ativo;
  if (dados.senha) payload.password = dados.senha;
  if (dados.senhaAtual) payload.currentPassword = dados.senhaAtual;
  if (dados.foto !== undefined) payload.photoUrl = dados.foto;
  if (dados.telefone !== undefined) payload.phone = dados.telefone;
  if (dados.cargo !== undefined) payload.jobTitle = dados.cargo;
  if (dados.assinatura !== undefined) payload.emailSignature = dados.assinatura;
  
  if (dados.perfil) {
    payload.role = dados.perfil.toLowerCase() === 'administrador' ? 'admin' : 
                   dados.perfil.toLowerCase() === 'financeiro' ? 'financeiro' : 'vendedor';
  }

  return request(`/users/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function deleteUserApi(id: string) {
  return request(`/users/${id}`, {
    method: "DELETE",
  });
}

// --- Funções de Pipeline / Etapas ---

export async function createStageApi(pipelineId: string, dados: { 
  name: string; 
  order: number; 
  key: string; 
  color: string; 
  sla: number 
}) {
  return request(`/pipelines/${pipelineId}/stages`, {
    method: "POST",
    body: JSON.stringify(dados),
  });
}

export async function updateStageApi(stageId: string, dados: { 
  name?: string; 
  order?: number; 
  color?: string; 
  sla?: number 
}) {
  return request(`/pipelines/stages/${stageId}`, {
    method: "PATCH",
    body: JSON.stringify(dados),
  });
}

export async function deleteStageApi(stageId: string) {
  return request(`/pipelines/stages/${stageId}`, {
    method: "DELETE",
  });
}

export async function reorderStagesApi(pipelineId: string, orderedIds: string[]) {
  return request(`/pipelines/${pipelineId}/stages/reorder`, {
    method: "PUT",
    body: JSON.stringify({ ids: orderedIds }),
  });
}

// --- Funções de Exportação ---

interface ExportFilters {
  stageId?: string;
  origin?: string;
  owners?: string[];
  startDate?: string;
  endDate?: string;
  pipelineId?: string;
}

interface ExportFields {
  basico: boolean;
  contato: boolean;
  cnpj: boolean;
  vidas: boolean;
  hospitais: boolean;
  responsaveis: boolean;
  observacoes: boolean;
}

export async function exportToXLSX(filters: ExportFilters, fields: ExportFields) {
  const token = getStoredValue("authToken");
  const response = await fetch(`${API_URL}/leads/export/xlsx`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(token),
    },
    body: JSON.stringify({ filters, fields }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Erro ao exportar para XLSX");
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `Leads_Nautiluz_${new Date().toISOString().split('T')[0]}.xlsx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

export async function exportToCSV(filters: ExportFilters, fields: ExportFields) {
  const token = getStoredValue("authToken");
  const response = await fetch(`${API_URL}/leads/export/csv`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(token),
    },
    body: JSON.stringify({ filters, fields }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Erro ao exportar para CSV");
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `Leads_Nautiluz_${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

export async function exportToPDF(filters: ExportFilters, fields: ExportFields) {
  const token = getStoredValue("authToken");
  const response = await fetch(`${API_URL}/leads/export/pdf`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(token),
    },
    body: JSON.stringify({ filters, fields }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Erro ao exportar para PDF");
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `Leads_Nautiluz_${new Date().toISOString().split('T')[0]}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

// ==================== NOTIFICATIONS API ====================

export interface Notification {
  _id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'lead' | 'system';
  read: boolean;
  link?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

/**
 * Busca todas as notificações do usuário
 */
export async function fetchNotifications(unreadOnly = false): Promise<Notification[]> {
  const query = unreadOnly ? '?unreadOnly=true' : '';
  return request<Notification[]>(`/notifications${query}`);
}

/**
 * Busca a contagem de notificações não lidas
 */
export async function fetchUnreadCount(): Promise<number> {
  const data = await request<{ count: number }>('/notifications/unread-count');
  return data.count;
}

/**
 * Marca uma notificação como lida
 */
export async function markNotificationAsRead(notificationId: string): Promise<Notification> {
  return request<Notification>(`/notifications/${notificationId}/read`, {
    method: 'PATCH',
  });
}

/**
 * Marca todas as notificações como lidas
 */
export async function markAllNotificationsAsRead(): Promise<{ message: string; count: number }> {
  return request<{ message: string; count: number }>('/notifications/mark-all-read', {
    method: 'PATCH',
  });
}

/**
 * Deleta uma notificação
 */
export async function deleteNotification(notificationId: string): Promise<{ message: string }> {
  return request<{ message: string }>(`/notifications/${notificationId}`, {
    method: 'DELETE',
  });
}

/**
 * Limpa todas as notificações lidas
 */
export async function clearReadNotifications(): Promise<{ message: string; count: number }> {
  return request<{ message: string; count: number }>('/notifications/clear-read', {
    method: 'DELETE',
  });
}

// ==================== ATIVIDADES ====================

export interface Activity {
  _id: string;
  leadId: string;
  tipo: 'lead_criado' | 'lead_atualizado' | 'lead_movido' | 'observacao_adicionada' | 
        'observacao_atualizada' | 'observacao_removida' | 'responsavel_alterado' | 
        'status_alterado' | 'email_enviado' | 'ligacao_realizada' | 'whatsapp_enviado';
  descricao: string;
  userId: string;
  userName: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

/**
 * Busca as atividades de um lead específico
 */
export async function fetchLeadActivities(leadId: string, limit = 20): Promise<Activity[]> {
  return request<Activity[]>(`/leads/${leadId}/activities?limit=${limit}`);
}

/**
 * Busca as atividades recentes (feed geral)
 */
export async function fetchRecentActivities(limit = 50): Promise<Activity[]> {
  return request<Activity[]>(`/activities/recent?limit=${limit}`);
}

// ==================== OBSERVAÇÕES (NOTAS) ====================

export interface Note {
  _id: string;
  leadId: string;
  conteudo: string;
  userId: string;
  userName: string;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Busca as observações de um lead específico
 */
export async function fetchLeadNotes(leadId: string): Promise<Note[]> {
  return request<Note[]>(`/leads/${leadId}/notes`);
}

/**
 * Cria uma nova observação para um lead
 */
export async function createNote(leadId: string, conteudo: string, isPinned = false): Promise<Note> {
  return request<Note>(`/leads/${leadId}/notes`, {
    method: 'POST',
    body: JSON.stringify({ conteudo, isPinned }),
  });
}

/**
 * Atualiza uma observação existente
 */
export async function updateNote(noteId: string, data: { conteudo?: string; isPinned?: boolean }): Promise<Note> {
  return request<Note>(`/notes/${noteId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

/**
 * Deleta uma observação
 */
export async function deleteNote(noteId: string): Promise<{ message: string }> {
  return request<{ message: string }>(`/notes/${noteId}`, {
    method: 'DELETE',
  });
}

// ============================================
// Integrações (Meta Lead Ads, etc.)
// ============================================

export interface Integration {
  _id: string;
  type: 'meta_lead_ads' | 'google_ads' | 'webhook_generico';
  name: string;
  active: boolean;
  config: {
    appId?: string;
    appSecret?: string;
    accessToken?: string;
    pageId?: string;
    formId?: string;
    verifyToken?: string;
    fieldMapping?: Record<string, string>;
    defaultPipelineId?: string;
    defaultStageId?: string;
    defaultOwnerId?: string;
    origin?: string;
  };
  stats: {
    leadsReceived: number;
    leadsCreated: number;
    lastLeadAt?: string;
    errors: number;
  };
  webhookUrl?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Lista todas as integrações
 */
export async function fetchIntegrations(): Promise<Integration[]> {
  return request<Integration[]>('/integrations/meta');
}

/**
 * Busca uma integração por ID
 */
export async function fetchIntegration(id: string): Promise<Integration> {
  return request<Integration>(`/integrations/meta/${id}`);
}

/**
 * Cria uma nova integração
 */
export async function createIntegrationApi(data: Partial<Integration>): Promise<Integration> {
  return request<Integration>('/integrations/meta', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Atualiza uma integração existente
 */
export async function updateIntegrationApi(id: string, data: Partial<Integration>): Promise<Integration> {
  return request<Integration>(`/integrations/meta/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

/**
 * Deleta uma integração
 */
export async function deleteIntegrationApi(id: string): Promise<{ message: string }> {
  return request<{ message: string }>(`/integrations/meta/${id}`, {
    method: 'DELETE',
  });
}

/**
 * Testa uma integração criando um lead de teste
 */
export async function testIntegrationApi(id: string): Promise<{ success: boolean; lead?: any; error?: string }> {
  return request<{ success: boolean; lead?: any; error?: string }>(`/integrations/meta/${id}/test`, {
    method: 'POST',
  });
}

