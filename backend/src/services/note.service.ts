import { Note } from '../models/Note.model.js';
import { Types } from 'mongoose';
import { ActivityService } from './activity.service.js';

export class NoteService {
  // Criar uma nota
  static async createNote(data: {
    leadId: string;
    conteudo: string;
    userId: string;
    userName: string;
    isPinned?: boolean;
  }) {
    try {
      const note = new Note({
        leadId: new Types.ObjectId(data.leadId),
        conteudo: data.conteudo,
        userId: new Types.ObjectId(data.userId),
        userName: data.userName,
        isPinned: data.isPinned || false
      });

      await note.save();

      // Criar atividade automática
      await ActivityService.createActivity({
        leadId: data.leadId,
        tipo: 'observacao_adicionada',
        descricao: `${data.userName} adicionou uma observação`,
        userId: data.userId,
        userName: data.userName
      });

      return note;
    } catch (error) {
      console.error('Erro ao criar nota:', error);
      throw error;
    }
  }

  // Buscar notas de um lead
  static async getLeadNotes(leadId: string) {
    try {
      const notes = await Note.find({ leadId: new Types.ObjectId(leadId) })
        .sort({ isPinned: -1, createdAt: -1 })
        .lean();

      return notes;
    } catch (error) {
      console.error('Erro ao buscar notas:', error);
      throw error;
    }
  }

  // Atualizar uma nota
  static async updateNote(noteId: string, data: {
    conteudo?: string;
    isPinned?: boolean;
    userId: string;
    userName: string;
  }) {
    try {
      const note = await Note.findById(noteId);
      
      if (!note) {
        throw new Error('Nota não encontrada');
      }

      if (data.conteudo !== undefined) {
        note.conteudo = data.conteudo;
      }
      
      if (data.isPinned !== undefined) {
        note.isPinned = data.isPinned;
      }

      await note.save();

      // Criar atividade automática
      await ActivityService.createActivity({
        leadId: note.leadId.toString(),
        tipo: 'observacao_atualizada',
        descricao: `${data.userName} atualizou uma observação`,
        userId: data.userId,
        userName: data.userName
      });

      return note;
    } catch (error) {
      console.error('Erro ao atualizar nota:', error);
      throw error;
    }
  }

  // Deletar uma nota
  static async deleteNote(noteId: string, userId: string, userName: string) {
    try {
      const note = await Note.findById(noteId);
      
      if (!note) {
        throw new Error('Nota não encontrada');
      }

      const leadId = note.leadId.toString();
      await note.deleteOne();

      // Criar atividade automática
      await ActivityService.createActivity({
        leadId,
        tipo: 'observacao_removida',
        descricao: `${userName} removeu uma observação`,
        userId,
        userName
      });

      return { success: true };
    } catch (error) {
      console.error('Erro ao deletar nota:', error);
      throw error;
    }
  }
}
