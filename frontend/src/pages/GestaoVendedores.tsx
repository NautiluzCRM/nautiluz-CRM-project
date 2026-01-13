import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
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
  Target, 
  DollarSign, 
  Search,
  UserCheck,
  UserX,
  Loader2,
  Settings,
  Edit,
  Trash2,
  UserPlus
} from "lucide-react";
import { createUserApi, updateUserApi, deleteUserApi, getUserApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Navigate } from "react-router-dom";
import { EditSellerModal } from "@/components/ui/EditSellerModal";
import { useStats } from "@/contexts/StatsContext";

interface VendedorStats {
  id: string;
  nome: string;
  email: string;
  foto: string | null;
  ativo: boolean;
  perfil: string;
  cargo?: string; // Adicionado
  ultimoAcesso: string;
  // Estatísticas
  totalLeads: number;
  leadsQualificados: number;
  leadsConvertidos: number;
  valorTotalPipeline: number;
  valorConvertido: number;
  taxaConversao: number;
  ticketMedio: number;
  leadsUltimos30Dias: number;
  tendencia: 'up' | 'down' | 'stable';
  distribution?: any; 
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
  
  // Usar o contexto de estatísticas ao invés de estado local
  const { vendedores, totals, isLoading, refreshStats, lastUpdated } = useStats();
  
  const [searchTerm, setSearchTerm] = useState("");

