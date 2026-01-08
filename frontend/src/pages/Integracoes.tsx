import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { 
  Plug, 
  Plus, 
  Settings, 
  Trash2, 
  Copy, 
  Check, 
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Zap,
  Key,
  Link2,
  Play,
  Loader2,
  Instagram,
  ArrowRight,
  FileText,
  Users,
  Clock,
  TrendingUp,
  Sparkles
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Navigate } from "react-router-dom";
import { 
  fetchIntegrations, 
  createIntegrationApi, 
  updateIntegrationApi, 
  deleteIntegrationApi,
  testIntegrationApi,
  fetchPipelines,
  fetchUsers
} from "@/lib/api";

interface Integration {
  _id: string;
  type: 'meta_lead_ads' | 'google_ads' | 'webhook_generico';
  name: string;
  active: boolean;
  config: {
    verifyToken?: string;
    defaultPipelineId?: string;
    defaultOwnerId?: string;
    origin?: string;
  };
  stats: {
    leadsReceived: number;
    leadsCreated: number;
    lastLeadAt?: string;
    errors: number;
  };
  webhookUrl?: string;
  createdAt: string;
  updatedAt: string;
}

const Integracoes = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [pipelines, setPipelines] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isTesting, setIsTesting] = useState<string | null>(null);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingIntegration, setEditingIntegration] = useState<Integration | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    type: 'meta_lead_ads' as const,
    active: true,
    config: {
      origin: 'Meta Lead Ads',
      defaultPipelineId: '',
      defaultOwnerId: ''
    }
  });

  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    if (isAdmin) {
      loadData();
    }
  }, [isAdmin]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [integrationsData, pipelinesData, usersData] = await Promise.all([
        fetchIntegrations(),
        fetchPipelines(),
        fetchUsers()
      ]);
      setIntegrations(integrationsData);
      setPipelines(pipelinesData);
      setUsers(usersData);
    } catch (error) {
      console.error("Erro ao carregar dados", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível carregar as integrações."
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  const handleCreate = async () => {
    if (!formData.name.trim()) {
      toast({
        variant: "destructive",
        title: "Nome obrigatório",
        description: "Dê um nome para identificar esta integração."
      });
      return;
    }

    setIsCreating(true);
    try {
      const newIntegration = await createIntegrationApi(formData);
      setIntegrations([newIntegration, ...integrations]);
      setShowCreateDialog(false);
      resetForm();
      toast({
        title: "✅ Integração criada!",
        description: "Agora copie a URL do Webhook e configure no Make."
      });
    } catch (error: any) {
      console.error("Erro ao criar integração:", error);
      toast({
        variant: "destructive",
        title: "Erro ao criar",
        description: error.message || "Não foi possível criar a integração."
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdate = async () => {
    if (!editingIntegration) return;
    
    setIsCreating(true);
    try {
      const updated = await updateIntegrationApi(editingIntegration._id, formData);
      setIntegrations(integrations.map(i => i._id === updated._id ? updated : i));
      setShowCreateDialog(false);
      setEditingIntegration(null);
      resetForm();
      toast({
        title: "Integração atualizada!",
        description: "As alterações foram salvas."
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message || "Não foi possível atualizar."
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta integração?")) return;
    
    try {
      await deleteIntegrationApi(id);
      setIntegrations(integrations.filter(i => i._id !== id));
      toast({ title: "Integração excluída" });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message || "Não foi possível excluir."
      });
    }
  };

  const handleToggle = async (integration: Integration) => {
    try {
      const updated = await updateIntegrationApi(integration._id, { 
        active: !integration.active 
      });
      setIntegrations(integrations.map(i => i._id === updated._id ? updated : i));
      toast({ title: updated.active ? "Integração ativada" : "Integração pausada" });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível alterar o status."
      });
    }
  };

  const handleTest = async (id: string) => {
    setIsTesting(id);
    try {
      const result = await testIntegrationApi(id);
      if (result.success) {
        toast({
          title: "Teste bem-sucedido!",
          description: `Lead de teste criado: ${result.lead?.name}`
        });
        loadData();
      } else {
        toast({ variant: "destructive", title: "Erro no teste", description: result.error });
      }
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erro", description: error.message });
    } finally {
      setIsTesting(null);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedUrl(id);
    setTimeout(() => setCopiedUrl(null), 2000);
    toast({ title: "URL copiada!" });
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'meta_lead_ads',
      active: true,
      config: { origin: 'Meta Lead Ads', defaultPipelineId: '', defaultOwnerId: '' }
    });
  };

  const openEditDialog = (integration: Integration) => {
    setEditingIntegration(integration);
    setFormData({
      name: integration.name,
      type: 'meta_lead_ads' as const, // Always use meta_lead_ads for this page
      active: integration.active,
      config: {
        origin: integration.config.origin || 'Meta Lead Ads',
        defaultPipelineId: integration.config.defaultPipelineId || '',
        defaultOwnerId: integration.config.defaultOwnerId || ''
      }
    });
    setShowCreateDialog(true);
  };

  const getWebhookUrl = (integration: Integration) => {
    return integration.webhookUrl || 
      `${window.location.origin.replace(':8080', ':10000')}/api/integrations/meta/webhook/${integration._id}`;
  };

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
      <div className="bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-blue-500/10 border-b border-border p-4 sm:p-6 shadow-sm shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2">
              <div className="p-2 bg-gradient-to-br from-pink-500 to-purple-600 rounded-lg">
                <Instagram className="h-5 w-5 text-white" />
              </div>
              Meta Lead Ads
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Receba leads automaticamente via Make/Zapier
            </p>
          </div>

          <Button 
            onClick={() => { resetForm(); setShowCreateDialog(true); }}
            className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nova Integração
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4 sm:p-6">
        {/* Instruções */}
        <Card className="mb-6 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-green-600" />
              Como funciona: Make + Meta Lead Ads
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center gap-3 py-4">
              <div className="text-center">
                <div className="w-14 h-14 mx-auto bg-pink-100 rounded-full flex items-center justify-center mb-2">
                  <Instagram className="h-7 w-7 text-pink-600" />
                </div>
                <p className="text-xs font-medium">Anúncio Meta</p>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground" />
              <div className="text-center">
                <div className="w-14 h-14 mx-auto bg-purple-100 rounded-full flex items-center justify-center mb-2">
                  <FileText className="h-7 w-7 text-purple-600" />
                </div>
                <p className="text-xs font-medium">Lead preenche</p>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground" />
              <div className="text-center">
                <div className="w-14 h-14 mx-auto bg-violet-100 rounded-full flex items-center justify-center mb-2">
                  <Zap className="h-7 w-7 text-violet-600" />
                </div>
                <p className="text-xs font-medium">Make envia</p>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground" />
              <div className="text-center">
                <div className="w-14 h-14 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-2">
                  <Users className="h-7 w-7 text-green-600" />
                </div>
                <p className="text-xs font-medium">Lead no CRM</p>
              </div>
            </div>
            <Separator className="my-4" />
            <div className="grid md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-start gap-2">
                <Badge className="shrink-0 bg-pink-500">1</Badge>
                <span>Crie uma integração e copie a <strong>URL do Webhook</strong></span>
              </div>
              <div className="flex items-start gap-2">
                <Badge className="shrink-0 bg-purple-500">2</Badge>
                <span>No Make, use o módulo <strong>Facebook Lead Ads</strong></span>
              </div>
              <div className="flex items-start gap-2">
                <Badge className="shrink-0 bg-green-500">3</Badge>
                <span>Adicione <strong>HTTP Request</strong> com a URL copiada</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Dialog */}
        <Dialog open={showCreateDialog} onOpenChange={(open) => {
          setShowCreateDialog(open);
          if (!open) { setEditingIntegration(null); resetForm(); }
        }}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Instagram className="h-5 w-5 text-pink-500" />
                {editingIntegration ? 'Editar Integração' : 'Nova Integração Meta Lead Ads'}
              </DialogTitle>
              <DialogDescription>Configure para receber leads do Make/Zapier</DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome da Integração *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Campanha Janeiro, Leads Instagram"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="origin">Identificador da Origem</Label>
                <Input
                  id="origin"
                  value={formData.config.origin}
                  onChange={(e) => setFormData({ ...formData, config: { ...formData.config, origin: e.target.value }})}
                  placeholder="Ex: Instagram Ads, Facebook Ads"
                />
                <p className="text-xs text-muted-foreground">Aparece no lead para identificar de onde veio</p>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Pipeline (opcional)</Label>
                <Select
                  value={formData.config.defaultPipelineId || "none"}
                  onValueChange={(v) => setFormData({ ...formData, config: { ...formData.config, defaultPipelineId: v === "none" ? "" : v }})}
                >
                  <SelectTrigger><SelectValue placeholder="Pipeline padrão" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none"><span className="text-muted-foreground">Usar pipeline padrão</span></SelectItem>
                    {pipelines.map((p: any) => (
                      <SelectItem key={p._id || p.id} value={p._id || p.id}>{p.name || p.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Responsável (opcional)</Label>
                <Select
                  value={formData.config.defaultOwnerId || "none"}
                  onValueChange={(v) => setFormData({ ...formData, config: { ...formData.config, defaultOwnerId: v === "none" ? "" : v }})}
                >
                  <SelectTrigger><SelectValue placeholder="Distribuição automática" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none"><span className="text-muted-foreground">Distribuição automática</span></SelectItem>
                    {users.map((u: any) => (
                      <SelectItem key={u._id || u.id} value={u._id || u.id}>{u.nome || u.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2 p-3 bg-muted/50 rounded-lg">
                <Switch checked={formData.active} onCheckedChange={(checked) => setFormData({ ...formData, active: checked })} />
                <div>
                  <Label>Integração ativa</Label>
                  <p className="text-xs text-muted-foreground">Desative para pausar o recebimento</p>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancelar</Button>
              <Button 
                onClick={editingIntegration ? handleUpdate : handleCreate}
                disabled={isCreating || !formData.name.trim()}
                className="bg-gradient-to-r from-pink-500 to-purple-600"
              >
                {isCreating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editingIntegration ? 'Salvar' : 'Criar Integração'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Lista */}
        {integrations.length === 0 ? (
          <Card className="border-dashed border-2">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mb-4">
                <Plug className="h-8 w-8 text-pink-500" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Nenhuma integração configurada</h3>
              <p className="text-muted-foreground text-center mb-4 max-w-md">
                Crie sua primeira integração para começar a receber leads do Meta Lead Ads via Make ou Zapier
              </p>
              <Button onClick={() => setShowCreateDialog(true)} className="bg-gradient-to-r from-pink-500 to-purple-600">
                <Plus className="h-4 w-4 mr-2" />
                Criar Integração
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {integrations.map((integration) => (
              <Card key={integration._id} className={`${!integration.active ? 'opacity-60' : ''} overflow-hidden`}>
                <div className={`h-1.5 ${integration.active ? 'bg-gradient-to-r from-pink-500 to-purple-600' : 'bg-muted'}`} />
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${integration.active ? 'bg-pink-100' : 'bg-muted'}`}>
                        <Instagram className="h-5 w-5 text-pink-500" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{integration.name}</CardTitle>
                        <CardDescription>{integration.config.origin || 'Meta Lead Ads'}</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={integration.active ? "default" : "secondary"} className={integration.active ? 'bg-green-500' : ''}>
                        {integration.active ? <><CheckCircle2 className="h-3 w-3 mr-1" /> Ativa</> : 'Pausada'}
                      </Badge>
                      <Switch checked={integration.active} onCheckedChange={() => handleToggle(integration)} />
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <Alert className="bg-blue-50 border-blue-200">
                    <Link2 className="h-4 w-4 text-blue-600" />
                    <AlertTitle className="text-blue-800">URL do Webhook (copie para o Make)</AlertTitle>
                    <AlertDescription className="mt-2">
                      <div className="flex gap-2">
                        <Input value={getWebhookUrl(integration)} readOnly className="font-mono text-xs bg-white" />
                        <Button variant="outline" size="icon" onClick={() => copyToClipboard(getWebhookUrl(integration), integration._id)}>
                          {copiedUrl === integration._id ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                        </Button>
                      </div>
                    </AlertDescription>
                  </Alert>

                  {integration.config.verifyToken && (
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground flex items-center gap-1">
                        <Key className="h-3 w-3" /> Verify Token
                      </Label>
                      <div className="flex gap-2">
                        <Input value={integration.config.verifyToken} readOnly className="font-mono text-xs bg-muted/50" type="password" />
                        <Button variant="outline" size="icon" onClick={() => copyToClipboard(integration.config.verifyToken!, `token-${integration._id}`)}>
                          {copiedUrl === `token-${integration._id}` ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-4 gap-3 pt-2">
                    <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-100">
                      <TrendingUp className="h-4 w-4 text-blue-600 mx-auto mb-1" />
                      <p className="text-xl font-bold text-blue-600">{integration.stats.leadsReceived}</p>
                      <p className="text-[10px] text-muted-foreground">Recebidos</p>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg border border-green-100">
                      <CheckCircle2 className="h-4 w-4 text-green-600 mx-auto mb-1" />
                      <p className="text-xl font-bold text-green-600">{integration.stats.leadsCreated}</p>
                      <p className="text-[10px] text-muted-foreground">Criados</p>
                    </div>
                    <div className="text-center p-3 bg-red-50 rounded-lg border border-red-100">
                      <AlertCircle className="h-4 w-4 text-red-500 mx-auto mb-1" />
                      <p className="text-xl font-bold text-red-500">{integration.stats.errors}</p>
                      <p className="text-[10px] text-muted-foreground">Erros</p>
                    </div>
                    <div className="text-center p-3 bg-purple-50 rounded-lg border border-purple-100">
                      <Clock className="h-4 w-4 text-purple-600 mx-auto mb-1" />
                      <p className="text-sm font-medium text-purple-600">
                        {integration.stats.lastLeadAt ? new Date(integration.stats.lastLeadAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) : '--'}
                      </p>
                      <p className="text-[10px] text-muted-foreground">Último</p>
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="flex justify-between border-t pt-4 bg-muted/20">
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleTest(integration._id)} disabled={isTesting === integration._id}>
                      {isTesting === integration._id ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Play className="h-4 w-4 mr-2" />}
                      Testar
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => openEditDialog(integration)}>
                      <Settings className="h-4 w-4 mr-2" /> Editar
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => loadData()}>
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </div>
                  <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleDelete(integration._id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Integracoes;
