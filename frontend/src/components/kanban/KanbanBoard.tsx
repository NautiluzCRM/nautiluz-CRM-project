import { useState, useRef, useMemo } from "react";
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
  closestCorners,
} from "@dnd-kit/core";
import { 
  SortableContext, 
  arrayMove, 
  verticalListSortingStrategy 
} from "@dnd-kit/sortable";
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

export function KanbanBoard({ colunas, leads: initialLeads, onLeadMove, onLeadUpdate, onLeadClick }: KanbanBoardProps) {
  // Estado local para animação fluida
  const [leads, setLeads] = useState<Lead[]>(initialLeads);
  
  // Sincroniza se o pai mandar leads novos
  useMemo(() => {
    setLeads(initialLeads);
  }, [initialLeads]);

  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeLead, setActiveLead] = useState<Lead | null>(null);
  
  // AQUI ESTÁ A DEFINIÇÃO QUE FALTAVA:
  const [activeType, setActiveType] = useState<'lead' | 'column' | null>(null);

  const pipelineContainerRef = useRef<HTMLDivElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 3,
      },
    })
  );

  // --- LIMITADOR DE TELA (MANUAL) ---
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
    const lead = leads.find(l => l.id === active.id);
    
    if (active.data.current?.type === 'lead') {
      setActiveType('lead');
      if (lead) setActiveLead(lead);
    } else {
      setActiveType('column');
    }
  };

  // --- ANIMAÇÃO FLUIDA (DragOver) ---
  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const isActiveALead = active.data.current?.type === 'lead';
    const isOverALead = over.data.current?.type === 'lead';
    const isOverAColumn = over.data.current?.type === 'column';

    if (!isActiveALead) return;

    const activeItem = leads.find(l => l.id === activeId);
    if (!activeItem) return;

    // Cenário 1: Sobre outro Lead
    if (isActiveALead && isOverALead && activeItem && activeId !== overId) {
      const overItem = leads.find(l => l.id === overId);
      if (!overItem) return;

      if (activeItem.colunaAtual !== overItem.colunaAtual) {
        setLeads((items) => {
          const activeIndex = items.findIndex(l => l.id === activeId);
          const overIndex = items.findIndex(l => l.id === overId);
          
          const newItems = [...items];
          newItems[activeIndex] = { ...newItems[activeIndex], colunaAtual: overItem.colunaAtual };
          
          return arrayMove(newItems, activeIndex, overIndex);
        });
      } else {
        setLeads((items) => {
            const activeIndex = items.findIndex(l => l.id === activeId);
            const overIndex = items.findIndex(l => l.id === overId);
            return arrayMove(items, activeIndex, overIndex);
        });
      }
    }

    // Cenário 2: Sobre Coluna Vazia
    if (isActiveALead && isOverAColumn && activeItem) {
      const overColumnId = overId;
      if (activeItem.colunaAtual !== overColumnId) {
        setLeads((items) => {
          const activeIndex = items.findIndex(l => l.id === activeId);
          const newItems = [...items];
          newItems[activeIndex] = { ...newItems[activeIndex], colunaAtual: overColumnId };
          return arrayMove(newItems, activeIndex, activeIndex);
        });
      }
    }
  };

  // --- FINALIZAÇÃO (DragEnd com Diagnóstico) ---
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    const activeId = active.id as string;
    
    // Recupera o lead do estado ATUALIZADO (que o DragOver já mexeu)
    const activeItem = leads.find(l => l.id === activeId);

    // Limpa estado visual
    setActiveId(null);
    setActiveLead(null);
    setActiveType(null);

    if (!activeItem || !over) return;

    // Coluna final (já atualizada pelo DragOver)
    const targetColumnId = activeItem.colunaAtual;
    
    // Filtra leads dessa coluna NA ORDEM VISUAL ATUAL
    const leadsInColumn = leads.filter(l => l.colunaAtual === targetColumnId);
    const newIndex = leadsInColumn.findIndex(l => l.id === activeId);

    // Vizinhos
    const beforeLead = leadsInColumn[newIndex - 1];
    const afterLead = leadsInColumn[newIndex + 1];

    // === DIAGNÓSTICO ===
    console.group("Diagnóstico Drag & Drop");
    console.log("Card:", activeItem.nome);
    console.log("Coluna Final:", targetColumnId);
    console.log("Vizinho ACIMA:", beforeLead?.nome || "TOPO");
    console.log("Vizinho ABAIXO:", afterLead?.nome || "FUNDO");
    console.groupEnd();
    // ===================

    onLeadMove(activeId, targetColumnId, beforeLead?.id, afterLead?.id);
  };

  const getLeadsByColumn = (columnId: string) => {
    return leads.filter(lead => lead.colunaAtual === columnId);
  };

  return (
    <div 
      ref={pipelineContainerRef} 
      className="h-full flex p-3 sm:p-6 bg-background overflow-x-auto relative"
    >
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        modifiers={[restrictToPipelineArea]}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex h-full gap-3 sm:gap-6 min-w-fit">
          {colunas.map((coluna) => (
            <SortableContext
              key={coluna.id}
              items={getLeadsByColumn(coluna.id).map(l => l.id)}
              strategy={verticalListSortingStrategy}
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
          {activeLead ? (
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