import mongoose, { Schema, Types, Document } from 'mongoose';

/**
 * Faixas etárias para distribuição de vidas
 * Chaves alinhadas com o Frontend (CreateLeadModal/EditLeadModal)
 */
export interface FaixasEtarias {
  ate18: number;
  de19a23: number;
  de24a28: number;
  de29a33: number;
  de34a38: number;
  de39a43: number;
  de44a48: number;
  de49a53: number;
  de54a58: number;
  acima59: number;
}

/**
 * Origens possíveis do lead
 */
export const leadOrigins = [
  'Meta Ads',
  'Google Ads', 
  'Indicação',
  'Site',
  'WhatsApp',
  'Telefone',
  'Email',
  'Evento',
  'LinkedIn',
  'Parceiro',
  'Outros',
  'Outro'
] as const;
export type LeadOrigin = typeof leadOrigins[number];

/**
 * Status de qualificação do lead
 */
export const qualificationStatuses = [
  'novo',
  'em_contato',
  'qualificado',
  'proposta_enviada',
  'negociacao',
  'fechado_ganho',
  'fechado_perdido',
  'sem_interesse',
  'aguardando_retorno'
] as const;
export type QualificationStatus = typeof qualificationStatuses[number];

/**
 * Tipos de CNPJ
 * CORREÇÃO: Adicionado 'ME' que estava faltando e causando erro
 */
export const cnpjTypes = ['MEI', 'EI', 'ME', 'EPP', 'SLU', 'LTDA', 'SS', 'SA', 'Média', 'Grande', 'Outro', 'Outros'] as const;
export type CnpjType = typeof cnpjTypes[number];

/**
 * Prioridades do lead
 */
export const leadPriorities = ['baixa', 'media', 'alta', 'urgente'] as const;
export type LeadPriority = typeof leadPriorities[number];

export interface Lead extends Document {
  // Dados básicos
  name: string;
  company?: string;
  phone?: string;
  phoneSecondary?: string;
  whatsapp?: string;
  email?: string;
  emailSecondary?: string;
  
  // Dados da empresa
  hasCnpj?: boolean;
  cnpj?: string;
  cnpjType?: CnpjType;
  razaoSocial?: string;
  nomeFantasia?: string;
  
  // Vidas e faixas etárias
  livesCount?: number;
  faixasEtarias?: FaixasEtarias; // Objeto novo
  idades?: number[]; // Array legado (mantido por compatibilidade)
  
  // Plano atual
  hasCurrentPlan?: boolean;
  currentPlan?: string;
  currentOperadora?: string;
  dataVencimentoPlanoAtual?: Date;
  
  // Valores
  avgPrice?: number;
  valorProposta?: number;
  valorFechado?: number;
  
  // Preferências
  preferredHospitals?: string[];
  preferredConvenios?: string[]; // Convênios/Operadoras preferidos
  preferenciaCoparticipacao?: boolean;
  preferenciaEnfermaria?: boolean;
  
  // Localização
  state?: string;
  city?: string;
  cep?: string;
  endereco?: string;
  
  // Origem e rastreamento
  origin: LeadOrigin | string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  
  // Responsáveis
  owner?: Types.ObjectId;       // Mantido para legado
  owners?: Types.ObjectId[];    // Array de responsáveis
  
  // Pipeline
  pipelineId: Types.ObjectId;
  stageId: Types.ObjectId;
  rank: string;
  
  // Status e qualificação
  qualificationStatus?: QualificationStatus;
  priority?: LeadPriority;
  score?: number; // 0-100 pontuação do lead
  
  // Resultado
  lostReason?: string;
  wonAt?: Date;
  lostAt?: Date;
  
  // Observações e notas
  notes?: string;
  observacoesInternas?: string;
  
  // Próximo contato
  proximoContato?: Date;
  lembreteContato?: string;
  
  // Apólice vinculada (quando fechado)
  apoliceId?: Types.ObjectId;
  
  // Audit
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  lastActivityAt?: Date;
  lastContactAt?: Date;
  
  // SLA e Vencimento
  enteredStageAt?: Date; // Quando entrou na stage atual
  dueDate?: Date; // Data de vencimento calculada baseada no SLA da stage
  isOverdue?: boolean; // Se está atrasado
  overdueHours?: number; // Horas de atraso
  
  // Timestamps
  createdAt?: Date;
  updatedAt?: Date;
}

// Schema específico para as faixas etárias (CORREÇÃO PRINCIPAL)
const faixasEtariasSchema = new Schema<FaixasEtarias>({
  ate18: { type: Number, default: 0 },
  de19a23: { type: Number, default: 0 },
  de24a28: { type: Number, default: 0 },
  de29a33: { type: Number, default: 0 },
  de34a38: { type: Number, default: 0 },
  de39a43: { type: Number, default: 0 },
  de44a48: { type: Number, default: 0 },
  de49a53: { type: Number, default: 0 },
  de54a58: { type: Number, default: 0 },
  acima59: { type: Number, default: 0 }
}, { _id: false }); // _id: false impede que o Mongoose crie um ID para este sub-objeto

