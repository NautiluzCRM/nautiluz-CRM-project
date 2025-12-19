import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { KanbanCard } from "./KanbanCard";
import { Lead, Coluna } from "@/types/crm";
import { Badge } from "@/components/ui/badge";
import { Clock, AlertCircle, CalendarClock } from "lucide-react";

interface KanbanColumnProps {
  coluna: Coluna;
  leads: Lead[];
  onLeadUpdate: (lead: Lead) => void;
  onLeadClick?: (lead: Lead) => void;
}

export function KanbanColumn({ coluna, leads, onLeadUpdate, onLeadClick }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: coluna.id,
    data: {
      type: 'column',
      column: coluna,
    },
  });

  // Calcula leads vencidos apenas se houver SLA definido (> 0)
  const leadsVencidos = leads.filter(lead => {
    if (!coluna.sla || coluna.sla <= 0) return false;
    const horasPassadas = (Date.now() - new Date(lead.ultimaAtividade).getTime()) / (1000 * 60 * 60);
    return horasPassadas > coluna.sla;
  });

  const isWipExceeded = coluna.wipLimit && leads.length > coluna.wipLimit;

  return (
    <div
      ref={setNodeRef}
      className={`
        flex flex-col w-72 sm:w-80 h-full rounded-lg
        ${isOver ? 'bg-kanban-preview border-2 border-primary border-dashed' : 'bg-kanban-column'}
        transition-colors duration-200
      `}
    >
      {/* Header da Coluna */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: coluna.cor }}
            />
            {coluna.nome}
          </h3>
          <Badge variant="secondary" className="text-xs">
            {leads.length}
          </Badge>
        </div>
        
        {/* Indicadores de SLA e WIP */}
        <div className="flex flex-wrap gap-2">
          {/* Badge de Vencidos (Prioridade Alta) */}
          {(coluna.sla || 0) > 0 && leadsVencidos.length > 0 && (
            <Badge variant="destructive" className="text-xs flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {leadsVencidos.length} vencido{leadsVencidos.length > 1 ? 's' : ''}
            </Badge>
          )}
          
          {/* Badge de SLA (Correção do bug do 0) */}
          {(coluna.sla || 0) > 0 ? (
            <Badge variant="outline" className="text-xs flex items-center gap-1">
              <Clock className="h-3 w-3" />
              SLA: {coluna.sla}h
            </Badge>
          ) : (
            <Badge variant="secondary" className="text-xs flex items-center gap-1 text-muted-foreground bg-muted/50 font-normal">
              <CalendarClock className="h-3 w-3 opacity-70" />
              Sem prazo
            </Badge>
          )}
          
          {isWipExceeded && (
            <Badge variant="outline" className="text-xs border-orange-500 text-orange-600 bg-orange-50">
              Limite WIP ({leads.length}/{coluna.wipLimit})
            </Badge>
          )}
        </div>
      </div>

      {/* Lista de Cards */}
      <div className="flex-1 p-4 space-y-3 overflow-y-auto min-h-0">
        <SortableContext items={leads.map(l => l.id)} strategy={verticalListSortingStrategy}>
          {leads.map((lead) => {
            const isVencido = (coluna.sla || 0) > 0 && 
              (Date.now() - new Date(lead.ultimaAtividade).getTime()) / (1000 * 60 * 60) > (coluna.sla || 0);
            
            return (
              <KanbanCard
                key={lead.id}
                lead={lead}
                onLeadUpdate={onLeadUpdate}
                onLeadClick={onLeadClick}
                isOverdue={isVencido}
              />
            );
          })}
        </SortableContext>
        
        {leads.length === 0 && (
          <div className="text-center py-8 text-muted-foreground opacity-50">
            <p className="text-sm">Vazio</p>
          </div>
        )}
      </div>
    </div>
  );
}