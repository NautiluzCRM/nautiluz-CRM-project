export interface LeadOwner {
  id: string;
  nome: string;
  foto?: string | null; 
}

// NOVO: Adicionado para suportar o detalhamento de idades
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
  _id?: string;
  nome: string;
  empresa?: string;
  celular: string;
  email: string;
  possuiCnpj: boolean;
  
  // Alterado para aceitar string genérica (evita erros se vier algo diferente do banco)
  tipoCnpj?: 'MEI' | 'EI' | 'ME' | 'EPP' | 'SLU' | 'LTDA' | 'SS' | 'SA' | 'Outros' | string;
  
  quantidadeVidas: number;
  
  // --- MUDANÇA AQUI ---
  idades: number[]; 
  faixasEtarias?: FaixasEtarias; // Campo novo adicionado
  // --------------------

  possuiPlano: boolean;
  planoAtual?: string;
  valorMedio?: number;
  hospitaisPreferencia: string[];
  preferredConvenios?: string[]; 
  
  origem: 'Instagram' | 'Indicação' | 'Site' | 'Outros' | string;
  
  informacoes?: string;
  uf?: string;
  cidade?: string;
  responsavel: string; 
  owners?: LeadOwner[]; 
  ownersIds?: string[]; 
  statusQualificacao: 'Qualificado' | 'Incompleto' | 'Duplicado' | 'Sem interesse' | string;
  motivoPerda?: string;
  colunaAtual: string;

  // --- MUDANÇA NAS DATAS (CRUCIAL PARA O SLA) ---
  // Aceita Date | string para não quebrar quando o dado vem do JSON
  createdAt?: Date | string; 
  updatedAt?: Date | string; 
  ultimaAtividade: Date | string;
  
  stageChangedAt?: Date | string; // O campo novo para o cronômetro funcionar
  // ----------------------------------------------

  arquivos: string[];
  atividades: Atividade[];
}

export interface Atividade {
  id: string;
  tipo: 'Ligação' | 'WhatsApp' | 'Email' | 'Reunião' | 'Observação' | 'Sistema' | 'Alteração' | 
        'lead_criado' | 'lead_atualizado' | 'lead_movido' | 'observacao_adicionada' | string;
  descricao: string;
  data: Date | string; // Flexibilizado para aceitar string também
  usuario: string;
  metadata?: any; 
}

export interface Coluna {
  id: string;
  nome: string;
  cor: string;
  ordem: number;
  sla?: number; 
  wipLimit?: number;
  columnTag?: string;
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