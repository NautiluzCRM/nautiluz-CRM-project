import { Lead } from "@/types/crm";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
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
  Loader2,
  Upload,
  ImagePlus
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useState, useEffect, useRef } from "react";
import { 
  fetchLeadActivities, 
  fetchLeadNotes, 
  createNote, 
  updateNote, 
  deleteNote,
  searchOperadoraLogo,
  uploadOperadoraLogo,
  type Activity as ApiActivity,
  type Note as ApiNote
} from "@/lib/api";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";

// Lista de logos locais disponíveis em /public/logos
const LOGOS_LOCAIS = [
  { id: 'alice', name: 'Alice', src: '/logos/alice.png' },
  { id: 'allianz', name: 'Allianz', src: '/logos/allianz.png' },
  { id: 'ameplan', name: 'Ameplan', src: '/logos/ameplan.png' },
  { id: 'amil', name: 'Amil', src: '/logos/amil.png' },
  { id: 'biovida', name: 'Biovida', src: '/logos/biovida.png' },
  { id: 'blue', name: 'Blue Saúde', src: '/logos/blue.png' },
  { id: 'bradesco', name: 'Bradesco', src: '/logos/bradesco.png' },
  { id: 'careplus', name: 'Care Plus', src: '/logos/careplus.png' },
  { id: 'cassi', name: 'Cassi', src: '/logos/cassi.png' },
  { id: 'cruzazul', name: 'Cruz Azul', src: '/logos/cruzazul.png' },
  { id: 'gndi', name: 'NotreDame / GNDI', src: '/logos/gndi.png' },
  { id: 'gocare', name: 'Go Care', src: '/logos/gocare.png' },
  { id: 'golden', name: 'Golden Cross', src: '/logos/golden.png' },
  { id: 'hapvida', name: 'Hapvida', src: '/logos/hapvida.png' },
  { id: 'medsenior', name: 'MedSênior', src: '/logos/medsenior.png' },
  { id: 'omint', name: 'Omint', src: '/logos/omint.png' },
  { id: 'porto', name: 'Porto Seguro', src: '/logos/porto.png' },
  { id: 'prevent', name: 'Prevent Senior', src: '/logos/prevent.png' },
  { id: 'saocristovao', name: 'São Cristóvão', src: '/logos/saocristovao.png' },
  { id: 'sompo', name: 'Sompo', src: '/logos/sompo.png' },
  { id: 'sulamerica', name: 'SulAmérica', src: '/logos/sulamerica.png' },
  { id: 'trasmontano', name: 'Trasmontano', src: '/logos/trasmontano.png' },
  { id: 'unimed', name: 'Unimed', src: '/logos/unimed.png' },
];

const FAIXAS_LABELS = [
  "0-18", "19-23", "24-28", "29-33", "34-38",
  "39-43", "44-48", "49-53", "54-58", "59+"
];

