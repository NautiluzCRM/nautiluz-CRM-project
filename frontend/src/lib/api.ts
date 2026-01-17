import { Lead, Pipeline, Coluna } from "@/types/crm";

// @ts-ignore - Vite env typing
export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:10000/api";
const storages = [localStorage, sessionStorage];

// Flag para evitar múltiplos redirects simultâneos
let isRedirecting = false;

// Função para resetar o estado de redirect (útil após login)
export function resetRedirectFlag() {
  isRedirecting = false;
}

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

// --- CORREÇÃO PRINCIPAL: Rotação de Token e Tratamento de Erro Seguro ---
async function refreshAccessToken() {
  const storage = getAuthStorage();
  const refreshToken = storage.getItem("refreshToken") ?? getStoredValue("refreshToken");
  
  // Se não tem token de refresh, não há o que fazer
  if (!refreshToken) {
    console.warn('[Auth] Nenhum refresh token disponível');
    return null;
  }

  try {
    console.log('[Auth] Tentando renovar access token...');
    const res = await fetch(`${API_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: refreshToken }),
    });

    if (!res.ok) {
      const errText = await res.text();
      let errorDetail = errText;
      try {
        const errorJson = JSON.parse(errText);
        errorDetail = errorJson.message || errText;
      } catch {}
      
      console.error(`[Auth] Falha no refresh (${res.status}): ${errorDetail}`);

      // SÓ desloga se o token for explicitamente recusado (401/403) ou inválido (400)
      // Se for erro de servidor (500+), NÃO desloga, permite tentar de novo depois
      if (res.status === 400 || res.status === 401 || res.status === 403) {
        console.warn('[Auth] Refresh token expirado ou inválido. Limpando sessão.');
        clearAuthStorage();
      }
      return null;
    }

    const data = await res.json();
    
    if (data?.accessToken) {
      console.log('[Auth] Token renovado com sucesso');
      setAccessToken(data.accessToken);

      // --- ROTAÇÃO: Se o backend mandou um novo refresh token, atualiza! ---
      if (data.refreshToken) {
        storage.setItem("refreshToken", data.refreshToken);
        console.log('[Auth] Refresh token também atualizado');
      }
      // ---------------------------------------------------------------------

      return data.accessToken as string;
    }
  } catch (error) {
    // Erro de rede (internet caiu, servidor fora do ar)
    console.error("[Auth] Erro de rede ao tentar refresh:", error);
    // NÃO desloga em erro de rede, retorna null para tentar no próximo ciclo
    return null;
  }
  
  console.warn('[Auth] Resposta de refresh sem accessToken');
  return null;
}
// -------------------------------------------------------------------------

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = {
    "Content-Type": "application/json",
    ...getAuthHeaders(),
    ...(options.headers || {}),
  };

  let res = await fetch(`${API_URL}${path}`, { ...options, headers });

  if (res.status === 401) {
    console.log(`[API] Recebido 401 em ${path}. Tentando renovar token...`);
    
    const newToken = await refreshAccessToken();
    if (newToken) {
      console.log('[API] Token renovado. Retentando requisição...');
      const retryHeaders = {
        ...headers,
        ...getAuthHeaders(newToken),
      };
      res = await fetch(`${API_URL}${path}`, { ...options, headers: retryHeaders });
      
      if (res.status === 401) {
        console.error('[API] 401 persistiu após refresh. Token pode estar sem permissões.');
      }
    } else {
      // Refresh falhou definitivamente - limpa auth e redireciona
      console.error('[API] Falha ao renovar token. Sessão expirada.');
      clearAuthStorage();
      
      // Evita múltiplos redirects simultâneos
      if (!isRedirecting && !window.location.pathname.includes('/login')) {
        isRedirecting = true;
        
        // Mostra mensagem amigável
        const mensagem = 'Sua sessão expirou. Por favor, faça login novamente.';
        
        // Tenta usar toast se disponível
        if (typeof window !== 'undefined' && (window as any).toast) {
          (window as any).toast.error(mensagem);
        } else {
          console.warn(mensagem);
        }
        
        // Pequeno delay para permitir que a mensagem seja vista
        setTimeout(() => {
          window.location.href = '/login';
        }, 500);
      }
      
      throw new Error('Sessão expirada. Por favor, faça login novamente.');
    }
  }

  if (!res.ok) {
    const text = await res.text();
    // Tenta fazer parse do JSON de erro se possível
    let errorMessage = text || `Erro HTTP ${res.status}`;
    try {
        const jsonError = JSON.parse(text);
        if (jsonError.message) errorMessage = jsonError.message;
    } catch {}
    
    throw new Error(errorMessage);
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
    owners: data.owners, 

    hasCurrentPlan: Boolean(data.possuiPlano),
    currentPlan: data.planoAtual,
    
    // Mapeamento correto das faixas etárias (Objeto)
    faixasEtarias: data.faixasEtarias,

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
    columnTag: stage.columnTag || ''
  };
}

export function mapApiLeadToLead(api: any): Lead {
  // LÓGICA DE MAPEAMENTO DE DONOS (Objetos ou Strings)
  
  // 1. Pega o array bruto (pode vir owners ou owner)
  const rawOwners = api.owners && api.owners.length > 0 ? api.owners : (api.owner ? [api.owner] : []);

  // 2. Normaliza para garantir que temos um array de objetos { id, nome }
  const normalizedOwners = rawOwners.map((u: any) => {
    if (typeof u === 'string') {
        return { id: u, nome: "Carregando...", foto: null }; 
    }
    return { 
        id: u._id || u.id, 
        nome: u.name || u.nome || "Sem Nome",
        foto: u.photoUrl || u.photoBase64 || null 
    };
  });

  // 3. Cria uma string de exibição
  const responsavelDisplay = normalizedOwners.map((o: any) => o.nome.split(' ')[0]).join(', ');

  // 4. Extrai IDs para checkbox
  const ownersIds = normalizedOwners.map((o: any) => o.id);

  // 5. IDs e Stage
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
    faixasEtarias: api.faixasEtarias || {}, 
    
    possuiPlano: api.hasCurrentPlan ?? false,
    planoAtual: api.currentPlan,
    valorMedio: api.avgPrice,
    hospitaisPreferencia: api.preferredHospitals || [],
    origem: api.origin || "Outros",
    informacoes: api.notes,
    uf: api.state,
    cidade: api.city,
    
    owners: normalizedOwners, 
    ownersIds: ownersIds,
    responsavel: responsavelDisplay || "Não atribuído",
    
    statusQualificacao: api.qualificationStatus || "Qualificado",
    motivoPerda: api.lostReason,
    colunaAtual: typeof stageId === 'object' ? stageId.toString() : stageId,
    dataCriacao: api.createdAt ? new Date(api.createdAt) : new Date(),
    ultimaAtividade: api.lastActivityAt ? new Date(api.lastActivityAt) : new Date(),

    // 👇👇👇 AQUI ESTÁ A CORREÇÃO MÁGICA 👇👇👇
    // Repassa as datas de fase que vieram do backend
    stageChangedAt: api.stageChangedAt,
    enteredStageAt: api.enteredStageAt,
    // 👆👆👆 O HUMBERTO AGRADECE 👆👆👆

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
    
    faixasEtarias: (lead as any).faixasEtarias,

    hasCurrentPlan: lead.possuiPlano,
    currentPlan: lead.planoAtual,
    avgPrice: lead.valorMedio,
    preferredHospitals: lead.hospitaisPreferencia,
    origin: lead.origem,
    notes: lead.informacoes,
    state: lead.uf,
    city: lead.cidade,
    
    owners: (lead as any).owners, 
    
    qualificationStatus: lead.statusQualificacao,
    lostReason: lead.motivoPerda,
    stageId: lead.colunaAtual,
  };
}

export async function fetchPipelineData(): Promise<Pipeline> {
  console.log('[API] Iniciando fetchPipelineData...');
  
  const [pipelines, leads, users] = await Promise.all([
    fetchPipelines(), 
    fetchLeads(),
    fetchUsers()
  ]);
  
  console.log('[API] Dados recebidos:', {
    pipelines: pipelines.length,
    leads: leads.length,
    users: users.length
  });
  
  const pipeline = pipelines[0];

  if (!pipeline) {
    console.warn('[API] Nenhum pipeline encontrado!');
    return {
      id: '',
      nome: 'Pipeline não configurado',
      colunas: [],
      leads: [],
      owners: [],
    };
  }

  console.log('[API] Pipeline encontrado:', pipeline.name, 'ID:', pipeline._id || pipeline.id);
  
  const stages = await fetchStages(pipeline._id || pipeline.id);
  
  console.log('[API] Stages carregados:', stages.length);

  return {
    id: pipeline._id || pipeline.id,
    nome: pipeline.name,
    colunas: stages.map(mapApiStageToColuna),
    leads: leads.map(mapApiLeadToLead),
    owners: users.filter(u => u.ativo).map(u => ({ _id: u.id, nome: u.nome })),
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
  senha?: string;
  telefone?: string;
  cargo?: string;
  assinatura?: string;
  enviarEmailSenha?: boolean;
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
    emailSignature: dados.assinatura,
    sendResetEmail: dados.enviarEmailSenha !== false // Por padrão, envia email
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
  active?: boolean;
  senha?: string;
  senhaAtual?: string;
  foto?: string;
  telefone?: string;
  cargo?: string;
  assinatura?: string;
  distribution?: any;
}) {
  const payload: any = {};
  
  if (dados.nome) payload.name = dados.nome;
  if (dados.email) payload.email = dados.email;
  
  if (dados.ativo !== undefined) payload.active = dados.ativo;
  if (dados.active !== undefined) payload.active = dados.active;

  if (dados.senha) payload.password = dados.senha;
  if (dados.senhaAtual) payload.currentPassword = dados.senhaAtual;
  if (dados.foto !== undefined) payload.photoUrl = dados.foto;
  if (dados.telefone !== undefined) payload.phone = dados.telefone;
  if (dados.cargo !== undefined) payload.jobTitle = dados.cargo;
  if (dados.assinatura !== undefined) payload.emailSignature = dados.assinatura;
  
  if (dados.distribution) {
    payload.distribution = dados.distribution;
  }
  
  if (dados.perfil) {
    payload.role = dados.perfil.toLowerCase() === 'administrador' ? 'admin' : 
                   dados.perfil.toLowerCase() === 'financeiro' ? 'financeiro' : 'vendedor';
  }

  return request(`/users/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function updateUserPreferencesApi(id: string, preferences: {
  notificationPreferences?: {
    email?: boolean;
    sla?: boolean;
    sms?: boolean;
  };
  preferences?: {
    darkMode?: boolean;
    autoSave?: boolean;
  };
}) {
  return request(`/users/${id}`, {
    method: "PATCH",
    body: JSON.stringify(preferences),
  });
}

export async function getUserApi(id: string) {
  return request(`/users/${id}`, {
    method: "GET",
  });
}

export async function deleteUserApi(id: string) {
  return request(`/users/${id}`, {
    method: "DELETE",
  });
}

// Upload de foto de perfil (base64)
export async function uploadUserPhotoApi(id: string, photoBase64: string) {
  return request(`/users/${id}/photo`, {
    method: "POST",
    body: JSON.stringify({ photoBase64 }),
  });
}

// Remover foto de perfil
export async function removeUserPhotoApi(id: string) {
  return request(`/users/${id}/photo`, {
    method: "DELETE",
  });
}

// --- Funções de Pipeline / Etapas ---

export async function createStageApi(pipelineId: string, dados: { 
  name: string; 
  order: number; 
  key: string; 
  color: string; 
  sla: number;
  columnTag?: string;
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
  sla?: number;
  columnTag?: string;
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

export async function fetchNotifications(unreadOnly = false): Promise<Notification[]> {
  const query = unreadOnly ? '?unreadOnly=true' : '';
  return request<Notification[]>(`/notifications${query}`);
}

export async function fetchUnreadCount(): Promise<number> {
  const data = await request<{ count: number }>('/notifications/unread-count');
  return data.count;
}

export async function markNotificationAsRead(notificationId: string): Promise<Notification> {
  return request<Notification>(`/notifications/${notificationId}/read`, {
    method: 'PATCH',
  });
}

export async function markAllNotificationsAsRead(): Promise<{ message: string; count: number }> {
  return request<{ message: string; count: number }>('/notifications/mark-all-read', {
    method: 'PATCH',
  });
}

export async function deleteNotification(notificationId: string): Promise<{ message: string }> {
  return request<{ message: string }>(`/notifications/${notificationId}`, {
    method: 'DELETE',
  });
}

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

export async function fetchLeadActivities(leadId: string, limit = 20): Promise<Activity[]> {
  return request<Activity[]>(`/leads/${leadId}/activities?limit=${limit}`);
}

export async function fetchRecentActivities(limit = 50): Promise<Activity[]> {
  return request<Activity[]>(`/activities/recent?limit=${limit}`);
}

// ============================================
// SLA e Qualificação
// ============================================

export interface SLAStatus {
  isOverdue: boolean;
  overdueHours: number;
  daysUntilDue?: number;
  hoursUntilDue?: number;
}

export interface QualificationCriteria {
  hasContact: boolean;
  hasCompanyData: boolean;
  hasLivesCount: boolean;
  hasBudget: boolean;
  isEngaged: boolean;
  score: number;
}

export interface QualificationEvaluation {
  criteria: QualificationCriteria;
  suggestedStatus: string;
  isQualified: boolean;
}

export async function checkLeadSLA(leadId: string): Promise<SLAStatus> {
  return request<SLAStatus>(`/sla/leads/${leadId}/sla`);
}

export async function evaluateLeadQualification(leadId: string): Promise<QualificationEvaluation> {
  return request<QualificationEvaluation>(`/sla/leads/${leadId}/qualification`);
}

export async function getLeadsDueSoon(hours: number = 24): Promise<any[]> {
  return request<any[]>(`/sla/due-soon?hours=${hours}`);
}

export async function getSLAStatsByPipeline(pipelineId: string): Promise<{
  total: number;
  onTime: number;
  overdue: number;
  noSLA: number;
  avgOverdueHours: number;
}> {
  return request(`/sla/pipelines/${pipelineId}/stats`);
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

export async function fetchLeadNotes(leadId: string): Promise<Note[]> {
  return request<Note[]>(`/leads/${leadId}/notes`);
}

export async function createNote(leadId: string, conteudo: string, isPinned = false): Promise<Note> {
  return request<Note>(`/leads/${leadId}/notes`, {
    method: 'POST',
    body: JSON.stringify({ conteudo, isPinned }),
  });
}

export async function updateNote(noteId: string, data: { conteudo?: string; isPinned?: boolean }): Promise<Note> {
  return request<Note>(`/notes/${noteId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

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

export async function fetchIntegrations(): Promise<Integration[]> {
  return request<Integration[]>('/integrations/meta');
}

export async function fetchIntegration(id: string): Promise<Integration> {
  return request<Integration>(`/integrations/meta/${id}`);
}

export async function createIntegrationApi(data: Partial<Integration>): Promise<Integration> {
  return request<Integration>('/integrations/meta', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateIntegrationApi(id: string, data: Partial<Integration>): Promise<Integration> {
  return request<Integration>(`/integrations/meta/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteIntegrationApi(id: string): Promise<{ message: string }> {
  return request<{ message: string }>(`/integrations/meta/${id}`, {
    method: 'DELETE',
  });
}

export async function testIntegrationApi(id: string): Promise<{ success: boolean; lead?: any; error?: string }> {
  return request<{ success: boolean; lead?: any; error?: string }>(`/integrations/meta/${id}/test`, {
    method: 'POST',
  });
}

// --- Operadoras/Convênios Logos ---

export interface OperadoraLogo {
  _id: string;
  nomeNormalizado: string;
  nomeOriginal: string;
  logoUrl: string;
  logoPublicId: string;
  createdAt: string;
  updatedAt: string;
}

export async function fetchOperadoraLogos(): Promise<OperadoraLogo[]> {
  return request<OperadoraLogo[]>('/operadoras/logos');
}

export async function searchOperadoraLogo(plano: string): Promise<OperadoraLogo | null> {
  try {
    return await request<OperadoraLogo>(`/operadoras/logos/search?plano=${encodeURIComponent(plano)}`);
  } catch {
    return null;
  }
}

export async function uploadOperadoraLogo(nomeOperadora: string, imageBase64: string): Promise<{ message: string; logo: OperadoraLogo }> {
  return request<{ message: string; logo: OperadoraLogo }>('/operadoras/logos', {
    method: 'POST',
    body: JSON.stringify({ nomeOperadora, imageBase64 }),
  });
}

export async function deleteOperadoraLogo(id: string): Promise<{ message: string }> {
  return request<{ message: string }>(`/operadoras/logos/${id}`, {
    method: 'DELETE',
  });
}