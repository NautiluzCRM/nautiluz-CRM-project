import mongoose, { Schema, Types } from 'mongoose';

export interface Activity {
  leadId: Types.ObjectId;
  tipo: 'lead_criado' | 'lead_atualizado' | 'lead_movido' | 'observacao_adicionada' | 'observacao_atualizada' | 'observacao_removida' | 'responsavel_alterado' | 'status_alterado' | 'email_enviado' | 'ligacao_realizada' | 'whatsapp_enviado';
  descricao: string;
  userId: Types.ObjectId;
  userName: string;
  metadata?: {
    from?: string;
    to?: string;
    campo?: string;
    valorAnterior?: any;
    valorNovo?: any;
  };
  createdAt?: Date;
  updatedAt?: Date;
}

const activitySchema = new Schema<Activity>({
  leadId: { type: Schema.Types.ObjectId, ref: 'Lead', required: true, index: true },
  tipo: { 
    type: String, 
    required: true,
    enum: ['lead_criado', 'lead_atualizado', 'lead_movido', 'observacao_adicionada', 'observacao_atualizada', 'observacao_removida', 'responsavel_alterado', 'status_alterado', 'email_enviado', 'ligacao_realizada', 'whatsapp_enviado']
  },
  descricao: { type: String, required: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  userName: { type: String, required: true },
  metadata: {
    from: String,
    to: String,
    campo: String,
    valorAnterior: Schema.Types.Mixed,
    valorNovo: Schema.Types.Mixed
  }
}, { timestamps: true });

// Índice para buscar atividades de um lead rapidamente
activitySchema.index({ leadId: 1, createdAt: -1 });

// Evita redefinição do modelo
export const ActivityModel = mongoose.models.Activity || mongoose.model<Activity>('Activity', activitySchema);
