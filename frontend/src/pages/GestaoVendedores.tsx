import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Users, 
  TrendingUp, 
  TrendingDown,
  Trophy, 
  Target, 
  DollarSign, 
  Search,
  UserCheck,
  UserX,
  Calendar,
  Phone,
  Mail,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  BarChart3,
  PieChart,
  Activity,
  Zap,
  Star,
  Clock,
  Award
} from "lucide-react";
import { fetchSellersStats } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Navigate } from "react-router-dom";

interface VendedorStats {
  id: string;
  nome: string;
  email: string;
  foto: string | null;
  ativo: boolean;
  perfil: string;
  ultimoAcesso: string;
  // Estatísticas calculadas
  totalLeads: number;
  leadsQualificados: number;
  leadsConvertidos: number;
  valorTotalPipeline: number;
  valorConvertido: number;
  taxaConversao: number;
  ticketMedio: number;
  leadsUltimos30Dias: number;
  tendencia: 'up' | 'down' | 'stable';
}

interface Totals {
  totalVendedores: number;
  vendedoresAtivos: number;
  totalLeadsEquipe: number;
  totalConvertidos: number;
  valorTotalEquipe: number;
  valorConvertidoEquipe: number;
  mediaConversao: number;
}

const GestaoVendedores = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [vendedores, setVendedores] = useState<VendedorStats[]>([]);
  const [totals, setTotals] = useState<Totals>({
    totalVendedores: 0,
    vendedoresAtivos: 0,
    totalLeadsEquipe: 0,
    totalConvertidos: 0,
    valorTotalEquipe: 0,
    valorConvertidoEquipe: 0,
    mediaConversao: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("overview");

  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    if (isAdmin) {
      loadData();
    }
  }, [isAdmin]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await fetchSellersStats();
      setVendedores(data.sellers);
      setTotals(data.totals);
    } catch (error) {
      console.error("Erro ao carregar dados", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível carregar os dados dos vendedores."
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Verificar se é admin - APÓS os hooks
  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  const filteredVendedores = vendedores.filter(v =>
    v.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Métricas gerais (usando os totais do backend)
  const { totalVendedores, vendedoresAtivos, totalLeadsEquipe, valorTotalEquipe, mediaConversao } = totals;

  // Top vendedores
  const topPorValor = [...vendedores].sort((a, b) => b.valorTotalPipeline - a.valorTotalPipeline).slice(0, 5);
  const topPorConversao = [...vendedores].sort((a, b) => b.taxaConversao - a.taxaConversao).slice(0, 5);
  const topPorLeads = [...vendedores].sort((a, b) => b.totalLeads - a.totalLeads).slice(0, 5);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="bg-card border-b border-border p-4 sm:p-6 shadow-sm shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2">
              <Users className="h-6 w-6 text-primary" />
              Gestão de Vendedores
            </h1>
            <p className="text-sm text-muted-foreground">
              Acompanhe o desempenho da sua equipe de vendas
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar vendedor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4 sm:p-6 space-y-6">
        {/* Cards de Métricas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-blue-600 font-medium">Vendedores</p>
                  <p className="text-2xl font-bold text-blue-700">{totalVendedores}</p>
                  <p className="text-xs text-blue-500">{vendedoresAtivos} ativos</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100/50 border-green-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-green-600 font-medium">Total Leads</p>
                  <p className="text-2xl font-bold text-green-700">{totalLeadsEquipe}</p>
                  <p className="text-xs text-green-500">na equipe</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-green-500/20 flex items-center justify-center">
                  <Target className="h-5 w-5 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100/50 border-purple-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-purple-600 font-medium">Valor Pipeline</p>
                  <p className="text-xl font-bold text-purple-700">
                    {valorTotalEquipe.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
                  </p>
                  <p className="text-xs text-purple-500">total</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100/50 border-orange-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-orange-600 font-medium">Taxa Conversão</p>
                  <p className="text-2xl font-bold text-orange-700">{mediaConversao.toFixed(1)}%</p>
                  <p className="text-xs text-orange-500">média geral</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-orange-500/20 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full sm:w-auto">
            <TabsTrigger value="overview" className="flex items-center gap-1.5">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Visão Geral</span>
            </TabsTrigger>
            <TabsTrigger value="ranking" className="flex items-center gap-1.5">
              <Trophy className="h-4 w-4" />
              <span className="hidden sm:inline">Ranking</span>
            </TabsTrigger>
            <TabsTrigger value="detalhes" className="flex items-center gap-1.5">
              <Activity className="h-4 w-4" />
              <span className="hidden sm:inline">Detalhes</span>
            </TabsTrigger>
          </TabsList>

          {/* Tab: Visão Geral */}
          <TabsContent value="overview" className="space-y-6 mt-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Top por Valor */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-green-500" />
                    Top por Valor em Pipeline
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {topPorValor.map((v, index) => (
                    <div key={v.id} className="flex items-center gap-3">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                        ${index === 0 ? 'bg-yellow-100 text-yellow-700' : 
                          index === 1 ? 'bg-gray-100 text-gray-700' : 
                          index === 2 ? 'bg-orange-100 text-orange-700' : 
                          'bg-muted text-muted-foreground'}`}>
                        {index + 1}
                      </span>
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={v.foto || ''} />
                        <AvatarFallback className="text-xs bg-primary/10">
                          {v.nome.split(' ').map(n => n[0]).join('').substring(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{v.nome}</p>
                        <p className="text-xs text-muted-foreground">
                          {v.valorTotalPipeline.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </p>
                      </div>
                      {v.tendencia === 'up' && <ArrowUpRight className="h-4 w-4 text-green-500" />}
                      {v.tendencia === 'down' && <ArrowDownRight className="h-4 w-4 text-red-500" />}
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Top por Conversão */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Zap className="h-4 w-4 text-purple-500" />
                    Top por Taxa de Conversão
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {topPorConversao.map((v, index) => (
                    <div key={v.id} className="flex items-center gap-3">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                        ${index === 0 ? 'bg-yellow-100 text-yellow-700' : 
                          index === 1 ? 'bg-gray-100 text-gray-700' : 
                          index === 2 ? 'bg-orange-100 text-orange-700' : 
                          'bg-muted text-muted-foreground'}`}>
                        {index + 1}
                      </span>
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={v.foto || ''} />
                        <AvatarFallback className="text-xs bg-primary/10">
                          {v.nome.split(' ').map(n => n[0]).join('').substring(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{v.nome}</p>
                        <div className="flex items-center gap-2">
                          <Progress value={v.taxaConversao} className="h-1.5 flex-1" />
                          <span className="text-xs font-medium">{v.taxaConversao.toFixed(1)}%</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Top por Leads */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Target className="h-4 w-4 text-blue-500" />
                    Top por Quantidade de Leads
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {topPorLeads.map((v, index) => (
                    <div key={v.id} className="flex items-center gap-3">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                        ${index === 0 ? 'bg-yellow-100 text-yellow-700' : 
                          index === 1 ? 'bg-gray-100 text-gray-700' : 
                          index === 2 ? 'bg-orange-100 text-orange-700' : 
                          'bg-muted text-muted-foreground'}`}>
                        {index + 1}
                      </span>
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={v.foto || ''} />
                        <AvatarFallback className="text-xs bg-primary/10">
                          {v.nome.split(' ').map(n => n[0]).join('').substring(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{v.nome}</p>
                        <p className="text-xs text-muted-foreground">
                          {v.totalLeads} leads • {v.leadsQualificados} qualificados
                        </p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        +{v.leadsUltimos30Dias}
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Insights */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Star className="h-4 w-4 text-yellow-500" />
                  Insights da Equipe
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-3 rounded-lg bg-blue-50 border border-blue-100">
                    <div className="flex items-center gap-2 mb-1">
                      <Award className="h-4 w-4 text-blue-600" />
                      <span className="text-xs font-medium text-blue-600">Melhor Vendedor</span>
                    </div>
                    <p className="font-semibold text-blue-900">{topPorValor[0]?.nome || '-'}</p>
                    <p className="text-xs text-blue-600">
                      {topPorValor[0]?.valorTotalPipeline.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) || '-'}
                    </p>
                  </div>

                  <div className="p-3 rounded-lg bg-green-50 border border-green-100">
                    <div className="flex items-center gap-2 mb-1">
                      <Zap className="h-4 w-4 text-green-600" />
                      <span className="text-xs font-medium text-green-600">Maior Conversão</span>
                    </div>
                    <p className="font-semibold text-green-900">{topPorConversao[0]?.nome || '-'}</p>
                    <p className="text-xs text-green-600">
                      {topPorConversao[0]?.taxaConversao.toFixed(1)}% de conversão
                    </p>
                  </div>

                  <div className="p-3 rounded-lg bg-purple-50 border border-purple-100">
                    <div className="flex items-center gap-2 mb-1">
                      <TrendingUp className="h-4 w-4 text-purple-600" />
                      <span className="text-xs font-medium text-purple-600">Em Alta</span>
                    </div>
                    <p className="font-semibold text-purple-900">
                      {vendedores.filter(v => v.tendencia === 'up').length} vendedor(es)
                    </p>
                    <p className="text-xs text-purple-600">com tendência de crescimento</p>
                  </div>

                  <div className="p-3 rounded-lg bg-orange-50 border border-orange-100">
                    <div className="flex items-center gap-2 mb-1">
                      <Clock className="h-4 w-4 text-orange-600" />
                      <span className="text-xs font-medium text-orange-600">Ticket Médio</span>
                    </div>
                    <p className="font-semibold text-orange-900">
                      {(vendedores.reduce((acc, v) => acc + v.ticketMedio, 0) / vendedores.length || 0)
                        .toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </p>
                    <p className="text-xs text-orange-600">média da equipe</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Ranking */}
          <TabsContent value="ranking" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                  Ranking de Vendedores
                </CardTitle>
                <CardDescription>
                  Classificação por valor total em pipeline
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {filteredVendedores.map((v, index) => (
                    <div 
                      key={v.id} 
                      className={`flex items-center gap-4 p-3 rounded-lg border transition-colors
                        ${index === 0 ? 'bg-yellow-50 border-yellow-200' : 
                          index === 1 ? 'bg-gray-50 border-gray-200' : 
                          index === 2 ? 'bg-orange-50 border-orange-200' : 
                          'bg-card'}`}
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold
                        ${index === 0 ? 'bg-yellow-500 text-white' : 
                          index === 1 ? 'bg-gray-400 text-white' : 
                          index === 2 ? 'bg-orange-400 text-white' : 
                          'bg-muted text-muted-foreground'}`}>
                        {index === 0 && <Trophy className="h-5 w-5" />}
                        {index > 0 && (index + 1)}
                      </div>

                      <Avatar className="h-12 w-12">
                        <AvatarImage src={v.foto || ''} />
                        <AvatarFallback className="bg-primary/10">
                          {v.nome.split(' ').map(n => n[0]).join('').substring(0, 2)}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold truncate">{v.nome}</p>
                          {!v.ativo && <Badge variant="secondary" className="text-xs">Inativo</Badge>}
                          {v.tendencia === 'up' && (
                            <Badge variant="outline" className="text-xs text-green-600 border-green-300">
                              <ArrowUpRight className="h-3 w-3 mr-1" />
                              Em alta
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{v.email}</p>
                      </div>

                      <div className="text-right hidden sm:block">
                        <p className="text-sm font-medium">
                          {v.valorTotalPipeline.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {v.totalLeads} leads
                        </p>
                      </div>

                      <div className="text-right hidden md:block">
                        <p className="text-sm font-medium text-green-600">
                          {v.taxaConversao.toFixed(1)}%
                        </p>
                        <p className="text-xs text-muted-foreground">conversão</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Detalhes */}
          <TabsContent value="detalhes" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Detalhes dos Vendedores</CardTitle>
                <CardDescription>
                  Informações completas de cada membro da equipe
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Vendedor</TableHead>
                        <TableHead className="text-center">Status</TableHead>
                        <TableHead className="text-center">Leads</TableHead>
                        <TableHead className="text-center">Qualificados</TableHead>
                        <TableHead className="text-center">Conversão</TableHead>
                        <TableHead className="text-right">Valor Pipeline</TableHead>
                        <TableHead className="text-right">Ticket Médio</TableHead>
                        <TableHead className="text-center">Últimos 30d</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredVendedores.map((v) => (
                        <TableRow key={v.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={v.foto || ''} />
                                <AvatarFallback className="text-xs bg-primary/10">
                                  {v.nome.split(' ').map(n => n[0]).join('').substring(0, 2)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium text-sm">{v.nome}</p>
                                <p className="text-xs text-muted-foreground">{v.email}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            {v.ativo ? (
                              <Badge variant="outline" className="text-green-600 border-green-300">
                                <UserCheck className="h-3 w-3 mr-1" />
                                Ativo
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-gray-500 border-gray-300">
                                <UserX className="h-3 w-3 mr-1" />
                                Inativo
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-center font-medium">{v.totalLeads}</TableCell>
                          <TableCell className="text-center">{v.leadsQualificados}</TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-2">
                              <Progress value={v.taxaConversao} className="w-16 h-1.5" />
                              <span className="text-xs font-medium">{v.taxaConversao.toFixed(1)}%</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {v.valorTotalPipeline.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </TableCell>
                          <TableCell className="text-right text-muted-foreground">
                            {v.ticketMedio.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant={v.leadsUltimos30Dias > 5 ? "default" : "secondary"}>
                              +{v.leadsUltimos30Dias}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default GestaoVendedores;
