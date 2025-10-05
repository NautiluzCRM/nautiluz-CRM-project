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
  ExternalLink,
  MapPin,
  FileText,
  Activity,
  DollarSign,
  Clock,
  CheckCircle,
} from "lucide-react";

interface LeadDetailsModalProps {
  lead: Lead | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (lead: Lead) => void;
}

export function LeadDetailsModal({ lead, isOpen, onClose, onEdit }: LeadDetailsModalProps) {
  if (!lead) return null;

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
      'Qualificado': 'success',
      'Incompleto': 'warning',
      'Duplicado': 'secondary',
      'Sem interesse': 'destructive'
    };
    return colors[status as keyof typeof colors] || 'secondary';
  };

  const diasSemAtividade = Math.floor(
    (Date.now() - lead.ultimaAtividade.getTime()) / (1000 * 60 * 60 * 24)
  );

  const faixasEtarias = lead.idades.reduce((acc, idade) => {
    const faixa = idade < 19 ? '0-18' : 
                 idade < 24 ? '19-23' :
                 idade < 29 ? '24-28' :
                 idade < 34 ? '29-33' :
                 idade < 39 ? '34-38' :
                 idade < 44 ? '39-43' :
                 idade < 49 ? '44-48' :
                 idade < 54 ? '49-53' :
                 idade < 59 ? '54-58' : '59+';
    acc[faixa] = (acc[faixa] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src="" alt={lead.nome} />
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {lead.nome.split(' ').map(n => n[0]).join('').substring(0, 2)}
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
              className="bg-gradient-primary hover:bg-primary-hover"
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
              <Badge variant={getStatusColor(lead.statusQualificacao) as any}>
                {lead.statusQualificacao}
              </Badge>
              {diasSemAtividade > 0 && (
                <Badge variant="outline" className="flex items-center gap-1">
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
                    onClick={() => window.open(`mailto:${lead.email}`, '_self')}
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    {lead.email}
                  </Button>
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(`https://wa.me/55${lead.celular.replace(/\D/g, '')}`, '_blank')}
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    WhatsApp
                  </Button>
                </div>
                {lead.uf && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    {lead.cidade}, {lead.uf}
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
                  <Badge variant="outline" className="text-lg px-3 py-1">
                    {lead.quantidadeVidas} vida{lead.quantidadeVidas > 1 ? 's' : ''}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Faixas Etárias</p>
                  <div className="flex flex-wrap gap-1">
                    {Object.entries(faixasEtarias).map(([faixa, count]) => (
                      <Badge key={faixa} variant="secondary" className="text-xs">
                        {faixa}: {count}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              {lead.possuiPlano && (
                <div className="bg-muted p-4 rounded-lg space-y-2">
                  <p className="text-sm font-medium flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-success" />
                    Plano Atual
                  </p>
                  <p className="text-sm">{lead.planoAtual}</p>
                  {lead.valorMedio && (
                    <p className="text-sm flex items-center gap-1">
                      <DollarSign className="h-3 w-3" />
                      {lead.valorMedio.toLocaleString('pt-BR', { 
                        style: 'currency', 
                        currency: 'BRL' 
                      })}/mês
                    </p>
                  )}
                </div>
              )}

              {lead.hospitaisPreferencia.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Hospitais de Preferência</p>
                  <div className="flex flex-wrap gap-1">
                    {lead.hospitaisPreferencia.map((hospital) => (
                      <Badge key={hospital} variant="outline" className="text-xs">
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
                  <p className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
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
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="" alt={lead.responsavel} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                    {lead.responsavel.split(' ').map(n => n[0]).join('').substring(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">{lead.responsavel}</p>
                  <p className="text-xs text-muted-foreground">Vendedor</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Datas Importantes
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Criado em:</span>
                  <span>{lead.dataCriacao.toLocaleDateString('pt-BR')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Última atividade:</span>
                  <span>{lead.ultimaAtividade.toLocaleDateString('pt-BR')}</span>
                </div>
              </div>
            </div>

            {lead.atividades.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-lg font-semibold">Atividades Recentes</h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {lead.atividades.map((atividade) => (
                    <div key={atividade.id} className="p-3 bg-muted rounded-lg text-sm">
                      <div className="flex items-center justify-between mb-1">
                        <Badge variant="outline" className="text-xs">
                          {atividade.tipo}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {atividade.data.toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                      <p className="text-muted-foreground">{atividade.descricao}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        por {atividade.usuario}
                      </p>
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