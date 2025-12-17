import { ChangeEvent, useState, useRef, useEffect, useMemo} from "react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, User, Shield, Bell, Palette, Database, Users, Plus, Edit, Trash2, XCircle, CheckCircle, Key, Mail, Smartphone, Save } from "lucide-react";
import ImagePreviewOverlay from "@/components/ui/ImagePreviewOverlay";
import { fetchUsers, createUserApi, updateUserApi, deleteUserApi } from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

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

// Função para converter Arquivo -> Base64
const convertFileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};

const Configuracoes = () => {
  const { toast } = useToast();
  const { user, updateUserLocal } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [notificacaoEmail, setNotificacaoEmail] = useState(true);
  const [notificacaoSMS, setNotificacaoSMS] = useState(false);
  const [modoEscuro, setModoEscuro] = useState(false);
  const [autoSave, setAutoSave] = useState(true);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);

  // Estados do Perfil
  const [perfilNome, setPerfilNome] = useState("");
  const [perfilEmail, setPerfilEmail] = useState("");
  const [perfilTelefone, setPerfilTelefone] = useState("");
  const [perfilCargo, setPerfilCargo] = useState("");
  const [perfilAssinatura, setPerfilAssinatura] = useState("");

  // Estados de Senha
  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [fotoPerfil, setFotoPerfil] = useState<string | null>(null);// foto confirmada
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);// preview da imagem
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);// controla o modal(componente que sobrepõe a tela)
  const [arquivoTemporario, setArquivoTemporario] = useState<File | null>(null);

  // Estados para o formulário de Novo Usuário
  const [novoNome, setNovoNome] = useState("");
  const [novoEmail, setNovoEmail] = useState("");
  const [novoPerfil, setNovoPerfil] = useState("Vendedor");
  const [novoTelefone, setNovoTelefone] = useState("");
  const [novoCargo, setNovoCargo] = useState("");
  const [novaAssinatura, setNovaAssinatura] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [usuarioEmEdicao, setUsuarioEmEdicao] = useState<Usuario | null>(null);

  const [alertExclusaoOpen, setAlertExclusaoOpen] = useState(false); // Modal de Excluir
  const [alertStatusOpen, setAlertStatusOpen] = useState(false);     // Modal de Ativar/Inativar
  const [usuarioParaStatus, setUsuarioParaStatus] = useState<Usuario | null>(null); // Quem vamos ativar/inativar?

  // Preenche os campos automaticamente quando o usuário logado carregar
  useEffect(() => {
    if (user) {
      setPerfilNome(user.name || "");
      setPerfilEmail(user.email || "");
      if (user.photoUrl) setFotoPerfil(user.photoUrl);
      setPerfilTelefone((user as any).phone || ""); 
      setPerfilCargo((user as any).jobTitle || "");
      setPerfilAssinatura((user as any).emailSignature || "");
    }
  }, [user]);

  // Verifica se algo mudou nos dados
  const temAlteracoesPerfil = useMemo(() => {
    if (!user) return false;
    
    const mudouNome = perfilNome !== (user.name || "");
    const mudouEmail = perfilEmail !== (user.email || "");
    const mudouFoto = fotoPerfil !== (user.photoUrl || null);
    
    const mudouTelefone = perfilTelefone !== ((user as any).phone || "");
    const mudouCargo = perfilCargo !== ((user as any).jobTitle || "");
    const mudouAssinatura = perfilAssinatura !== ((user as any).emailSignature || "");
    
    return mudouNome || mudouEmail || mudouFoto || mudouTelefone || mudouCargo || mudouAssinatura;
  }, [user, perfilNome, perfilEmail, fotoPerfil, perfilTelefone, perfilCargo, perfilAssinatura]);

  // Verifica se o formulário de senha está válido
  const podeSalvarSenha = useMemo(() => {
    return (
      senhaAtual.length > 0 && 
      novaSenha.length >= 6 && // Mínimo de 6 caracteres
      senhaAtual !== novaSenha // Nova senha deve ser diferente da atual
    );
  }, [senhaAtual, novaSenha, confirmarSenha]);

  const carregarUsuarios = async () => {
    try {
      const dados = await fetchUsers();
      setUsuarios(dados);
    } catch (error) {
      console.error("Erro ao carregar usuários:", error);
    }
  };

  useEffect(() => {
    carregarUsuarios();
  }, []);

  // Reseta os campos do modal
  const resetModal = () => {
    setNovoNome("");
    setNovoEmail("");
    setNovoPerfil("Vendedor");
    setNovoTelefone("");
    setNovoCargo("");
    setNovaAssinatura("");
    setUsuarioEmEdicao(null);
  };

  // Abre modal para CRIAR
  const handleNovoUsuario = () => {
    resetModal();
    setIsModalOpen(true);
  };

  // Abre modal para EDITAR
  const handleEditarUsuario = (usuario: Usuario) => {
    setNovoNome(usuario.nome);
    setNovoEmail(usuario.email);
    const perfilFormatado = usuario.perfil === 'Administrador' ? 'Administrador' : 
                            usuario.perfil === 'Financeiro' ? 'Financeiro' : 'Vendedor';
    setNovoPerfil(perfilFormatado);
    
    setNovoTelefone(usuario.phone || "");
    setNovoCargo(usuario.jobTitle || "");
    setNovaAssinatura(usuario.emailSignature || "");
    
    setUsuarioEmEdicao(usuario);
    setIsModalOpen(true);
  };

  // Máscara de telefone específica para o Modal
  const handleNovoTelefoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    value = value.replace(/\D/g, "");
    if (value.length > 11) value = value.slice(0, 11);
    value = value.replace(/^(\d{2})(\d)/g, "($1) $2");
    value = value.replace(/(\d)(\d{4})$/, "$1-$2");
    setNovoTelefone(value);
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
    // Validação 1: Obrigatórios
    if (!novoNome.trim() || !novoEmail.trim()) {
      toast({
        variant: "destructive",
        title: "Dados Incompletos",
        description: "Nome e E-mail são obrigatórios."
      });
      return;
    }

    // Validação 2: Formato de E-mail
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(novoEmail)) {
      toast({
        variant: "destructive",
        title: "E-mail Inválido",
        description: "Por favor, insira um endereço de e-mail válido."
      });
      return;
    }
    
    // Validação 3: Telefone
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
        // --- MODO EDIÇÃO ---
        const id = usuarioEmEdicao.id || (usuarioEmEdicao as any)._id;
        
        await updateUserApi(id, {
          nome: novoNome,
          email: novoEmail,
          perfil: novoPerfil,
          telefone: novoTelefone,
          cargo: novoCargo,
          assinatura: novaAssinatura
        });
        
        toast({
          title: "Usuário Atualizado",
          description: "As alterações foram salvas com sucesso."
        });

      } else {
        // --- MODO CRIAÇÃO ---
        await createUserApi({
          nome: novoNome,
          email: novoEmail,
          perfil: novoPerfil,
          telefone: novoTelefone,
          cargo: novoCargo,
          assinatura: novaAssinatura
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
      
      // Tratamento de Erro JSON (igual fizemos na senha)
      let msg = "Não foi possível salvar os dados.";
      try {
        const parsed = JSON.parse(error.message);
        if (parsed.message) msg = parsed.message;
      } catch (e) { /* mantém msg padrão */ }

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
    const acao = novoStatus ? "ativar" : "inativar";

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
        description: `Não foi possível ${acao} o usuário.`
      });
    } finally {
      setAlertStatusOpen(false);
      setUsuarioParaStatus(null);
    }
  };


  
  const colunasPipeline = [
    { id: 'novo', nome: 'Novo', cor: '#3B82F6', sla: 24 },
    { id: 'qualificacao', nome: 'Qualificação', cor: '#8B5CF6', sla: 48 },
    { id: 'cotacao', nome: 'Cotação', cor: '#F59E0B', sla: 72 },
    { id: 'proposta', nome: 'Proposta Enviada', cor: '#EF4444', sla: 96 },
    { id: 'negociacao', nome: 'Negociação', cor: '#F97316', sla: 120 },
    { id: 'fechamento', nome: 'Fechamento', cor: '#10B981', sla: 48 },
  ];

  // Alterar foto de perfil
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setArquivoTemporario(file);

    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setIsPreviewOpen(true);
  };

  const handleCancelPreview = () => {
    fileInputRef.current!.value = "";
    setIsPreviewOpen(false);
    setPreviewUrl(null);
  };

  const handleConfirmPreview = async () => {
    if (arquivoTemporario) {
      try {
        const base64 = await convertFileToBase64(arquivoTemporario);
        setFotoPerfil(base64);
      } catch (error) {
        console.error("Erro ao converter imagem", error);
        toast({
          variant: "destructive",
          title: "Erro na Imagem",
          description: "Não foi possível processar o arquivo selecionado."
        });
      }
    }
    setIsPreviewOpen(false);
    setPreviewUrl(null);
    setArquivoTemporario(null);
  };

  const handleRemoverFoto = () => {
    setFotoPerfil(null);
    setArquivoTemporario(null);
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click(); // abre o seletor
  };

  const handleSalvarDados = async () => {
    const userId = user?.id || (user as any)?._id;

    if (!userId) {
      toast({
        variant: "destructive",
        title: "Erro de Sessão",
        description: "Não foi possível identificar o usuário logado."
      });
      return;
    }

    // 1. Validação de Obrigatórios
    if (!perfilNome.trim() || !perfilEmail.trim()) {
      toast({
        variant: "destructive",
        title: "Campos Obrigatórios",
        description: "Por favor, preencha o Nome e o E-mail."
      });
      return;
    }

    // 2. Validação de Telefone
    const telefoneLimpo = perfilTelefone.replace(/\D/g, "");
    if (telefoneLimpo.length > 0 && telefoneLimpo.length < 10) {
      toast({
        variant: "destructive",
        title: "Telefone Inválido",
        description: "O número deve conter DDD + Número."
      });
      return;
    }

    try {
      await updateUserApi(userId, {
        nome: perfilNome,
        email: perfilEmail,
        foto: fotoPerfil === null ? "" : fotoPerfil,
        telefone: perfilTelefone,
        cargo: perfilCargo,
        assinatura: perfilAssinatura
      });

      updateUserLocal({
        name: perfilNome,
        email: perfilEmail,
        photoUrl: fotoPerfil || undefined,
        ...({ phone: perfilTelefone, jobTitle: perfilCargo, emailSignature: perfilAssinatura } as any)
      });

      toast({
        title: "Perfil Atualizado",
        description: "Suas informações foram salvas com sucesso."
      });

    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Erro ao Salvar",
        description: "Não foi possível atualizar seus dados."
      });
    }
  };

  const handleAlterarSenha = async () => {
    const userId = user?.id || (user as any)?._id;

    if (!userId) return;

    // 1. Validação de Campos Vazios
    if (!novaSenha || !confirmarSenha) {
      toast({
        variant: "destructive",
        title: "Campos Incompletos",
        description: "Preencha a nova senha e a confirmação."
      });
      return;
    }

    // 2. Validação de Igualdade
    if (novaSenha !== confirmarSenha) {
      toast({
        variant: "destructive",
        title: "Senhas Diferentes",
        description: "A nova senha e a confirmação não conferem."
      });
      return;
    }

    try {
      await updateUserApi(userId, {
        senha: novaSenha,
        senhaAtual: senhaAtual
      });

      toast({
        title: "Senha Alterada",
        description: "Sua senha foi atualizada com sucesso."
      });
      
      setSenhaAtual("");
      setNovaSenha("");
      setConfirmarSenha("");

    } catch (error: any) {
      console.error(error);
      let msg = error.message || "Verifique a senha atual e tente novamente.";

      try {
        const parsed = JSON.parse(msg);
        if (parsed.message) {
          msg = parsed.message;
        }
      } catch (e) {
      }
      
      // Erro do Backend (Ex: Senha atual incorreta)
      toast({
        variant: "destructive",
        title: "Erro ao Alterar Senha",
        description: msg
      });
    }
  };

