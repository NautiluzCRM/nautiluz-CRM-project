import { Lead } from "@/types/crm";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import {
  Phone,
  Mail,
  Building,
  Users,
  Calendar,
  MessageCircle,
  Edit,
  MapPin,
  FileText,
  Activity,
  Clock,
  Briefcase,
  Shield,
  Plus,
  Trash2,
  Pencil,
  X,
  Check,
  Pin,
  PinOff,
  Loader2
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useState, useEffect } from "react";
import { 
  fetchLeadActivities, 
  fetchLeadNotes, 
  createNote, 
  updateNote, 
  deleteNote,
  type Activity as ApiActivity,
  type Note as ApiNote
} from "@/lib/api";

const FAIXAS_LABELS = [
  "0-18", "19-23", "24-28", "29-33", "34-38",
  "39-43", "44-48", "49-53", "54-58", "59+"
];

// --- FUNÇÃO AUXILIAR PARA ASSETS LOCAIS ---
// Certifique-se de ter as imagens em /frontend/public/logos/nome.png
const getOperadoraInfo = (plano?: string) => {
  if (!plano) return null;
  const text = plano.toLowerCase();
  
  // Grandes Nacionais
  if (text.includes('amil') || text.includes('one health') || text.includes('lincx')) return { src: '/logos/amil.png', name: 'Amil' };
  if (text.includes('bradesco')) return { src: '/logos/bradesco.png', name: 'Bradesco' };
  if (text.includes('sulamerica') || text.includes('sul américa')) return { src: '/logos/sulamerica.png', name: 'SulAmérica' };
  if (text.includes('unimed') || text.includes('seguros unimed') || text.includes('central nacional')) return { src: '/logos/unimed.png', name: 'Unimed' };
  if (text.includes('notre') || text.includes('gndi') || text.includes('intermedica')) return { src: '/logos/gndi.png', name: 'NotreDame' };
  if (text.includes('hapvida')) return { src: '/logos/hapvida.png', name: 'Hapvida' };
  if (text.includes('porto')) return { src: '/logos/porto.png', name: 'Porto Seguro' };
  if (text.includes('cassi')) return { src: '/logos/cassi.png', name: 'Cassi' };
  
  // Premium / Seguradoras
  if (text.includes('omint')) return { src: '/logos/omint.png', name: 'Omint' };
  if (text.includes('allianz')) return { src: '/logos/allianz.png', name: 'Allianz' };
  if (text.includes('sompo')) return { src: '/logos/sompo.png', name: 'Sompo' };
  if (text.includes('care plus') || text.includes('careplus')) return { src: '/logos/careplus.png', name: 'Care Plus' };
  
  // Regionais Fortes / Senior / Outros
  if (text.includes('golden') || text.includes('cross')) return { src: '/logos/golden.png', name: 'Golden Cross' };
  if (text.includes('prevent')) return { src: '/logos/prevent.png', name: 'Prevent Senior' };
  if (text.includes('alice')) return { src: '/logos/alice.png', name: 'Alice' };
  if (text.includes('medsenior') || text.includes('med senior')) return { src: '/logos/medsenior.png', name: 'MedSênior' };
  if (text.includes('sao cristovao') || text.includes('são cristóvão')) return { src: '/logos/saocristovao.png', name: 'São Cristóvão' };
  if (text.includes('trasmontano')) return { src: '/logos/trasmontano.png', name: 'Trasmontano' };
  if (text.includes('biovida')) return { src: '/logos/biovida.png', name: 'Biovida' };
  if (text.includes('blue')) return { src: '/logos/blue.png', name: 'Blue Saúde' };
  if (text.includes('ameplan')) return { src: '/logos/ameplan.png', name: 'Ameplan' };
  if (text.includes('cruz azul')) return { src: '/logos/cruzazul.png', name: 'Cruz Azul' };
  if (text.includes('go care') || text.includes('gocare')) return { src: '/logos/gocare.png', name: 'Go Care' };

  return null;
};

interface LeadDetailsModalProps {
  lead: Lead | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (lead: Lead) => void;
  onDelete?: (leadId: string) => Promise<void>;
}

