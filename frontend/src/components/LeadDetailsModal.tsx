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
} from "lucide-react";

// Faixas Padrão ANS (Mapeiam os índices 0 a 9 do array)
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
  if (!lead) return null;

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
      'Qualificado': 'default', // Shadcn usa 'default', 'secondary', 'destructive'
      'Incompleto': 'secondary', // Warning n existe por padrão, usando secondary
      'Duplicado': 'outline',
      'Sem interesse': 'destructive'
    };
    return colors[status] || 'secondary';
  };

  const diasSemAtividade = lead.ultimaAtividade 
    ? Math.floor((Date.now() - new Date(lead.ultimaAtividade).getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  // LÓGICA CORRIGIDA:
  // Mapeia o array de contadores [0, 2, 5...] para objetos { label: "19-23", count: 2 }
  const faixasPreenchidas = (lead.idades || []).map((count, index) => ({
    label: FAIXAS_LABELS[index],
    count: count
  })).filter(item => item.count > 0); // Filtra para mostrar apenas as faixas que têm gente

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
                {lead.empresa && (
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Building className="h-3 w-3" />
                    {lead.empresa}
                  </p>
                )}
              </div>
            </div>
            <Button
              onClick={() => onEdit?.(lead)}
              size="sm"
              className="bg-primary hover:bg-primary/90 text-white"
            >
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          {/* Coluna Principal - Informações de Contato */}
          <div className="md:col-span-2 space-y-6">
            {/* Badges de Status */}
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

            {/* Informações de Contato */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Contato
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => window.open(`tel:${lead.celular}`, '_self')}
                  >
                    <Phone className="h-4 w-4 mr-2" />
                    {lead.celular}
                  </Button>
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => window.open(`mailto:${lead.email}`, '_self')}
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    {lead.email || 'Sem email'}
                  </Button>
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full justify-start hover:text-green-600 hover:border-green-600"
                    onClick={() => window.open(`https://wa.me/55${lead.celular.replace(/\D/g, '')}`, '_blank')}
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    WhatsApp
                  </Button>
                </div>
                {(lead as any).uf && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground px-3">
                    <MapPin className="h-4 w-4" />
                    {(lead as any).cidade}, {(lead as any).uf}
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Informações do Plano */}
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
                  <div className="flex flex-wrap gap-2">
                    {faixasPreenchidas.length > 0 ? (
                      faixasPreenchidas.map((item) => (
                        <Badge key={item.label} variant="outline" className="text-xs bg-slate-50">
                          {item.label}: <span className="font-bold ml-1">{item.count}</span>
                        </Badge>
                      ))
                    ) : (
                      <span className="text-xs">Nenhuma faixa registrada</span>
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
                  {lead.valorMedio > 0 && (
                    <p className="text-sm flex items-center gap-1 text-muted-foreground">
                      <DollarSign className="h-3 w-3" />
                      Estimado: {lead.valorMedio.toLocaleString('pt-BR', { 
                        style: 'currency', 
                        currency: 'BRL' 
                      })}
                    </p>
                  )}
                </div>
              )}

              {lead.hospitaisPreferencia && lead.hospitaisPreferencia.length > 0 && (
                <div className="space-y-2 pt-2">
                  <p className="text-sm font-medium text-muted-foreground">Hospitais de Preferência</p>
                  <div className="flex flex-wrap gap-1">
                    {lead.hospitaisPreferencia.map((hospital) => (
                      <Badge key={hospital} variant="secondary" className="text-xs">
                        {hospital}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {lead.informacoes && (
              <>
                <Separator />
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Observações
                  </h3>
                  <p className="text-sm text-muted-foreground bg-muted/50 p-4 rounded-lg leading-relaxed">
                    {lead.informacoes}
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Sidebar - Atividades e Timeline */}
          <div className="space-y-6">
            <div className="space-y-3">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Responsável
              </h3>
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

            {lead.atividades && lead.atividades.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-lg font-semibold">Atividades Recentes</h3>
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {lead.atividades.map((atividade) => (
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
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}