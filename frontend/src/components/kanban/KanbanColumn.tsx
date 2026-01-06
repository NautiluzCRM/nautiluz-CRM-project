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
        flex flex-col w-64 sm:w-72 md:w-80 h-full rounded-lg shrink-0
        ${isOver ? 'bg-kanban-preview border-2 border-primary border-dashed' : 'bg-kanban-column'}
        transition-colors duration-200
      `}
    >
      {/* Header da Coluna */}
      <div className="p-3 sm:p-4 border-b border-border">
        <div className="flex items-center justify-between mb-1.5 sm:mb-2">
          <h3 className="font-semibold text-foreground flex items-center gap-1.5 sm:gap-2 text-sm sm:text-base">
            <div 
              className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full shrink-0" 
              style={{ backgroundColor: coluna.cor }}
            />
            <span className="truncate">{coluna.nome}</span>
          </h3>
          <Badge variant="secondary" className="text-[10px] sm:text-xs shrink-0 ml-2">
            {leads.length}
          </Badge>
        </div>
        
        {/* Indicadores de SLA e WIP */}
        <div className="flex flex-wrap gap-1 sm:gap-2">
          {/* Badge de Vencidos (Prioridade Alta) */}
          {(coluna.sla || 0) > 0 && leadsVencidos.length > 0 && (
            <Badge variant="destructive" className="text-[10px] sm:text-xs flex items-center gap-0.5 sm:gap-1 px-1.5">
              <AlertCircle className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
              {leadsVencidos.length} vencido{leadsVencidos.length > 1 ? 's' : ''}
            </Badge>
          )}
          
          {/* Badge de SLA (Correção do bug do 0) */}
          {(coluna.sla || 0) > 0 ? (
            <Badge variant="outline" className="text-[10px] sm:text-xs flex items-center gap-0.5 sm:gap-1 px-1.5">
              <Clock className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
              SLA: {coluna.sla}h
            </Badge>
          ) : (
            <Badge variant="secondary" className="text-[10px] sm:text-xs flex items-center gap-0.5 sm:gap-1 text-muted-foreground bg-muted/50 font-normal px-1.5">
              <CalendarClock className="h-2.5 w-2.5 sm:h-3 sm:w-3 opacity-70" />
              Sem prazo
            </Badge>
          )}
          
          {isWipExceeded && (
            <Badge variant="outline" className="text-[10px] sm:text-xs border-orange-500 text-orange-600 bg-orange-50 px-1.5">
              WIP ({leads.length}/{coluna.wipLimit})
            </Badge>
          )}
        </div>
      </div>

      {/* Lista de Cards */}
      <div className="flex-1 p-2 sm:p-4 space-y-2 sm:space-y-3 overflow-y-auto min-h-0 scrollbar-thin">
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
          <div className="text-center py-6 sm:py-8 text-muted-foreground opacity-50">
            <p className="text-xs sm:text-sm">Vazio</p>
          </div>
        )}
      </div>
    </div>
  );
}