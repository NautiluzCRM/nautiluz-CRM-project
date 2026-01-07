import { Request, Response } from 'express';
import { NoteService } from '../services/note.service.js';

export class NoteController {
  // GET /api/leads/:leadId/notes
  static async getLeadNotes(req: Request, res: Response) {
    try {
      const { leadId } = req.params;

      const notes = await NoteService.getLeadNotes(leadId);

      res.json(notes);
    } catch (error: any) {
      console.error('Erro ao buscar notas:', error);
      res.status(500).json({ error: error.message || 'Erro ao buscar notas' });
    }
  }

  // POST /api/leads/:leadId/notes
  static async createNote(req: Request, res: Response) {
    try {
      const { leadId } = req.params;
      const { conteudo, isPinned } = req.body;
      const user = (req as any).user;

      if (!conteudo || !conteudo.trim()) {
        return res.status(400).json({ error: 'Conteúdo da nota é obrigatório' });
      }

      const note = await NoteService.createNote({
        leadId,
        conteudo: conteudo.trim(),
        userId: user.id || user._id,
        userName: user.name || user.nome,
        isPinned
      });

      res.status(201).json(note);
    } catch (error: any) {
      console.error('Erro ao criar nota:', error);
      res.status(500).json({ error: error.message || 'Erro ao criar nota' });
    }
  }

  // PUT /api/notes/:noteId
  static async updateNote(req: Request, res: Response) {
    try {
      const { noteId } = req.params;
      const { conteudo, isPinned } = req.body;
      const user = (req as any).user;

      const note = await NoteService.updateNote(noteId, {
        conteudo,
        isPinned,
        userId: user.id || user._id,
        userName: user.name || user.nome
      });

      res.json(note);
    } catch (error: any) {
      console.error('Erro ao atualizar nota:', error);
      res.status(500).json({ error: error.message || 'Erro ao atualizar nota' });
    }
  }

  // DELETE /api/notes/:noteId
  static async deleteNote(req: Request, res: Response) {
    try {
      const { noteId } = req.params;
      const user = (req as any).user;

      await NoteService.deleteNote(
        noteId, 
        user.id || user._id, 
        user.name || user.nome
      );

      res.json({ success: true, message: 'Nota removida com sucesso' });
    } catch (error: any) {
      console.error('Erro ao deletar nota:', error);
      res.status(500).json({ error: error.message || 'Erro ao deletar nota' });
    }
  }
}
