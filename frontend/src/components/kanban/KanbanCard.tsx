import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Lead } from "@/types/crm";
import { Card } from "@/components/ui/card"; 
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/use-auth";
import { Phone, Mail, Building, Users, MessageCircle, AlertCircle, Clock, Lock } from "lucide-react";

interface KanbanCardProps {
  lead: Lead;
  onLeadUpdate: (lead: Lead) => void;
  onLeadClick?: (lead: Lead) => void;
  isDragging?: boolean;
  isOverdue?: boolean;
}

export function KanbanCard({ lead, onLeadUpdate, onLeadClick, isDragging = false, isOverdue = false }: KanbanCardProps) {
  const { user } = useAuth();
  
  const currentUserId = user?.id || (user as any)?._id;
  const isVendedor = user?.role === 'vendedor';
  const isOwner = (lead.ownersIds || []).some(id => id === currentUserId);
  const canDrag = !isVendedor || isOwner; 

  const { attributes, listeners, setNodeRef, transform, transition, isDragging: isSortableDragging } = useSortable({
    id: lead.id,
    data: { type: 'lead', lead },
    disabled: !canDrag,
  });

  const dndStyle = {
    transform: CSS.Translate.toString(transform),
    transition,
  };

  const isBeingDragged = isSortableDragging || isDragging;

  const getOrigemColor = (origem: string) => {
    const colors: Record<string, string> = {
      'Instagram': 'bg-purple-100 text-purple-700 border-purple-200',
      'Indicação': 'bg-green-100 text-green-700 border-green-200',
      'Site': 'bg-blue-100 text-blue-700 border-blue-200',
      'Outros': 'bg-gray-100 text-gray-700 border-gray-200'
    };
    return colors[origem] || colors['Outros'];
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'Qualificado': 'bg-success text-success-foreground',
      'Incompleto': 'bg-warning text-warning-foreground',
      'Duplicado': 'bg-muted text-muted-foreground',
      'Sem interesse': 'bg-destructive text-destructive-foreground'
    };
    return colors[status] || colors['Incompleto'];
  };

  const dataUltima = lead.ultimaAtividade instanceof Date ? lead.ultimaAtividade : new Date(lead.ultimaAtividade);
  const diasSemAtividade = Math.floor((Date.now() - dataUltima.getTime()) / (1000 * 60 * 60 * 24));

  const ownersList = (lead.owners && lead.owners.length > 0) ? lead.owners : [{ id: 'legacy', nome: lead.responsavel || 'Vendedor', foto: null }];
  const MAX_DISPLAY = 3;
  const displayCount = ownersList.length > MAX_DISPLAY ? MAX_DISPLAY - 1 : MAX_DISPLAY;
  const visibleOwners = ownersList.slice(0, displayCount);
  const remainingCount = ownersList.length - displayCount;

  return (
    <Card
      ref={setNodeRef}
      style={dndStyle}
      {...attributes}
      {...(canDrag ? listeners : {})}
      onClick={() => { if (!isBeingDragged) onLeadClick?.(lead); }}
      className={`
        transition-all duration-200 border-l-[6px] relative overflow-hidden
        ${canDrag ? 'cursor-grab active:cursor-grabbing hover:shadow-md' : 'cursor-pointer'}
        ${isBeingDragged ? 'opacity-30 ring-2 ring-primary ring-offset-2 z-50 bg-background/80 pointer-events-none' : 'shadow-sm opacity-100'}
        ${!canDrag && isVendedor ? 'opacity-75' : ''}
        ${isOverdue ? '!bg-red-50 !border-red-500 !border-l-red-600' : 'bg-card border-l-primary'}
      `}
    >
      <div className="p-4 space-y-3">
        <div className="space-y-1">
          <div className="flex items-start justify-between">
            <h4 className={`font-medium text-sm line-clamp-1 ${isOverdue ? 'text-red-900 font-bold' : 'text-foreground'}`}>
              {lead.nome}
            </h4>
            <div className="flex items-center gap-1 ml-2 flex-shrink-0">
              {!canDrag && isVendedor && <Lock className="h-3 w-3 text-muted-foreground" />}
              {isOverdue && <AlertCircle className="h-4 w-4 text-red-600 animate-pulse" />}
            </div>
          </div>
          {lead.empresa && <p className="text-xs text-muted-foreground flex items-center gap-1"><Building className="h-3 w-3" />{lead.empresa}</p>}
        </div>

        <div className="flex flex-wrap gap-1">
          <Badge variant="outline" className={`text-xs ${getOrigemColor(lead.origem)}`}>{lead.origem}</Badge>
          <Badge variant="outline" className={`text-xs ${getStatusColor(lead.statusQualificacao || '')}`}>{lead.statusQualificacao}</Badge>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground"><Users className="h-3 w-3" /><span>{lead.quantidadeVidas} vida{lead.quantidadeVidas > 1 ? 's' : ''}</span></div>
          {lead.valorMedio && <div className="text-xs text-muted-foreground">Valor atual: {lead.valorMedio.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>}
        </div>

        <div className={`flex items-center justify-between pt-2 border-t ${isOverdue ? 'border-red-200' : 'border-border'}`}>
          <div className="flex gap-1">
            <Button size="sm" variant="ghost" className="h-6 w-6 p-0 hover:bg-background/80" onClick={(e) => { e.stopPropagation(); if (lead.celular) window.open(`tel:${lead.celular}`, '_self'); }}><Phone className="h-3 w-3" /></Button>
            <Button size="sm" variant="ghost" className="h-6 w-6 p-0 hover:bg-background/80" onClick={(e) => { e.stopPropagation(); if (lead.celular) window.open(`https://wa.me/55${lead.celular.replace(/\D/g, '')}`, '_blank'); }}><MessageCircle className="h-3 w-3" /></Button>
            <Button size="sm" variant="ghost" className="h-6 w-6 p-0 hover:bg-background/80" onClick={(e) => { e.stopPropagation(); if (lead.email) window.open(`mailto:${lead.email}`, '_self'); }}><Mail className="h-3 w-3" /></Button>
          </div>
          <div className="flex items-center gap-3">
            {diasSemAtividade > 0 && <div className="flex items-center gap-1 text-xs text-muted-foreground"><Clock className="h-3 w-3" /><span>{diasSemAtividade}d</span></div>}
            <div className="flex items-center -space-x-2">
              {visibleOwners.map((owner: any) => (
                <Avatar key={owner.id} className="h-6 w-6 border-2 border-background ring-0"><AvatarImage src={owner.foto || ""} alt={owner.nome} className="object-cover" /><AvatarFallback className="text-[9px] bg-primary text-primary-foreground font-bold">{(owner.nome || "U").substring(0, 2).toUpperCase()}</AvatarFallback></Avatar>
              ))}
              {ownersList.length > MAX_DISPLAY && <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-background bg-muted text-[9px] font-medium text-muted-foreground">+{ownersList.length - MAX_DISPLAY + 1}</div>}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}