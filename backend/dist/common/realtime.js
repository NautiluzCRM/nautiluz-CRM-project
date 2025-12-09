let ioInstance = null;
export function attachRealtimeHelpers(io) {
    ioInstance = io;
}
export function emitKanbanUpdate(pipelineId, payload) {
    if (!ioInstance)
        return;
    ioInstance.to(`pipeline:${pipelineId}`).emit('kanban:updated', payload);
}
