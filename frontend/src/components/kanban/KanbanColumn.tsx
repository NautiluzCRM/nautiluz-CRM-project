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

// --- FUNÇÃO AUXILIAR LIMPA (Sem Logs) ---
const getDataDeReferencia = (lead: Lead): Date | null => {
  const anyLead = lead as any;
  
  // 1. Prioridade: Datas de Fase (enteredStageAt é o campeão aqui)
  const dataFase =  anyLead.enteredStageAt || 
                    anyLead.stageChangedAt || 
                    anyLead.entered_stage_at;
  if (dataFase) {
    return new Date(dataFase);
  }

  // 2. Fallback: Data de Criação
  if (lead.createdAt) {
    return new Date(lead.createdAt);
  }

  // 3. Fallback: ID (Para leads muito antigos sem createdAt)
  if (lead.id && /^[0-9a-fA-F]{24}$/.test(lead.id)) {
    try {
      const timestamp = parseInt(lead.id.substring(0, 8), 16) * 1000;
      return new Date(timestamp);
    } catch (e) {}
  }

  return null;
};

export function KanbanColumn({ coluna, leads = [], onLeadUpdate, onLeadClick }: KanbanColumnProps) {
  console.log(`[DEBUG COLUNA] ${coluna.nome} | SLA: ${coluna.sla} | Tipo: ${typeof coluna.sla}`);

  leads.forEach(lead => {
    if (lead.nome.includes("Nautiluz") || lead.nome.includes("Andréia")) {
      console.log(`🕵️‍♂️ ESPIÃO DO LEAD [${lead.nome}]:`, {
        enteredStageAt: (lead as any).enteredStageAt,
        stageChangedAt: (lead as any).stageChangedAt,
        createdAt: (lead as any).createdAt || (lead as any).dataCriacao
      });
    }
  });
  
  const { over } = useDndContext();

  const { setNodeRef, isOver } = useDroppable({
    id: coluna.id,
    data: { type: 'column', column: coluna },
  });

  const isActive = useMemo(() => {
    if (isOver) return true;
    if (!over) return false;
    return leads.some(lead => lead.id === over.id);
  }, [isOver, over, leads]);

  const slaHoras = Number(coluna.sla);
  const hasActiveSla = !isNaN(slaHoras) && slaHoras > 0;

  // Cálculo otimizado com useMemo
  const leadsVencidosCount = useMemo(() => {
    if (!hasActiveSla) return 0;
    return leads.filter(lead => {
      const dataRef = getDataDeReferencia(lead);
      if (!dataRef || isNaN(dataRef.getTime())) return false;
      
      const horasPassadas = (Date.now() - dataRef.getTime()) / (1000 * 60 * 60);
      return horasPassadas > slaHoras;
    }).length;
  }, [leads, hasActiveSla, slaHoras]);

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
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: coluna.cor }} />
            {coluna.nome}
          </h3>
          <Badge variant="secondary" className="text-xs">{leads.length}</Badge>
        </div>
        
        <div className="flex gap-2 flex-wrap">
          {hasActiveSla && leadsVencidosCount > 0 && (
            <Badge variant="destructive" className="text-xs flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {leadsVencidosCount} vencido{leadsVencidosCount > 1 ? 's' : ''}
            </Badge>
          )}
          {hasActiveSla ? (
            <Badge variant="outline" className="text-xs flex items-center gap-1">
              <Clock className="h-3 w-3" />
              SLA: {slaHoras}h
            </Badge>
          ) : (
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

      <div className="flex-1 p-4 space-y-3 overflow-y-scroll min-h-0 scrollbar-thin">
        <SortableContext items={leads.map(l => l.id)} strategy={verticalListSortingStrategy}>
          {leads.map((lead) => {
             let isVencido = false;
             
             if (hasActiveSla) {
                 const dataRef = getDataDeReferencia(lead);
                 
                 if (dataRef && !isNaN(dataRef.getTime())) {
                     const horasPassadas = (Date.now() - dataRef.getTime()) / (1000 * 60 * 60);
                     isVencido = horasPassadas > slaHoras;
                 }
             }

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