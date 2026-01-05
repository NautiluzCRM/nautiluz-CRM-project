import mongoose, { Schema, Types } from 'mongoose';

/**
 * Tipos de alerta
 */
export const alertTypes = [
  'apolice_vencendo',
  'apolice_vencida',
  'lead_sem_contato',
  'lead_proximo_contato',
  'meta_nao_atingida',
  'sistema',
  'lembrete',
  'tarefa'
] as const;
export type AlertType = typeof alertTypes[number];

/**
 * Prioridades de alerta
 */
export const alertPriorities = ['baixa', 'media', 'alta', 'urgente'] as const;
export type AlertPriority = typeof alertPriorities[number];

/**
 * Status do alerta
 */
export const alertStatuses = ['ativo', 'lido', 'resolvido', 'ignorado'] as const;
export type AlertStatus = typeof alertStatuses[number];

/**
 * Interface principal de Alerta
 */
export interface Alert {
  // Tipo e conteúdo
  type: AlertType;
  title: string;
  message: string;
  priority: AlertPriority;
  
  // Contexto
  userId: Types.ObjectId; // Usuário que deve ver o alerta
  leadId?: Types.ObjectId;
  apoliceId?: Types.ObjectId;
  
  // Status
  status: AlertStatus;
  readAt?: Date;
  resolvedAt?: Date;
  
  // Ação sugerida
  actionUrl?: string;
  actionLabel?: string;
  
  // Agendamento
  scheduledFor?: Date;
  expiresAt?: Date;
  
  // Metadata
  metadata?: Record<string, any>;
  
  // Audit
  createdBy?: Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

const alertSchema = new Schema<Alert>({
  type: { type: String, enum: alertTypes, required: true, index: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  priority: { type: String, enum: alertPriorities, default: 'media', index: true },
  
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  leadId: { type: Schema.Types.ObjectId, ref: 'Lead', index: true },
  apoliceId: { type: Schema.Types.ObjectId, ref: 'Apolice', index: true },
  
  status: { type: String, enum: alertStatuses, default: 'ativo', index: true },
  readAt: Date,
  resolvedAt: Date,
  
  actionUrl: String,
  actionLabel: String,
  
  scheduledFor: Date,
  expiresAt: Date,
  
  metadata: Schema.Types.Mixed,
  
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

// Índices compostos
alertSchema.index({ userId: 1, status: 1, createdAt: -1 });
alertSchema.index({ type: 1, status: 1 });
alertSchema.index({ scheduledFor: 1, status: 1 });

export const AlertModel = mongoose.model<Alert>('Alert', alertSchema);
