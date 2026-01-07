export interface LeadOwner {
  id: string;
  nome: string;
}

export interface Lead {
  id: string;
  _id?: string; // ID do MongoDB
  nome: string;
  empresa?: string;
  celular: string;
  email: string;
  possuiCnpj: boolean;
  tipoCnpj?: 'MEI' | 'LTDA' | 'SA' | 'Outros';
  quantidadeVidas: number;
  idades: number[];
  possuiPlano: boolean;
  planoAtual?: string;
  valorMedio?: number;
  hospitaisPreferencia: string[];
  origem: 'Instagram' | 'Indicação' | 'Site' | 'Outros';
  informacoes?: string;
  uf?: string;
  cidade?: string;
  responsavel: string; // Mantido para compatibilidade visual simples
  owners?: LeadOwner[]; // Lista de objetos com ID e Nome (para Avatars)
  ownersIds?: string[]; // Lista de IDs (para checagem rápida de permissão)
  statusQualificacao: 'Qualificado' | 'Incompleto' | 'Duplicado' | 'Sem interesse';
  motivoPerda?: string;
  colunaAtual: string;
  dataCriacao: Date;
  ultimaAtividade: Date;
  arquivos: string[];
  atividades: Atividade[];
}

export interface Atividade {
  id: string;
  tipo: 'Ligação' | 'WhatsApp' | 'Email' | 'Reunião' | 'Observação' | 'Sistema' | 'Alteração'; // Adicionei Sistema/Alteração que o backend usa
  descricao: string;
  data: Date;
  usuario: string;
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
  perfil: 'Administrador' | 'Financeiro' | 'Vendedor';
  ativo: boolean;
}

export interface Pipeline {
  id: string;
  nome: string;
  colunas: Coluna[];
  leads: Lead[];
}