import { Lead } from "@/types/crm";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
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
  DollarSign,
  Clock,
  CheckCircle,
  Briefcase
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

const FAIXAS_LABELS = [
  "0-18", "19-23", "24-28", "29-33", "34-38",
  "39-43", "44-48", "49-53", "54-58", "59+"
];

interface LeadDetailsModalProps {
  lead: Lead | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (lead: Lead) => void;
}

export function LeadDetailsModal({ lead, isOpen, onClose, onEdit }: LeadDetailsModalProps) {
  const { user } = useAuth();

  if (!lead) return null;

  const leadData = lead as any;

  // --- CORREÇÃO DA PERMISSÃO DE EDIÇÃO ---
  const isAdmin = user?.role === 'admin';
  
  // 1. Pega o ID do usuário de forma segura (id ou _id)
  const currentUserId = user?.id || (user as any)?._id;
  
  // 2. Verifica se o ID está na lista de donos
  const isOwner = (lead.ownersIds || []).some(id => id === currentUserId);
  
  // 3. Fallback: Se não tiver lista de IDs, verifica pelo nome (sistema antigo)
  const isLegacyOwner = (!lead.ownersIds || lead.ownersIds.length === 0) && lead.responsavel === user?.name;

  const canEdit = isAdmin || isOwner || isLegacyOwner;
  // ---------------------------------------

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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src="" alt={lead.nome} />
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {lead.nome.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-xl font-semibold">{lead.nome}</h2>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Building className="h-3 w-3" />
                  {lead.empresa || "-"}
                </p>
              </div>
            </div>
            
            {/* Botão Editar (Agora aparece corretamente para o dono) */}
            {canEdit && (
              <Button
                onClick={() => onEdit?.(lead)}
                size="sm"
                className="bg-primary hover:bg-primary/90 text-white"
              >
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </Button>
            )}

          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          {/* Coluna Principal */}
          <div className="md:col-span-2 space-y-6">
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className={getOrigemColor(lead.origem)}>
                {lead.origem}
              </Badge>
              {lead.statusQualificacao && (
                <Badge variant={getStatusColor(lead.statusQualificacao) as any}>
                  {lead.statusQualificacao}
                </Badge>
              )}
              {diasSemAtividade > 0 && (
                <Badge variant="outline" className="flex items-center gap-1 text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {diasSemAtividade}d sem atividade
                </Badge>
              )}
            </div>

            <div className="space-y-3">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Contato
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <Button size="sm" variant="outline" className="w-full justify-start" onClick={() => lead.celular && window.open(`tel:${lead.celular}`, '_self')} disabled={!lead.celular}>
                    <Phone className="h-4 w-4 mr-2" />
                    {lead.celular || "-"}
                  </Button>
                </div>
                <div className="flex items-center gap-3">
                  <Button size="sm" variant="outline" className="w-full justify-start" onClick={() => lead.email && window.open(`mailto:${lead.email}`, '_self')} disabled={!lead.email}>
                    <Mail className="h-4 w-4 mr-2" />
                    {lead.email || "-"}
                  </Button>
                </div>
                <div className="flex items-center gap-3">
                  <Button size="sm" variant="outline" className="w-full justify-start hover:text-green-600 hover:border-green-600" onClick={() => lead.celular && window.open(`https://wa.me/55${lead.celular.replace(/\D/g, '')}`, '_blank')} disabled={!lead.celular}>
                    <MessageCircle className="h-4 w-4 mr-2" />
                    WhatsApp
                  </Button>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground px-3 border rounded-md h-9">
                   <MapPin className="h-4 w-4" />
                   {leadData.cidade ? `${leadData.cidade}, ${leadData.uf}` : "-"}
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Users className="h-4 w-4" />
                Informações do Plano
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium">Quantidade de Vidas</p>
                  <Badge variant="secondary" className="text-lg px-4 py-1 rounded-full">
                    {lead.quantidadeVidas} {lead.quantidadeVidas === 1 ? 'vida' : 'vidas'}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Faixas Etárias</p>
                  <div className="flex flex-wrap gap-1">
                    {faixasPreenchidas.length > 0 ? (
                      faixasPreenchidas.map((item) => (
                        <Badge key={item.label} variant="outline" className="text-xs bg-slate-50">
                          {item.label}: <span className="font-bold ml-1">{item.count}</span>
                        </Badge>
                      ))
                    ) : (
                      <span className="text-xs text-muted-foreground">-</span>
                    )}
                  </div>
                </div>
              </div>

              {lead.possuiPlano && (
                <div className="bg-green-50/50 border border-green-100 p-4 rounded-lg space-y-2 mt-4">
                  <p className="text-sm font-medium flex items-center gap-2 text-green-700">
                    <CheckCircle className="h-4 w-4" />
                    Plano Atual
                  </p>
                  <p className="text-sm font-semibold">{lead.planoAtual}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 pt-2">
                 <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground uppercase">CNPJ</p>
                    <div className="flex items-center gap-2 text-sm">
                       <Briefcase className="h-4 w-4 text-muted-foreground" />
                       {lead.possuiCnpj ? <span>Sim ({leadData.tipoCnpj || "N/A"})</span> : <span>Não</span>}
                    </div>
                 </div>
                 <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground uppercase">Valor Estimado</p>
                    <div className="flex items-center gap-2 text-sm">
                       <DollarSign className="h-4 w-4 text-muted-foreground" />
                       {lead.valorMedio > 0 ? lead.valorMedio.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : "-"}
                    </div>
                 </div>
              </div>

              <div className="space-y-2 pt-2">
                <p className="text-sm font-medium text-muted-foreground">Hospitais de Preferência</p>
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

            <Separator />
            
            <div className="space-y-3">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Observações
                </h3>
                <p className="text-sm text-muted-foreground bg-muted/50 p-4 rounded-lg leading-relaxed">
                {lead.informacoes || "-"}
                </p>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="space-y-3">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Responsável
              </h3>
              {leadData.owners && leadData.owners.length > 0 ? (
                <div className="flex flex-col gap-2">
                  {leadData.owners.map((owner: any) => (
                    <div key={owner.id} className="flex items-center gap-3 p-2 bg-muted/30 border rounded-lg">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src="" alt={owner.nome} />
                        <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                          {owner.nome.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="overflow-hidden">
                        <p className="text-sm font-medium truncate">{owner.nome}</p>
                        <p className="text-[10px] text-muted-foreground">Vendedor</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center gap-3 p-3 bg-muted/30 border rounded-lg">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="" alt={lead.responsavel || "Vendedor"} />
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs">
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

            <div className="space-y-3">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Datas Importantes
              </h3>
              <div className="space-y-3 text-sm bg-muted/30 border p-3 rounded-lg">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Criado em:</span>
                  <span className="font-medium">
                    {lead.dataCriacao ? new Date(lead.dataCriacao).toLocaleDateString('pt-BR') : '-'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Última atividade:</span>
                  <span className="font-medium">
                    {lead.ultimaAtividade ? new Date(lead.ultimaAtividade).toLocaleDateString('pt-BR') : '-'}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
                <h3 className="text-lg font-semibold">Atividades Recentes</h3>
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {lead.atividades && lead.atividades.length > 0 ? (
                    lead.atividades.map((atividade) => (
                    <div key={atividade.id} className="p-3 bg-muted/50 border rounded-lg text-sm">
                        <div className="flex items-center justify-between mb-1">
                        <Badge variant="outline" className="text-[10px] px-1 py-0 h-5">
                            {atividade.tipo}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground">
                            {new Date(atividade.data).toLocaleDateString('pt-BR')}
                        </span>
                        </div>
                        <p className="text-muted-foreground text-xs mt-1 line-clamp-2">{atividade.descricao}</p>
                    </div>
                    ))
                ) : (
                    <div className="text-xs text-muted-foreground p-3 border border-dashed rounded-lg text-center">
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