const leadSchema = new Schema<Lead>(
  {
    // Dados básicos
    name: { type: String, required: true, index: true },
    company: { type: String, index: true },
    phone: String,
    phoneSecondary: String,
    whatsapp: String,
    email: { type: String, index: true },
    emailSecondary: String,
    
    // Dados da empresa
    hasCnpj: Boolean,
    cnpj: { type: String, index: true },
    cnpjType: { type: String, enum: cnpjTypes },
    razaoSocial: String,
    nomeFantasia: String,
    
    // Vidas e faixas etárias
    livesCount: { type: Number, min: 0 },
    
    // NOVO CAMPO: Faixas Etárias (Objeto)
    faixasEtarias: { type: faixasEtariasSchema, default: () => ({}) },
    
    // Campo Legado: Idades (Array) - Mantido caso algo antigo ainda use
    idades: [Number], 
    
    // Plano atual
    hasCurrentPlan: Boolean,
    currentPlan: String,
    currentOperadora: String,
    dataVencimentoPlanoAtual: Date,
    
    // Valores
    avgPrice: Number,
    valorProposta: Number,
    valorFechado: Number,
    
    // Preferências
    preferredHospitals: [String],
    preferredConvenios: [String], // Convênios/Operadoras preferidos
    preferenciaCoparticipacao: Boolean,
    preferenciaEnfermaria: Boolean,
    
    // Localização
    state: String,
    city: String,
    cep: String,
    endereco: String,
    
    // Origem e rastreamento
    origin: { type: String, required: true, index: true },
    utmSource: String,
    utmMedium: String,
    utmCampaign: String,
    utmTerm: String,
    
    // Responsáveis
    owner: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    owners: [{ type: Schema.Types.ObjectId, ref: 'User', index: true }],
    
    // Pipeline
    pipelineId: { type: Schema.Types.ObjectId, ref: 'Pipeline', required: true, index: true },
    stageId: { type: Schema.Types.ObjectId, ref: 'Stage', required: true, index: true },
    rank: { type: String, required: true, index: true },
    
    // Status e qualificação
    qualificationStatus: { type: String, enum: qualificationStatuses, default: 'novo', index: true },
    priority: { type: String, enum: leadPriorities, default: 'media' },
    score: { type: Number, min: 0, max: 100, default: 0 },
    
    // Resultado
    lostReason: String,
    wonAt: Date,
    lostAt: Date,
    
    // Observações
    notes: String,
    observacoesInternas: String,
    
    // Próximo contato
    proximoContato: { type: Date, index: true },
    lembreteContato: String,
    
    // Apólice vinculada
    apoliceId: { type: Schema.Types.ObjectId, ref: 'Apolice' },
    
    // Audit
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    lastActivityAt: Date,
    lastContactAt: Date,
    
    // SLA e Vencimento
    enteredStageAt: { type: Date, index: true },
    dueDate: { type: Date, index: true },
    isOverdue: { type: Boolean, default: false, index: true },
    overdueHours: { type: Number, default: 0 }
  },
  {
    timestamps: true
  }
);

// Índices compostos para buscas otimizadas
leadSchema.index({ pipelineId: 1, stageId: 1, rank: 1 });
leadSchema.index({ qualificationStatus: 1, createdAt: -1 });
leadSchema.index({ owners: 1, qualificationStatus: 1 });
leadSchema.index({ origin: 1, createdAt: -1 });
leadSchema.index({ proximoContato: 1, qualificationStatus: 1 });

// Virtual para calcular total de vidas das faixas etárias
leadSchema.virtual('totalVidasFaixas').get(function() {
  if (!this.faixasEtarias) return 0;
  // Soma todos os valores do objeto faixasEtarias
  return Object.values(this.faixasEtarias).reduce((sum: number, val: any) => sum + (Number(val) || 0), 0);
});

// Middleware para sincronizar livesCount com faixas etárias
leadSchema.pre('save', function(next) {
  // Se faixasEtarias foi modificado, atualiza o contador total de vidas
  if (this.faixasEtarias && this.isModified('faixasEtarias')) {
    const total = Object.values(this.faixasEtarias).reduce((sum: number, val: any) => sum + (Number(val) || 0), 0);
    // Se o total for maior que 0, atualizamos o livesCount
    if (total > 0) {
      this.livesCount = total;
    }
  }
  next();
});

export const LeadModel = mongoose.models.Lead || mongoose.model<Lead>('Lead', leadSchema);