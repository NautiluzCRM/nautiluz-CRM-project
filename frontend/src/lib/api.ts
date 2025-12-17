import { Lead, Pipeline, Coluna } from "@/types/crm";

export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";
const storages = [localStorage, sessionStorage];

const getStoredValue = (key: string) => localStorage.getItem(key) ?? sessionStorage.getItem(key);

const clearAuthStorage = () => {
  for (const storage of storages) {
    storage.removeItem("authToken");
    storage.removeItem("refreshToken");
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
  // O 'request' lida automaticamente com o cabeçalho Authorization e erro 401
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
    
    // NOVO: Mapeia o Tipo de CNPJ apenas se tiver CNPJ marcado
    cnpjType: data.possuiCnpj ? data.tipoCnpj : undefined,

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

export async function fetchLeads() {
  return request<any[]>("/leads");
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

export async function exportLeadsXlsx(filter: Record<string, unknown> = {}) {
  return request<{ url: string; file: string }>("/exports/xlsx", {
    method: "POST",
    body: JSON.stringify(filter),
  });
}

// Helpers para adaptar payload do backend aos tipos do frontend
export function mapApiStageToColuna(stage: any): Coluna {
  return {
    id: stage._id || stage.id,
    nome: stage.name,
    cor: "#3B82F6",
    ordem: stage.order,
    wipLimit: stage.wipLimit,
    sla: stage.sla,
  };
}

export function mapApiLeadToLead(api: any): Lead {
  return {
    id: api._id || api.id,
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
    responsavel: api.owner || "",
    statusQualificacao: api.qualificationStatus || "Qualificado",
    motivoPerda: api.lostReason,
    colunaAtual: api.stageId || api.colunaAtual,
    dataCriacao: api.createdAt ? new Date(api.createdAt) : new Date(),
    ultimaAtividade: api.lastActivityAt ? new Date(api.lastActivityAt) : new Date(),
    arquivos: [],
    atividades: api.activities || [],
  };
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
    qualificationStatus: lead.statusQualificacao,
    lostReason: lead.motivoPerda,
    stageId: lead.colunaAtual,
  };
}

export async function fetchPipelineData(): Promise<Pipeline> {
  const [pipelines, leads] = await Promise.all([fetchPipelines(), fetchLeads()]);
  const pipeline = pipelines[0];
  const stages = await fetchStages(pipeline._id || pipeline.id);

  return {
    id: pipeline._id || pipeline.id,
    nome: pipeline.name,
    colunas: stages.map(mapApiStageToColuna),
    leads: leads.map(mapApiLeadToLead),
  };
}

export async function fetchUsers() {
  const data = await request<any[]>("/users");
  return data.map(mapApiUserToUsuario);
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
  
  // Mapeia os campos simples
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