export function LeadDetailsModal({ lead, isOpen, onClose, onEdit, onDelete }: LeadDetailsModalProps) {
  const { user } = useAuth();

  // Estados para atividades e notas da API
  const [activities, setActivities] = useState<ApiActivity[]>([]);
  const [notes, setNotes] = useState<ApiNote[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [loadingNotes, setLoadingNotes] = useState(false);
  
  // Estados para adicionar/editar notas
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteContent, setNoteContent] = useState("");

  // Dados derivados (executados sempre, mesmo se lead for null)
  const leadData = lead as any;
  const leadId = lead?._id || lead?.id;

  // --- LÓGICA DE PERMISSÃO ---
  const isAdmin = user?.role === 'admin';
  const currentUserId = user?.id || (user as any)?._id;
  const isOwner = lead ? (lead.ownersIds || []).some(id => id === currentUserId) : false;
  const isLegacyOwner = lead ? ((!lead.ownersIds || lead.ownersIds.length === 0) && lead.responsavel === user?.name) : false;
  const canEdit = isAdmin || isOwner || isLegacyOwner;
  // ---------------------------

  const operadoraInfo = lead ? getOperadoraInfo(lead.planoAtual) : null;

  // Carregar atividades e notas quando o modal abrir
  useEffect(() => {
    if (isOpen && leadId) {
      loadActivities();
      loadNotes();
    }
  }, [isOpen, leadId]);
  
  // Return condicional DEPOIS de todos os hooks
  if (!lead) return null;
  
  const loadActivities = async () => {
    if (!leadId) return;
    try {
      setLoadingActivities(true);
      const data = await fetchLeadActivities(leadId);
      setActivities(data);
    } catch (error: any) {
      // Ignora erro 404 (rota não existe) silenciosamente
      if (!error?.message?.includes('404') && !error?.message?.includes('Cannot GET')) {
        console.error('Erro ao carregar atividades:', error);
      }
      setActivities([]);
    } finally {
      setLoadingActivities(false);
    }
  };
  
  const loadNotes = async () => {
    if (!leadId) return;
    try {
      setLoadingNotes(true);
      const data = await fetchLeadNotes(leadId);
      setNotes(data);
    } catch (error: any) {
      // Ignora erro 404 (rota não existe) silenciosamente
      if (!error?.message?.includes('404') && !error?.message?.includes('Cannot GET')) {
        console.error('Erro ao carregar notas:', error);
      }
      setNotes([]);
    } finally {
      setLoadingNotes(false);
    }
  };
  
  const handleCreateNote = async () => {
    if (!leadId || !noteContent.trim()) return;
    try {
      await createNote(leadId, noteContent.trim());
      setNoteContent("");
      setIsAddingNote(false);
      await Promise.all([loadNotes(), loadActivities()]);
    } catch (error) {
      console.error('Erro ao criar nota:', error);
      alert('Erro ao criar observação');
    }
  };
  
  const handleUpdateNote = async (noteId: string) => {
    if (!noteContent.trim()) return;
    try {
      await updateNote(noteId, { conteudo: noteContent.trim() });
      setEditingNoteId(null);
      setNoteContent("");
      await Promise.all([loadNotes(), loadActivities()]);
    } catch (error) {
      console.error('Erro ao atualizar nota:', error);
      alert('Erro ao atualizar observação');
    }
  };
  
  const handleDeleteNote = async (noteId: string) => {
    if (!confirm('Deseja realmente excluir esta observação?')) return;
    try {
      await deleteNote(noteId);
      await Promise.all([loadNotes(), loadActivities()]);
    } catch (error) {
      console.error('Erro ao excluir nota:', error);
      alert('Erro ao excluir observação');
    }
  };
  
  const handleTogglePin = async (noteId: string, currentPinned: boolean) => {
    try {
      await updateNote(noteId, { isPinned: !currentPinned });
      await loadNotes();
    } catch (error) {
      console.error('Erro ao fixar nota:', error);
    }
  };

  const startEditNote = (note: ApiNote) => {
    setEditingNoteId(note._id);
    setNoteContent(note.conteudo);
  };

  const cancelEdit = () => {
    setEditingNoteId(null);
    setNoteContent("");
    setIsAddingNote(false);
  };

  const diasSemAtividade = lead.ultimaAtividade 
    ? Math.floor((Date.now() - new Date(lead.ultimaAtividade).getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  const faixasPreenchidas = (lead.idades || []).map((count, index) => ({
    label: FAIXAS_LABELS[index],
    count: count
  })).filter(item => item.count > 0);
  
  const ownersList = (leadData.owners || []) as any[];
  
  const sortedOwners = [...ownersList].sort((a, b) => 
    (a.nome || "").localeCompare(b.nome || "")
  );

  const tituloResponsavel = sortedOwners.length > 1 ? "Responsáveis" : "Responsável";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogDescription className="sr-only">
            Detalhes completos do lead incluindo informações de contato, plano, histórico e observações
          </DialogDescription>
          <DialogTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 sm:h-12 sm:w-12 border-2">
                <AvatarImage src="" alt={lead.nome} />
                <AvatarFallback className="bg-primary text-white font-semibold text-sm sm:text-base">
                  {lead.nome.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-lg sm:text-xl font-semibold">{lead.nome}</h2>
                <p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1">
                  <Building className="h-3 w-3" />
                  {lead.empresa || "-"}
                </p>
              </div>
            </div>
            
            {canEdit && (
              <div className="flex gap-2 w-full sm:w-auto sm:mr-10">
                <Button
                  onClick={() => onEdit?.(lead)}
                  size="sm"
                  className="flex-1 sm:flex-none"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </Button>
                {onDelete && (
                  <Button
                    onClick={async () => {
                      const confirmed = window.confirm("Tem certeza que deseja excluir este lead? Essa ação não pode ser desfeita.");
                      if (confirmed) {
                        await onDelete(lead.id);
                        onClose();
                      }
                    }}
                    size="sm"
                    variant="destructive"
                    className="flex-1 sm:flex-none"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Excluir
                  </Button>
                )}
              </div>
            )}
          </DialogTitle>
        </DialogHeader>

        {/* Badges */}
        <div className="flex flex-wrap gap-2 -mt-2">
          <Badge variant="secondary">
            {lead.origem}
          </Badge>
          <Badge variant="outline">
            {lead.statusQualificacao}
          </Badge>
          {diasSemAtividade > 0 && (
            <Badge variant="destructive">
              <Clock className="h-3 w-3 mr-1" />
              {diasSemAtividade}d sem atividade
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Coluna Principal */}
          <div className="md:col-span-2 space-y-6">
            {/* Contato */}
            <div className="space-y-3">
              <h3 className="text-base font-semibold flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Contato
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2 text-sm border rounded-md px-3 py-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{lead.celular || "-"}</span>
                </div>
                <div className="flex items-center gap-2 text-sm border rounded-md px-3 py-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="truncate">{lead.email || "-"}</span>
                </div>
                <Button 
                  size="sm" 
                  variant="outline"
                  className="w-full justify-start text-green-600 hover:text-green-700 hover:bg-success/10 dark:hover:bg-success/5" 
                  onClick={() => lead.celular && window.open(`https://wa.me/55${lead.celular.replace(/\D/g, '')}`, '_blank')} 
                  disabled={!lead.celular}
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  WhatsApp
                </Button>
                <div className="flex items-center gap-2 text-sm text-muted-foreground px-3 py-2 border rounded-md bg-muted/30">
                  <MapPin className="h-4 w-4" />
                  <span className="truncate">{leadData.cidade ? `${leadData.cidade}, ${leadData.uf}` : "-"}</span>
                </div>
              </div>
            </div>

            <Separator />

            {/* Informações do Plano */}
            <div className="space-y-4">
              <h3 className="text-base font-semibold flex items-center gap-2">
                <Users className="h-4 w-4" />
                Informações do Plano
              </h3>
              
              {/* Grid: Quantidade de Vidas e Faixas Etárias */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium uppercase text-muted-foreground mb-2">Quantidade de Vidas</p>
                  <Badge className="text-base px-3 py-1">
                    {lead.quantidadeVidas} {lead.quantidadeVidas === 1 ? 'vida' : 'vidas'}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase text-muted-foreground mb-2">Faixas Etárias</p>
                  <div className="flex flex-wrap gap-1">
                    {faixasPreenchidas.length > 0 ? (
                      faixasPreenchidas.map((item) => (
                        <Badge key={item.label} variant="outline" className="text-xs">
                          {item.label}: {item.count}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-sm text-muted-foreground">-</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Grid: CNPJ e Hospitais */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium uppercase text-muted-foreground mb-2">CNPJ</p>
                  <div className="flex items-center gap-2 text-sm">
                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                    <span>{lead.possuiCnpj ? `Sim (${leadData.tipoCnpj || "ME"})` : "Não"}</span>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase text-muted-foreground mb-2">Hospitais de Preferência</p>
                  <div className="flex flex-wrap gap-1">
                    {lead.hospitaisPreferencia && lead.hospitaisPreferencia.length > 0 ? (
                      lead.hospitaisPreferencia.map((hospital) => (
                        <Badge key={hospital} variant="secondary" className="text-xs">{hospital}</Badge>
                      ))
                    ) : (
                      <span className="text-sm text-muted-foreground">-</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Card Grande: Logo + Plano + Valor */}
              <div className="border rounded-lg p-4 bg-muted/30 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="h-20 w-28 rounded border bg-card flex items-center justify-center overflow-hidden shrink-0">
                    {operadoraInfo ? (
                      <img 
                        src={operadoraInfo.src} 
                        alt={operadoraInfo.name}
                        className="h-full w-full object-contain p-2"
                        onError={(e) => e.currentTarget.style.display = 'none'}
                      />
                    ) : (
                      <Shield className="h-8 w-8 text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase text-muted-foreground">Plano Atual</p>
                    <p className="text-base font-bold">{lead.planoAtual || "Sem plano atual"}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-medium uppercase text-muted-foreground">Valor Estimado</p>
                  <div className="flex items-baseline justify-end gap-1">
                    <span className="text-xs text-emerald-600">R$</span>
                    <span className="text-2xl font-bold text-emerald-600">
                      {lead.valorMedio > 0 
                        ? lead.valorMedio.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) 
                        : "0,00"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Observações */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Observações
                </h3>
                {canEdit && !isAddingNote && (
                  <Button 
                    size="sm" 
                    variant="ghost"
                    onClick={() => setIsAddingNote(true)}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Adicionar
                  </Button>
                )}
              </div>

              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {isAddingNote && (
                  <div className="border rounded-lg p-3 bg-muted/30">
                    <Textarea 
                      placeholder="Digite sua observação..."
                      value={noteContent}
                      onChange={(e) => setNoteContent(e.target.value)}
                      className="min-h-[60px] mb-2 text-sm"
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleCreateNote} disabled={!noteContent.trim()}>
                        <Check className="h-3 w-3 mr-1" />
                        Salvar
                      </Button>
                      <Button size="sm" variant="outline" onClick={cancelEdit}>
                        <X className="h-3 w-3 mr-1" />
                        Cancelar
                      </Button>
                    </div>
                  </div>
                )}
                
                {loadingNotes ? (
                  <div className="text-center py-4">
                    <p className="text-sm text-muted-foreground">Carregando...</p>
                  </div>
                ) : notes.length > 0 ? (
                  notes.map((note) => (
                    <div key={note._id} className={`border rounded-lg p-3 text-sm ${note.isPinned ? 'bg-primary/5 border-primary/20' : 'bg-muted/30'}`}>
                      {editingNoteId === note._id ? (
                        <>
                          <Textarea 
                            value={noteContent}
                            onChange={(e) => setNoteContent(e.target.value)}
                            className="min-h-[60px] mb-2 text-sm"
                          />
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => handleUpdateNote(note._id)} disabled={!noteContent.trim()}>
                              <Check className="h-3 w-3 mr-1" />
                              Salvar
                            </Button>
                            <Button size="sm" variant="outline" onClick={cancelEdit}>
                              <X className="h-3 w-3 mr-1" />
                              Cancelar
                            </Button>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <p className="text-sm flex-1">{note.conteudo}</p>
                            {canEdit && (
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleTogglePin(note._id, note.isPinned)}
                                  className="h-6 w-6 p-0"
                                >
                                  {note.isPinned ? <Pin className="h-3 w-3" /> : <PinOff className="h-3 w-3" />}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => startEditNote(note)}
                                  className="h-6 w-6 p-0"
                                >
                                  <Pencil className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleDeleteNote(note._id)}
                                  className="h-6 w-6 p-0 text-red-600"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {note.userName} • {new Date(note.createdAt).toLocaleDateString('pt-BR')}
                          </p>
                        </>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-muted-foreground p-4 border rounded-lg bg-muted/30">
                    {lead.informacoes || "Nenhuma observação"}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Coluna Sidebar */}
          <div className="space-y-6">
            {/* Responsável */}
            <div className="space-y-3">
              <h3 className="text-base font-semibold flex items-center gap-2">
                <Activity className="h-4 w-4" />
                {tituloResponsavel}
              </h3>
              
              {sortedOwners.length > 0 ? (
                <div className="space-y-2">
                  {sortedOwners.map((owner: any) => (
                    <div key={owner.id} className="flex items-center gap-3 p-3 bg-muted/30 border rounded-lg">
                      <Avatar className="h-9 w-9 border-2">
                        <AvatarImage src="" alt={owner.nome} />
                        <AvatarFallback className="bg-primary text-white text-xs font-semibold">
                          {owner.nome.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="overflow-hidden">
                        <p className="text-sm font-medium truncate">{owner.nome}</p>
                        <p className="text-xs text-muted-foreground">Vendedor</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center gap-3 p-3 bg-muted/30 border rounded-lg">
                  <Avatar className="h-9 w-9 border-2">
                    <AvatarImage src="" alt={lead.responsavel || "Vendedor"} />
                    <AvatarFallback className="bg-primary text-white text-xs font-semibold">
                      {(lead.responsavel || "VD").substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">{lead.responsavel || "Não atribuído"}</p>
                    <p className="text-xs text-muted-foreground">Vendedor</p>
                  </div>
                </div>
              )}
            </div>

            {/* Datas Importantes */}
            <div className="space-y-3">
              <h3 className="text-base font-semibold flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Datas Importantes
              </h3>
              <div className="space-y-3 text-sm bg-muted/30 border rounded-lg p-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Criado em:</p>
                  <p className="font-medium">
                    {lead.createdAt ? new Date(lead.createdAt).toLocaleDateString('pt-BR') : '-'}
                  </p>
                </div>
                <Separator />
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Última atividade:</p>
                  <p className="font-medium">
                    {lead.ultimaAtividade ? new Date(lead.ultimaAtividade).toLocaleDateString('pt-BR') : '-'}
                  </p>
                </div>
              </div>
            </div>

            {/* Atividades Recentes */}
            <div className="space-y-3">
              <h3 className="text-base font-semibold">Atividades Recentes</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {loadingActivities ? (
                  <div className="text-center py-4">
                    <p className="text-sm text-muted-foreground">Carregando...</p>
                  </div>
                ) : activities.length > 0 ? (
                  activities.slice(0, 5).map((atividade) => (
                    <div key={atividade._id} className="p-3 bg-muted/30 border rounded-lg text-sm">
                      <div className="flex items-center justify-between mb-1">
                        <Badge variant="outline" className="text-xs">
                          {(atividade.tipo || '').replace(/_/g, ' ')}                        
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(atividade.createdAt).toLocaleDateString('pt-BR', { 
                            day: '2-digit', 
                            month: 'short'
                          })}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">{atividade.descricao}</p>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 border rounded-lg bg-muted/30">
                    <p className="text-xs text-muted-foreground">Nenhuma atividade registrada</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
