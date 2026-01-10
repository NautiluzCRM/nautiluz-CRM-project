import { useEffect, useState } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCorners,
  defaultDropAnimationSideEffects,
  DropAnimation,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { KanbanColumn } from "./KanbanColumn";
import { KanbanCard } from "./KanbanCard";
import { Lead, Coluna } from "@/types/crm";
import { createPortal } from "react-dom";

interface KanbanBoardProps {
  colunas: Coluna[];
  leads: Lead[];
  onLeadMove: (leadId: string, novaColuna: string, beforeId?: string, afterId?: string) => void;
  onLeadUpdate: (lead: Lead) => void;
  onLeadClick?: (lead: Lead) => void;
}

export function KanbanBoard({ colunas, leads, onLeadMove, onLeadUpdate, onLeadClick }: KanbanBoardProps) {
  const [tasks, setTasks] = useState<{ [key: string]: Lead[] }>({});
  const [activeLead, setActiveLead] = useState<Lead | null>(null);

  // Sincroniza props com state local
  useEffect(() => {
    const newTasks: { [key: string]: Lead[] } = {};
    colunas.forEach(col => { newTasks[col.id] = []; });
    leads.forEach(lead => {
      if (newTasks[lead.colunaAtual]) {
        newTasks[lead.colunaAtual].push(lead);
      }
    });
    setTasks(newTasks);
  }, [leads, colunas]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const findContainer = (id: string): string | undefined => {
    if (id in tasks) return id;
    return Object.keys(tasks).find((key) => tasks[key].find((l) => l.id === id));
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const leadId = active.id as string;
    const container = findContainer(leadId);
    if (container) {
      const lead = tasks[container].find(l => l.id === leadId);
      if (lead) setActiveLead(lead);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    const overId = over?.id;
    if (!overId || active.id === overId) return;

    const activeContainer = findContainer(active.id as string);
    const overContainer = findContainer(overId as string);

    if (!activeContainer || !overContainer || activeContainer === overContainer) return;

    setTasks((prev) => {
      const activeItems = prev[activeContainer];
      const overItems = prev[overContainer];
      const activeIndex = activeItems.findIndex((i) => i.id === active.id);
      const overIndex = overItems.findIndex((i) => i.id === overId);

      let newIndex;
      if (overId in prev) {
        newIndex = overItems.length + 1;
      } else {
        const isBelowOverItem = over && active.rect.current.translated &&
          active.rect.current.translated.top > over.rect.top + over.rect.height;
        const modifier = isBelowOverItem ? 1 : 0;
        newIndex = overIndex >= 0 ? overIndex + modifier : overItems.length + 1;
      }

      return {
        ...prev,
        [activeContainer]: [...prev[activeContainer].filter((item) => item.id !== active.id)],
        [overContainer]: [
          ...prev[overContainer].slice(0, newIndex),
          activeItems[activeIndex],
          ...prev[overContainer].slice(newIndex, prev[overContainer].length),
        ],
      };
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    const activeId = active.id as string;
    const overId = over?.id as string;

    const activeContainer = findContainer(activeId);
    const overContainer = findContainer(overId);

    if (activeContainer && overContainer && activeLead) {
      const activeIndex = tasks[activeContainer].findIndex((i) => i.id === activeId);
      const overIndex = tasks[overContainer].findIndex((i) => i.id === overId);

      if (activeContainer === overContainer) {
        if (activeIndex !== overIndex) {
          const newOrder = arrayMove(tasks[activeContainer], activeIndex, overIndex);
          setTasks((prev) => ({ ...prev, [activeContainer]: newOrder }));
        }
      }

      const destList = activeContainer === overContainer
        ? arrayMove(tasks[activeContainer], activeIndex, overIndex)
        : tasks[overContainer];
      
      const movedItem = destList.find(l => l.id === activeId);
      if (movedItem) {
        const finalIndex = destList.indexOf(movedItem);
        const beforeId = finalIndex > 0 ? destList[finalIndex - 1].id : undefined;
        const afterId = finalIndex < destList.length - 1 ? destList[finalIndex + 1].id : undefined;
        onLeadMove(activeId, overContainer, beforeId, afterId);
      }
    }
    setActiveLead(null);
  };

  const dropAnimation: DropAnimation = {
    sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: "0.5" } } }),
  };

  return (
    // Visual Original do Container
    <div className="h-full w-full flex p-3 sm:p-6 bg-background overflow-x-auto overflow-y-hidden">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex h-full gap-3 sm:gap-6 min-w-fit">
          {colunas.map((coluna) => (
            <KanbanColumn
              key={coluna.id}
              coluna={coluna}
              leads={tasks[coluna.id] || []}
              onLeadUpdate={onLeadUpdate}
              onLeadClick={onLeadClick}
            />
          ))}
        </div>

        {createPortal(
          <DragOverlay dropAnimation={dropAnimation}>
            {activeLead ? (
              <KanbanCard
                lead={activeLead}
                onLeadUpdate={onLeadUpdate}
                isDragging
              />
            ) : null}
          </DragOverlay>,
          document.body
        )}
      </DndContext>
    </div>
  );
}