import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Lead } from "@/types/crm";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/use-auth";
import { 
  Phone, 
  Mail, 
  Building, 
  Users, 
  Calendar,
  MessageCircle,
  AlertCircle,
  Clock,
  Lock
} from "lucide-react";

interface KanbanCardProps {
  lead: Lead;
  onLeadUpdate: (lead: Lead) => void;
  onLeadClick?: (lead: Lead) => void;
  isDragging?: boolean;
  isOverdue?: boolean;
}

export function KanbanCard({ lead, onLeadUpdate, onLeadClick, isDragging = false, isOverdue = false }: KanbanCardProps) {
  const { user } = useAuth();
  
  // Verifica se o usuário pode arrastar o card
  const currentUserId = user?.id || (user as any)?._id;
  const isVendedor = user?.role === 'vendedor';
  const isOwner = (lead.ownersIds || []).some(id => id === currentUserId);
  const canDrag = !isVendedor || isOwner; // Admin e outros perfis podem arrastar tudo

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({
    id: lead.id,
    data: {
      type: 'lead',
      lead,
    },
    disabled: !canDrag, // Desabilita o drag se não pode arrastar
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const getOrigemColor = (origem: string) => {
    const colors = {
      'Instagram': 'bg-purple-100 text-purple-700 border-purple-200',
      'Indicação': 'bg-green-100 text-green-700 border-green-200',
      'Site': 'bg-blue-100 text-blue-700 border-blue-200',
      'Outros': 'bg-gray-100 text-gray-700 border-gray-200'
    };
    return colors[origem as keyof typeof colors] || colors['Outros'];
  };

  const getStatusColor = (status: string) => {
    const colors = {
      'Qualificado': 'bg-success text-success-foreground',
      'Incompleto': 'bg-warning text-warning-foreground',
      'Duplicado': 'bg-muted text-muted-foreground',
      'Sem interesse': 'bg-destructive text-destructive-foreground'
    };
    return colors[status as keyof typeof colors] || colors['Incompleto'];
  };

  const diasSemAtividade = Math.floor(
    (Date.now() - lead.ultimaAtividade.getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...(canDrag ? listeners : {})}
      onClick={() => onLeadClick?.(lead)}
      className={`
        ${canDrag ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'} 
        shadow-kanban-card hover:shadow-lg
        transition-all duration-200 border-l-4 border-l-primary
        ${isDragging ? 'opacity-50 rotate-2 scale-105' : ''}
        ${isOverdue ? 'border-l-destructive bg-destructive/5' : ''}
        ${!canDrag && isVendedor ? 'opacity-75' : ''}
      `}
    >
      <CardContent className="p-4 space-y-3">
        {/* Header com nome e empresa */}
        <div className="space-y-1">
          <div className="flex items-start justify-between">
            <h4 className="font-medium text-foreground text-sm line-clamp-1">
              {lead.nome}
            </h4>
            <div className="flex items-center gap-1 ml-2 flex-shrink-0">
              {!canDrag && isVendedor && (
                <Lock className="h-3 w-3 text-muted-foreground" title="Lead de outro vendedor" />
              )}
              {isOverdue && (
                <AlertCircle className="h-4 w-4 text-destructive" />
              )}
            </div>
          </div>
          {lead.empresa && (
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Building className="h-3 w-3" />
              {lead.empresa}
            </p>
          )}
        </div>

        {/* Badges de Status e Origem */}
        <div className="flex flex-wrap gap-1">
          <Badge 
            variant="outline" 
            className={`text-xs ${getOrigemColor(lead.origem)}`}
          >
            {lead.origem}
          </Badge>
          <Badge 
            className={`text-xs ${getStatusColor(lead.statusQualificacao)}`}
          >
            {lead.statusQualificacao}
          </Badge>
        </div>

        {/* Informações principais */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Users className="h-3 w-3" />
            <span>{lead.quantidadeVidas} vida{lead.quantidadeVidas > 1 ? 's' : ''}</span>
          </div>
          
          {lead.valorMedio && (
            <div className="text-xs text-muted-foreground">
              Valor atual: {lead.valorMedio.toLocaleString('pt-BR', { 
                style: 'currency', 
                currency: 'BRL' 
              })}
            </div>
          )}
        </div>

        {/* Ações rápidas */}
        <div className="flex items-center justify-between pt-2 border-t border-border">
          <div className="flex gap-1">
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0"
              onClick={(e) => {
                e.stopPropagation();
                window.open(`tel:${lead.celular}`, '_self');
              }}
            >
              <Phone className="h-3 w-3" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0"
              onClick={(e) => {
                e.stopPropagation();
                window.open(`https://wa.me/55${lead.celular.replace(/\D/g, '')}`, '_blank');
              }}
            >
              <MessageCircle className="h-3 w-3" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0"
              onClick={(e) => {
                e.stopPropagation();
                window.open(`mailto:${lead.email}`, '_self');
              }}
            >
              <Mail className="h-3 w-3" />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            {diasSemAtividade > 0 && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>{diasSemAtividade}d</span>
              </div>
            )}
            <Avatar className="h-6 w-6">
              <AvatarImage src="" alt={lead.responsavel} />
              <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                {lead.responsavel.split(' ').map(n => n[0]).join('').substring(0, 2)}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}