// Função auxiliar para mascarar o telefone: (99) 99999-9999
  const handleTelefoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    
    // Remove tudo que não for número
    value = value.replace(/\D/g, "");
    
    // Limita a 11 números (DDD + 9 dígitos)
    if (value.length > 11) {
      value = value.slice(0, 11);
    }

    // Adiciona parênteses no DDD
    value = value.replace(/^(\d{2})(\d)/g, "($1) $2");
    // Adiciona o hífen (funciona para 8 ou 9 dígitos)
    value = value.replace(/(\d)(\d{4})$/, "$1-$2");

    setPerfilTelefone(value);
  };



  return (
    <Layout>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="bg-card border-b border-border p-6 shadow-card">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Configurações</h1>
              <p className="text-sm text-muted-foreground">
                Gerencie as configurações do sistema e usuários
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 overflow-auto">
          <Tabs defaultValue="perfil" className="space-y-6">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="perfil" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Perfil
              </TabsTrigger>

              {isAdmin && (
                <TabsTrigger value="usuarios" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Usuários
                </TabsTrigger>
              )}

              {isAdmin && (
                <TabsTrigger value="pipeline" className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Pipeline
                </TabsTrigger>
              )}

              <TabsTrigger value="notificacoes" className="flex items-center gap-2">
                <Bell className="h-4 w-4" />
                Notificações
              </TabsTrigger>

              <TabsTrigger value="sistema" className="flex items-center gap-2">
                <Database className="h-4 w-4" />
                Sistema
              </TabsTrigger>

             {/* 
              <TabsTrigger value="seguranca" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Segurança
              </TabsTrigger>
              */}
            </TabsList>

            {/* Aba Perfil */}
            <TabsContent value="perfil" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Informações do Perfil
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">

                  <Avatar className="h-20 w-20">
                    <AvatarImage src={fotoPerfil ?? ""} alt="Foto do perfil" />
                    <AvatarFallback className="text-lg bg-primary text-primary-foreground">
                      {(user?.name || "N").slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileChange}
                    />

                    <Button variant="outline" size="sm" onClick={handleButtonClick}>
                      Alterar Foto
                    </Button>

                    {/* BOTÃO REMOVER (Só aparece se tiver foto) */}
                    {fotoPerfil && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={handleRemoverFoto}
                        title="Remover foto de perfil"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}

                    <p className="text-xs text-muted-foreground">
                      JPG, PNG ou GIF. Máximo 2MB.
                    </p>

                    {/* Modal de preview */}
                    {isPreviewOpen && previewUrl && (
                      <ImagePreviewOverlay
                        imageUrl={previewUrl}
                        onCancel={handleCancelPreview}
                        onConfirm={handleConfirmPreview}
                      />
                    )}
                  </div>
                 

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="nome">
                        Nome Completo <span className="text-red-500">*</span>
                      </Label>
                      <Input 
                        id="nome" 
                        value={perfilNome}
                        onChange={(e) => setPerfilNome(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">
                        E-mail <span className="text-red-500">*</span>
                      </Label>
                      <Input 
                        id="email" 
                        type="email" 
                        value={perfilEmail} 
                        onChange={(e) => setPerfilEmail(e.target.value)}
                        
                        disabled={!isAdmin}
                        className={!isAdmin ? "bg-muted text-muted-foreground cursor-not-allowed" : ""}
                        // --------------------
                      />
                      {!isAdmin && (
                        <p className="text-[10px] text-muted-foreground">
                          Para alterar seu e-mail, contate um administrador.
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="telefone">Telefone</Label>
                      <Input 
                        id="telefone" 
                        value={perfilTelefone} 
                        onChange={handleTelefoneChange}
                        placeholder="(99) 99999-9999"
                        maxLength={15}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cargo">Cargo</Label>
                      <Input 
                        id="cargo" 
                        value={perfilCargo} 
                        onChange={e => setPerfilCargo(e.target.value)}
                        disabled={!isAdmin}
                        className={!isAdmin ? "bg-muted text-muted-foreground" : ""}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="assinatura">Assinatura de E-mail</Label>
                    <Textarea
                      id="assinatura"
                      value={perfilAssinatura}
                      onChange={e => setPerfilAssinatura(e.target.value)}
                      placeholder="Sua assinatura..."
                    />
                  </div>
                  <div className="flex justify-begin">
                    <Button 
                      onClick={handleSalvarDados} 
                      disabled={!temAlteracoesPerfil}
                      className="bg-gradient-primary hover:bg-primary-hover disabled:opacity-50"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Salvar Alterações
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Key className="h-5 w-5" />
                    Alterar Senha
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="senhaAtual">Senha Atual</Label>
                    <Input 
                      id="senhaAtual" 
                      type="password" 
                      value={senhaAtual}
                      onChange={(e) => setSenhaAtual(e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="novaSenha">Nova Senha</Label>
                      <Input 
                        id="novaSenha" 
                        type="password" 
                        value={novaSenha}
                        onChange={(e) => setNovaSenha(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmarSenha">Confirmar Nova Senha</Label>
                      <Input 
                        id="confirmarSenha" 
                        type="password" 
                        value={confirmarSenha}
                        onChange={(e) => setConfirmarSenha(e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <Button 
                    variant="outline" 
                    onClick={handleAlterarSenha}
                    disabled={!podeSalvarSenha}
                  >
                    Alterar Senha
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Aba Usuários */}
            {isAdmin && (
              <TabsContent value="usuarios" className="space-y-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Gerenciar Usuários
                    </CardTitle>
                    <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                      <DialogTrigger asChild>
                        <Button 
                          size="sm" 
                          className="bg-gradient-primary hover:bg-primary-hover"
                          onClick={handleNovoUsuario}
                        >
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
                          
                          {/* Linha 1: Nome e Email */}
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

                          {/* Linha 2: Perfil e Cargo */}
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="perfilUsuario">Perfil (Acesso) <span className="text-red-500">*</span></Label>
                              <Select value={novoPerfil} onValueChange={setNovoPerfil}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione o perfil" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Vendedor">Vendedor</SelectItem>
                                  <SelectItem value="Financeiro">Financeiro</SelectItem>
                                  <SelectItem value="Administrador">Administrador</SelectItem>
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

                          {/* Linha 3: Telefone */}
                          <div className="space-y-2">
                            <Label htmlFor="telefoneUsuario">Telefone</Label>
                            <Input 
                              id="telefoneUsuario" 
                              placeholder="(99) 99999-9999"
                              value={novoTelefone}
                              onChange={handleNovoTelefoneChange}
                              maxLength={15}
                            />
                          </div>

                          {/* Linha 4: Assinatura */}
                          <div className="space-y-2">
                            <Label htmlFor="assinaturaUsuario">Assinatura de E-mail</Label>
                            <Textarea 
                              id="assinaturaUsuario" 
                              placeholder="Assinatura padrão para e-mails..."
                              value={novaAssinatura}
                              onChange={(e) => setNovaAssinatura(e.target.value)}
                            />
                          </div>

                          <div className="flex gap-2 justify-end pt-4">
                            {/* Botão de Excluir (Só aparece se estiver editando) */}
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

                            {/* Botão Salvar (Ocupa o resto do espaço ou largura total se for novo) */}
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
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {usuarios.map((usuario) => (
                        <div key={usuario.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                          <div className="flex items-center gap-4">
                            <Avatar>
                              <AvatarImage src={usuario.foto} alt={usuario.nome} />
                              <AvatarFallback className="bg-primary text-primary-foreground">
                                {usuario.nome.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <h4 className="font-medium">{usuario.nome}</h4>
                              <p className="text-sm text-muted-foreground">{usuario.email}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs text-muted-foreground">{usuario.perfil}</span>
                                <span className={`text-xs px-2 py-1 rounded-full ${
                                  usuario.ativo 
                                    ? 'bg-success/20 text-success' 
                                    : 'bg-muted text-muted-foreground'
                                }`}>
                                  {usuario.ativo ? 'Ativo' : 'Inativo'}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleEditarUsuario(usuario)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>

                            <Button
                              variant="ghost"
                              size="sm"
                              className={usuario.ativo ? "text-destructive hover:text-destructive" : "text-green-600 hover:text-green-700"}
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
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            )}

            {/* Aba Pipeline */}
            {isAdmin && (
              <TabsContent value="pipeline" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="h-5 w-5" />
                      Configurações do Pipeline
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      {colunasPipeline.map((coluna, index) => (
                        <div key={coluna.id} className="flex items-center gap-4 p-4 border border-border rounded-lg">
                          <div className="flex items-center gap-3 flex-1">
                            <div 
                              className="w-4 h-4 rounded-full"
                              style={{ backgroundColor: coluna.cor }}
                            />
                            <Input defaultValue={coluna.nome} className="flex-1" />
                            <div className="flex items-center gap-2">
                              <Label className="text-sm">SLA:</Label>
                              <Input 
                                type="number" 
                                defaultValue={coluna.sla} 
                                className="w-20"
                              />
                              <span className="text-sm text-muted-foreground">horas</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                            {index > 2 && (
                              <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    <Button variant="outline" className="w-full">
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar Nova Etapa
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>
            )}

            {/* Aba Notificações */}
            <TabsContent value="notificacoes" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5" />
                    Preferências de Notificação
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Mail className="h-5 w-5 text-primary" />
                        <div>
                          <h4 className="font-medium">Notificações por E-mail</h4>
                          <p className="text-sm text-muted-foreground">
                            Receber alertas de novos leads e atualizações
                          </p>
                        </div>
                      </div>
                      <Switch
                        checked={notificacaoEmail}
                        onCheckedChange={setNotificacaoEmail}
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Smartphone className="h-5 w-5 text-primary" />
                        <div>
                          <h4 className="font-medium">Notificações por SMS</h4>
                          <p className="text-sm text-muted-foreground">
                            Alertas urgentes para leads quentes
                          </p>
                        </div>
                      </div>
                      <Switch
                        checked={notificacaoSMS}
                        onCheckedChange={setNotificacaoSMS}
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Bell className="h-5 w-5 text-primary" />
                        <div>
                          <h4 className="font-medium">Alertas SLA</h4>
                          <p className="text-sm text-muted-foreground">
                            Avisos quando leads estão próximos do vencimento
                          </p>
                        </div>
                      </div>
                      <Switch defaultChecked />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Aba Sistema */}
            <TabsContent value="sistema" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5" />
                    Configurações do Sistema
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Palette className="h-5 w-5 text-primary" />
                        <div>
                          <h4 className="font-medium">Modo Escuro</h4>
                          <p className="text-sm text-muted-foreground">
                            Alternar entre tema claro e escuro
                          </p>
                        </div>
                      </div>
                      <Switch
                        checked={modoEscuro}
                        onCheckedChange={setModoEscuro}
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Save className="h-5 w-5 text-primary" />
                        <div>
                          <h4 className="font-medium">Auto-salvamento</h4>
                          <p className="text-sm text-muted-foreground">
                            Salvar alterações automaticamente
                          </p>
                        </div>
                      </div>
                      <Switch
                        checked={autoSave}
                        onCheckedChange={setAutoSave}
                      />
                    </div>
                  </div>


                  {/* 
                  <Separator />

                  <div className="space-y-4">
                    <h4 className="font-medium">Backup e Restauração</h4>
                    <div className="flex gap-4">
                      <Button variant="outline">
                        Fazer Backup
                      </Button>
                      <Button variant="outline">
                        Restaurar Backup
                      </Button>
                    </div>
                  </div>
                  */}

                </CardContent>
              </Card>
            </TabsContent>

            {/* Aba Segurança */}
            
            <TabsContent value="seguranca" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Configurações de Segurança
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="p-4 border border-border rounded-lg">
                      <h4 className="font-medium mb-2">Autenticação de Dois Fatores (2FA)</h4>
                      <p className="text-sm text-muted-foreground mb-4">
                        Adicione uma camada extra de segurança à sua conta
                      </p>
                      <Button variant="outline">Ativar 2FA</Button>
                    </div>

                    <div className="p-4 border border-border rounded-lg">
                      <h4 className="font-medium mb-2">Sessões Ativas</h4>
                      <p className="text-sm text-muted-foreground mb-4">
                        Gerencie dispositivos conectados à sua conta
                      </p>
                      <Button variant="outline">Ver Sessões</Button>
                    </div>

                    <div className="p-4 border border-border rounded-lg">
                      <h4 className="font-medium mb-2">Log de Atividades</h4>
                      <p className="text-sm text-muted-foreground mb-4">
                        Visualize todas as ações realizadas no sistema
                      </p>
                      <Button variant="outline">Ver Logs</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
      {/* --- MODAL DE CONFIRMAÇÃO: EXCLUIR --- */}
      <AlertDialog open={alertExclusaoOpen} onOpenChange={setAlertExclusaoOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza absoluta?</AlertDialogTitle>
            <AlertDialogDescription>
              Essa ação não pode ser desfeita. Isso excluirá permanentemente o usuário 
              <span className="font-bold text-foreground"> {usuarioEmEdicao?.nome} </span>
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

      {/* --- MODAL DE CONFIRMAÇÃO: STATUS --- */}
      <AlertDialog open={alertStatusOpen} onOpenChange={setAlertStatusOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {usuarioParaStatus?.ativo ? "Inativar Usuário" : "Reativar Usuário"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja {usuarioParaStatus?.ativo ? "inativar" : "ativar"} o acesso de 
              <span className="font-bold text-foreground"> {usuarioParaStatus?.nome}</span>?
              {usuarioParaStatus?.ativo && " Ele perderá o acesso ao sistema imediatamente."}
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

    </Layout>
  );
};

export default Configuracoes;