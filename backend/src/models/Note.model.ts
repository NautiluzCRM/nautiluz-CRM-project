import mongoose, { Schema, Document } from 'mongoose';

export interface INote extends Document {
  leadId: Schema.Types.ObjectId;
  conteudo: string;
  userId: Schema.Types.ObjectId;
  userName: string;
  isPinned: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const noteSchema = new Schema<INote>(
  {
    leadId: { type: Schema.Types.ObjectId, ref: 'Lead', required: true, index: true },
    conteudo: { type: String, required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    userName: { type: String, required: true },
    isPinned: { type: Boolean, default: false }
  },
  {
    timestamps: true
  }
);

// Índice para buscar notas de um lead
noteSchema.index({ leadId: 1, createdAt: -1 });

// Evita redefinição do modelo
export const Note = mongoose.models.Note || mongoose.model<INote>('Note', noteSchema);
