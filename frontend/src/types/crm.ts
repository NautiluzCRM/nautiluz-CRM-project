export interface LeadOwner {
  id: string;
  nome: string;
}

// ADICIONE ISTO: A interface que faltava
export interface FaixasEtarias {
  ate18?: number;
  de19a23?: number;
  de24a28?: number;
  de29a33?: number;
  de34a38?: number;
  de39a43?: number;
  de44a48?: number;
  de49a53?: number;
  de54a58?: number;
  acima59?: number;
}

export interface Lead {
  id: string;
  _id?: string; // ID do MongoDB
  nome: string;
  empresa?: string;
  celular: string;
  email: string;
  possuiCnpj: boolean;
  
  // Atualizei para aceitar strings genéricas para evitar erros de validação estritos
  tipoCnpj?: 'MEI' | 'EI' | 'ME' | 'EPP' | 'SLU' | 'LTDA' | 'SS' | 'SA' | 'Outros' | string;
  
  quantidadeVidas: number;
  
  // --- AQUI ESTÁ A CORREÇÃO ---
  idades: number[]; // Mantido para compatibilidade
  faixasEtarias?: FaixasEtarias; // O novo objeto que faltava!
  // ----------------------------

  possuiPlano: boolean;
  planoAtual?: string;
  valorMedio?: number;
  hospitaisPreferencia: string[];
  
  // Atualizei para aceitar string genérica também
  origem: 'Instagram' | 'Indicação' | 'Site' | 'Outros' | string;
  
  informacoes?: string;
  uf?: string;
  cidade?: string;
  responsavel: string; // Mantido para compatibilidade visual simples
  owners?: LeadOwner[]; // Lista de objetos com ID e Nome (para Avatars)
  ownersIds?: string[]; // Lista de IDs (para checagem rápida de permissão)
  statusQualificacao: 'Qualificado' | 'Incompleto' | 'Duplicado' | 'Sem interesse' | string;
  motivoPerda?: string;
  colunaAtual: string;
  createdAt?: Date; // Data de criação automática do Mongoose
  updatedAt?: Date; // Data de atualização automática do Mongoose
  ultimaAtividade: Date;
  arquivos: string[];
  atividades: Atividade[];
}

export interface Atividade {
  id: string;
  // Adicionei os tipos novos do backend aqui para o TS não reclamar
  tipo: 'Ligação' | 'WhatsApp' | 'Email' | 'Reunião' | 'Observação' | 'Sistema' | 'Alteração' | 
        'lead_criado' | 'lead_atualizado' | 'lead_movido' | 'observacao_adicionada' | string;
  descricao: string;
  data: Date;
  usuario: string;
  metadata?: any; // Para guardar dados extras como "de -> para"
}

export interface Coluna {
  id: string;
  nome: string;
  cor: string;
  ordem: number;
  sla?: number; // em horas
  wipLimit?: number;
}

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  foto?: string;
  perfil: 'Administrador' | 'Financeiro' | 'Vendedor' | string;
  ativo: boolean;
}

export interface Pipeline {
  id: string;
  nome: string;
  colunas: Coluna[];
  leads: Lead[];
  owners?: Array<{ _id: string; nome: string }>;
}