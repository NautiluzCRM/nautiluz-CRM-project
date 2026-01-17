import { useDroppable, useDndContext } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { KanbanCard } from "./KanbanCard";
import { Lead, Coluna } from "@/types/crm";
import { Badge } from "@/components/ui/badge";
import { Clock, AlertCircle } from "lucide-react";
import { useMemo } from "react";

interface KanbanColumnProps {
  coluna: Coluna;
  leads: Lead[];
  onLeadUpdate: (lead: Lead) => void;
  onLeadClick?: (lead: Lead) => void;
}

export function KanbanColumn({ coluna, leads, onLeadUpdate, onLeadClick }: KanbanColumnProps) {
  const { over } = useDndContext();

  const { setNodeRef, isOver } = useDroppable({
    id: coluna.id,
    data: {
      type: 'column',
      column: coluna,
    },
  });

  const isActive = useMemo(() => {
    if (isOver) return true;
    if (!over) return false;
    return leads.some(lead => lead.id === over.id);
  }, [isOver, over, leads]);

  // SLA Ativo: Apenas se for número E maior que zero
  const hasActiveSla = typeof coluna.sla === 'number' && coluna.sla > 0;

  const leadsVencidos = leads.filter(lead => {
    // Se não tem SLA ativo, não há vencimento
    if (!hasActiveSla) return false;
    
    const dataUltima = lead.ultimaAtividade instanceof Date ? lead.ultimaAtividade : new Date(lead.ultimaAtividade);
    const horasPassadas = (Date.now() - dataUltima.getTime()) / (1000 * 60 * 60);
    
    return horasPassadas > (coluna.sla || 0);
  });

  const isWipExceeded = coluna.wipLimit && leads.length > coluna.wipLimit;

  return (
    <div
      ref={setNodeRef}
      className={`
        flex flex-col w-72 sm:w-80 rounded-lg shrink-0
        ${isActive ? 'bg-muted/50 border-2 border-primary/20 border-dashed' : 'bg-secondary/30 border-2 border-transparent'}
        transition-colors duration-200
      `}
      style={{ height: '100%', maxHeight: '100%' }}
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
        
        {/* Indicadores */}
        <div className="flex gap-2">
          {/* Badge Vermelha: Apenas se SLA ativo E tiver vencidos */}
          {hasActiveSla && leadsVencidos.length > 0 && (
            <Badge variant="destructive" className="text-xs flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {leadsVencidos.length} vencido{leadsVencidos.length > 1 ? 's' : ''}
            </Badge>
          )}
          
          {/* Badge de Tempo SLA (ou Sem SLA) */}
          {hasActiveSla ? (
            <Badge variant="outline" className="text-xs flex items-center gap-1">
              <Clock className="h-3 w-3" />
              SLA: {coluna.sla}h
            </Badge>
          ) : (
            // Badge para quando é zero ou undefined
            <Badge variant="outline" className="text-xs flex items-center gap-1 text-muted-foreground bg-muted/50 border-dashed">
              <Clock className="h-3 w-3 opacity-50" />
              Sem SLA
            </Badge>
          )}
          
          {isWipExceeded && (
            <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-800 hover:bg-yellow-100 border-yellow-200">
              WIP Excedido ({leads.length}/{coluna.wipLimit})
            </Badge>
          )}
        </div>
      </div>

      {/* Lista de Cards */}
      <div className="flex-1 p-4 space-y-3 overflow-y-scroll min-h-0 scrollbar-thin">
        <SortableContext items={leads.map(l => l.id)} strategy={verticalListSortingStrategy}>
          {leads.map((lead) => {
             const dataUltima = lead.ultimaAtividade instanceof Date ? lead.ultimaAtividade : new Date(lead.ultimaAtividade);
             
             // Card só fica vermelho se tiver SLA ativo (>0)
             const isVencido = hasActiveSla && 
               (Date.now() - dataUltima.getTime()) / (1000 * 60 * 60) > (coluna.sla || 0);

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
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm">Nenhum lead nesta etapa</p>
          </div>
        )}
      </div>
    </div>
  );
}