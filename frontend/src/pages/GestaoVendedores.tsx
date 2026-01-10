import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
  Award,
  Plus,
  Edit,
  Trash2,
  UserPlus
} from "lucide-react";
import { fetchSellersStats, createUserApi, updateUserApi, deleteUserApi, getUserApi } from "@/lib/api";
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

  // Estado do modal de CRUD
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVendedor, setEditingVendedor] = useState<VendedorStats | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [vendedorToDelete, setVendedorToDelete] = useState<VendedorStats | null>(null);
  
  // Campos do formulário
  const [formNome, setFormNome] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formTelefone, setFormTelefone] = useState("");
  const [formCargo, setFormCargo] = useState("");
  const [isSaving, setIsSaving] = useState(false);

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

  // Abre modal para criar vendedor
  const handleNovoVendedor = () => {
    setEditingVendedor(null);
    setFormNome("");
    setFormEmail("");
    setFormTelefone("");
    setFormCargo("");
    setIsModalOpen(true);
  };

  // Abre modal para editar vendedor
  const handleEditarVendedor = async (vendedor: VendedorStats) => {
    setEditingVendedor(vendedor);
    setFormNome(vendedor.nome);
    setFormEmail(vendedor.email);
    
    // Buscar dados completos do usuário
    try {
      const userData = await getUserApi(vendedor.id);
      setFormTelefone(userData.phone || "");
      setFormCargo(userData.jobTitle || "");
    } catch (error) {
      console.error("Erro ao buscar dados do usuário:", error);
      setFormTelefone("");
      setFormCargo("");
    }
    
    setIsModalOpen(true);
  };

  // Salva vendedor (criar ou editar)
  const handleSalvarVendedor = async () => {
    if (!formNome.trim() || !formEmail.trim()) {
      toast({
        variant: "destructive",
        title: "Dados Incompletos",
        description: "Nome e E-mail são obrigatórios."
      });
      return;
    }

    setIsSaving(true);
    try {
      if (editingVendedor) {
        // Editar vendedor existente
        await updateUserApi(editingVendedor.id, {
          nome: formNome,
          email: formEmail,
          telefone: formTelefone,
          cargo: formCargo
        });

        toast({
          title: "Vendedor Atualizado",
          description: "As alterações foram salvas com sucesso."
        });
      } else {
        // Criar novo vendedor
        await createUserApi({
          nome: formNome,
          email: formEmail,
          senha: "senha123", // Senha temporária que será alterada pelo usuário
          perfil: "vendedor",
          telefone: formTelefone,
          cargo: formCargo
        });

        toast({
          title: "Vendedor Criado",
          description: "Um email de definição de senha foi enviado para o vendedor."
        });
      }

      setIsModalOpen(false);
      loadData(); // Recarrega os dados
    } catch (error: any) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message || "Não foi possível salvar o vendedor."
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Confirma exclusão
  const handleConfirmarExclusao = async () => {
    if (!vendedorToDelete) return;

    try {
      await deleteUserApi(vendedorToDelete.id);

      toast({
        title: "Vendedor Excluído",
        description: `O vendedor ${vendedorToDelete.nome} foi removido.`
      });

      setIsDeleting(false);
      setVendedorToDelete(null);
      loadData();
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível excluir o vendedor."
      });
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

          <div className="flex items-center gap-2">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar vendedor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button onClick={handleNovoVendedor} className="shrink-0">
              <UserPlus className="h-4 w-4 mr-2" />
              Novo Vendedor
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4 sm:p-6 space-y-6">
        {/* Cards de Métricas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20 dark:from-primary/10 dark:to-primary/5 dark:border-primary/30">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-primary font-medium">Vendedores</p>
                  <p className="text-2xl font-bold text-primary dark:text-foreground">{totalVendedores}</p>
                  <p className="text-xs text-primary/80 dark:text-foreground/80">{vendedoresAtivos} ativos</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <Users className="h-5 w-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-success/5 to-success/10 border-success/20 dark:from-success/10 dark:to-success/5 dark:border-success/30">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-success font-medium">Total Leads</p>
                  <p className="text-2xl font-bold text-success dark:text-foreground">{totalLeadsEquipe}</p>
                  <p className="text-xs text-success/80 dark:text-foreground/80">na equipe</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-success/20 flex items-center justify-center">
                  <Target className="h-5 w-5 text-success" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-accent/5 to-accent/10 border-accent/20 dark:from-accent/10 dark:to-accent/5 dark:border-accent/30">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-accent-foreground font-medium">Valor Pipeline</p>
                  <p className="text-xl font-bold text-accent-foreground dark:text-foreground">
                    {valorTotalEquipe.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
                  </p>
                  <p className="text-xs text-accent-foreground/80 dark:text-foreground/80">total</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-accent/20 flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-accent-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-warning/5 to-warning/10 border-warning/20 dark:from-warning/10 dark:to-warning/5 dark:border-warning/30">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-warning font-medium">Taxa Conversão</p>
                  <p className="text-2xl font-bold text-warning dark:text-foreground">{mediaConversao.toFixed(1)}%</p>
                  <p className="text-xs text-warning/80 dark:text-foreground/80">média geral</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-warning/20 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-warning" />
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
                    <DollarSign className="h-4 w-4 text-success/80" />
                    Top por Valor em Pipeline
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {topPorValor.map((v, index) => (
                    <div key={v.id} className="flex items-center gap-3">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                        ${index === 0 ? 'bg-yellow-100 text-yellow-700' : 
                          index === 1 ? 'bg-gray-100 text-gray-700' : 
                          index === 2 ? 'bg-orange-100 text-warning dark:text-warning-foreground' : 
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
                      {v.tendencia === 'up' && <ArrowUpRight className="h-4 w-4 text-success/80" />}
                      {v.tendencia === 'down' && <ArrowDownRight className="h-4 w-4 text-red-500" />}
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Top por Conversão */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Zap className="h-4 w-4 text-accent-foreground/80" />
                    Top por Taxa de Conversão
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {topPorConversao.map((v, index) => (
                    <div key={v.id} className="flex items-center gap-3">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                        ${index === 0 ? 'bg-yellow-500 text-white dark:bg-yellow-600' : 
                          index === 1 ? 'bg-muted-foreground text-white dark:bg-muted' : 
                          index === 2 ? 'bg-warning text-white dark:bg-warning/90' : 
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
                          <span className="text-xs font-medium dark:text-foreground">{v.taxaConversao.toFixed(1)}%</span>
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
                    <Target className="h-4 w-4 text-primary/80" />
                    Top por Quantidade de Leads
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {topPorLeads.map((v, index) => (
                    <div key={v.id} className="flex items-center gap-3">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                        ${index === 0 ? 'bg-yellow-500 text-white dark:bg-yellow-600' : 
                          index === 1 ? 'bg-muted-foreground text-white dark:bg-muted' : 
                          index === 2 ? 'bg-warning text-white dark:bg-warning/90' : 
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
                        <p className="text-xs text-muted-foreground dark:text-foreground/70">
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
                  <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 dark:bg-primary/5">
                    <div className="flex items-center gap-2 mb-1">
                      <Award className="h-4 w-4 text-primary" />
                      <span className="text-xs font-medium text-primary">Melhor Vendedor</span>
                    </div>
                    <p className="font-semibold text-primary dark:text-foreground">{topPorValor[0]?.nome || '-'}</p>
                    <p className="text-xs text-primary dark:text-foreground">
                      {topPorValor[0]?.valorTotalPipeline.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) || '-'}
                    </p>
                  </div>

                  <div className="p-3 rounded-lg bg-success/10 border border-success/20 dark:bg-success/5">
                    <div className="flex items-center gap-2 mb-1">
                      <Zap className="h-4 w-4 text-success" />
                      <span className="text-xs font-medium text-success">Maior Conversão</span>
                    </div>
                    <p className="font-semibold text-success dark:text-foreground">{topPorConversao[0]?.nome || '-'}</p>
                    <p className="text-xs text-success dark:text-foreground">
                      {topPorConversao[0]?.taxaConversao.toFixed(1)}% de conversão
                    </p>
                  </div>

                  <div className="p-3 rounded-lg bg-accent/10 border border-accent/20 dark:bg-accent/5">
                    <div className="flex items-center gap-2 mb-1">
                      <TrendingUp className="h-4 w-4 text-accent" />
                      <span className="text-xs font-medium text-accent">Em Alta</span>
                    </div>
                    <p className="font-semibold text-accent dark:text-foreground">
                      {vendedores.filter(v => v.tendencia === 'up').length} vendedor(es)
                    </p>
                    <p className="text-xs text-accent dark:text-foreground">com tendência de crescimento</p>
                  </div>

                  <div className="p-3 rounded-lg bg-warning/10 border border-warning/20 dark:bg-warning/5">
                    <div className="flex items-center gap-2 mb-1">
                      <Clock className="h-4 w-4 text-warning" />
                      <span className="text-xs font-medium text-warning">Ticket Médio</span>
                    </div>
                    <p className="font-semibold text-warning dark:text-foreground">
                      {(vendedores.reduce((acc, v) => acc + v.ticketMedio, 0) / vendedores.length || 0)
                        .toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </p>
                    <p className="text-xs text-warning dark:text-foreground">média da equipe</p>
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
                        ${index === 0 ? 'bg-yellow-500/10 border-yellow-500/30 dark:bg-yellow-500/5' : 
                          index === 1 ? 'bg-muted border-border' : 
                          index === 2 ? 'bg-warning/10 border-warning/30 dark:bg-warning/5' : 
                          'bg-card'}`}
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold
                        ${index === 0 ? 'bg-yellow-500 text-white dark:bg-yellow-600' : 
                          index === 1 ? 'bg-muted-foreground text-white dark:bg-muted' : 
                          index === 2 ? 'bg-warning text-white dark:bg-warning/90' : 
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
                        <p className="text-sm font-medium dark:text-foreground">
                          {v.valorTotalPipeline.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {v.totalLeads} leads
                        </p>
                      </div>

                      <div className="text-right hidden md:block">
                        <p className="text-sm font-medium text-success dark:text-foreground">
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
                        <TableHead className="text-center">Ações</TableHead>
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
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handleEditarVendedor(v)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive"
                                onClick={() => {
                                  setVendedorToDelete(v);
                                  setIsDeleting(true);
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
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

      {/* Modal de Criar/Editar Vendedor */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingVendedor ? "Editar Vendedor" : "Novo Vendedor"}
            </DialogTitle>
            <DialogDescription>
              {editingVendedor 
                ? "Atualize as informações do vendedor."
                : "Preencha os dados do novo vendedor. Um email de definição de senha será enviado automaticamente."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="nome">Nome *</Label>
              <Input
                id="nome"
                value={formNome}
                onChange={(e) => setFormNome(e.target.value)}
                placeholder="Nome completo"
              />
            </div>

            <div>
              <Label htmlFor="email">E-mail *</Label>
              <Input
                id="email"
                type="email"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                placeholder="email@exemplo.com"
              />
            </div>

            <div>
              <Label htmlFor="telefone">Telefone</Label>
              <Input
                id="telefone"
                value={formTelefone}
                onChange={(e) => setFormTelefone(e.target.value)}
                placeholder="(11) 99999-9999"
              />
            </div>

            <div>
              <Label htmlFor="cargo">Cargo</Label>
              <Input
                id="cargo"
                value={formCargo}
                onChange={(e) => setFormCargo(e.target.value)}
                placeholder="Ex: Vendedor Sênior"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsModalOpen(false)}
              disabled={isSaving}
            >
              Cancelar
            </Button>
            <Button onClick={handleSalvarVendedor} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                editingVendedor ? "Salvar Alterações" : "Criar Vendedor"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Confirmação de Exclusão */}
      <AlertDialog open={isDeleting} onOpenChange={setIsDeleting}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o vendedor <strong>{vendedorToDelete?.nome}</strong>?
              Esta ação não pode ser desfeita. Todos os leads associados a este vendedor permanecerão no sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setVendedorToDelete(null)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmarExclusao}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir Vendedor
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default GestaoVendedores;
