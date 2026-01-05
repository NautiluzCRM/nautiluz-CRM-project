import { Lead } from "@/types/crm";
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Save,
  X,
  Loader2
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { updateLeadApi } from "@/lib/api";

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
  if (text.includes('cassi')) return { src: '/logos/cassi.png', name: 'Cassi' }; // <--- CASSI ADICIONADA
  
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
  onUpdate?: () => void;
}

export function LeadDetailsModal({ lead, isOpen, onClose, onEdit, onUpdate }: LeadDetailsModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Campos editáveis
  const [editedPhone, setEditedPhone] = useState("");
  const [editedEmail, setEditedEmail] = useState("");
  const [editedAvgPrice, setEditedAvgPrice] = useState("");
  const [editedCurrentPlan, setEditedCurrentPlan] = useState("");
  const [editedNotes, setEditedNotes] = useState("");
  const [editedStatus, setEditedStatus] = useState("");
  const [editedCity, setEditedCity] = useState("");
  const [editedState, setEditedState] = useState("");

  // Sincroniza os valores quando o lead muda ou modal abre
  useEffect(() => {
    if (lead && isOpen) {
      setEditedPhone(lead.celular || "");
      setEditedEmail(lead.email || "");
      setEditedAvgPrice(lead.valorMedio?.toString() || "");
      setEditedCurrentPlan(lead.planoAtual || "");
      setEditedNotes(lead.informacoes || "");
      setEditedStatus(lead.statusQualificacao || "");
      setEditedCity(lead.cidade || "");
      setEditedState(lead.uf || "");
      setIsEditing(false);
    }
  }, [lead, isOpen]);

  if (!lead) return null;

  const leadData = lead as any;

  // --- LÓGICA DE PERMISSÃO ---
  const isAdmin = user?.role === 'admin';
  const currentUserId = user?.id || (user as any)?._id;
  const isOwner = (lead.ownersIds || []).some(id => id === currentUserId);
  const isLegacyOwner = (!lead.ownersIds || lead.ownersIds.length === 0) && lead.responsavel === user?.name;
  const canEdit = isAdmin || isOwner || isLegacyOwner;
  // ---------------------------

  const operadoraInfo = getOperadoraInfo(lead.planoAtual);

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
      'Qualificado': 'default', 
      'Incompleto': 'secondary',
      'Duplicado': 'outline',
      'Sem interesse': 'destructive'
    };
    return colors[status] || 'secondary';
  };

  const diasSemAtividade = lead.ultimaAtividade 
    ? Math.floor((Date.now() - new Date(lead.ultimaAtividade).getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  const faixasPreenchidas = (lead.idades || []).map((count, index) => ({
    label: FAIXAS_LABELS[index],
    count: count
  })).filter(item => item.count > 0);

  const handleCancelEditing = () => {
    // Restaura os valores originais
    setEditedPhone(lead.celular || "");
    setEditedEmail(lead.email || "");
    setEditedAvgPrice(lead.valorMedio?.toString() || "");
    setEditedCurrentPlan(lead.planoAtual || "");
    setEditedNotes(lead.informacoes || "");
    setEditedStatus(lead.statusQualificacao || "");
    setEditedCity(lead.cidade || "");
    setEditedState(lead.uf || "");
    setIsEditing(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateLeadApi(lead.id, {
        celular: editedPhone,
        email: editedEmail,
        valorMedio: parseFloat(editedAvgPrice) || 0,
        planoAtual: editedCurrentPlan,
        informacoes: editedNotes,
        statusQualificacao: editedStatus as Lead['statusQualificacao'],
        cidade: editedCity,
        uf: editedState,
      });

      toast({
        title: "Lead atualizado!",
        description: "As informações foram salvas com sucesso.",
      });

      setIsEditing(false);
      onUpdate?.();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao salvar",
        description: error?.message || "Não foi possível atualizar o lead.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[calc(100%-1rem)] max-w-4xl max-h-[90vh] overflow-y-auto p-4 sm:p-6 rounded-xl">
        <DialogHeader className="pb-2">
          <DialogTitle className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 sm:h-12 sm:w-12 shrink-0">
                <AvatarImage src="" alt={lead.nome} />
                <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                  {lead.nome.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <h2 className="text-lg sm:text-xl font-semibold truncate">{lead.nome}</h2>
                <p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1">
                  <Building className="h-3 w-3 shrink-0" />
                  <span className="truncate">{lead.empresa || "-"}</span>
                </p>
              </div>
            </div>
            
            {canEdit && !isEditing && (
              <Button
                onClick={() => setIsEditing(true)}
                size="sm"
                className="w-full sm:w-auto h-9"
              >
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </Button>
            )}

            {isEditing && (
              <div className="flex gap-2 w-full sm:w-auto">
                <Button
                  onClick={handleCancelEditing}
                  size="sm"
                  variant="outline"
                  disabled={isSaving}
                  className="flex-1 sm:flex-none h-9"
                >
                  <X className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Cancelar</span>
                </Button>
                <Button
                  onClick={handleSave}
                  size="sm"
                  className="flex-1 sm:flex-none bg-green-600 hover:bg-green-700 text-white h-9"
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Save className="h-4 w-4 sm:mr-2" />
                      <span className="hidden sm:inline">Salvar</span>
                    </>
                  )}
                </Button>
              </div>
            )}

          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mt-4">
          {/* Coluna Principal */}
          <div className="md:col-span-2 space-y-4 sm:space-y-6">
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              <Badge variant="outline" className={`text-xs ${getOrigemColor(lead.origem)}`}>
                {lead.origem}
              </Badge>
              {isEditing ? (
                <Select value={editedStatus} onValueChange={setEditedStatus}>
                  <SelectTrigger className="w-32 sm:w-40 h-6 text-xs">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Qualificado">Qualificado</SelectItem>
                    <SelectItem value="Incompleto">Incompleto</SelectItem>
                    <SelectItem value="Duplicado">Duplicado</SelectItem>
                    <SelectItem value="Sem interesse">Sem interesse</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                lead.statusQualificacao && (
                  <Badge variant={getStatusColor(lead.statusQualificacao) as any} className="text-xs">
                    {lead.statusQualificacao}
                  </Badge>
                )
              )}
              {diasSemAtividade > 0 && (
                <Badge variant="outline" className="flex items-center gap-1 text-muted-foreground text-xs">
                  <Clock className="h-3 w-3" />
                  {diasSemAtividade}d sem atividade
                </Badge>
              )}
            </div>

            <div className="space-y-2 sm:space-y-3">
              <h3 className="text-base sm:text-lg font-semibold flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Contato
              </h3>
              <div className="grid grid-cols-1 xs:grid-cols-2 gap-2 sm:gap-3">
                {isEditing ? (
                  <>
                    <div className="space-y-1">
                      <Label className="text-xs">Celular</Label>
                      <Input
                        value={editedPhone}
                        onChange={(e) => setEditedPhone(e.target.value)}
                        placeholder="(11) 99999-9999"
                        className="h-10"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Email</Label>
                      <Input
                        type="email"
                        value={editedEmail}
                        onChange={(e) => setEditedEmail(e.target.value)}
                        placeholder="email@exemplo.com"
                        className="h-10"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Cidade</Label>
                      <Input
                        value={editedCity}
                        onChange={(e) => setEditedCity(e.target.value)}
                        placeholder="Cidade"
                        className="h-10"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">UF</Label>
                      <Input
                        value={editedState}
                        onChange={(e) => setEditedState(e.target.value)}
                        placeholder="SP"
                        maxLength={2}
                        className="h-10"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <Button size="sm" variant="outline" className="w-full justify-start h-9 text-xs sm:text-sm" onClick={() => lead.celular && window.open(`tel:${lead.celular}`, '_self')} disabled={!lead.celular}>
                      <Phone className="h-3.5 w-3.5 mr-2 shrink-0" />
                      <span className="truncate">{lead.celular || "-"}</span>
                    </Button>
                    <Button size="sm" variant="outline" className="w-full justify-start h-9 text-xs sm:text-sm" onClick={() => lead.email && window.open(`mailto:${lead.email}`, '_self')} disabled={!lead.email}>
                      <Mail className="h-3.5 w-3.5 mr-2 shrink-0" />
                      <span className="truncate">{lead.email || "-"}</span>
                    </Button>
                    <Button size="sm" variant="outline" className="w-full justify-start h-9 text-xs sm:text-sm hover:text-green-600 hover:border-green-600" onClick={() => lead.celular && window.open(`https://wa.me/55${lead.celular.replace(/\D/g, '')}`, '_blank')} disabled={!lead.celular}>
                      <MessageCircle className="h-3.5 w-3.5 mr-2 shrink-0" />
                      WhatsApp
                    </Button>
                    <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground px-3 border rounded-md h-9">
                      <MapPin className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{leadData.cidade ? `${leadData.cidade}, ${leadData.uf}` : "-"}</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            <Separator />

            <div className="space-y-2 sm:space-y-3">
              <h3 className="text-base sm:text-lg font-semibold flex items-center gap-2">
                <Users className="h-4 w-4" />
                Informações do Plano
              </h3>
              
              {/* Vidas e Faixas */}
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-1.5">
                  <p className="text-xs sm:text-sm font-medium">Quantidade de Vidas</p>
                  <Badge variant="secondary" className="text-sm sm:text-lg px-3 sm:px-4 py-1 rounded-full">
                    {lead.quantidadeVidas} {lead.quantidadeVidas === 1 ? 'vida' : 'vidas'}
                  </Badge>
                </div>
                <div className="space-y-1.5">
                  <p className="text-xs sm:text-sm font-medium">Faixas Etárias</p>
                  <div className="flex flex-wrap gap-1">
                    {faixasPreenchidas.length > 0 ? (
                      faixasPreenchidas.map((item) => (
                        <Badge key={item.label} variant="outline" className="text-[10px] sm:text-xs bg-slate-50">
                          {item.label}: <span className="font-bold ml-1">{item.count}</span>
                        </Badge>
                      ))
                    ) : (
                      <span className="text-xs text-muted-foreground">-</span>
                    )}
                  </div>
                </div>
              </div>

              {/* GRID: CNPJ e Hospitais lado a lado */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 pt-2">
                  <div className="space-y-1">
                     <p className="text-xs font-medium uppercase">CNPJ</p>
                     <div className="flex items-center gap-2 text-xs sm:text-sm">
                        <Briefcase className="h-3.5 w-3.5 text-muted-foreground" />
                        {lead.possuiCnpj ? <span>Sim ({leadData.tipoCnpj || "N/A"})</span> : <span>Não</span>}
                     </div>
                  </div>

                  <div className="space-y-1.5">
                    <p className="text-xs font-medium uppercase">Hospitais de Preferência</p>
                    <div className="flex flex-wrap gap-1">
                      {lead.hospitaisPreferencia && lead.hospitaisPreferencia.length > 0 ? (
                        lead.hospitaisPreferencia.map((hospital) => (
                          <Badge key={hospital} variant="secondary" className="text-[10px] sm:text-xs">{hospital}</Badge>
                        ))
                      ) : (
                        <span className="text-xs sm:text-sm text-muted-foreground">-</span>
                      )}
                    </div>
                  </div>
              </div>

              {/* === CARD DE DESTAQUE (LOGO PREENCHENDO TUDO) === */}
              <div className="mt-3 sm:mt-4 mb-2 bg-slate-50 border border-slate-200 rounded-xl p-3 sm:p-4 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 shadow-sm">
                 {/* Lado Esquerdo: Plano */}
                 <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
                    {/* CONTAINER DA LOGO */}
                    <div className="h-16 w-24 sm:h-24 sm:w-36 rounded-lg bg-white border flex items-center justify-center shadow-sm shrink-0 overflow-hidden relative">
                       {operadoraInfo ? (
                         <img 
                           src={operadoraInfo.src} 
                           alt={operadoraInfo.name}
                           className="h-full w-full object-cover"
                           onError={(e) => e.currentTarget.style.display = 'none'}
                         />
                       ) : (
                         <Shield className="h-8 w-8 sm:h-10 sm:w-10 text-slate-300" />
                       )}
                    </div>
                    <div className="flex-1 min-w-0">
                       <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider mb-0.5">Plano Atual</p>
                       {isEditing ? (
                         <Input
                           value={editedCurrentPlan}
                           onChange={(e) => setEditedCurrentPlan(e.target.value)}
                           placeholder="Nome do plano"
                           className="mt-1 h-9"
                         />
                       ) : (
                         <h4 className="text-sm sm:text-lg font-bold text-slate-800 leading-tight truncate">
                           {lead.planoAtual || "Sem plano atual"}
                         </h4>
                       )}
                    </div>
                 </div>

                 {/* Divisor Desktop */}
                 <div className="hidden sm:block w-px h-10 bg-slate-200"></div>
                 {/* Divisor Mobile */}
                 <div className="sm:hidden w-full h-px bg-slate-200"></div>

                 {/* Lado Direito: Valor */}
                 <div className="w-full sm:w-auto text-left sm:text-right">
                    <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider mb-0.5">Valor Estimado</p>
                    {isEditing ? (
                      <div className="flex items-center gap-1">
                        <span className="text-xs sm:text-sm font-medium text-emerald-600">R$</span>
                        <Input
                          type="number"
                          value={editedAvgPrice}
                          onChange={(e) => setEditedAvgPrice(e.target.value)}
                          placeholder="0.00"
                          className="w-28 sm:w-32 h-9"
                        />
                      </div>
                    ) : (
                      <div className="flex items-baseline sm:justify-end gap-1">
                         <span className="text-xs sm:text-sm font-medium text-emerald-600">R$</span>
                         <span className="text-xl sm:text-2xl font-bold text-emerald-600">
                           {lead.valorMedio && lead.valorMedio > 0 
                             ? lead.valorMedio.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) 
                             : "0,00"}
                         </span>
                      </div>
                    )}
                 </div>
              </div>

            </div>

            <Separator />
            
            <div className="space-y-2 sm:space-y-3">
                <h3 className="text-base sm:text-lg font-semibold flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Observações
                </h3>
                {isEditing ? (
                  <Textarea
                    value={editedNotes}
                    onChange={(e) => setEditedNotes(e.target.value)}
                    placeholder="Observações sobre o lead..."
                    className="min-h-[80px] sm:min-h-[100px] text-sm"
                  />
                ) : (
                  <p className="text-xs sm:text-sm text-muted-foreground bg-muted/50 p-3 sm:p-4 rounded-lg leading-relaxed">
                    {lead.informacoes || "-"}
                  </p>
                )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4 sm:space-y-6">
            <div className="space-y-2 sm:space-y-3">
              <h3 className="text-base sm:text-lg font-semibold flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Responsável
              </h3>
              {leadData.owners && leadData.owners.length > 0 ? (
                <div className="flex flex-col gap-2">
                  {leadData.owners.map((owner: any) => (
                    <div key={owner.id} className="flex items-center gap-2 sm:gap-3 p-2 bg-muted/30 border rounded-lg">
                      <Avatar className="h-7 w-7 sm:h-8 sm:w-8">
                        <AvatarImage src="" alt={owner.nome} />
                        <AvatarFallback className="bg-primary text-primary-foreground text-[10px] sm:text-xs">
                          {owner.nome.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="overflow-hidden flex-1 min-w-0">
                        <p className="text-xs sm:text-sm font-medium truncate">{owner.nome}</p>
                        <p className="text-[10px] text-muted-foreground">Vendedor</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-muted/30 border rounded-lg">
                  <Avatar className="h-7 w-7 sm:h-8 sm:w-8">
                    <AvatarImage src="" alt={lead.responsavel || "Vendedor"} />
                    <AvatarFallback className="bg-primary text-primary-foreground text-[10px] sm:text-xs">
                      {(lead.responsavel || "VD").substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm font-medium truncate">{lead.responsavel || "Não atribuído"}</p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground">Vendedor</p>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2 sm:space-y-3">
              <h3 className="text-base sm:text-lg font-semibold flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Datas Importantes
              </h3>
              <div className="space-y-2 sm:space-y-3 text-xs sm:text-sm bg-muted/30 border p-2.5 sm:p-3 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Criado em:</span>
                  <span className="font-medium">
                    {lead.dataCriacao ? new Date(lead.dataCriacao).toLocaleDateString('pt-BR') : '-'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Última atividade:</span>
                  <span className="font-medium">
                    {lead.ultimaAtividade ? new Date(lead.ultimaAtividade).toLocaleDateString('pt-BR') : '-'}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-2 sm:space-y-3">
                <h3 className="text-base sm:text-lg font-semibold">Atividades Recentes</h3>
                <div className="space-y-2 max-h-48 sm:max-h-64 overflow-y-auto pr-1">
                {lead.atividades && lead.atividades.length > 0 ? (
                    lead.atividades.map((atividade) => (
                    <div key={atividade.id} className="p-2.5 sm:p-3 bg-muted/50 border rounded-lg text-xs sm:text-sm">
                        <div className="flex items-center justify-between mb-1">
                        <Badge variant="outline" className="text-[9px] sm:text-[10px] px-1 py-0 h-4 sm:h-5">
                            {atividade.tipo}
                        </Badge>
                        <span className="text-[9px] sm:text-[10px] text-muted-foreground">
                            {new Date(atividade.data).toLocaleDateString('pt-BR')}
                        </span>
                        </div>
                        <p className="text-muted-foreground text-[10px] sm:text-xs mt-1 line-clamp-2">{atividade.descricao}</p>
                    </div>
                    ))
                ) : (
                    <div className="text-[10px] sm:text-xs text-muted-foreground p-2.5 sm:p-3 border border-dashed rounded-lg text-center">
                    Nenhuma atividade registrada
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