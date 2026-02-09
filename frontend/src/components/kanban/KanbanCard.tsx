import { useState } from "react";
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
  MessageCircle, 
  AlertCircle, 
  Clock, 
  Lock, 
  FileText, // Ícone para VER o arquivo (Roxo)
  Upload    // Ícone para ENVIAR o arquivo (Azul)
} from "lucide-react";
import { ProposalModal } from "@/components/ui/ProposalModal";

interface KanbanCardProps {
  lead: Lead;
  onLeadUpdate: (lead: Lead) => void;
  onLeadClick?: (lead: Lead) => void;
  isDragging?: boolean;
  isOverdue?: boolean;
}

export function KanbanCard({ lead, onLeadUpdate, onLeadClick, isDragging = false, isOverdue = false }: KanbanCardProps) {
  const { user } = useAuth();
  const [isProposalOpen, setIsProposalOpen] = useState(false);
  
  // --- DIAGNÓSTICO: Verifica se o link chegou ---
  if (lead.proposalUrl) {
    // console.log(`[KanbanCard] Arquivo detectado no lead ${lead.nome}:`, lead.proposalUrl);
  }
  // ----------------------------------------------

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

  // --- CORES DAS BADGES ---
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
      'Novo': 'bg-orange-100 text-orange-700 border-orange-200 hover:bg-orange-100',
      'novo': 'bg-orange-100 text-orange-700 border-orange-200 hover:bg-orange-100',
      'Qualificado': 'bg-success text-success-foreground',
      'Incompleto': 'bg-warning text-warning-foreground',
      'Duplicado': 'bg-muted text-muted-foreground',
      'Sem interesse': 'bg-destructive text-destructive-foreground'
    };
    return colors[status] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  // --- LÓGICA DE DATAS ---
  const dataUltima = lead.ultimaAtividade instanceof Date ? lead.ultimaAtividade : new Date(lead.ultimaAtividade);
  const diasSemAtividade = Math.floor((Date.now() - dataUltima.getTime()) / (1000 * 60 * 60 * 24));

  // --- LÓGICA DE OWNERS ---
  const ownersList = (lead.owners && lead.owners.length > 0) ? lead.owners : [{ id: 'legacy', nome: lead.responsavel || 'Vendedor', foto: null }];
  const MAX_DISPLAY = 3;
  const totalOwners = ownersList.length;
  const shouldShowCounter = totalOwners > MAX_DISPLAY;
  const displayCount = shouldShowCounter ? MAX_DISPLAY - 1 : MAX_DISPLAY;
  const visibleOwners = ownersList.slice(0, displayCount);
  const remainingCount = totalOwners - displayCount;

  // --- LÓGICA DO LINK DE DOWNLOAD (CORRIGIDA) ---
  // Gera o link para a rota do backend que força o download com nome correto
  const getDownloadLink = (leadId: string) => {
    const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:10000/api";
    // Aponta para a rota GET /api/leads/:id/proposal
    return `${apiUrl}/leads/${leadId}/proposal`;
  };

  return (
    <>
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
        <CardContent className="p-4 space-y-3">
          
          {/* Cabeçalho do Card */}
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

          {/* Badges */}
          <div className="flex flex-wrap gap-1">
            <Badge variant="outline" className={`text-xs ${getOrigemColor(lead.origem)}`}>{lead.origem}</Badge>
            <Badge 
              variant="outline" 
              className={`text-xs capitalize ${getStatusColor(lead.statusQualificacao || '')}`}
            >
              {lead.statusQualificacao?.toLowerCase()}
            </Badge>
          </div>

          {/* Info: Vidas e Valor */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground"><Users className="h-3 w-3" /><span>{lead.quantidadeVidas} vida{lead.quantidadeVidas > 1 ? 's' : ''}</span></div>
            {lead.valorMedio && <div className="text-xs text-muted-foreground">Valor atual: {lead.valorMedio.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>}
          </div>

          {/* Rodapé: Ações e Owners */}
          <div className={`flex items-center justify-between pt-2 border-t ${isOverdue ? 'border-red-200' : 'border-border'}`}>
            <div className="flex gap-1">
              {/* Botões Padrão (Telefone, Whats, Email) */}
              <Button size="sm" variant="ghost" className="h-6 w-6 p-0 hover:bg-background/80" onClick={(e) => { e.stopPropagation(); if (lead.celular) window.open(`tel:${lead.celular}`, '_self'); }}><Phone className="h-3 w-3" /></Button>
              <Button size="sm" variant="ghost" className="h-6 w-6 p-0 hover:bg-background/80" onClick={(e) => { e.stopPropagation(); if (lead.celular) window.open(`https://wa.me/55${lead.celular.replace(/\D/g, '')}`, '_blank'); }}><MessageCircle className="h-3 w-3" /></Button>
              <Button size="sm" variant="ghost" className="h-6 w-6 p-0 hover:bg-background/80" onClick={(e) => { e.stopPropagation(); if (lead.email) window.open(`mailto:${lead.email}`, '_self'); }}><Mail className="h-3 w-3" /></Button>
              
              {/* 🟣 BOTÃO VER PROPOSTA (Atualizado: Usa link direto da API para download correto) */}
              {lead.proposalUrl && (
                <Button 
                  asChild // Importante: Renderiza como um link <a>
                  size="sm" 
                  variant="ghost" 
                  className="h-6 w-6 p-0 hover:bg-purple-100 text-purple-600" 
                  title={`Baixar: ${lead.proposalOriginalName || 'Proposta'}`}
                >
                  <a 
                    href={getDownloadLink(lead.id)} // Usa a rota da API
                    target="_blank" 
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()} // Impede de abrir o card
                  >
                    <FileText className="h-3 w-3" />
                  </a>
                </Button>
              )}

              {/* 🔵 BOTÃO ENVIAR/ATUALIZAR PROPOSTA */}
              <Button 
                size="sm" 
                variant="ghost" 
                className="h-6 w-6 p-0 hover:bg-blue-50 text-blue-600" 
                title="Enviar/Atualizar Proposta"
                onClick={(e) => { 
                  e.stopPropagation(); 
                  setIsProposalOpen(true); 
                }}
              >
                <Upload className="h-3 w-3" />
              </Button>

            </div>

            {/* Avatares dos Owners */}
            <div className="flex items-center gap-3">
              {diasSemAtividade > 0 && <div className="flex items-center gap-1 text-xs text-muted-foreground"><Clock className="h-3 w-3" /><span>{diasSemAtividade}d</span></div>}
              <div className="flex items-center -space-x-2">
                {visibleOwners.map((owner: any) => (
                  <Avatar key={owner.id} className="h-6 w-6 border-2 border-background ring-0"><AvatarImage src={owner.foto || ""} alt={owner.nome} className="object-cover" /><AvatarFallback className="text-[9px] bg-primary text-primary-foreground font-bold">{(owner.nome || "U").substring(0, 2).toUpperCase()}</AvatarFallback></Avatar>
                ))}
                {shouldShowCounter && <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-background bg-muted text-[9px] font-medium text-muted-foreground">+{remainingCount}</div>}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modal de Upload */}
      <ProposalModal 
        isOpen={isProposalOpen} 
        onClose={() => setIsProposalOpen(false)}
        leadId={lead.id}
        onSuccess={() => {
           // Recarrega a página para garantir que o Kanban pegue os dados novos
           window.location.reload(); 
        }}
      />
    </>
  );
}