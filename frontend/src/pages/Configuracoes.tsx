import { ChangeEvent, useState, useRef} from "react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Settings,
  User,
  Shield,
  Bell,
  Palette,
  Database,
  Users,
  Plus,
  Edit,
  Trash2,
  Key,
  Mail,
  Smartphone,
  Save,
} from "lucide-react";

import ImagePreviewOverlay from "@/components/ui/ImagePreviewOverlay";

interface Usuario {
  id: string;
  nome: string;
  email: string;
  perfil: 'Administrador' | 'Financeiro' | 'Vendedor';
  ativo: boolean;
  foto?: string;
  ultimoAcesso: Date;
}

const Configuracoes = () => {
  const [notificacaoEmail, setNotificacaoEmail] = useState(true);
  const [notificacaoSMS, setNotificacaoSMS] = useState(false);
  const [modoEscuro, setModoEscuro] = useState(false);
  const [autoSave, setAutoSave] = useState(true);

  const usuarios: Usuario[] = [
    {
      id: '1',
      nome: 'João Silva',
      email: 'joao@nautiluz.com.br',
      perfil: 'Administrador',
      ativo: true,
      ultimoAcesso: new Date(2024, 0, 20, 14, 30)
    },
    {
      id: '2',
      nome: 'Ana Costa',
      email: 'ana@nautiluz.com.br',
      perfil: 'Vendedor',
      ativo: true,
      ultimoAcesso: new Date(2024, 0, 20, 16, 15)
    },
    {
      id: '3',
      nome: 'Carlos Santos',
      email: 'carlos@nautiluz.com.br',
      perfil: 'Vendedor',
      ativo: true,
      ultimoAcesso: new Date(2024, 0, 19, 18, 45)
    },
    {
      id: '4',
      nome: 'Maria Oliveira',
      email: 'maria@nautiluz.com.br',
      perfil: 'Financeiro',
      ativo: false,
      ultimoAcesso: new Date(2024, 0, 15, 9, 20)
    }
  ];

  const colunasPipeline = [
    { id: 'novo', nome: 'Novo', cor: '#3B82F6', sla: 24 },
    { id: 'qualificacao', nome: 'Qualificação', cor: '#8B5CF6', sla: 48 },
    { id: 'cotacao', nome: 'Cotação', cor: '#F59E0B', sla: 72 },
    { id: 'proposta', nome: 'Proposta Enviada', cor: '#EF4444', sla: 96 },
    { id: 'negociacao', nome: 'Negociação', cor: '#F97316', sla: 120 },
    { id: 'fechamento', nome: 'Fechamento', cor: '#10B981', sla: 48 },
  ];


  
  // Foto de perfil com overlay

const fileInputRef = useRef<HTMLInputElement | null>(null);
const [fotoPerfil, setFotoPerfil] = useState<string | null>(null);// foto confirmada
const [previewUrl, setPreviewUrl] = useState<string | null>(null);// preview da imagem
const [isPreviewOpen, setIsPreviewOpen] = useState(false);// controla o modal(componente que sobrepõe a tela)

const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;

  const url = URL.createObjectURL(file);
  setPreviewUrl(url);
  setIsPreviewOpen(true);
};

const handleCancelPreview = () => {
  fileInputRef.current!.value = "";
  setIsPreviewOpen(false);
  setPreviewUrl(null);
};

const handleConfirmPreview = () => {
  if (previewUrl) {
    setFotoPerfil(previewUrl); // confirma a foto
  }
  setIsPreviewOpen(false);
};

const handleButtonClick = () => {
  fileInputRef.current?.click(); // abre o seletor
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
            <Button className="bg-gradient-primary hover:bg-primary-hover">
              <Save className="h-4 w-4 mr-2" />
              Salvar Alterações
            </Button>
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
              <TabsTrigger value="usuarios" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Usuários
              </TabsTrigger>
              <TabsTrigger value="pipeline" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Pipeline
              </TabsTrigger>
              <TabsTrigger value="notificacoes" className="flex items-center gap-2">
                <Bell className="h-4 w-4" />
                Notificações
              </TabsTrigger>
              <TabsTrigger value="sistema" className="flex items-center gap-2">
                <Database className="h-4 w-4" />
                Sistema
              </TabsTrigger>
             
              <TabsTrigger value="seguranca" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Segurança
              </TabsTrigger>
              
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
                      JS
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-2">
                    {/* input escondido, acionado pelo botão, uso UseRef par ligar o botão real com esse componente*/}
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
                      <Label htmlFor="nome">Nome Completo</Label>
                      <Input id="nome" defaultValue="João Silva" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">E-mail</Label>
                      <Input id="email" type="email" defaultValue="joao@nautiluz.com.br" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="telefone">Telefone</Label>
                      <Input id="telefone" defaultValue="(11) 99999-9999" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cargo">Cargo</Label>
                      <Input id="cargo" defaultValue="Gerente de Vendas" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="assinatura">Assinatura de E-mail</Label>
                    <Textarea
                      id="assinatura"
                      placeholder="Sua assinatura personalizada..."
                      defaultValue="João Silva&#10;Gerente de Vendas&#10;NAUTILUZ - Consultoria em Seguros&#10;(11) 99999-9999 | joao@nautiluz.com.br"
                    />
                  </div>
                </CardContent>
              </Card>
              {/* 
              
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
                    <Input id="senhaAtual" type="password" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="novaSenha">Nova Senha</Label>
                      <Input id="novaSenha" type="password" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmarSenha">Confirmar Nova Senha</Label>
                      <Input id="confirmarSenha" type="password" />
                    </div>
                  </div>
                  <Button variant="outline">Alterar Senha</Button>
                </CardContent>
              </Card>
              */
              }
            </TabsContent>

            {/* Aba Usuários */}
            <TabsContent value="usuarios" className="space-y-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Gerenciar Usuários
                  </CardTitle>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button size="sm" className="bg-gradient-primary hover:bg-primary-hover">
                        <Plus className="h-4 w-4 mr-2" />
                        Novo Usuário
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Novo Usuário</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="nomeUsuario">Nome</Label>
                            <Input id="nomeUsuario" placeholder="Nome completo" />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="emailUsuario">E-mail</Label>
                            <Input id="emailUsuario" type="email" placeholder="email@nautiluz.com.br" />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="perfilUsuario">Perfil</Label>
                          <Select>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o perfil" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="vendedor">Vendedor</SelectItem>
                              <SelectItem value="financeiro">Financeiro</SelectItem>
                              <SelectItem value="administrador">Administrador</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <Button className="w-full bg-gradient-primary hover:bg-primary-hover">
                          Criar Usuário
                        </Button>
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
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Aba Pipeline */}
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
              {/* Essa parte pode ser que seja mantida mas tenho que ver com o Et
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
              */}
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
                    <Input id="senhaAtual" type="password" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="novaSenha">Nova Senha</Label>
                      <Input id="novaSenha" type="password" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmarSenha">Confirmar Nova Senha</Label>
                      <Input id="confirmarSenha" type="password" />
                    </div>
                  </div>
                  <Button variant="outline">Alterar Senha</Button>
                </CardContent>
              </Card>
            </TabsContent>
            

          </Tabs>
        </div>
      </div>
    </Layout>
  );
};

export default Configuracoes;