import mongoose, { Schema, Types } from 'mongoose';

/**
 * Status possíveis de uma apólice
 */
export const apoliceStatuses = ['ativa', 'pendente', 'vencendo', 'vencida', 'cancelada', 'suspensa'] as const;
export type ApoliceStatus = typeof apoliceStatuses[number];

/**
 * Tipos de plano de saúde
 */
export const planTypes = ['enfermaria', 'apartamento', 'vip', 'empresarial', 'pme', 'adesao'] as const;
export type PlanType = typeof planTypes[number];

/**
 * Operadoras de saúde
 */
export const operadoras = [
  'Unimed',
  'Bradesco Saúde',
  'SulAmérica',
  'Amil',
  'Notre Dame Intermédica',
  'Hapvida',
  'Porto Seguro Saúde',
  'Prevent Senior',
  'Golden Cross',
  'Medial Saúde',
  'Outro'
] as const;
export type Operadora = typeof operadoras[number];

/**
 * Interface para dependentes da apólice
 */
export interface Dependente {
  nome: string;
  cpf?: string;
  dataNascimento?: Date;
  parentesco: string;
  inclusoEm?: Date;
}

/**
 * Interface principal da Apólice
 */
export interface Apolice {
  // Identificação
  numeroApolice: string;
  leadId?: Types.ObjectId;
  empresaNome: string;
  empresaCnpj?: string;
  
  // Plano
  operadora: string;
  tipoPlano: string;
  nomePlano?: string;
  coparticipacao?: boolean;
  
  // Datas importantes
  dataInicio: Date;
  dataVencimento: Date;
  dataRenovacao?: Date;
  
  // Valores
  valorMensal: number;
  valorTotal?: number;
  comissao?: number;
  percentualComissao?: number;
  
  // Pessoas
  titularNome: string;
  titularCpf?: string;
  titularDataNascimento?: Date;
  titularEmail?: string;
  titularTelefone?: string;
  quantidadeVidas: number;
  dependentes?: Dependente[];
  
  // Faixas etárias (quantidade de vidas por faixa)
  faixasEtarias?: {
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
  };
  
  // Status e controle
  status: ApoliceStatus;
  motivoCancelamento?: string;
  observacoes?: string;
  
  // Responsável
  vendedorId?: Types.ObjectId;
  
  // Anexos
  contratoUrl?: string;
  carteirinhasUrl?: string;
  
  // Alertas
  alertaVencimentoEnviado?: boolean;
  alertaRenovacaoEnviado?: boolean;
  diasParaVencimento?: number;
  
  // Audit
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
}

const dependenteSchema = new Schema<Dependente>({
  nome: { type: String, required: true },
  cpf: String,
  dataNascimento: Date,
  parentesco: { type: String, required: true },
  inclusoEm: Date
}, { _id: false });

const faixasEtariasSchema = new Schema({
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
}, { _id: false });

const apoliceSchema = new Schema<Apolice>({
  numeroApolice: { type: String, required: true, unique: true, index: true },
  leadId: { type: Schema.Types.ObjectId, ref: 'Lead', index: true },
  empresaNome: { type: String, required: true, index: true },
  empresaCnpj: { type: String, index: true },
  
  operadora: { type: String, required: true, index: true },
  tipoPlano: { type: String, required: true },
  nomePlano: String,
  coparticipacao: { type: Boolean, default: false },
  
  dataInicio: { type: Date, required: true },
  dataVencimento: { type: Date, required: true, index: true },
  dataRenovacao: Date,
  
  valorMensal: { type: Number, required: true },
  valorTotal: Number,
  comissao: Number,
  percentualComissao: Number,
  
  titularNome: { type: String, required: true },
  titularCpf: String,
  titularDataNascimento: Date,
  titularEmail: String,
  titularTelefone: String,
  quantidadeVidas: { type: Number, required: true, default: 1 },
  dependentes: [dependenteSchema],
  
  faixasEtarias: faixasEtariasSchema,
  
  status: { type: String, enum: apoliceStatuses, default: 'ativa', index: true },
  motivoCancelamento: String,
  observacoes: String,
  
  vendedorId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
  
  contratoUrl: String,
  carteirinhasUrl: String,
  
  alertaVencimentoEnviado: { type: Boolean, default: false },
  alertaRenovacaoEnviado: { type: Boolean, default: false },
  diasParaVencimento: Number,
  
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

// Índice composto para buscas comuns
apoliceSchema.index({ status: 1, dataVencimento: 1 });
apoliceSchema.index({ vendedorId: 1, status: 1 });
apoliceSchema.index({ operadora: 1, status: 1 });

// Virtual para calcular dias até vencimento
apoliceSchema.virtual('diasAteVencimento').get(function() {
  const hoje = new Date();
  const vencimento = new Date(this.dataVencimento);
  const diffTime = vencimento.getTime() - hoje.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

// Middleware pre-save para atualizar dias para vencimento e status
apoliceSchema.pre('save', function(next) {
  const hoje = new Date();
  const vencimento = new Date(this.dataVencimento);
  const diffTime = vencimento.getTime() - hoje.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  this.diasParaVencimento = diffDays;
  
  // Atualiza status automaticamente baseado na data
  if (this.status !== 'cancelada' && this.status !== 'suspensa') {
    if (diffDays < 0) {
      this.status = 'vencida';
    } else if (diffDays <= 30) {
      this.status = 'vencendo';
    }
  }
  
  next();
});

export const ApoliceModel = mongoose.model<Apolice>('Apolice', apoliceSchema);
