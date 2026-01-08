import { useEffect, useState } from "react";
import { KanbanBoard } from "@/components/kanban/KanbanBoard";
import { LeadDetailsModal } from "@/components/LeadDetailsModal";
import { EditLeadModal } from "@/components/EditLeadModal";
import { Lead } from "@/types/crm";
import { Button } from "@/components/ui/button";
import { Plus, Filter, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { fetchPipelineData, moveLeadApi, updateLeadApi, deleteLeadApi } from "@/lib/api";
import { CreateLeadModal } from "@/components/CreateLeadModal";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const { toast } = useToast();

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

  // Função para recarregar os dados do Kanban
  const loadPipeline = async () => {
    try {
      const data = await fetchPipelineData();
      setPipeline(data);
    } catch (error) {
      console.error("Erro ao carregar pipeline", error);
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
    setPipeline((prev: any) => {
      // 1. Cria uma cópia da lista de leads
      const currentLeads = [...prev.leads];
      
      // 2. Encontra e remove o lead da posição original
      const activeIndex = currentLeads.findIndex(l => l.id === leadId);
      if (activeIndex === -1) return prev; // Segurança
      
      const [movedLead] = currentLeads.splice(activeIndex, 1);
      
      // 3. Atualiza a propriedade de coluna
      movedLead.colunaAtual = novaColuna;

      // 4. Descobre onde inserir na nova lista
      if (beforeId) {
        // Se temos um "Vizinho de Cima", inserimos LOGO DEPOIS dele
        const beforeIndex = currentLeads.findIndex(l => l.id === beforeId);
        if (beforeIndex !== -1) {
          currentLeads.splice(beforeIndex + 1, 0, movedLead);
        } else {
          // Fallback: se não achou o vizinho, joga pro final
          currentLeads.push(movedLead);
        }
      } else if (afterId) {
        const afterIndex = currentLeads.findIndex(l => l.id === afterId);
        if (afterIndex !== -1) {
          currentLeads.splice(afterIndex, 0, movedLead);
        } else {
          currentLeads.push(movedLead);
        }
      } else {
        currentLeads.push(movedLead);
      }

      return { ...prev, leads: currentLeads };
    });

    try {
      await moveLeadApi(leadId, novaColuna, beforeId, afterId);
    } catch (error) {
      console.error("Erro ao mover lead:", error);
      toast({
        variant: "destructive",
        title: "Erro ao salvar",
        description: "A nova posição não foi salva no servidor."
      });
      loadPipeline();
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

  const filteredLeads = pipeline?.leads?.filter((lead: Lead) => 
    lead.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (lead.empresa && lead.empresa.toLowerCase().includes(searchTerm.toLowerCase()))
  ) || [];

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
              <Button variant="outline" size="sm" className="h-9 sm:h-10 px-3 shrink-0">
                <Filter className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Filtrar</span>
              </Button>
            </div>

            {/* Stats and Export - Scrollable on mobile */}
            <div className="flex items-center justify-between gap-2 overflow-x-auto scrollbar-hide pb-1">
              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                <Badge variant="outline" className="text-[10px] sm:text-xs whitespace-nowrap">{totalLeads} Total</Badge>
                <Badge variant="success" className="text-[10px] sm:text-xs whitespace-nowrap">{leadsQualificados} Qualificados</Badge>
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
          {pipeline ? (
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
        }}
      />

      {/* Modal de Criação de Novo Lead */}
      <CreateLeadModal 
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          loadPipeline(); // Recarrega os dados após criar
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
          setIsEditModalOpen(false);
          setLeadToEdit(null);
        }}
        leadToEdit={leadToEdit}
      />

    </>
  );
};

export default Index;