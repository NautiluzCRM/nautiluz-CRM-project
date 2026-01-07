import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SortableStageRowProps {
    id: string;
    children: React.ReactNode;
}

export function SortableStageRow({ id, children }: SortableStageRowProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 10 : 1,
        position: 'relative' as 'relative',
    };

    return (
        <div ref={setNodeRef} style={style} className="flex items-center gap-2 mb-4 bg-background rounded-lg">
            <div className="flex-1 flex items-center gap-1 p-2 border border-border rounded-lg shadow-sm">
                <Button
                    variant="ghost"
                    size="icon"
                    className="cursor-grab touch-none text-muted-foreground hover:text-foreground"
                    {...attributes}
                    {...listeners}
                >
                    <GripVertical className="h-4 w-4" />
                </Button>

                {children}
            </div>
        </div>
    );
}