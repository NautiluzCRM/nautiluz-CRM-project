import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Lead } from "@/types/crm";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { 
  Phone, 
  Mail, 
  Building, 
  Users, 
  MessageCircle,
  AlertCircle,
  Clock,
  Lock // Ícone de cadeado para indicar visualmente
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth"; // <--- Import do Auth

interface KanbanCardProps {
  lead: Lead;
  onLeadUpdate: (lead: Lead) => void;
  onLeadClick?: (lead: Lead) => void;
  isDragging?: boolean;
  isOverdue?: boolean;
}

export function KanbanCard({ lead, onLeadClick, isDragging = false, isOverdue = false }: KanbanCardProps) {
  const { user } = useAuth();

  const isAdmin = user?.role === 'admin';
  
  // Tenta pegar o ID de todas as formas possíveis (id ou _id)
  const currentUserId = user?.id || (user as any)?._id;
  
  // Verifica se o ID do usuário está na lista de donos
  const isOwner = (lead.ownersIds || []).some(id => id === currentUserId);
  
  // Fallback para legado: verifica se bate com o nome ou ID antigo se o array estiver vazio
  const isLegacyOwner = !lead.ownersIds?.length && lead.responsavel === user?.name;

  const canMove = isAdmin || isOwner || isLegacyOwner;

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
    disabled: !canMove, // <--- BLOQUEIA O ARRASTO AQUI
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

  const diasSemAtividade = lead.ultimaAtividade 
  ? Math.floor((Date.now() - new Date(lead.ultimaAtividade).getTime()) / (1000 * 60 * 60 * 24))
  : 0;

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onLeadClick?.(lead)}
      className={`
        relative group
        ${canMove ? 'cursor-grab active:cursor-grabbing hover:shadow-lg' : 'cursor-default opacity-90'} 
        shadow-kanban-card 
        transition-all duration-200 border-l-4 border-l-primary
        ${isDragging ? 'opacity-50 rotate-2 scale-105' : ''}
        ${isOverdue ? 'border-l-destructive bg-destructive/5' : ''}
      `}
    >
      {/* Indicador visual de bloqueio (opcional, mas bom pra UX) */}
      {!canMove && (
        <div className="absolute top-2 right-2 text-muted-foreground/20">
          <Lock className="h-4 w-4" />
        </div>
      )}

      <CardContent className="p-3 sm:p-4 space-y-2 sm:space-y-3">
        {/* Header com nome e empresa */}
        <div className="space-y-0.5 sm:space-y-1">
          <div className="flex items-start justify-between pr-4">
            <h4 className="font-medium text-foreground text-xs sm:text-sm line-clamp-1">
              {lead.nome}
            </h4>
            {isOverdue && (
              <AlertCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-destructive flex-shrink-0 ml-2" />
            )}
          </div>
          {lead.empresa && (
            <p className="text-[10px] sm:text-xs text-muted-foreground flex items-center gap-1">
              <Building className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
              <span className="truncate">{lead.empresa}</span>
            </p>
          )}
        </div>

        {/* Badges de Status e Origem */}
        <div className="flex flex-wrap gap-1">
          <Badge 
            variant="outline" 
            className={`text-[10px] sm:text-xs px-1.5 py-0 h-5 ${getOrigemColor(lead.origem)}`}
          >
            {lead.origem}
          </Badge>
          <Badge 
            className={`text-[10px] sm:text-xs px-1.5 py-0 h-5 ${getStatusColor(lead.statusQualificacao)}`}
          >
            {lead.statusQualificacao}
          </Badge>
        </div>

        {/* Informações principais */}
        <div className="space-y-1 sm:space-y-2">
          <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs text-muted-foreground">
            <Users className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
            <span>{lead.quantidadeVidas} vida{lead.quantidadeVidas > 1 ? 's' : ''}</span>
          </div>
          
          {lead.valorMedio && (
            <div className="text-[10px] sm:text-xs text-muted-foreground">
              {lead.valorMedio.toLocaleString('pt-BR', { 
                style: 'currency', 
                currency: 'BRL' 
              })}
            </div>
          )}
        </div>

        {/* Footer com Ações e Avatar */}
        <div className="flex items-center justify-between pt-1.5 sm:pt-2 border-t border-border">
          <div className="flex gap-0.5 sm:gap-1">
            {/* Botões de ação rápida (Phone, Whats, Mail) */}
            <Button
              size="sm"
              variant="ghost"
              className="h-7 w-7 sm:h-6 sm:w-6 p-0"
              onClick={(e) => {
                e.stopPropagation();
                window.open(`tel:${lead.celular}`, '_self');
              }}
            >
              <Phone className="h-3.5 w-3.5 sm:h-3 sm:w-3" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 w-7 sm:h-6 sm:w-6 p-0"
              onClick={(e) => {
                e.stopPropagation();
                window.open(`https://wa.me/55${lead.celular.replace(/\D/g, '')}`, '_blank');
              }}
            >
              <MessageCircle className="h-3.5 w-3.5 sm:h-3 sm:w-3" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 w-7 sm:h-6 sm:w-6 p-0"
              onClick={(e) => {
                e.stopPropagation();
                window.open(`mailto:${lead.email}`, '_self');
              }}
            >
              <Mail className="h-3.5 w-3.5 sm:h-3 sm:w-3" />
            </Button>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            {diasSemAtividade > 0 && (
              <div className="flex items-center gap-0.5 sm:gap-1 text-[10px] sm:text-xs text-muted-foreground">
                <Clock className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                <span>{diasSemAtividade}d</span>
              </div>
            )}
            
            {/* Avatar do Responsável */}
            <div className="flex -space-x-1.5 sm:-space-x-2 overflow-hidden">
               {lead.owners && lead.owners.length > 0 ? (
                  lead.owners.slice(0, 2).map((owner: any) => (
                    <Avatar key={owner.id} className="h-5 w-5 sm:h-6 sm:w-6 border-2 border-background ring-1 ring-background">
                      <AvatarImage src="" />
                      <AvatarFallback className="text-[9px] sm:text-[10px] bg-primary text-primary-foreground">
                        {owner.nome.substring(0, 1)}
                      </AvatarFallback>
                    </Avatar>
                  ))
               ) : (
                  <Avatar className="h-5 w-5 sm:h-6 sm:w-6">
                    <AvatarFallback className="text-[9px] sm:text-[10px] bg-muted">?</AvatarFallback>
                  </Avatar>
               )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}