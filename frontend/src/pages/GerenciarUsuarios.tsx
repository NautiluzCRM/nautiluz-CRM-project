import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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
  Search,
  Plus,
  Edit,
  Trash2,
  Save,
  XCircle,
  CheckCircle,
  Loader2,
  UserCheck,
  UserX,
  Shield
} from "lucide-react";
import { fetchUsers, createUserApi, updateUserApi, deleteUserApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Navigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { formatPhone } from "@/lib/utils";

interface Usuario {
  id: string;
  nome: string;
  email: string;
  perfil: 'Administrador' | 'Financeiro' | 'Vendedor';
  ativo: boolean;
  foto?: string;
  ultimoAcesso: Date;
  phone?: string;
  jobTitle?: string;
  emailSignature?: string;
}

const GerenciarUsuarios = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Estados do Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [usuarioEmEdicao, setUsuarioEmEdicao] = useState<Usuario | null>(null);

  // Estados dos Formulários
  const [novoNome, setNovoNome] = useState("");
  const [novoEmail, setNovoEmail] = useState("");
  const [novoPerfil, setNovoPerfil] = useState("Vendedor");
  const [novoTelefone, setNovoTelefone] = useState("");
  const [novoCargo, setNovoCargo] = useState("");

  // Estados dos Modais de Confirmação
  const [alertExclusaoOpen, setAlertExclusaoOpen] = useState(false);
  const [alertStatusOpen, setAlertStatusOpen] = useState(false);
  const [usuarioParaStatus, setUsuarioParaStatus] = useState<Usuario | null>(null);

  const carregarUsuarios = async () => {
    setIsLoading(true);
    try {
      const dados = await fetchUsers();
      const usuariosOrdenados = [...dados].sort((a, b) =>
        (a.nome || "").localeCompare(b.nome || "")
      );
      setUsuarios(usuariosOrdenados);
    } catch (error) {
      console.error("Erro ao carregar usuários:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível carregar os usuários."
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    carregarUsuarios();
  }, []);

  const resetModal = () => {
    setNovoNome("");
    setNovoEmail("");
    setNovoPerfil("Vendedor");
    setNovoTelefone("");
    setNovoCargo("");
    setUsuarioEmEdicao(null);
  };

  const handleNovoUsuario = () => {
    resetModal();
    setIsModalOpen(true);
  };

  const handleEditarUsuario = (usuario: Usuario) => {
    setNovoNome(usuario.nome);
    setNovoEmail(usuario.email);
    const perfilFormatado = usuario.perfil === 'Administrador' ? 'Administrador' : 'Vendedor';
    setNovoPerfil(perfilFormatado);
    setNovoTelefone(usuario.phone || "");
    setNovoCargo(usuario.jobTitle || "");
    setUsuarioEmEdicao(usuario);
    setIsModalOpen(true);
  };

  const handleClickExcluir = () => {
    setAlertExclusaoOpen(true);
  };

  const confirmarExclusao = async () => {
    if (!usuarioEmEdicao) return;
    const id = usuarioEmEdicao.id || (usuarioEmEdicao as any)._id;

    try {
      await deleteUserApi(id);
      toast({
        title: "Usuário Excluído",
        description: `O usuário ${usuarioEmEdicao.nome} foi removido.`
      });
      setAlertExclusaoOpen(false);
      setIsModalOpen(false);
      resetModal();
      carregarUsuarios();
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Erro ao Excluir",
        description: "Não foi possível remover o usuário."
      });
    }
  };

  const handleSalvarUsuario = async () => {
    if (!novoNome.trim() || !novoEmail.trim()) {
      toast({
        variant: "destructive",
        title: "Dados Incompletos",
        description: "Nome e E-mail são obrigatórios."
      });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(novoEmail)) {
      toast({
        variant: "destructive",
        title: "E-mail Inválido",
        description: "Por favor, insira um endereço de e-mail válido."
      });
      return;
    }

    const telLimpo = novoTelefone.replace(/\D/g, "");
    if (telLimpo.length > 0 && telLimpo.length < 10) {
      toast({
        variant: "destructive",
        title: "Telefone Inválido",
        description: "O número deve conter DDD + 8 ou 9 dígitos."
      });
      return;
    }

    try {
      if (usuarioEmEdicao) {
        const id = usuarioEmEdicao.id || (usuarioEmEdicao as any)._id;
        await updateUserApi(id, {
          nome: novoNome,
          email: novoEmail,
          perfil: novoPerfil,
          telefone: novoTelefone,
          cargo: novoCargo
        });
        toast({
          title: "Usuário Atualizado",
          description: "As alterações foram salvas com sucesso."
        });
      } else {
        await createUserApi({
          nome: novoNome,
          email: novoEmail,
          perfil: novoPerfil,
          telefone: novoTelefone,
          cargo: novoCargo
        });
        toast({
          title: "Usuário Criado",
          description: "Novo acesso liberado com sucesso."
        });
      }

      setIsModalOpen(false);
      resetModal();
      carregarUsuarios();
    } catch (error: any) {
      console.error(error);
      let msg = "Não foi possível salvar os dados.";
      try {
        const parsed = JSON.parse(error.message);
        if (parsed.message) msg = parsed.message;
      } catch (e) { }
      toast({
        variant: "destructive",
        title: "Erro na Operação",
        description: msg
      });
    }
  };

  const handleClickStatus = (usuario: Usuario) => {
    setUsuarioParaStatus(usuario);
    setAlertStatusOpen(true);
  };

  const confirmarStatus = async () => {
    if (!usuarioParaStatus) return;
    const novoStatus = !usuarioParaStatus.ativo;

    try {
      await updateUserApi(usuarioParaStatus.id, { ativo: novoStatus });
      toast({
        title: `Usuário ${novoStatus ? 'Ativado' : 'Inativado'}`,
        description: `Status de ${usuarioParaStatus.nome} atualizado.`
      });
      carregarUsuarios();
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível alterar o status do usuário."
      });
    } finally {
      setAlertStatusOpen(false);
      setUsuarioParaStatus(null);
    }
  };

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  const filteredUsuarios = usuarios.filter(u =>
    u.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Estatísticas dos usuários
  const totalUsuarios = usuarios.length;
  const usuariosAtivos = usuarios.filter(u => u.ativo).length;
  const usuariosInativos = usuarios.filter(u => !u.ativo).length;
  const totalAdmins = usuarios.filter(u => u.perfil === 'Administrador').length;

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
              Gerenciar Usuários
            </h1>
            <p className="text-sm text-muted-foreground">
              Gerencie os acessos e permissões do sistema
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar usuário..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
              <DialogTrigger asChild>
                <Button onClick={handleNovoUsuario} className="shrink-0 bg-gradient-primary hover:bg-primary-hover">
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Usuário
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {usuarioEmEdicao ? "Editar Usuário" : "Novo Usuário"}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="nomeUsuario">Nome <span className="text-red-500">*</span></Label>
                      <Input
                        id="nomeUsuario"
                        placeholder="Nome completo"
                        value={novoNome}
                        onChange={(e) => setNovoNome(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="emailUsuario">E-mail <span className="text-red-500">*</span></Label>
                      <Input
                        id="emailUsuario"
                        type="email"
                        placeholder="email@nautiluz.com.br"
                        value={novoEmail}
                        onChange={(e) => setNovoEmail(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="perfilUsuario">Perfil (Acesso) <span className="text-red-500">*</span></Label>
                      <Select value={novoPerfil} onValueChange={setNovoPerfil}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o perfil" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Vendedor">Vendedor</SelectItem>
                          <SelectItem value="Administrador">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cargoUsuario">Cargo</Label>
                      <Input
                        id="cargoUsuario"
                        placeholder="Ex: Gerente Comercial"
                        value={novoCargo}
                        onChange={(e) => setNovoCargo(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="telefoneUsuario">Telefone</Label>
                    <Input
                      id="telefoneUsuario"
                      placeholder="(99) 99999-9999"
                      value={novoTelefone}
                      onChange={(e) => setNovoTelefone(formatPhone(e.target.value))}
                      maxLength={15}
                    />
                  </div>

                  <div className="flex gap-2 justify-end pt-4">
                    {usuarioEmEdicao && (
                      <Button
                        variant="destructive"
                        type="button"
                        onClick={handleClickExcluir}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Excluir Usuário
                      </Button>
                    )}
                    <Button
                      className={usuarioEmEdicao ? "flex-1 bg-gradient-primary" : "w-full bg-gradient-primary"}
                      onClick={handleSalvarUsuario}
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {usuarioEmEdicao ? "Salvar Alterações" : "Criar Usuário"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden p-4 sm:p-6 flex flex-col gap-6">
        
        {/* Cards de Métricas */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20 dark:from-primary/10 dark:to-primary/5 dark:border-primary/30">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-primary font-medium">Usuários</p>
                  <p className="text-2xl font-bold text-primary dark:text-foreground">{totalUsuarios}</p>
                  <p className="text-xs text-primary/80 dark:text-foreground/80">{usuariosAtivos} ativos</p>
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
                  <p className="text-xs text-success font-medium">Administradores</p>
                  <p className="text-2xl font-bold text-success dark:text-foreground">{totalAdmins}</p>
                  <p className="text-xs text-success/80 dark:text-foreground/80">com acesso total</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-success/20 flex items-center justify-center">
                  <Shield className="h-5 w-5 text-success" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-accent/5 to-accent/10 border-accent/20 dark:from-accent/10 dark:to-accent/5 dark:border-accent/30">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-accent-foreground font-medium">Inativos</p>
                  <p className="text-2xl font-bold text-accent-foreground dark:text-foreground">{usuariosInativos}</p>
                  <p className="text-xs text-accent-foreground/80 dark:text-foreground/80">sem acesso</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-accent/20 flex items-center justify-center">
                  <UserX className="h-5 w-5 text-accent-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabela de Detalhes */}
        <Card className="flex-1 flex flex-col overflow-hidden">
          <CardHeader className="shrink-0">
            <CardTitle>Detalhes dos Usuários</CardTitle>
            <CardDescription>
              Informações completas de cada usuário do sistema
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden">
            <div className="h-full overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuário</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-center">Perfil</TableHead>
                    <TableHead className="text-center">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsuarios.map((usuario) => (
                    <TableRow key={usuario.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={usuario.foto || ''} className="object-cover" />
                            <AvatarFallback className="text-xs bg-primary/10">
                              {usuario.nome.split(' ').map(n => n[0]).join('').substring(0, 2)}
                            </AvatarFallback>
                          </Avatar>

                          <div className="flex flex-col gap-0.5">
                            <p className="font-medium text-sm text-foreground leading-none">{usuario.nome}</p>
                            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mt-0.5">
                              {usuario.jobTitle && (
                                <>
                                  <span className="font-medium text-foreground/80">{usuario.jobTitle}</span>
                                  <span className="text-muted-foreground/40">•</span>
                                </>
                              )}
                              <span>{usuario.email}</span>
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        {usuario.ativo ? (
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
                      <TableCell className="text-center">
                        <Badge variant="outline" className="text-[9px] h-4 px-1.5 font-medium border-primary/20 text-primary uppercase tracking-wide">
                          {usuario.perfil || "Vendedor"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-primary"
                            onClick={() => handleEditarUsuario(usuario)}
                            title="Editar Dados"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className={cn("h-8 w-8", usuario.ativo ? "text-destructive hover:text-destructive hover:bg-destructive/10" : "text-green-600 hover:text-green-700 hover:bg-success/10 dark:hover:bg-success/5")}
                            onClick={() => handleClickStatus(usuario)}
                            title={usuario.ativo ? "Inativar Usuário" : "Reativar Usuário"}
                          >
                            {usuario.ativo ? (
                              <XCircle className="h-4 w-4" />
                            ) : (
                              <CheckCircle className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {filteredUsuarios.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Nenhum usuário encontrado</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modal de Confirmação: Excluir */}
      <AlertDialog open={alertExclusaoOpen} onOpenChange={setAlertExclusaoOpen}>
        <AlertDialogContent className="max-w-[90vw] sm:max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza absoluta?</AlertDialogTitle>
            <AlertDialogDescription>
              Essa ação não pode ser desfeita. Isso excluirá permanentemente o usuário
              <br />
              <span className="font-bold text-foreground break-all">
                {usuarioEmEdicao?.nome}
              </span>
              <br />
              e removerá seus dados dos nossos servidores.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmarExclusao}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Sim, excluir usuário
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal de Confirmação: Status */}
      <AlertDialog open={alertStatusOpen} onOpenChange={setAlertStatusOpen}>
        <AlertDialogContent className="max-w-[90vw] sm:max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {usuarioParaStatus?.ativo ? "Inativar Usuário" : "Reativar Usuário"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja {usuarioParaStatus?.ativo ? "inativar" : "ativar"} o acesso de
              <br />
              <span className="font-bold text-foreground break-all">
                {usuarioParaStatus?.nome}
              </span>
              ?
              <br />
              {usuarioParaStatus?.ativo && (
                <span className="block mt-2">
                  Ele perderá o acesso ao sistema imediatamente.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmarStatus}
              className={usuarioParaStatus?.ativo ? "bg-destructive hover:bg-destructive/90" : "bg-green-600 hover:bg-green-700"}
            >
              {usuarioParaStatus?.ativo ? "Inativar" : "Ativar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default GerenciarUsuarios;
