import { Lead, Pipeline, Coluna } from "@/types/crm";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

function getAuthHeaders() {
  const token = localStorage.getItem("authToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
      ...(options.headers || {}),
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Erro HTTP ${res.status}`);
  }
  return (await res.json()) as T;
}

export async function loginApi(email: string, password: string) {
  return request<{ accessToken: string; refreshToken: string; user: any }>(
    "/auth/login",
    {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }
  );
}

export async function fetchPipelines() {
  return request<any[]>("/pipelines");
}

export async function fetchStages(pipelineId: string) {
  return request<any[]>(`/pipelines/${pipelineId}/stages`);
}

export async function fetchLeads() {
  return request<any[]>("/leads");
}

export async function moveLeadApi(leadId: string, toStageId: string) {
  return request(`/kanban/move`, {
    method: "POST",
    body: JSON.stringify({ leadId, toStageId }),
  });
}

export async function updateLeadApi(leadId: string, payload: Partial<Lead>) {
  return request(`/leads/${leadId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
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
