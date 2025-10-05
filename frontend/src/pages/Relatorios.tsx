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
        <div className="bg-card border-b border-border p-6 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Relatórios & Analytics</h1>
              <p className="text-sm text-muted-foreground">
                Acompanhe o desempenho das vendas e KPIs importantes
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filtrar
              </Button>
              <Button variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Atualizar
              </Button>
              <Button className="bg-gradient-primary hover:bg-primary-hover" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Exportar PDF
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Select defaultValue="30">
              <SelectTrigger className="w-48">
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
              <SelectTrigger className="w-48">
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
        <div className="flex-1 p-6 overflow-auto space-y-6">
          {/* KPIs Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {metricas.map((metrica, index) => (
              <Card key={index}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{metrica.titulo}</p>
                      <h3 className="text-2xl font-bold mt-1">{metrica.valor}</h3>
                      <div className="flex items-center gap-1 mt-2">
                        <Badge 
                          variant={metrica.tipo === 'aumento' || metrica.tipo === 'melhoria' ? 'success' : 'destructive'} 
                          className="text-xs"
                        >
                          {metrica.mudanca}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{metrica.descricao}</span>
                      </div>
                    </div>
                    <div className="p-3 bg-primary/10 rounded-lg">
                      <metrica.icone className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Funil de Conversão */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Funil de Conversão
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={dadosConversao}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="etapa" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="quantidade" fill="hsl(var(--primary))" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Distribuição por Origem */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Leads por Origem
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={dadosOrigem}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
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
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Tempo de Resposta (horas)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={dadosTempoResposta}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mes" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
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
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Performance por Vendedor
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dadosVendedores.map((vendedor, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-muted rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-semibold">
                        {vendedor.vendedor.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <h4 className="font-medium">{vendedor.vendedor}</h4>
                        <p className="text-sm text-muted-foreground">{vendedor.leads} leads ativos</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6 text-sm">
                      <div className="text-center">
                        <p className="font-medium">{vendedor.conversao}%</p>
                        <p className="text-muted-foreground">Conversão</p>
                      </div>
                      <div className="text-center">
                        <p className="font-medium">
                          {vendedor.receita.toLocaleString('pt-BR', { 
                            style: 'currency', 
                            currency: 'BRL' 
                          })}
                        </p>
                        <p className="text-muted-foreground">Receita Est.</p>
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