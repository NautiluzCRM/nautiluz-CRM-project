import { useState, useRef } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  Modifier,
} from "@dnd-kit/core";
import { SortableContext } from "@dnd-kit/sortable";
import { KanbanColumn } from "./KanbanColumn";
import { KanbanCard } from "./KanbanCard";
import { Lead, Coluna } from "@/types/crm";

interface KanbanBoardProps {
  colunas: Coluna[];
  leads: Lead[];
  onLeadMove: (leadId: string, novaColuna: string, beforeId?: string, afterId?: string) => void;
  onLeadUpdate: (lead: Lead) => void;
  onLeadClick?: (lead: Lead) => void;
}

export function KanbanBoard({ colunas, leads, onLeadMove, onLeadUpdate, onLeadClick }: KanbanBoardProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeType, setActiveType] = useState<'lead' | 'column' | null>(null);
  
  const pipelineContainerRef = useRef<HTMLDivElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 3,
      },
    })
  );

  const restrictToPipelineArea: Modifier = ({ transform, draggingNodeRect }) => {
    if (!pipelineContainerRef.current || !draggingNodeRect) {
      return transform;
    }

    const containerRect = pipelineContainerRef.current.getBoundingClientRect();

    const minX = containerRect.left - draggingNodeRect.left;
    const maxX = containerRect.right - draggingNodeRect.right;
    
    const minY = containerRect.top - draggingNodeRect.top;
    const maxY = containerRect.bottom - draggingNodeRect.bottom;

    return {
      ...transform,
      x: Math.max(minX, Math.min(transform.x, maxX)),
      y: Math.max(minY, Math.min(transform.y, maxY)),
    };
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id as string);
    
    if (active.data.current?.type === 'lead') {
      setActiveType('lead');
    } else {
      setActiveType('column');
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) {
      setActiveId(null);
      setActiveType(null);
      return;
    }

    if (activeType === 'lead') {
      const leadId = active.id as string;
      const overType = over.data.current?.type;
      
      if (overType === 'column') {
        const newColumnId = over.id as string;
        onLeadMove(leadId, newColumnId);
      } else if (overType === 'lead') {
        const overLead = leads.find(l => l.id === over.id);
        if (overLead) {
          onLeadMove(leadId, overLead.colunaAtual);
        }
      }
    }

    setActiveId(null);
    setActiveType(null);
  };

  const handleDragOver = (event: DragOverEvent) => {
    // Handle drag over events if needed for better UX
  };

  const getLeadsByColumn = (columnId: string) => {
    return leads.filter(lead => lead.colunaAtual === columnId);
  };

  const activeLead = activeId ? leads.find(l => l.id === activeId) : null;

  return (
    // A Ref vai aqui no container principal
    <div 
      ref={pipelineContainerRef} 
      className="h-full flex p-3 sm:p-6 bg-background overflow-x-auto relative"
    >
      <DndContext
        sensors={sensors}
        modifiers={[restrictToPipelineArea]}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragOver={handleDragOver}
      >
        <div className="flex h-full gap-3 sm:gap-6 min-w-fit">
          {colunas.map((coluna) => (
            <SortableContext
              key={coluna.id}
              items={getLeadsByColumn(coluna.id).map(l => l.id)}
            >
              <KanbanColumn
                coluna={coluna}
                leads={getLeadsByColumn(coluna.id)}
                onLeadUpdate={onLeadUpdate}
                onLeadClick={onLeadClick}
              />
            </SortableContext>
          ))}
        </div>

        <DragOverlay>
          {activeType === 'lead' && activeLead ? (
            <KanbanCard 
              lead={activeLead} 
              onLeadUpdate={onLeadUpdate}
              isDragging 
            />
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}