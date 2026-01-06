import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from "recharts";
import {
  TrendingUp,
  Users,
  DollarSign,
  Target,
  Download,
  Calendar,
  Filter,
  RefreshCw,
} from "lucide-react";

const Relatorios = () => {
  const dadosConversao = [
    { etapa: 'Novo', quantidade: 45, conversao: 100 },
    { etapa: 'Qualificação', quantidade: 38, conversao: 84 },
    { etapa: 'Cotação', quantidade: 28, conversao: 62 },
    { etapa: 'Proposta', quantidade: 22, conversao: 49 },
    { etapa: 'Negociação', quantidade: 15, conversao: 33 },
    { etapa: 'Fechamento', quantidade: 8, conversao: 18 },
  ];

  const dadosOrigem = [
    { name: 'Instagram', value: 45, color: '#8B5CF6' },
    { name: 'Indicação', value: 30, color: '#10B981' },
    { name: 'Site', value: 20, color: '#3B82F6' },
    { name: 'Outros', value: 5, color: '#6B7280' },
  ];

  const dadosTempoResposta = [
    { mes: 'Jan', tempoMedio: 24, meta: 48 },
    { mes: 'Fev', tempoMedio: 18, meta: 48 },
    { mes: 'Mar', tempoMedio: 32, meta: 48 },
    { mes: 'Abr', tempoMedio: 28, meta: 48 },
    { mes: 'Mai', tempoMedio: 22, meta: 48 },
    { mes: 'Jun', tempoMedio: 20, meta: 48 },
  ];

  const dadosVendedores = [
    { vendedor: 'João Silva', leads: 25, conversao: 32, receita: 45000 },
    { vendedor: 'Ana Costa', leads: 28, conversao: 36, receita: 52000 },
    { vendedor: 'Carlos Santos', leads: 22, conversao: 27, receita: 38000 },
    { vendedor: 'Maria Oliveira', leads: 15, conversao: 40, receita: 35000 },
  ];

  const metricas = [
    {
      titulo: 'Total de Leads',
      valor: '156',
      mudanca: '+12%',
      tipo: 'aumento',
      icone: Users,
      descricao: 'Este mês'
    },
    {
      titulo: 'Taxa de Conversão',
      valor: '18%',
      mudanca: '+3.2%',
      tipo: 'aumento',
      icone: Target,
      descricao: 'Média geral'
    },
    {
      titulo: 'Receita Estimada',
      valor: 'R$ 170.000',
      mudanca: '+8.5%',
      tipo: 'aumento',
      icone: DollarSign,
      descricao: 'Este mês'
    },
    {
      titulo: 'Tempo Médio',
      valor: '24h',
      mudanca: '-6h',
      tipo: 'melhoria',
      icone: TrendingUp,
      descricao: 'Primeira resposta'
    },
  ];

  return (
    <Layout>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="bg-card border-b border-border p-4 sm:p-6 shadow-card">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-4">
            <div>
              <h1 className="text-lg sm:text-2xl font-bold text-foreground">Relatórios & Analytics</h1>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Acompanhe o desempenho das vendas e KPIs importantes
              </p>
            </div>
            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
              <Button variant="outline" size="sm" className="h-8 sm:h-9 text-xs sm:text-sm shrink-0">
                <Filter className="h-3.5 w-3.5 sm:mr-2" />
                <span className="hidden sm:inline">Filtrar</span>
              </Button>
              <Button variant="outline" size="sm" className="h-8 sm:h-9 text-xs sm:text-sm shrink-0">
                <RefreshCw className="h-3.5 w-3.5 sm:mr-2" />
                <span className="hidden sm:inline">Atualizar</span>
              </Button>
              <Button className="bg-gradient-primary hover:bg-primary-hover h-8 sm:h-9 text-xs sm:text-sm shrink-0" size="sm">
                <Download className="h-3.5 w-3.5 sm:mr-2" />
                <span className="hidden sm:inline">Exportar PDF</span>
              </Button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4">
            <Select defaultValue="30">
              <SelectTrigger className="w-full sm:w-48 h-9 text-sm">
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Últimos 7 dias</SelectItem>
                <SelectItem value="30">Últimos 30 dias</SelectItem>
                <SelectItem value="90">Últimos 90 dias</SelectItem>
                <SelectItem value="365">Último ano</SelectItem>
              </SelectContent>
            </Select>
            
            <Select defaultValue="all">
              <SelectTrigger className="w-full sm:w-48 h-9 text-sm">
                <SelectValue placeholder="Vendedor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Vendedores</SelectItem>
                <SelectItem value="joao">João Silva</SelectItem>
                <SelectItem value="ana">Ana Costa</SelectItem>
                <SelectItem value="carlos">Carlos Santos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-4 sm:p-6 overflow-auto space-y-4 sm:space-y-6">
          {/* KPIs Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {metricas.map((metrica, index) => (
              <Card key={index}>
                <CardContent className="p-3 sm:p-6">
                  <div className="flex items-start sm:items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] sm:text-sm text-muted-foreground truncate">{metrica.titulo}</p>
                      <h3 className="text-lg sm:text-2xl font-bold mt-0.5 sm:mt-1 truncate">{metrica.valor}</h3>
                      <div className="flex flex-wrap items-center gap-1 mt-1 sm:mt-2">
                        <Badge 
                          variant={metrica.tipo === 'aumento' || metrica.tipo === 'melhoria' ? 'success' : 'destructive'} 
                          className="text-[9px] sm:text-xs px-1.5"
                        >
                          {metrica.mudanca}
                        </Badge>
                        <span className="text-[9px] sm:text-xs text-muted-foreground hidden sm:inline">{metrica.descricao}</span>
                      </div>
                    </div>
                    <div className="p-2 sm:p-3 bg-primary/10 rounded-lg shrink-0">
                      <metrica.icone className="h-4 w-4 sm:h-6 sm:w-6 text-primary" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Funil de Conversão */}
            <Card>
              <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-4">
                <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                  <Target className="h-4 w-4 sm:h-5 sm:w-5" />
                  Funil de Conversão
                </CardTitle>
              </CardHeader>
              <CardContent className="p-2 sm:p-6 pt-0">
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={dadosConversao}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="etapa" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Bar dataKey="quantidade" fill="hsl(var(--primary))" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Distribuição por Origem */}
            <Card>
              <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-4">
                <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                  <Users className="h-4 w-4 sm:h-5 sm:w-5" />
                  Leads por Origem
                </CardTitle>
              </CardHeader>
              <CardContent className="p-2 sm:p-6 pt-0">
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={dadosOrigem}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {dadosOrigem.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Tempo de Resposta */}
          <Card>
            <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-4">
              <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                <Calendar className="h-4 w-4 sm:h-5 sm:w-5" />
                Tempo de Resposta (horas)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-2 sm:p-6 pt-0">
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={dadosTempoResposta}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mes" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Line 
                    type="monotone" 
                    dataKey="tempoMedio" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    name="Tempo Médio"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="meta" 
                    stroke="hsl(var(--destructive))" 
                    strokeDasharray="5 5"
                    name="Meta (48h)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Performance por Vendedor */}
          <Card>
            <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-4">
              <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5" />
                Performance por Vendedor
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-6 pt-0">
              <div className="space-y-3 sm:space-y-4">
                {dadosVendedores.map((vendedor, index) => (
                  <div key={index} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 sm:p-4 bg-muted rounded-lg">
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-semibold text-xs sm:text-sm shrink-0">
                        {vendedor.vendedor.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-medium text-sm sm:text-base truncate">{vendedor.vendedor}</h4>
                        <p className="text-xs sm:text-sm text-muted-foreground">{vendedor.leads} leads ativos</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 sm:gap-6 text-xs sm:text-sm ml-11 sm:ml-0">
                      <div className="text-left sm:text-center">
                        <p className="font-medium">{vendedor.conversao}%</p>
                        <p className="text-muted-foreground text-[10px] sm:text-xs">Conversão</p>
                      </div>
                      <div className="text-left sm:text-center">
                        <p className="font-medium">
                          {vendedor.receita.toLocaleString('pt-BR', { 
                            style: 'currency', 
                            currency: 'BRL' 
                          })}
                        </p>
                        <p className="text-muted-foreground text-[10px] sm:text-xs">Receita Est.</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Relatorios;