  // Estado do modal de CRUD Básico
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVendedor, setEditingVendedor] = useState<VendedorStats | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [vendedorToDelete, setVendedorToDelete] = useState<VendedorStats | null>(null);
  
  // Estado do modal de Configuração (Robô)
  const [configSeller, setConfigSeller] = useState<any>(null);
  const [isConfigOpen, setIsConfigOpen] = useState(false);

  // Campos do formulário básico
  const [formNome, setFormNome] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formTelefone, setFormTelefone] = useState("");
  const [formCargo, setFormCargo] = useState(""); // Já existia
  const [formPerfil, setFormPerfil] = useState("Vendedor"); 
  const [isSaving, setIsSaving] = useState(false);

  const isAdmin = user?.role === 'admin';

  // Não precisa mais do useEffect e loadData, o contexto já carrega automaticamente

  const handleConfigurarVendedor = async (vendedor: VendedorStats) => {
    try {
      const fullUserData = await getUserApi(vendedor.id);
      setConfigSeller(fullUserData);
      setIsConfigOpen(true);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao carregar configurações do vendedor."
      });
    }
  };

  // Abre modal para criar vendedor
  const handleNovoVendedor = () => {
    setEditingVendedor(null);
    setFormNome("");
    setFormEmail("");
    setFormTelefone("");
    setFormCargo(""); // Reseta cargo
    setFormPerfil("Vendedor"); // Reseta perfil para padrão
    setIsModalOpen(true);
  };

  // Abre modal para editar dados básicos
  const handleEditarVendedor = async (vendedor: VendedorStats) => {
    setEditingVendedor(vendedor);
    setFormNome(vendedor.nome);
    setFormEmail(vendedor.email);
    
    // Mapeamento visual reverso (opcional, pois buscamos do userApi abaixo)
    setFormPerfil(vendedor.perfil === "Administrador" ? "Administrador" : 
                  vendedor.perfil === "Gerente" ? "Gerente" : "Vendedor");

    try {
      const userData = await getUserApi(vendedor.id) as any;
      setFormTelefone(userData.phone || "");
      setFormCargo(userData.jobTitle || "");
      
      // Garante que o perfil venha correto do backend (admin/vendedor -> Administrador/Vendedor)
      if (userData.role) {
         const roleMap: Record<string, string> = {
            'admin': 'Administrador',
            'financeiro': 'Financeiro',
            'gerente': 'Gerente',
            'vendedor': 'Vendedor'
         };
         setFormPerfil(roleMap[userData.role] || "Vendedor");
      }
    } catch (error) {
      console.error("Erro ao buscar dados do usuário:", error);
      setFormTelefone("");
      setFormCargo("");
    }
    
    setIsModalOpen(true);
  };

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
        // EDITA
        await updateUserApi(editingVendedor.id, {
          nome: formNome,
          email: formEmail,
          telefone: formTelefone,
          cargo: formCargo,    // ✅ Envia Cargo
          perfil: formPerfil   // ✅ Envia Perfil
        });

        toast({
          title: "Vendedor Atualizado",
          description: "As alterações foram salvas com sucesso."
        });
      } else {
        // CRIA
        await createUserApi({
          nome: formNome,
          email: formEmail,
          senha: "senha123", // Senha temporária, sistema envia email de reset
          perfil: formPerfil, // ✅ Usa o perfil selecionado
          telefone: formTelefone,
          cargo: formCargo,   // ✅ Usa o cargo digitado
          enviarEmailSenha: true
        });

        toast({
          title: "Vendedor Criado",
          description: "Um email de definição de senha foi enviado para o vendedor."
        });
      }

      setIsModalOpen(false);
      refreshStats(); 
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
      refreshStats();
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível excluir o vendedor."
      });
    }
  };

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  const filteredVendedores = vendedores.filter(v =>
    v.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const { totalVendedores, vendedoresAtivos, totalLeadsEquipe, valorTotalEquipe } = totals;

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
              {lastUpdated && (
                <span className="ml-2 text-xs opacity-60">
                  • Atualizado {new Date(lastUpdated).toLocaleTimeString('pt-BR')}
                </span>
              )}
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
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
        </div>

        {/* Tabela de Detalhes */}
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
                        <TableHead className="text-center">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredVendedores.map((v) => (
                        <TableRow key={v.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {/* Avatar (Mantido igual) */}
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={v.foto || ''} />
                              <AvatarFallback className="text-xs bg-primary/10">
                                {v.nome.split(' ').map(n => n[0]).join('').substring(0, 2)}
                              </AvatarFallback>
                            </Avatar>

                            <div className="flex flex-col gap-0.5">
                              {/* Nome */}
                              <p className="font-medium text-sm text-foreground leading-none">{v.nome}</p>
                              
                              {/* 👇 MUDANÇA AQUI: Mostra CARGO • EMAIL */}
                              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mt-0.5">
                                {v.cargo && (
                                  <>
                                    <span className="font-medium text-foreground/80">{v.cargo}</span>
                                    <span className="text-muted-foreground/40">•</span>
                                  </>
                                )}
                                <span>{v.email}</span>
                              </div>
                              
                              <div className="flex items-center gap-2 mt-1">
                                {/* BADGE 1: O Perfil (Sistema) */}
                                <Badge variant="outline" className="text-[9px] h-4 px-1.5 font-medium border-primary/20 text-primary uppercase tracking-wide">
                                  {v.perfil || "Vendedor"}
                                </Badge>

                                {/* BADGE 2: O Robô (Distribuição) */}
                                {v.distribution?.active ? (
                                  <Badge variant="secondary" className="text-[9px] h-4 px-1.5 font-normal text-gray-600 border-gray-200 bg-gray-50">
                                    {v.distribution.minLives} a {v.distribution.maxLives} vidas
                                    {v.distribution.cnpjRule === 'required' && ' (CNPJ)'}
                                    {v.distribution.cnpjRule === 'forbidden' && ' (PF)'}
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="text-[9px] h-4 px-1.5 text-gray-400 border-dashed border-gray-300">
                                    Robô Off
                                  </Badge>
                                )}
                              </div>
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
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-1">
                              
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-blue-500 hover:text-blue-600 hover:bg-blue-50"
                                onClick={() => handleConfigurarVendedor(v)}
                                title="Configurar Distribuição"
                              >
                                <Settings className="h-4 w-4" />
                              </Button>

                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handleEditarVendedor(v)}
                                title="Editar Dados"
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
                                title="Excluir"
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
      </div>

      {/* Modal de Criar/Editar Vendedor (Básico) */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingVendedor ? "Editar Vendedor" : "Novo Vendedor"}
            </DialogTitle>
            <DialogDescription>
              {editingVendedor 
                ? "Atualize as informações do vendedor."
                : "Preencha os dados do novo vendedor."}
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

      {/* MODAL DE CONFIGURAÇÃO (O ROBÔ) */}
      <EditSellerModal 
        seller={configSeller}
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
        onSuccess={() => {
          refreshStats(); 
        }}
      />

      {/* Dialog de Confirmação de Exclusão */}
      <AlertDialog open={isDeleting} onOpenChange={setIsDeleting}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o vendedor <strong>{vendedorToDelete?.nome}</strong>?
              Esta ação não pode ser desfeita.
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