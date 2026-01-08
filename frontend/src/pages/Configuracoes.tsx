import { ChangeEvent, useState, useRef, useEffect, useMemo } from "react";
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
import { Settings, User, Shield, Bell, Palette, Database, Users, Plus, Edit, Trash2, XCircle, CheckCircle, Key, Mail, Smartphone, Save, Loader2 } from "lucide-react";
import ImagePreviewOverlay from "@/components/ui/ImagePreviewOverlay";
import {
  fetchUsers,
  createUserApi,
  updateUserApi,
  deleteUserApi,
  fetchPipelines,
  fetchStages,
  createStageApi,
  updateStageApi,
  deleteStageApi,
  reorderStagesApi,
  mapApiStageToColuna
} from "@/lib/api";
import { Coluna } from "@/types/crm";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

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
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  restrictToVerticalAxis,
  restrictToParentElement
} from "@dnd-kit/modifiers";

import { SortableStageRow } from "@/components/ui/sortable-stage-row";

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



  // Estados do Pipeline Dinâmico
  const [stages, setStages] = useState<Coluna[]>([]);
  const [loadingPipeline, setLoadingPipeline] = useState(false);
  const [selectedPipelineId, setSelectedPipelineId] = useState<string | null>(null);

  // Controle de Edição de Etapa
  const [editingStageId, setEditingStageId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Coluna>>({});

  // Controle de Exclusão de Etapa
  const [stageParaExcluir, setStageParaExcluir] = useState<Coluna | null>(null);
  const [alertExclusaoEtapaOpen, setAlertExclusaoEtapaOpen] = useState(false);

  // 1. Carregar Pipeline ao abrir
  useEffect(() => {
    carregarDadosPipeline();
  }, []);

  const carregarDadosPipeline = async () => {
    // Evita recarregar se já estiver na aba de pipeline, mas garante dados frescos
    setLoadingPipeline(true);
    try {
      const pipelines = await fetchPipelines();
      if (pipelines.length > 0) {
        const pipelinePadrao = pipelines[0];
        const id = pipelinePadrao._id || pipelinePadrao.id;
        setSelectedPipelineId(id);
        await carregarEtapas(id);
      }
    } catch (error) {
      console.error(error);
      toast({ variant: "destructive", title: "Erro", description: "Falha ao carregar pipeline." });
    } finally {
      setLoadingPipeline(false);
    }
  };

  const carregarEtapas = async (pipelineId: string) => {
    try {
      const rawStages = await fetchStages(pipelineId);
      const formattedStages = rawStages.map(mapApiStageToColuna);
      setStages(formattedStages.sort((a, b) => a.ordem - b.ordem));
    } catch (error) {
      console.error(error);
    }
  };

  // 2. Adicionar Etapa
  const handleAdicionarEtapa = async () => {
    if (!selectedPipelineId) return;
    try {
      const novaOrdem = stages.length > 0 ? Math.max(...stages.map(s => s.ordem)) + 1 : 1;
      const keyGerada = `nova-${Date.now()}`;

      await createStageApi(selectedPipelineId, {
        name: "Nova Etapa",
        color: "#94a3b8",
        sla: 24,
        order: novaOrdem,
        key: keyGerada
      });

      toast({ title: "Etapa Criada", description: "Edite o nome e a cor conforme necessário." });
      carregarEtapas(selectedPipelineId);
    } catch (error) {
      toast({ variant: "destructive", title: "Erro", description: "Não foi possível criar a etapa." });
    }
  };

  // 3. Salvar Edição (Nome, Cor, SLA)
  const handleSalvarEdicaoEtapa = async (stage: Coluna) => {
    if (editForm.nome !== undefined && editForm.nome.trim() === "") {
      toast({
        variant: "destructive",
        title: "Nome inválido",
        description: "O nome da etapa não pode ficar vazio."
      });
      return;
    }

    try {
      await updateStageApi(stage.id, {
        name: editForm.nome,
        sla: editForm.sla,
        color: editForm.cor,
      });

      toast({ title: "Atualizado", description: "Etapa salva com sucesso." });
      setEditingStageId(null);
      setEditForm({});
      if (selectedPipelineId) carregarEtapas(selectedPipelineId);
    } catch (error) {
      toast({ variant: "destructive", title: "Erro", description: "Falha ao salvar alterações." });
    }
  };

  // 4. Confirmar Exclusão
  const confirmarExclusaoEtapa = async () => {
    if (!stageParaExcluir) return;
    try {
      await deleteStageApi(stageParaExcluir.id);
      toast({ title: "Excluída", description: "Etapa removida com sucesso." });
      if (selectedPipelineId) carregarEtapas(selectedPipelineId);
    } catch (error: any) {
      let msg = "Não foi possível excluir.";
      try {
        const parsed = JSON.parse(error.message);
        if (parsed.message) msg = parsed.message;
      } catch (e) {
        if (error.message) msg = error.message;
      }

      toast({
        variant: "destructive",
        title: "Operação Bloqueada",
        description: msg
      });
    } finally {
      setAlertExclusaoEtapaOpen(false);
      setStageParaExcluir(null);
    }
  };


  // Configuração dos Sensores (Copiado/Adaptado do seu Kanban)
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 }, // 5px de movimento para iniciar o arrasto
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Função chamada quando solta o item
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    // 1. Atualiza visualmente primeiro
    setStages((items) => {
      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over.id);

      const newOrder = arrayMove(items, oldIndex, newIndex);

      // 2. Chama a API em background para salvar a nova ordem
      if (selectedPipelineId) {
        const idsOrdenados = newOrder.map(s => s.id);

        reorderStagesApi(selectedPipelineId, idsOrdenados)
          .then(() => {
            console.log("Ordem salva com sucesso");
          })
          .catch((err) => {
            console.error("Erro ao salvar ordem", err);
            toast({
              variant: "destructive",
              title: "Erro de Sincronização",
              description: "A nova ordem não pode ser salva. Recarregue a página."
            });
          });
      }

      return newOrder;
    });
  };





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
    <>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="bg-card border-b border-border p-4 sm:p-6 shadow-card">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg sm:text-2xl font-bold text-foreground">Configurações</h1>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Gerencie as configurações do sistema e usuários
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-4 sm:p-6 overflow-auto">
          <div className="space-y-4 sm:space-y-6">
            {/* Perfil */}
            <Card>
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <User className="h-4 w-4 sm:h-5 sm:w-5" />
                  Informações do Perfil
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6 pt-0">

                <Avatar className="h-16 w-16 sm:h-20 sm:w-20">
                  <AvatarImage src={fotoPerfil ?? ""} alt="Foto do perfil" />
                  <AvatarFallback className="text-base sm:text-lg bg-primary text-primary-foreground">
                    {(user?.name || "N").slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                  />

                  <Button variant="outline" size="sm" onClick={handleButtonClick} className="h-8 text-xs sm:text-sm">
                    Alterar Foto
                  </Button>

                  {/* BOTÃO REMOVER (Só aparece se tiver foto) */}
                  {fotoPerfil && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8"
                      onClick={handleRemoverFoto}
                      title="Remover foto de perfil"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}

                  <p className="text-[10px] sm:text-xs text-muted-foreground w-full sm:w-auto">
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

            {/* Usuários */}
            {isAdmin && (
              <div className="space-y-6">
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
                          <Plus className="h-4 w-4 sm:mr-2" />
                          <span className="hidden sm:inline">Novo Usuário</span>
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
                        <div key={usuario.id} className="grid grid-cols-[1fr_auto] items-center gap-2 sm:gap-4 p-3 sm:p-4 border border-border rounded-lg">

                          {/* LADO ESQUERDO: Avatar + Infos */}
                          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                            <Avatar className="h-9 w-9 sm:h-10 sm:w-10 shrink-0">
                              <AvatarImage src={usuario.foto} alt={usuario.nome} />
                              <AvatarFallback className="bg-primary text-primary-foreground text-xs sm:text-sm">
                                {usuario.nome.split(' ').map(n => n[0]).join('').slice(0, 2)}
                              </AvatarFallback>
                            </Avatar>

                            <div className="min-w-0 flex-1 space-y-0.5 sm:space-y-1">
                              <h4 className="font-medium text-sm sm:text-base truncate" title={usuario.nome}>
                                {usuario.nome}
                              </h4>

                              <p className="text-xs sm:text-sm text-muted-foreground truncate" title={usuario.email}>
                                {usuario.email}
                              </p>

                              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 pt-1">
                                <span className="text-[10px] sm:text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded border border-border/50 whitespace-nowrap">
                                  {usuario.perfil}
                                </span>
                                <span className={`text-[10px] sm:text-xs px-1.5 py-0.5 rounded-full border whitespace-nowrap ${usuario.ativo
                                    ? 'bg-green-50 text-green-700 border-green-200'
                                    : 'bg-gray-100 text-gray-500 border-gray-200'
                                  }`}>
                                  {usuario.ativo ? 'Ativo' : 'Inativo'}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* LADO DIREITO: Botões (Fixo) */}
                          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-primary"
                              onClick={() => handleEditarUsuario(usuario)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>

                            <Button
                              variant="ghost"
                              size="icon"
                              className={cn("h-8 w-8", usuario.ativo ? "text-destructive hover:text-destructive hover:bg-destructive/10" : "text-green-600 hover:text-green-700 hover:bg-green-50")}
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
              </div>
            )}

            {/* Pipeline */}
            {isAdmin && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="h-5 w-5" />
                      Configurações do Pipeline
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">

                    {loadingPipeline ? (
                      <div className="flex justify-center p-8"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>
                    ) : (
                      <div className="space-y-4">

                        {/* ENVOLVE A LISTA COM O CONTEXTO DE DRAG AND DROP */}
                        <DndContext
                          sensors={sensors}
                          collisionDetection={closestCenter}
                          onDragEnd={handleDragEnd}
                          modifiers={[restrictToVerticalAxis, restrictToParentElement]}
                        >
                          <SortableContext
                            items={stages.map(s => s.id)}
                            strategy={verticalListSortingStrategy}
                          >
                            {stages.map((stage) => {
                              const isEditing = editingStageId === stage.id;

                              return (
                                <SortableStageRow key={stage.id} id={stage.id}>
                                  <div className="grid grid-cols-[1fr_auto] items-center w-full gap-2 sm:gap-4 py-1 pr-1">

                                    {/* LADO ESQUERDO: Cor + Nome */}
                                    <div className="flex items-center gap-2 sm:gap-3 min-w-0 overflow-hidden">

                                      {/* Cor */}
                                      {isEditing ? (
                                        <input
                                          type="color"
                                          className="h-6 w-6 sm:h-8 sm:w-8 rounded cursor-pointer border-none p-0 bg-transparent shrink-0"
                                          value={editForm.cor || stage.cor}
                                          onChange={(e) => setEditForm({ ...editForm, cor: e.target.value })}
                                        />
                                      ) : (
                                        <div
                                          className="w-6 h-6 sm:w-6 sm:h-6 rounded-full border border-gray-100 shadow-sm shrink-0"
                                          style={{ backgroundColor: stage.cor }}
                                        />
                                      )}

                                      {/* Nome */}
                                      {isEditing ? (
                                        <Input
                                          value={editForm.nome !== undefined ? editForm.nome : stage.nome}
                                          onChange={(e) => setEditForm({ ...editForm, nome: e.target.value })}
                                          className="h-8 text-sm w-full min-w-0"
                                          placeholder="Nome"
                                        />
                                      ) : (
                                        <span
                                          className="font-medium text-sm sm:text-base text-foreground truncate block w-full"
                                          title={stage.nome}
                                        >
                                          {stage.nome}
                                        </span>
                                      )}
                                    </div>

                                    {/* LADO DIREITO: SLA + Botões */}
                                    <div className="flex items-center gap-2 sm:gap-4 shrink-0">

                                      {/* SLA */}
                                      <div className="flex items-center gap-1.5 bg-muted/50 px-2 py-1 rounded-md border border-border/50 cursor-default">
                                        <span className="text-[10px] sm:text-xs text-muted-foreground uppercase font-bold">SLA:</span>

                                        {isEditing ? (
                                          <input
                                            type="number"
                                            value={editForm.sla !== undefined ? editForm.sla : (stage.sla || 0)}
                                            onChange={(e) => {
                                              if (e.target.value.length <= 5) {
                                                setEditForm({ ...editForm, sla: Number(e.target.value) })
                                              }
                                            }}
                                            className="w-8 sm:w-12 text-center h-6 text-xs bg-transparent border-b border-muted-foreground/30 focus:outline-none focus:border-primary"
                                          />
                                        ) : (
                                          <span className="text-xs sm:text-sm font-mono font-medium min-w-[1.5rem] text-center">
                                            {stage.sla || 0}h
                                          </span>
                                        )}
                                      </div>

                                      {/* Botões (Edit/Delete) */}
                                      <div className="flex items-center">
                                        {isEditing ? (
                                          <Button size="sm" onClick={() => handleSalvarEdicaoEtapa(stage)} className="bg-green-600 hover:bg-green-700 h-7 w-7 sm:h-8 sm:w-auto sm:px-3 p-0 rounded-full sm:rounded-md">
                                            <Save className="h-3.5 w-3.5 sm:mr-1" />
                                            <span className="hidden sm:inline">Salvar</span>
                                          </Button>
                                        ) : (
                                          <>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => {
                                              setEditingStageId(stage.id);
                                              setEditForm({ nome: stage.nome, sla: stage.sla, cor: stage.cor });
                                            }}>
                                              <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button
                                              variant="ghost"
                                              size="icon"
                                              className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                              onClick={() => {
                                                setStageParaExcluir(stage);
                                                setAlertExclusaoEtapaOpen(true);
                                              }}
                                            >
                                              <Trash2 className="h-4 w-4" />
                                            </Button>
                                          </>
                                        )}
                                      </div>

                                    </div>
                                  </div>
                                </SortableStageRow>
                              );
                            })}
                          </SortableContext>
                        </DndContext>
                      </div>
                    )}

                    <Button variant="outline" className="w-full border-dashed" onClick={handleAdicionarEtapa}>
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar Nova Etapa
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Notificações */}
            <div className="space-y-6">
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
            </div>

            {/* Sistema */}
            <div className="space-y-6">
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
            </div>
          </div>
        </div>
      </div>

      {/* --- MODAL DE CONFIRMAÇÃO: EXCLUIR --- */}
      <AlertDialog open={alertExclusaoOpen} onOpenChange={setAlertExclusaoOpen}>
        {/* Adicionado: max-w-[90vw] para segurança no mobile */}
        <AlertDialogContent className="max-w-[90vw] sm:max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza absoluta?</AlertDialogTitle>
            <AlertDialogDescription>
              Essa ação não pode ser desfeita. Isso excluirá permanentemente o usuário
              <br />
              {/* Adicionado: break-all para quebrar nomes gigantes */}
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

      {/* --- MODAL DE CONFIRMAÇÃO: STATUS --- */}
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

      {/* --- MODAL DE CONFIRMAÇÃO: EXCLUIR ETAPA --- */}
      <AlertDialog open={alertExclusaoEtapaOpen} onOpenChange={setAlertExclusaoEtapaOpen}>
        <AlertDialogContent className="max-w-[90vw] sm:max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Etapa do Pipeline</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a etapa:
              <br />
              <strong className="text-foreground break-all">
                {stageParaExcluir?.nome}
              </strong>
              ?
              <br />
              <span className="text-red-500 font-bold">Atenção:</span> Se houver leads nesta etapa, a exclusão será bloqueada pelo sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmarExclusaoEtapa}
              className="bg-red-600 hover:bg-red-700"
            >
              Excluir Etapa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </>
  );
};

export default Configuracoes;