// --- FUNÇÃO AUXILIAR PARA ASSETS LOCAIS ---
const getOperadoraInfo = (plano?: string) => {
  if (!plano) return null;
  const text = plano.toLowerCase();
  
  if (text.includes('amil') || text.includes('one health') || text.includes('lincx')) return { src: '/logos/amil.png', name: 'Amil' };
  if (text.includes('bradesco')) return { src: '/logos/bradesco.png', name: 'Bradesco' };
  if (text.includes('sulamerica') || text.includes('sul américa')) return { src: '/logos/sulamerica.png', name: 'SulAmérica' };
  if (text.includes('unimed') || text.includes('seguros unimed') || text.includes('central nacional')) return { src: '/logos/unimed.png', name: 'Unimed' };
  if (text.includes('notre') || text.includes('gndi') || text.includes('intermedica')) return { src: '/logos/gndi.png', name: 'NotreDame' };
  if (text.includes('hapvida')) return { src: '/logos/hapvida.png', name: 'Hapvida' };
  if (text.includes('porto')) return { src: '/logos/porto.png', name: 'Porto Seguro' };
  if (text.includes('cassi')) return { src: '/logos/cassi.png', name: 'Cassi' };
  
  if (text.includes('omint')) return { src: '/logos/omint.png', name: 'Omint' };
  if (text.includes('allianz')) return { src: '/logos/allianz.png', name: 'Allianz' };
  if (text.includes('sompo')) return { src: '/logos/sompo.png', name: 'Sompo' };
  if (text.includes('care plus') || text.includes('careplus')) return { src: '/logos/careplus.png', name: 'Care Plus' };
  
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
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Estados para atividades e notas da API
  const [activities, setActivities] = useState<ApiActivity[]>([]);
  const [notes, setNotes] = useState<ApiNote[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [loadingNotes, setLoadingNotes] = useState(false);
  
  // Estados para adicionar/editar notas
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteContent, setNoteContent] = useState("");

  // Estado para logo customizada do Cloudinary
  const [customLogoUrl, setCustomLogoUrl] = useState<string | null>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [showLogoSelector, setShowLogoSelector] = useState(false);
  const [logoSearchTerm, setLogoSearchTerm] = useState("");

  // Dados derivados
  const leadData = lead as any;
  const leadId = lead?._id || lead?.id;

  // --- LÓGICA DE PERMISSÃO ---
  const isAdmin = user?.role === 'admin';
  const currentUserId = user?.id || (user as any)?._id;
  const isOwner = lead ? (lead.ownersIds || []).some(id => id === currentUserId) : false;
  const isLegacyOwner = lead ? ((!lead.ownersIds || lead.ownersIds.length === 0) && lead.responsavel === user?.name) : false;
  const canEdit = isAdmin || isOwner || isLegacyOwner;

  const operadoraInfo = lead ? getOperadoraInfo(lead.planoAtual) : null;

  // Buscar logo customizada do Cloudinary quando não houver local
  useEffect(() => {
    if (isOpen && lead?.planoAtual && !operadoraInfo) {
      searchOperadoraLogo(lead.planoAtual).then((logo) => {
        if (logo) {
          setCustomLogoUrl(logo.logoUrl);
        } else {
          setCustomLogoUrl(null);
        }
      });
    } else {
      setCustomLogoUrl(null);
    }
  }, [isOpen, lead?.planoAtual, operadoraInfo]);

  // Função para fazer upload de logo
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !lead?.planoAtual) return;

    // Validar tamanho (500KB)
    if (file.size > 500 * 1024) {
      toast({
        variant: "destructive",
        title: "Imagem muito grande",
        description: "O tamanho máximo é 500KB"
      });
      return;
    }

    // Validar tipo
    if (!file.type.startsWith('image/')) {
      toast({
        variant: "destructive",
        title: "Formato inválido",
        description: "Selecione uma imagem (PNG, JPG, etc)"
      });
      return;
    }

    setIsUploadingLogo(true);

    try {
      // Converter para base64
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;
        
        try {
          const result = await uploadOperadoraLogo(lead.planoAtual!, base64);
          setCustomLogoUrl(result.logo.logoUrl);
          toast({
            title: "Logo salva!",
            description: `Logo da operadora "${lead.planoAtual}" foi salva com sucesso.`
          });
        } catch (error: any) {
          toast({
            variant: "destructive",
            title: "Erro ao salvar",
            description: error.message || "Não foi possível salvar a logo"
          });
        } finally {
          setIsUploadingLogo(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      setIsUploadingLogo(false);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao processar a imagem"
      });
    }

    // Limpar input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Função para selecionar logo local pré-definida
  const handleSelectLocalLogo = async (logoSrc: string) => {
    if (!lead?.planoAtual) return;
    
    setIsUploadingLogo(true);
    setShowLogoSelector(false);
    
    try {
      // Buscar a imagem local e converter para base64
      const response = await fetch(logoSrc);
      const blob = await response.blob();
      
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;
        
        try {
          const result = await uploadOperadoraLogo(lead.planoAtual!, base64);
          setCustomLogoUrl(result.logo.logoUrl);
          toast({
            title: "Logo vinculada!",
            description: `Logo vinculada ao plano "${lead.planoAtual}" com sucesso.`
          });
        } catch (error: any) {
          toast({
            variant: "destructive",
            title: "Erro ao vincular",
            description: error.message || "Não foi possível vincular a logo"
          });
        } finally {
          setIsUploadingLogo(false);
        }
      };
      reader.readAsDataURL(blob);
    } catch (error) {
      setIsUploadingLogo(false);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao carregar a logo"
      });
    }
  };

  // Filtrar logos locais pela busca
  const filteredLogos = LOGOS_LOCAIS.filter(logo => 
    logo.name.toLowerCase().includes(logoSearchTerm.toLowerCase())
  );

  // Carregar atividades e notas quando o modal abrir
  useEffect(() => {
    if (isOpen && leadId) {
      loadActivities();
      loadNotes();
    }
  }, [isOpen, leadId]);
  
  if (!lead) return null;
  
  const loadActivities = async () => {
    if (!leadId) return;
    try {
      setLoadingActivities(true);
      const data = await fetchLeadActivities(leadId);
      setActivities(data);
    } catch (error: any) {
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

  // --- CORREÇÃO AQUI: Lógica Híbrida (Objeto Novo ou Array Antigo) ---
  let faixasPreenchidas: { label: string; count: number }[] = [];
  
  // 1. Tenta usar o objeto novo (lead.faixasEtarias)
  if (lead.faixasEtarias) {
      const mapKeys = [
          { key: 'ate18', label: '0-18' },
          { key: 'de19a23', label: '19-23' },
          { key: 'de24a28', label: '24-28' },
          { key: 'de29a33', label: '29-33' },
          { key: 'de34a38', label: '34-38' },
          { key: 'de39a43', label: '39-43' },
          { key: 'de44a48', label: '44-48' },
          { key: 'de49a53', label: '49-53' },
          { key: 'de54a58', label: '54-58' },
          { key: 'acima59', label: '59+' }
      ];
      
      faixasPreenchidas = mapKeys.map(m => ({
          label: m.label,
          // @ts-ignore - Acesso dinâmico seguro
          count: (lead.faixasEtarias as any)[m.key] || 0
      })).filter(x => x.count > 0);
  } 
  // 2. Fallback para array antigo (lead.idades)
  else if (lead.idades && lead.idades.length > 0) {
      faixasPreenchidas = lead.idades.map((count, index) => ({
        label: FAIXAS_LABELS[index],
        count: count
      })).filter(item => item.count > 0);
  }
  // -----------------------------------------------------------------
  
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
              <div className="border rounded-lg p-4 bg-muted/30 flex items-center justify-between gap-4 relative">
                <div className="flex items-center gap-4">
                  {/* Input oculto para upload customizado */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                  
                  {/* Container da Logo - Clicável para abrir seletor */}
                  <div 
                    className={`h-20 w-28 rounded border bg-card flex items-center justify-center overflow-hidden shrink-0 relative group ${
                      !operadoraInfo && !customLogoUrl && canEdit && lead?.planoAtual ? 'cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors' : ''
                    }`}
                    onClick={() => {
                      // Só abre seletor se não tem logo e usuário pode editar
                      if (!operadoraInfo && !customLogoUrl && canEdit && lead?.planoAtual && !isUploadingLogo) {
                        setShowLogoSelector(true);
                        setLogoSearchTerm("");
                      }
                    }}
                    title={!operadoraInfo && !customLogoUrl && canEdit && lead?.planoAtual ? "Clique para adicionar logo" : undefined}
                  >
                    {isUploadingLogo ? (
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    ) : operadoraInfo ? (
                      <img 
                        src={operadoraInfo.src} 
                        alt={operadoraInfo.name}
                        className="h-full w-full object-contain p-2"
                        onError={(e) => e.currentTarget.style.display = 'none'}
                      />
                    ) : customLogoUrl ? (
                      <img 
                        src={customLogoUrl} 
                        alt={lead?.planoAtual || 'Logo'}
                        className="h-full w-full object-contain p-2"
                        onError={(e) => e.currentTarget.style.display = 'none'}
                      />
                    ) : lead?.planoAtual && canEdit ? (
                      <div className="flex flex-col items-center gap-1 text-muted-foreground group-hover:text-primary transition-colors">
                        <ImagePlus className="h-6 w-6" />
                        <span className="text-[9px] text-center">Adicionar logo</span>
                      </div>
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
                      {lead.valorMedio && lead.valorMedio > 0 
                        ? lead.valorMedio.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) 
                        : "0,00"}
                    </span>
                  </div>
                </div>

                {/* Modal/Popover de Seleção de Logo */}
                {showLogoSelector && (
                  <div className="absolute left-0 top-full mt-2 z-50 w-80 bg-card border rounded-lg shadow-lg p-3">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-semibold">Selecionar Logo</h4>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="h-6 w-6 p-0"
                        onClick={() => setShowLogoSelector(false)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    {/* Campo de busca */}
                    <input
                      type="text"
                      placeholder="Buscar operadora..."
                      value={logoSearchTerm}
                      onChange={(e) => setLogoSearchTerm(e.target.value)}
                      className="w-full px-3 py-2 text-sm border rounded-md mb-3 focus:outline-none focus:ring-2 focus:ring-primary"
                      autoFocus
                    />
                    
                    {/* Grid de logos */}
                    <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto mb-3">
                      {filteredLogos.map((logo) => (
                        <div
                          key={logo.id}
                          className="h-14 w-14 rounded border bg-white flex items-center justify-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors p-1"
                          onClick={() => handleSelectLocalLogo(logo.src)}
                          title={logo.name}
                        >
                          <img 
                            src={logo.src} 
                            alt={logo.name}
                            className="h-full w-full object-contain"
                          />
                        </div>
                      ))}
                    </div>
                    
                    {filteredLogos.length === 0 && (
                      <p className="text-xs text-muted-foreground text-center py-2">
                        Nenhuma operadora encontrada
                      </p>
                    )}
                    
                    {/* Opção de upload customizado */}
                    <Separator className="my-2" />
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full text-xs"
                      onClick={() => {
                        setShowLogoSelector(false);
                        fileInputRef.current?.click();
                      }}
                    >
                      <Upload className="h-3 w-3 mr-2" />
                      Enviar imagem personalizada
                    </Button>
                  </div>
                )}
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
                            <p className="text-sm flex-1 whitespace-pre-wrap" style={{ wordBreak: 'break-word' }}>
                              {note.conteudo ? note.conteudo.replace(/\\n/g, '\n') : ''}
                            </p>
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
                            {note.userName} • {new Date(note.createdAt).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })}
                          </p>
                        </>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-muted-foreground p-4 border rounded-lg bg-muted/30 whitespace-pre-wrap">
                    {lead.informacoes ? lead.informacoes.replace(/\\n/g, '\n') : "Nenhuma observação"}
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
                        {/* Usamos owner.foto que vem do backend */}
                        <AvatarImage 
                          src={owner.foto || ""} 
                          alt={owner.nome} 
                          className="object-cover"
                        />
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
                    {/* Fallback para lead antigo sem array de owners (apenas string nome) */}
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
                    {leadData.dataCriacao ? new Date(leadData.dataCriacao).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' }) : '-'}
                  </p>
                </div>
                <Separator />
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Última atividade:</p>
                  <p className="font-medium">
                    {lead.ultimaAtividade ? new Date(lead.ultimaAtividade).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' }) : '-'}
                  </p>
                </div>
              </div>
            </div>

            {/* Atividades Recentes */}
            <div className="space-y-3">
              <h3 className="text-base font-semibold">Atividades Recentes</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                {loadingActivities ? (
                  <div className="text-center py-4">
                    <Loader2 className="h-4 w-4 animate-spin mx-auto text-muted-foreground" />
                  </div>
                ) : activities.length > 0 ? (
                  activities.slice(0, 10).map((atividade) => (
                    <Dialog key={atividade._id}>
                      <DialogTrigger asChild>
                        {/* O Card agora é um botão clicável */}
                        <div 
                          className="p-3 bg-white border rounded-lg text-sm cursor-pointer hover:bg-gray-50 hover:shadow-sm transition-all group"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-wider">
                              {(atividade.tipo || '').replace(/_/g, ' ')}                         
                            </Badge>
                            <span className="text-[10px] text-muted-foreground">
                              {new Date(atividade.createdAt).toLocaleDateString('pt-BR', { 
                                day: '2-digit', 
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                          
                          {/* Esse texto agora será o principal indicador para clicar */}
                          <div className="text-[10px] text-blue-500 mt-1 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                            Ver detalhes →
                          </div>
                        </div>
                      </DialogTrigger>
                      
                      {/* A Janela que abre ao clicar */}
                      <DialogContent className="max-w-md sm:max-w-lg z-[9999]">
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2 text-base">
                            <Activity className="h-4 w-4 text-primary" />
                            Detalhes da Atividade
                          </DialogTitle>
                          <DialogDescription>
                            Registrado por <span className="font-semibold text-foreground">{atividade.userName || 'Sistema'}</span> em {new Date(atividade.createdAt).toLocaleString('pt-BR')}
                          </DialogDescription>
                        </DialogHeader>

                        <div className="mt-2">
                          <Badge variant="secondary" className="mb-4">
                            {(atividade.tipo || '').replace(/_/g, ' ')}
                          </Badge>
                          
                          <ScrollArea className="max-h-[50vh] rounded-md border p-4 bg-muted/20">
                            {/* whitespace-pre-wrap garante que os parágrafos não fiquem grudados */}
                            <p className="text-sm text-foreground whitespace-pre-wrap font-mono leading-relaxed">
                              {atividade.descricao}
                            </p>
                          </ScrollArea>
                        </div>
                      </DialogContent>
                    </Dialog>
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