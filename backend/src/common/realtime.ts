import { Server } from 'socket.io';

let ioInstance: Server | null = null;

export function attachRealtimeHelpers(io: Server) {
  ioInstance = io;
}

export function emitKanbanUpdate(pipelineId: string, payload: unknown) {
  if (!ioInstance) return;
  ioInstance.to(`pipeline:${pipelineId}`).emit('kanban:updated', payload);
}
