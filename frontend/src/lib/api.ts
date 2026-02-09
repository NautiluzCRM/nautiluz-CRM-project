import { Lead, Pipeline, Coluna } from "@/types/crm";

// @ts-ignore - Vite env typing
// Volte para a variável de ambiente ou coloque o link do Render
export const API_URL = import.meta.env.VITE_API_URL || "https://nautiluz-crm-project.onrender.com/api";
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

// --- Rotação de Token e Tratamento de Erro Seguro ---
async function refreshAccessToken() {
  const storage = getAuthStorage();
  const refreshToken = storage.getItem("refreshToken") ?? getStoredValue("refreshToken");
  
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

      if (data.refreshToken) {
        storage.setItem("refreshToken", data.refreshToken);
        console.log('[Auth] Refresh token também atualizado');
      }

      return data.accessToken as string;
    }
  } catch (error) {
    console.error("[Auth] Erro de rede ao tentar refresh:", error);
    return null;
  }
  
  console.warn('[Auth] Resposta de refresh sem accessToken');
  return null;
}

// Wrapper genérico para fetch (trata JSON e Auth)
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
      console.error('[API] Falha ao renovar token. Sessão expirada.');
      clearAuthStorage();
      
      if (!isRedirecting && !window.location.pathname.includes('/login')) {
        isRedirecting = true;
        
        const mensagem = 'Sua sessão expirou. Por favor, faça login novamente.';
        
        if (typeof window !== 'undefined' && (window as any).toast) {
          (window as any).toast.error(mensagem);
        } else {
          console.warn(mensagem);
        }
        
        setTimeout(() => {
          window.location.href = '/login';
        }, 500);
      }
      
      throw new Error('Sessão expirada. Por favor, faça login novamente.');
    }
  }

  if (!res.ok) {
    const text = await res.text();
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
    
    // --- Datas de SLA e Controle ---
    enteredStageAt: new Date().toISOString(), // Grava a hora exata da criação
    stageChangedAt: new Date().toISOString(), // Compatibilidade
    
    createdAt: data.dataCriacao ? new Date(data.dataCriacao).toISOString() : undefined,
    notes: data.observacoes,
    
    // Mapeamento reverso para API
    company: data.empresa,
    hasCnpj: data.possuiCnpj,
    cnpjType: data.tipoCnpj,
    livesCount: data.quantidadeVidas,
    faixasEtarias: data.faixasEtarias,
    hasCurrentPlan: data.possuiPlano,
    currentPlan: data.planoAtual,
    avgPrice: data.valorMedio,
    preferredHospitals: data.hospitaisPreferencia,
    state: data.uf,
    city: data.cidade,
    owners: data.owners,
    qualificationStatus: data.statusQualificacao,
    lostReason: data.motivoPerda,
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
  const rawOwners = api.owners && api.owners.length > 0 ? api.owners : (api.owner ? [api.owner] : []);

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

  const responsavelDisplay = normalizedOwners.map((o: any) => o.nome.split(' ')[0]).join(', ');
  const ownersIds = normalizedOwners.map((o: any) => o.id);
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
    
    enteredStageAt: api.enteredStageAt ? new Date(api.enteredStageAt) : undefined,
    stageChangedAt: api.stageChangedAt ? new Date(api.stageChangedAt) : undefined,

    // 👇 AQUI ESTAVA FALTANDO! ADICIONEI ESTAS DUAS LINHAS:
    proposalUrl: api.proposalUrl,
    proposalOriginalName: api.proposalOriginalName,
    proposalDate: api.proposalDate,
    // ----------------------------------------------------

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
  
  const stages = await fetchStages(pipeline._id || pipeline.id);
  
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

export async function fetchSellersStats() {
  return request<any>("/users/sellers/stats");
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

export async function createUserApi(dados: any) {
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
    sendResetEmail: dados.enviarEmailSenha !== false
  };

  return request("/users", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateUserApi(id: string, dados: any) {
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
  if (dados.distribution) payload.distribution = dados.distribution;
  
  if (dados.perfil) {
    payload.role = dados.perfil.toLowerCase() === 'administrador' ? 'admin' : 
                   dados.perfil.toLowerCase() === 'financeiro' ? 'financeiro' : 'vendedor';
  }

  return request(`/users/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function updateUserPreferencesApi(id: string, preferences: any) {
  return request(`/users/${id}`, {
    method: "PATCH",
    body: JSON.stringify(preferences),
  });
}

export async function getUserApi(id: string) {
  return request(`/users/${id}`, { method: "GET" });
}

export async function deleteUserApi(id: string) {
  return request(`/users/${id}`, { method: "DELETE" });
}

export async function uploadUserPhotoApi(id: string, photoBase64: string) {
  return request(`/users/${id}/photo`, {
    method: "POST",
    body: JSON.stringify({ photoBase64 }),
  });
}

export async function removeUserPhotoApi(id: string) {
  return request(`/users/${id}/photo`, { method: "DELETE" });
}

// --- Funções de Pipeline / Etapas ---

export async function createStageApi(pipelineId: string, dados: any) {
  return request(`/pipelines/${pipelineId}/stages`, {
    method: "POST",
    body: JSON.stringify(dados),
  });
}

export async function updateStageApi(stageId: string, dados: any) {
  return request(`/pipelines/stages/${stageId}`, {
    method: "PATCH",
    body: JSON.stringify(dados),
  });
}

export async function deleteStageApi(stageId: string) {
  return request(`/pipelines/stages/${stageId}`, { method: "DELETE" });
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
    headers: { "Content-Type": "application/json", ...getAuthHeaders(token) },
    body: JSON.stringify({ filters, fields }),
  });
  if (!response.ok) throw new Error("Erro ao exportar para XLSX");
  downloadBlob(await response.blob(), `Leads_Nautiluz_${getTodayString()}.xlsx`);
}

export async function exportToCSV(filters: ExportFilters, fields: ExportFields) {
  const token = getStoredValue("authToken");
  const response = await fetch(`${API_URL}/leads/export/csv`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAuthHeaders(token) },
    body: JSON.stringify({ filters, fields }),
  });
  if (!response.ok) throw new Error("Erro ao exportar para CSV");
  downloadBlob(await response.blob(), `Leads_Nautiluz_${getTodayString()}.csv`);
}

export async function exportToPDF(filters: ExportFilters, fields: ExportFields) {
  const token = getStoredValue("authToken");
  const response = await fetch(`${API_URL}/leads/export/pdf`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAuthHeaders(token) },
    body: JSON.stringify({ filters, fields }),
  });
  if (!response.ok) throw new Error("Erro ao exportar para PDF");
  downloadBlob(await response.blob(), `Leads_Nautiluz_${getTodayString()}.pdf`);
}

function downloadBlob(blob: Blob, fileName: string) {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

function getTodayString() {
  return new Date().toISOString().split('T')[0];
}

// ==================== NOTIFICATIONS API ====================

export interface Notification {
  _id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
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
  return request<Notification>(`/notifications/${notificationId}/read`, { method: 'PATCH' });
}

export async function markAllNotificationsAsRead(): Promise<{ message: string; count: number }> {
  return request<{ message: string; count: number }>('/notifications/mark-all-read', { method: 'PATCH' });
}

export async function deleteNotification(notificationId: string): Promise<{ message: string }> {
  return request<{ message: string }>(`/notifications/${notificationId}`, { method: 'DELETE' });
}

export async function clearReadNotifications(): Promise<{ message: string; count: number }> {
  return request<{ message: string; count: number }>('/notifications/clear-read', { method: 'DELETE' });
}

// ==================== ATIVIDADES ====================

export interface Activity {
  _id: string;
  leadId: string;
  tipo: string;
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

// ==================== SLA e Qualificação ====================

export async function checkLeadSLA(leadId: string) {
  return request<any>(`/sla/leads/${leadId}/sla`);
}

export async function evaluateLeadQualification(leadId: string) {
  return request<any>(`/sla/leads/${leadId}/qualification`);
}

export async function getLeadsDueSoon(hours: number = 24) {
  return request<any[]>(`/sla/due-soon?hours=${hours}`);
}

export async function getSLAStatsByPipeline(pipelineId: string) {
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

export async function updateNote(noteId: string, data: any): Promise<Note> {
  return request<Note>(`/notes/${noteId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteNote(noteId: string) {
  return request<{ message: string }>(`/notes/${noteId}`, { method: 'DELETE' });
}

// ==================== Integrações ====================

export interface Integration {
  _id: string;
  type: string;
  name: string;
  active: boolean;
  config: any;
  stats: any;
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

export async function createIntegrationApi(data: any): Promise<Integration> {
  return request<Integration>('/integrations/meta', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateIntegrationApi(id: string, data: any): Promise<Integration> {
  return request<Integration>(`/integrations/meta/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteIntegrationApi(id: string) {
  return request<{ message: string }>(`/integrations/meta/${id}`, { method: 'DELETE' });
}

export async function testIntegrationApi(id: string) {
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

// No final do arquivo api.ts

export async function uploadProposalApi(leadId: string, file: File) {
  const formData = new FormData();
  formData.append('file', file);

  const token = localStorage.getItem("authToken") || sessionStorage.getItem("authToken");
  
  // Headers manuais (sem Content-Type, o browser define automático para multipart/form-data)
  const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};

  // ATENÇÃO: Se sua API_URL já termina com /api (ex: http://localhost:10000/api),
  // então aqui deve ser apenas `/leads/${leadId}/proposal`.
  // O fetch vai montar: http://localhost:10000/api/leads/123/proposal
  const response = await fetch(`${API_URL}/leads/${leadId}/proposal`, {
    method: 'POST',
    headers: headers,
    body: formData
  });

  if (!response.ok) {
    if (response.status === 401) {
       throw new Error("Sessão expirada. Faça login novamente.");
    }
    const text = await response.text();
    // Tenta ler o JSON de erro se existir
    try {
        const json = JSON.parse(text);
        throw new Error(json.error || json.message || "Erro ao fazer upload");
    } catch {
        throw new Error(text || "Erro ao fazer upload da proposta");
    }
  }

  return response.json();
}