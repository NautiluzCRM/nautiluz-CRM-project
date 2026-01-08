import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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
import {
  Target,
  Plus,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Calendar,
  Award,
  AlertCircle,
  CheckCircle,
} from "lucide-react";

interface Meta {
  id: string;
  titulo: string;
  tipo: 'receita' | 'leads' | 'conversao' | 'tempo';
  periodo: 'mensal' | 'trimestral' | 'anual';
  valorMeta: number;
  valorAtual: number;
  unidade: string;
  responsavel: string;
  dataInicio: Date;
  dataFim: Date;
  status: 'ativo' | 'pausado' | 'concluido';
  descricao?: string;
}

const Metas = () => {
  const [periodoFiltro, setPeriodoFiltro] = useState<string>('todos');
  const [statusFiltro, setStatusFiltro] = useState<string>('todos');

  const metas: Meta[] = [
    {
      id: '1',
      titulo: 'Receita Mensal Janeiro',
      tipo: 'receita',
      periodo: 'mensal',
      valorMeta: 200000,
      valorAtual: 170000,
      unidade: 'R$',
      responsavel: 'Equipe Vendas',
      dataInicio: new Date(2024, 0, 1),
      dataFim: new Date(2024, 0, 31),
      status: 'ativo',
      descricao: 'Meta de receita para o mês de janeiro'
    },
    {
      id: '2',
      titulo: 'Novos Leads Janeiro',
      tipo: 'leads',
      periodo: 'mensal',
      valorMeta: 100,
      valorAtual: 85,
      unidade: 'leads',
      responsavel: 'João Silva',
      dataInicio: new Date(2024, 0, 1),
      dataFim: new Date(2024, 0, 31),
      status: 'ativo',
      descricao: 'Capturar 100 novos leads qualificados'
    },
    {
      id: '3',
      titulo: 'Taxa de Conversão Q1',
      tipo: 'conversao',
      periodo: 'trimestral',
      valorMeta: 25,
      valorAtual: 22,
      unidade: '%',
      responsavel: 'Ana Costa',
      dataInicio: new Date(2024, 0, 1),
      dataFim: new Date(2024, 2, 31),
      status: 'ativo',
      descricao: 'Atingir 25% de taxa de conversão no primeiro trimestre'
    },
    {
      id: '4',
      titulo: 'Tempo Primeira Resposta',
      tipo: 'tempo',
      periodo: 'mensal',
      valorMeta: 2,
      valorAtual: 1.8,
      unidade: 'horas',
      responsavel: 'Carlos Santos',
      dataInicio: new Date(2024, 0, 1),
      dataFim: new Date(2024, 0, 31),
      status: 'ativo',
      descricao: 'Manter tempo de primeira resposta abaixo de 2 horas'
    }
  ];

  const ranking = [
    { nome: 'Ana Costa', meta: 25000, atual: 28000, posicao: 1 },
    { nome: 'João Silva', meta: 20000, atual: 22000, posicao: 2 },
    { nome: 'Carlos Santos', meta: 18000, atual: 16000, posicao: 3 },
    { nome: 'Maria Oliveira', meta: 15000, atual: 12000, posicao: 4 },
  ];

  const metasFiltradas = metas.filter(meta => {
    const matchesPeriodo = periodoFiltro === 'todos' || meta.periodo === periodoFiltro;
    const matchesStatus = statusFiltro === 'todos' || meta.status === statusFiltro;
    return matchesPeriodo && matchesStatus;
  });

  const calcularProgresso = (atual: number, meta: number) => {
    return Math.min((atual / meta) * 100, 100);
  };

  const getStatusIcon = (progresso: number) => {
    if (progresso >= 100) return CheckCircle;
    if (progresso >= 80) return TrendingUp;
    if (progresso >= 60) return Target;
    return AlertCircle;
  };

  const getStatusColor = (progresso: number) => {
    if (progresso >= 100) return 'text-success';
    if (progresso >= 80) return 'text-primary';
    if (progresso >= 60) return 'text-warning';
    return 'text-destructive';
  };

  const getTipoIcon = (tipo: string) => {
    const icones = {
      'receita': DollarSign,
      'leads': Users,
      'conversao': Target,
      'tempo': Calendar
    };
    return icones[tipo as keyof typeof icones] || Target;
  };

  const formatarValor = (valor: number, unidade: string) => {
    if (unidade === 'R$') {
      return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    }
    return `${valor} ${unidade}`;
  };

  return (
    <>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="bg-card border-b border-border p-4 sm:p-6 shadow-card">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-4">
            <div>
              <h1 className="text-lg sm:text-2xl font-bold text-foreground">Metas & Objetivos</h1>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Acompanhe o progresso das metas da equipe e individuais
              </p>
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button className="bg-gradient-primary hover:bg-primary-hover h-9 sm:h-10 text-xs sm:text-sm w-full sm:w-auto">
                  <Plus className="h-4 w-4 sm:mr-2" />
                  <span className="sm:inline">Nova Meta</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="w-[calc(100%-1rem)] max-w-md p-4 sm:p-6">
                <DialogHeader>
                  <DialogTitle className="text-lg">Nova Meta</DialogTitle>
                </DialogHeader>
                <div className="space-y-3 sm:space-y-4">
                  <div className="space-y-1.5 sm:space-y-2">
                    <Label htmlFor="titulo" className="text-xs sm:text-sm">Título da Meta</Label>
                    <Input id="titulo" placeholder="Ex: Receita Mensal Fevereiro" className="h-9 sm:h-10 text-sm" />
                  </div>
                  <div className="space-y-1.5 sm:space-y-2">
                    <Label htmlFor="tipo" className="text-xs sm:text-sm">Tipo</Label>
                    <Select>
                      <SelectTrigger className="h-9 sm:h-10 text-sm">
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="receita">Receita</SelectItem>
                        <SelectItem value="leads">Leads</SelectItem>
                        <SelectItem value="conversao">Taxa de Conversão</SelectItem>
                        <SelectItem value="tempo">Tempo de Resposta</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    <div className="space-y-1.5 sm:space-y-2">
                      <Label htmlFor="valor" className="text-xs sm:text-sm">Valor da Meta</Label>
                      <Input id="valor" type="number" placeholder="100" className="h-9 sm:h-10 text-sm" />
                    </div>
                    <div className="space-y-1.5 sm:space-y-2">
                      <Label htmlFor="periodo" className="text-xs sm:text-sm">Período</Label>
                      <Select>
                        <SelectTrigger className="h-9 sm:h-10 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="mensal">Mensal</SelectItem>
                          <SelectItem value="trimestral">Trimestral</SelectItem>
                          <SelectItem value="anual">Anual</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Button className="w-full bg-gradient-primary hover:bg-primary-hover h-9 sm:h-10 text-sm">
                    Criar Meta
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4">
            <Select value={periodoFiltro} onValueChange={setPeriodoFiltro}>
              <SelectTrigger className="w-full sm:w-48 h-9 text-sm">
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os Períodos</SelectItem>
                <SelectItem value="mensal">Mensal</SelectItem>
                <SelectItem value="trimestral">Trimestral</SelectItem>
                <SelectItem value="anual">Anual</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFiltro} onValueChange={setStatusFiltro}>
              <SelectTrigger className="w-full sm:w-48 h-9 text-sm">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os Status</SelectItem>
                <SelectItem value="ativo">Ativo</SelectItem>
                <SelectItem value="pausado">Pausado</SelectItem>
                <SelectItem value="concluido">Concluído</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-4 sm:p-6 overflow-auto space-y-4 sm:space-y-6">
          {/* Resumo Geral */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            <Card>
              <CardContent className="p-3 sm:p-6">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[10px] sm:text-sm text-muted-foreground truncate">Metas Ativas</p>
                    <h3 className="text-lg sm:text-2xl font-bold mt-0.5 sm:mt-1">
                      {metas.filter(m => m.status === 'ativo').length}
                    </h3>
                  </div>
                  <Target className="h-6 w-6 sm:h-8 sm:w-8 text-primary shrink-0" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-3 sm:p-6">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm text-muted-foreground">Metas Concluídas</p>
                    <h3 className="text-2xl font-bold mt-1">
                      {metas.filter(m => m.status === 'concluido').length}
                    </h3>
                  </div>
                  <CheckCircle className="h-8 w-8 text-success" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Progresso Médio</p>
                    <h3 className="text-2xl font-bold mt-1">73%</h3>
                  </div>
                  <TrendingUp className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Em Risco</p>
                    <h3 className="text-2xl font-bold mt-1">
                      {metas.filter(m => calcularProgresso(m.valorAtual, m.valorMeta) < 60).length}
                    </h3>
                  </div>
                  <AlertCircle className="h-8 w-8 text-destructive" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Lista de Metas */}
            <div className="lg:col-span-2 space-y-4">
              <h2 className="text-xl font-semibold">Metas Atuais</h2>
              
              {metasFiltradas.map((meta) => {
                const progresso = calcularProgresso(meta.valorAtual, meta.valorMeta);
                const TipoIcon = getTipoIcon(meta.tipo);
                const StatusIcon = getStatusIcon(progresso);
                
                return (
                  <Card key={meta.id}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-start gap-4">
                          <div className="p-3 bg-primary/10 rounded-lg">
                            <TipoIcon className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg">{meta.titulo}</h3>
                            <p className="text-sm text-muted-foreground">{meta.descricao}</p>
                            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                              <span>Responsável: {meta.responsavel}</span>
                              <Badge variant="outline">
                                {meta.dataFim.toLocaleDateString('pt-BR')}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <StatusIcon className={`h-6 w-6 ${getStatusColor(progresso)}`} />
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Progresso</span>
                          <span className="font-medium">
                            {formatarValor(meta.valorAtual, meta.unidade)} / {formatarValor(meta.valorMeta, meta.unidade)}
                          </span>
                        </div>
                        
                        <Progress value={progresso} className="h-3" />
                        
                        <div className="flex items-center justify-between text-sm">
                          <Badge 
                            variant={progresso >= 80 ? 'success' : progresso >= 60 ? 'secondary' : 'destructive'}
                            className="text-xs"
                          >
                            {progresso.toFixed(1)}% completo
                          </Badge>
                          <span className="text-muted-foreground">
                            {Math.max(0, meta.valorMeta - meta.valorAtual).toLocaleString()} restante
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Ranking Individual */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5" />
                    Ranking Individual
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {ranking.map((vendedor) => {
                    const progresso = calcularProgresso(vendedor.atual, vendedor.meta);
                    return (
                      <div key={vendedor.nome} className="flex items-center gap-4 p-4 bg-muted rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className={`
                            w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm
                            ${vendedor.posicao === 1 ? 'bg-yellow-500 text-white' : 
                              vendedor.posicao === 2 ? 'bg-gray-400 text-white' :
                              vendedor.posicao === 3 ? 'bg-amber-600 text-white' : 
                              'bg-muted-foreground text-white'}
                          `}>
                            {vendedor.posicao}°
                          </div>
                          <Avatar className="h-10 w-10">
                            <AvatarImage src="" alt={vendedor.nome} />
                            <AvatarFallback className="bg-primary text-primary-foreground">
                              {vendedor.nome.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium">{vendedor.nome}</h4>
                          <div className="text-sm text-muted-foreground">
                            {vendedor.atual.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} / 
                            {vendedor.meta.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </div>
                          <Progress value={progresso} className="h-2 mt-1" />
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

export default Metas;