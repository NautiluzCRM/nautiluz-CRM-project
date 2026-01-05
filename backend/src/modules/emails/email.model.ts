import mongoose, { Schema, Types } from 'mongoose';

/**
 * Status de envio do email
 */
export const emailStatuses = ['pendente', 'enviado', 'falhou', 'bounced'] as const;
export type EmailStatus = typeof emailStatuses[number];

/**
 * Tipos de email
 */
export const emailTypes = [
  'cotacao',
  'proposta',
  'contrato',
  'boas_vindas',
  'lembrete',
  'renovacao',
  'documentos',
  'marketing',
  'outro'
] as const;
export type EmailType = typeof emailTypes[number];

/**
 * Interface para anexos do email
 */
export interface EmailAttachment {
  filename: string;
  url: string;
  mimeType: string;
  size: number;
}

/**
 * Interface principal de Email
 */
export interface Email {
  // Destinatário
  to: string;
  toName?: string;
  cc?: string[];
  bcc?: string[];
  
  // Conteúdo
  subject: string;
  body: string;
  htmlBody?: string;
  
  // Anexos
  attachments?: EmailAttachment[];
  
  // Tipo e contexto
  type: EmailType;
  leadId?: Types.ObjectId;
  apoliceId?: Types.ObjectId;
  
  // Status
  status: EmailStatus;
  sentAt?: Date;
  errorMessage?: string;
  retryCount?: number;
  
  // Rastreamento
  messageId?: string;
  opened?: boolean;
  openedAt?: Date;
  clicked?: boolean;
  clickedAt?: Date;
  
  // Template (se usado)
  templateId?: string;
  templateData?: Record<string, any>;
  
  // Audit
  sentBy?: Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

const emailAttachmentSchema = new Schema<EmailAttachment>({
  filename: { type: String, required: true },
  url: { type: String, required: true },
  mimeType: { type: String, required: true },
  size: { type: Number, required: true }
}, { _id: false });

const emailSchema = new Schema<Email>({
  to: { type: String, required: true, index: true },
  toName: String,
  cc: [String],
  bcc: [String],
  
  subject: { type: String, required: true },
  body: { type: String, required: true },
  htmlBody: String,
  
  attachments: [emailAttachmentSchema],
  
  type: { type: String, enum: emailTypes, required: true, index: true },
  leadId: { type: Schema.Types.ObjectId, ref: 'Lead', index: true },
  apoliceId: { type: Schema.Types.ObjectId, ref: 'Apolice', index: true },
  
  status: { type: String, enum: emailStatuses, default: 'pendente', index: true },
  sentAt: Date,
  errorMessage: String,
  retryCount: { type: Number, default: 0 },
  
  messageId: String,
  opened: { type: Boolean, default: false },
  openedAt: Date,
  clicked: { type: Boolean, default: false },
  clickedAt: Date,
  
  templateId: String,
  templateData: Schema.Types.Mixed,
  
  sentBy: { type: Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

// Índices compostos
emailSchema.index({ status: 1, createdAt: -1 });
emailSchema.index({ leadId: 1, createdAt: -1 });
emailSchema.index({ sentBy: 1, createdAt: -1 });

export const EmailModel = mongoose.model<Email>('Email', emailSchema);
