import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Calendar as CalendarIcon,
  Plus,
  Filter,
  Clock,
  Users,
  Phone,
  Video,
  MapPin,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface Evento {
  id: string;
  titulo: string;
  tipo: 'ligacao' | 'reuniao' | 'follow-up' | 'cotacao';
  leadNome: string;
  leadId: string;
  dataHora: Date;
  duracao: number; // em minutos
  local?: string;
  descricao?: string;
  status: 'agendado' | 'concluido' | 'cancelado';
  responsavel: string;
}

const Calendario = () => {
  const [dataAtual, setDataAtual] = useState(new Date());
  const [visualizacao, setVisualizacao] = useState<'mes' | 'semana' | 'dia'>('mes');
  const [eventosFiltrados, setEventosFiltrados] = useState<string>('todos');

  const eventos: Evento[] = [
    {
      id: '1',
      titulo: 'Ligação de Follow-up',
      tipo: 'ligacao',
      leadNome: 'Maria Silva Santos',
      leadId: '1',
      dataHora: new Date(2024, 0, 15, 10, 0),
      duracao: 30,
      descricao: 'Acompanhar interesse na proposta enviada',
      status: 'agendado',
      responsavel: 'João Silva'
    },
    {
      id: '2',
      titulo: 'Reunião Comercial',
      tipo: 'reuniao',
      leadNome: 'Carlos Eduardo Oliveira',
      leadId: '2',
      dataHora: new Date(2024, 0, 16, 14, 30),
      duracao: 60,
      local: 'Escritório Nautiluz',
      descricao: 'Apresentação da proposta de plano empresarial',
      status: 'agendado',
      responsavel: 'Ana Costa'
    },
    {
      id: '3',
      titulo: 'Cotação - Família Premium',
      tipo: 'cotacao',
      leadNome: 'Roberto Fernandes',
      leadId: '4',
      dataHora: new Date(2024, 0, 17, 9, 0),
      duracao: 45,
      descricao: 'Elaborar cotação personalizada para família de 6 pessoas',
      status: 'agendado',
      responsavel: 'João Silva'
    },
    {
      id: '4',
      titulo: 'Follow-up Proposta',
      tipo: 'follow-up',
      leadNome: 'Luciana Moreira',
      leadId: '5',
      dataHora: new Date(2024, 0, 18, 11, 0),
      duracao: 30,
      descricao: 'Verificar feedback da proposta empresarial',
      status: 'concluido',
      responsavel: 'Ana Costa'
    },
  ];

  const getTipoColor = (tipo: string) => {
    const cores = {
      'ligacao': 'bg-blue-100 text-blue-700',
      'reuniao': 'bg-purple-100 text-purple-700',
      'follow-up': 'bg-green-100 text-green-700',
      'cotacao': 'bg-orange-100 text-orange-700'
    };
    return cores[tipo as keyof typeof cores] || 'bg-gray-100 text-gray-700';
  };

  const getTipoIcon = (tipo: string) => {
    const icones = {
      'ligacao': Phone,
      'reuniao': Video,
      'follow-up': Clock,
      'cotacao': Users
    };
    return icones[tipo as keyof typeof icones] || Clock;
  };

  const getStatusColor = (status: string) => {
    const cores = {
      'agendado': 'secondary',
      'concluido': 'success',
      'cancelado': 'destructive'
    };
    return cores[status as keyof typeof cores] || 'secondary';
  };

  const eventosHoje = eventos.filter(evento => {
    const hoje = new Date();
    return evento.dataHora.toDateString() === hoje.toDateString();
  });

  const proximosEventos = eventos
    .filter(evento => evento.dataHora > new Date())
    .sort((a, b) => a.dataHora.getTime() - b.dataHora.getTime())
    .slice(0, 5);

  const gerarDiasDoMes = () => {
    const ano = dataAtual.getFullYear();
    const mes = dataAtual.getMonth();
    const primeiroDia = new Date(ano, mes, 1);
    const ultimoDia = new Date(ano, mes + 1, 0);
    const diasDoMes = [];

    // Adicionar dias vazios do início
    for (let i = 0; i < primeiroDia.getDay(); i++) {
      diasDoMes.push(null);
    }

    // Adicionar dias do mês
    for (let dia = 1; dia <= ultimoDia.getDate(); dia++) {
      diasDoMes.push(new Date(ano, mes, dia));
    }

    return diasDoMes;
  };

  const getEventosParaDia = (data: Date) => {
    return eventos.filter(evento => 
      evento.dataHora.toDateString() === data.toDateString()
    );
  };

  const navegarMes = (direcao: 'anterior' | 'proximo') => {
    const novaData = new Date(dataAtual);
    novaData.setMonth(dataAtual.getMonth() + (direcao === 'proximo' ? 1 : -1));
    setDataAtual(novaData);
  };

  return (
    <>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="bg-card border-b border-border p-4 sm:p-6 shadow-card">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-4">
            <div>
              <h1 className="text-lg sm:text-2xl font-bold text-foreground">Calendário</h1>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Gerencie compromissos e atividades de vendas
              </p>
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button className="bg-gradient-primary hover:bg-primary-hover h-9 sm:h-10 text-xs sm:text-sm w-full sm:w-auto">
                  <Plus className="h-4 w-4 sm:mr-2" />
                  <span className="sm:inline">Novo Evento</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="w-[calc(100%-1rem)] max-w-md p-4 sm:p-6">
                <DialogHeader>
                  <DialogTitle className="text-lg">Novo Evento</DialogTitle>
                </DialogHeader>
                <div className="space-y-3 sm:space-y-4">
                  <div className="space-y-1.5 sm:space-y-2">
                    <Label htmlFor="titulo" className="text-xs sm:text-sm">Título</Label>
                    <Input id="titulo" placeholder="Ex: Reunião com cliente" className="h-9 sm:h-10 text-sm" />
                  </div>
                  <div className="space-y-1.5 sm:space-y-2">
                    <Label htmlFor="tipo" className="text-xs sm:text-sm">Tipo</Label>
                    <Select>
                      <SelectTrigger className="h-9 sm:h-10 text-sm">
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ligacao">Ligação</SelectItem>
                        <SelectItem value="reuniao">Reunião</SelectItem>
                        <SelectItem value="follow-up">Follow-up</SelectItem>
                        <SelectItem value="cotacao">Cotação</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    <div className="space-y-1.5 sm:space-y-2">
                      <Label htmlFor="data" className="text-xs sm:text-sm">Data</Label>
                      <Input id="data" type="date" className="h-9 sm:h-10 text-sm" />
                    </div>
                    <div className="space-y-1.5 sm:space-y-2">
                      <Label htmlFor="hora" className="text-xs sm:text-sm">Hora</Label>
                      <Input id="hora" type="time" className="h-9 sm:h-10 text-sm" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="descricao">Descrição</Label>
                    <Textarea id="descricao" placeholder="Detalhes do evento..." />
                  </div>
                  <Button className="w-full bg-gradient-primary hover:bg-primary-hover">
                    Criar Evento
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Select value={visualizacao} onValueChange={(value: any) => setVisualizacao(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dia">Dia</SelectItem>
                  <SelectItem value="semana">Semana</SelectItem>
                  <SelectItem value="mes">Mês</SelectItem>
                </SelectContent>
              </Select>

              <Select value={eventosFiltrados} onValueChange={setEventosFiltrados}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os Eventos</SelectItem>
                  <SelectItem value="ligacao">Ligações</SelectItem>
                  <SelectItem value="reuniao">Reuniões</SelectItem>
                  <SelectItem value="follow-up">Follow-ups</SelectItem>
                  <SelectItem value="cotacao">Cotações</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => navegarMes('anterior')}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-lg font-semibold min-w-48 text-center">
                {dataAtual.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
              </span>
              <Button variant="outline" size="sm" onClick={() => navegarMes('proximo')}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 overflow-auto">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Calendário Principal */}
            <div className="lg:col-span-3">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CalendarIcon className="h-5 w-5" />
                    {dataAtual.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {visualizacao === 'mes' && (
                    <div className="grid grid-cols-7 gap-1">
                      {/* Cabeçalho dos dias da semana */}
                      {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'].map(dia => (
                        <div key={dia} className="p-2 text-center text-sm font-medium text-muted-foreground">
                          {dia}
                        </div>
                      ))}
                      
                      {/* Dias do mês */}
                      {gerarDiasDoMes().map((data, index) => (
                        <div
                          key={index}
                          className={`
                            min-h-24 p-1 border border-border rounded
                            ${data ? 'hover:bg-muted/50 cursor-pointer' : ''}
                            ${data && data.toDateString() === new Date().toDateString() ? 'bg-primary/10 border-primary' : ''}
                          `}
                        >
                          {data && (
                            <>
                              <div className="text-sm font-medium p-1">
                                {data.getDate()}
                              </div>
                              <div className="space-y-1">
                                {getEventosParaDia(data).slice(0, 2).map(evento => {
                                  const TipoIcon = getTipoIcon(evento.tipo);
                                  return (
                                    <div
                                      key={evento.id}
                                      className={`text-xs p-1 rounded truncate ${getTipoColor(evento.tipo)}`}
                                    >
                                      <div className="flex items-center gap-1">
                                        <TipoIcon className="h-2 w-2" />
                                        <span className="truncate">{evento.titulo}</span>
                                      </div>
                                    </div>
                                  );
                                })}
                                {getEventosParaDia(data).length > 2 && (
                                  <div className="text-xs text-muted-foreground p-1">
                                    +{getEventosParaDia(data).length - 2} mais
                                  </div>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar - Próximos Eventos */}
            <div className="space-y-6">
              {/* Eventos de Hoje */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Hoje</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {eventosHoje.length > 0 ? (
                    eventosHoje.map(evento => {
                      const TipoIcon = getTipoIcon(evento.tipo);
                      return (
                        <div key={evento.id} className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                          <div className={`p-2 rounded ${getTipoColor(evento.tipo)}`}>
                            <TipoIcon className="h-4 w-4" />
                          </div>
                          <div className="flex-1 space-y-1">
                            <h4 className="font-medium text-sm">{evento.titulo}</h4>
                            <p className="text-xs text-muted-foreground">{evento.leadNome}</p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              {evento.dataHora.toLocaleTimeString('pt-BR', { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </div>
                            <Badge variant={getStatusColor(evento.status) as any} className="text-xs">
                              {evento.status}
                            </Badge>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Nenhum evento hoje
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Próximos Eventos */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Próximos Eventos</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {proximosEventos.map(evento => {
                    const TipoIcon = getTipoIcon(evento.tipo);
                    return (
                      <div key={evento.id} className="flex items-start gap-3 p-3 border border-border rounded-lg">
                        <div className={`p-2 rounded ${getTipoColor(evento.tipo)}`}>
                          <TipoIcon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 space-y-1">
                          <h4 className="font-medium text-sm">{evento.titulo}</h4>
                          <p className="text-xs text-muted-foreground">{evento.leadNome}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {evento.dataHora.toLocaleDateString('pt-BR', { 
                              timeZone: 'America/Sao_Paulo',
                              day: '2-digit', 
                              month: '2-digit' 
                            })} às {evento.dataHora.toLocaleTimeString('pt-BR', { 
                              timeZone: 'America/Sao_Paulo',
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </div>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-5 w-5">
                              <AvatarImage src="" alt={evento.responsavel} />
                              <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                                {evento.responsavel.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-xs text-muted-foreground">{evento.responsavel}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Calendario;