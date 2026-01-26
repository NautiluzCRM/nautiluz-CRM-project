import { useEffect, useState } from "react";
import { KanbanBoard } from "@/components/kanban/KanbanBoard";
import { LeadDetailsModal } from "@/components/LeadDetailsModal";
import { EditLeadModal } from "@/components/EditLeadModal";
import { Lead } from "@/types/crm";
import { Button } from "@/components/ui/button";
import { Plus, Filter, Search, X, RotateCcw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { fetchPipelineData, moveLeadApi, updateLeadApi, deleteLeadApi } from "@/lib/api";
import { CreateLeadModal } from "@/components/CreateLeadModal";
import { useToast } from "@/hooks/use-toast";
import { useStats } from "@/contexts/StatsContext";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

const Index = () => {
  const { toast } = useToast();
  const { refreshStats } = useStats();

  const [pipeline, setPipeline] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Estado para o Modal de Detalhes
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Estado para o Modal de Criação/Edição
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [leadToEdit, setLeadToEdit] = useState<Lead | null>(null);

  const [isLoading, setIsLoading] = useState(true);

  // Estados de filtros avançados
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filters, setFilters] = useState({
    origem: "all",
    status: "all",
    minVidas: "",
    maxVidas: "",
    minValor: "",
    maxValor: "",
    responsavel: "all"
  });

  // Função para recarregar os dados do Kanban
  const loadPipeline = async () => {
    try {
      console.log('[Index] Carregando pipeline...');
      const data = await fetchPipelineData();
      console.log('[Index] Pipeline carregado:', {
        nome: data.nome,
        colunas: data.colunas.length,
        leads: data.leads.length,
        owners: data.owners.length
      });
      setPipeline(data);
    } catch (error: any) {
      console.error("Erro ao carregar pipeline:", error);
      
      // Se for erro de sessão expirada, não mostra toast (já vai redirecionar)
      if (!error?.message?.includes('expirada')) {
        toast({
          variant: "destructive",
          title: "Erro ao carregar pipeline",
          description: error?.message || "Não foi possível carregar os dados. Tente novamente.",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPipeline();
  }, []);

  const handleLeadMove = async (
    leadId: string, 
    novaColuna: string, 
    beforeId?: string, 
    afterId?: string
  ) => {
    // 1. ATUALIZAÇÃO OTIMISTA (Atualiza a tela ANTES do servidor)
    setPipeline((prev: any) => {
      // Cria uma cópia profunda para não mutar o estado diretamente
      const currentLeads = [...prev.leads];
      
      // Encontra o lead que está sendo movido
      const activeIndex = currentLeads.findIndex(l => l.id === leadId);
      if (activeIndex === -1) return prev; 
      
      // Remove ele da posição antiga
      const [movedLead] = currentLeads.splice(activeIndex, 1);
      
      // --- AQUI ESTÁ O SEGREDO 🔮 ---
      // Atualizamos a coluna E AS DATAS para "Agora"
      const leadAtualizado = {
        ...movedLead,
        colunaAtual: novaColuna,
        enteredStageAt: new Date(), // <--- FORÇA O AZUL
        stageChangedAt: new Date()  // <--- FORÇA O AZUL
      };
      // -------------------------------

      // Lógica de reordenar (Vizinho de Cima / Baixo)
      if (beforeId) {
        const beforeIndex = currentLeads.findIndex(l => l.id === beforeId);
        if (beforeIndex !== -1) {
          currentLeads.splice(beforeIndex + 1, 0, leadAtualizado);
        } else {
          currentLeads.push(leadAtualizado);
        }
      } else if (afterId) {
        const afterIndex = currentLeads.findIndex(l => l.id === afterId);
        if (afterIndex !== -1) {
          currentLeads.splice(afterIndex, 0, leadAtualizado);
        } else {
          currentLeads.push(leadAtualizado);
        }
      } else {
        currentLeads.push(leadAtualizado);
      }

      return { ...prev, leads: currentLeads };
    });

    // 2. Chama a API em segundo plano (O usuário nem percebe o delay)
    try {
      await moveLeadApi(leadId, novaColuna, beforeId, afterId);
      refreshStats();
    } catch (error) {
      console.error("Erro ao mover lead:", error);
      toast({
        variant: "destructive",
        title: "Erro ao salvar",
        description: "A nova posição não foi salva no servidor. Recarregando..."
      });
      loadPipeline(); // Se der erro, desfaz a mentira recarregando tudo
    }
  };

  // Essa função lida apenas com atualizações rápidas (ex: drag and drop interno se houvesse)
  const handleLeadUpdate = async (updatedLead: Lead) => {
    await updateLeadApi(updatedLead.id, updatedLead);
    setPipeline((prev: any) => ({
      ...prev,
      leads: prev.leads.map((lead: Lead) =>
        lead.id === updatedLead.id ? updatedLead : lead
      )
    }));
  };

  // NOVO: Função chamada ao clicar no botão "Editar" dentro do Modal de Detalhes
  const handleEditStart = (lead: Lead) => {
    setLeadToEdit(lead);      // Define o lead a editar
    setIsModalOpen(false);    // Fecha o modal de detalhes
    setIsEditModalOpen(true); // Abre o modal de edição
  };

  // NOVO: Função chamada ao clicar no botão "Novo Lead"
  const handleNewLead = () => {
    setIsCreateModalOpen(true);
  };

  // Função para limpar filtros
  const handleClearFilters = () => {
    setFilters({
      origem: "all",
      status: "all",
      minVidas: "",
      maxVidas: "",
      minValor: "",
      maxValor: "",
      responsavel: "all"
    });
  };

  // Verifica se há filtros ativos
  const hasActiveFilters = 
    filters.origem !== "all" || 
    filters.status !== "all" || 
    filters.minVidas !== "" || 
    filters.maxVidas !== "" || 
    filters.minValor !== "" || 
    filters.maxValor !== "" ||
    filters.responsavel !== "all";

  const filteredLeads = pipeline?.leads?.filter((lead: Lead) => {
    // Filtro de busca (texto)
    const matchesSearch = 
      lead.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (lead.empresa && lead.empresa.toLowerCase().includes(searchTerm.toLowerCase()));
    
    if (!matchesSearch) return false;

    // Filtro de origem
    if (filters.origem !== "all" && lead.origem !== filters.origem) {
      return false;
    }

    // Filtro de status
    if (filters.status !== "all" && lead.statusQualificacao !== filters.status) {
      return false;
    }

    // Filtro de quantidade de vidas (mínimo)
    if (filters.minVidas !== "" && lead.quantidadeVidas < Number(filters.minVidas)) {
      return false;
    }

    // Filtro de quantidade de vidas (máximo)
    if (filters.maxVidas !== "" && lead.quantidadeVidas > Number(filters.maxVidas)) {
      return false;
    }

    // Filtro de valor estimado (mínimo)
    if (filters.minValor !== "" && (lead.valorMedio || 0) < Number(filters.minValor)) {
      return false;
    }

    // Filtro de valor estimado (máximo)
    if (filters.maxValor !== "" && (lead.valorMedio || 0) > Number(filters.maxValor)) {
      return false;
    }

    // Filtro de responsável
    if (filters.responsavel !== "all") {
      const ownerIds = (lead as any).ownersIds || [];
      if (!ownerIds.includes(filters.responsavel)) {
        return false;
      }
    }

    return true;
  }) || [];

  const totalLeads = pipeline?.leads?.length || 0;
  const leadsQualificados = pipeline?.leads?.filter((l: Lead) => l.statusQualificacao === 'Qualificado').length || 0;
  const valorTotalEstimado = pipeline?.leads?.reduce((acc: number, lead: Lead) =>
    acc + (lead.valorMedio || 0), 0
  ) || 0;

  return (
    <>
      <div className="flex flex-col h-full">
        {isLoading && (
          <div className="p-4 sm:p-6 text-xs sm:text-sm text-muted-foreground">Carregando pipeline...</div>
        )}
        {/* Toolbar */}
        <div className="bg-card border-b border-border p-3 sm:p-4 shadow-card">
          {/* Header Row */}
          <div className="flex items-center justify-between gap-3 mb-3 sm:mb-4">
            <div className="min-w-0 flex-1">
              <h1 className="text-lg sm:text-2xl font-bold text-foreground truncate">Pipeline de Vendas</h1>
              <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">
                Gestão de leads e oportunidades - NAUTILUZ CRM
              </p>
            </div>
            
            {/* Botão Novo Lead */}
            <Button onClick={handleNewLead}
              className="bg-gradient-primary hover:bg-primary-hover shrink-0 h-9 sm:h-10">
              <Plus className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Novo Lead</span>
            </Button>
          </div>

          {/* Search and Filters Row */}
          <div className="flex flex-col gap-3 sm:gap-4">
            {/* Search + Filter */}
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar leads..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-9 sm:h-10 text-sm"
                />
              </div>
              
              <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="h-9 sm:h-10 px-3 shrink-0 relative">
                    <Filter className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Filtrar</span>
                    {hasActiveFilters && (
                      <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-[10px]">
                        {Object.values(filters).filter(v => v !== "all" && v !== "").length}
                      </Badge>
                    )}
                  </Button>
                </SheetTrigger>
                
                <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
                  <SheetHeader>
                    <SheetTitle>Filtros Avançados</SheetTitle>
                  </SheetHeader>
                  
                  <div className="py-6 space-y-6">
                    {/* Filtro por Origem */}
                    <div className="space-y-2">
                      <Label htmlFor="filter-origem">Origem</Label>
                      <Select value={filters.origem} onValueChange={(v) => setFilters(prev => ({ ...prev, origem: v }))}>
                        <SelectTrigger id="filter-origem">
                          <SelectValue placeholder="Todas as origens" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todas as origens</SelectItem>
                          <SelectItem value="Google Ads">Google Ads</SelectItem>
                          <SelectItem value="Indicação">Indicação</SelectItem>
                          <SelectItem value="Instagram">Instagram</SelectItem>
                          <SelectItem value="Meta Ads">Meta Ads</SelectItem>
                          <SelectItem value="Site">Site</SelectItem>
                          <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                          <SelectItem value="Outros">Outros</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Filtro por Status */}
                    {/*<div className="space-y-2">
                      <Label htmlFor="filter-status">Status de Qualificação</Label>
                      <Select value={filters.status} onValueChange={(v) => setFilters(prev => ({ ...prev, status: v }))}>
                        <SelectTrigger id="filter-status">
                          <SelectValue placeholder="Todos os status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos os status</SelectItem>
                          <SelectItem value="Qualificado">Qualificado</SelectItem>
                          <SelectItem value="Incompleto">Incompleto</SelectItem>
                          <SelectItem value="Duplicado">Duplicado</SelectItem>
                          <SelectItem value="Sem interesse">Sem interesse</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>*/}

                    {/* Filtro por Quantidade de Vidas */}
                    <div className="space-y-2">
                      <Label>Quantidade de Vidas</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Input 
                            type="number" 
                            placeholder="Mínimo"
                            value={filters.minVidas}
                            onChange={(e) => setFilters(prev => ({ ...prev, minVidas: e.target.value }))}
                          />
                        </div>
                        <div>
                          <Input 
                            type="number" 
                            placeholder="Máximo"
                            value={filters.maxVidas}
                            onChange={(e) => setFilters(prev => ({ ...prev, maxVidas: e.target.value }))}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Filtro por Valor Estimado */}
                    <div className="space-y-2">
                      <Label>Valor Estimado (R$)</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Input 
                            type="number" 
                            placeholder="Mínimo"
                            value={filters.minValor}
                            onChange={(e) => setFilters(prev => ({ ...prev, minValor: e.target.value }))}
                          />
                        </div>
                        <div>
                          <Input 
                            type="number" 
                            placeholder="Máximo"
                            value={filters.maxValor}
                            onChange={(e) => setFilters(prev => ({ ...prev, maxValor: e.target.value }))}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Filtro por Responsável */}
                    <div className="space-y-2">
                      <Label htmlFor="filter-responsavel">Responsável</Label>
                      <Select value={filters.responsavel} onValueChange={(v) => setFilters(prev => ({ ...prev, responsavel: v }))}>
                        <SelectTrigger id="filter-responsavel">
                          <SelectValue placeholder="Todos os responsáveis" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos os responsáveis</SelectItem>
                          {[...(pipeline?.owners || [])]
                            .sort((a: any, b: any) => (a.nome || "").localeCompare(b.nome || ""))
                            .map((owner: any) => (
                              <SelectItem key={owner._id} value={owner._id}>
                                {owner.nome}
                              </SelectItem>
                          ))}

                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <SheetFooter className="gap-2">
                    <Button 
                      variant="outline" 
                      onClick={handleClearFilters}
                      className="flex-1"
                    >
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Limpar
                    </Button>
                    <Button 
                      onClick={() => setIsFilterOpen(false)}
                      className="flex-1 bg-gradient-primary hover:bg-primary-hover"
                    >
                      Aplicar Filtros
                    </Button>
                  </SheetFooter>
                </SheetContent>
              </Sheet>
            </div>

            {/* Stats and Export - Scrollable on mobile */}
            <div className="flex items-center justify-between gap-2 overflow-x-auto scrollbar-hide pb-1">
              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                <Badge variant="outline" className="text-[10px] sm:text-xs whitespace-nowrap">{totalLeads} Total</Badge>
                <Badge variant="outline" className="text-[10px] sm:text-xs whitespace-nowrap">
                  {valorTotalEstimado.toLocaleString('pt-BR', { 
                    style: 'currency', 
                    currency: 'BRL' 
                  })}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Kanban Board */}
        <div className="flex-1 min-h-0 overflow-hidden">
          {!isLoading && pipeline && pipeline.colunas && pipeline.colunas.length > 0 ? (
            <KanbanBoard
              colunas={pipeline.colunas}
              leads={filteredLeads}
              onLeadMove={handleLeadMove}
              onLeadUpdate={handleLeadUpdate}
              onLeadClick={(lead) => {
                setSelectedLead(lead);
                setIsModalOpen(true);
              }}
            />
          ) : !isLoading && (!pipeline || !pipeline.colunas || pipeline.colunas.length === 0) ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center p-8">
                <p className="text-lg font-semibold mb-2">Pipeline não configurado</p>
                <p className="text-sm text-muted-foreground">Execute o script de seed para criar o pipeline.</p>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* Modal de Detalhes - Agora usa handleEditStart */}
      <LeadDetailsModal
        lead={selectedLead}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onEdit={handleEditStart}
        onDelete={async (leadId: string) => {
          await deleteLeadApi(leadId);
          toast({ title: "Excluído!", description: "Lead removido com sucesso." });
          loadPipeline();
          refreshStats();
          refreshStats();
          refreshStats();
          refreshStats();
        }}
      />

      {/* Modal de Criação de Novo Lead */}
      <CreateLeadModal 
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          loadPipeline(); // Recarrega os dados após criar
          refreshStats(); // Atualiza estatísticas
        }}
      />

      {/* Modal de Edição de Lead */}
      <EditLeadModal 
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setLeadToEdit(null);
        }}
        onCancel={() => {
          // Volta para o modal de detalhes
          if (leadToEdit) {
            setSelectedLead(leadToEdit);
          }
          setIsEditModalOpen(false);
          setLeadToEdit(null);
          setIsModalOpen(true);
        }}
        onSuccess={() => {
          loadPipeline(); // Recarrega os dados após editar
          refreshStats(); // Atualiza estatísticas
          setIsEditModalOpen(false);
          setLeadToEdit(null);
        }}
        leadToEdit={leadToEdit}
      />

    </>
  );
};

export default Index;