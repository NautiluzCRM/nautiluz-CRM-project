import { useState } from "react";
import { Layout } from "@/components/Layout";
import { KanbanBoard } from "@/components/kanban/KanbanBoard";
import { LeadDetailsModal } from "@/components/LeadDetailsModal";
import { pipelineMock } from "@/data/mockData";
import { Lead } from "@/types/crm";
import { Button } from "@/components/ui/button";
import { Plus, Filter, Download, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

const Index = () => {
  const [pipeline, setPipeline] = useState(pipelineMock);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleLeadMove = (leadId: string, novaColuna: string) => {
    setPipeline(prev => ({
      ...prev,
      leads: prev.leads.map(lead => 
        lead.id === leadId 
          ? { ...lead, colunaAtual: novaColuna, ultimaAtividade: new Date() }
          : lead
      )
    }));
  };

  const handleLeadUpdate = (updatedLead: Lead) => {
    setPipeline(prev => ({
      ...prev,
      leads: prev.leads.map(lead => 
        lead.id === updatedLead.id ? updatedLead : lead
      )
    }));
  };

  const filteredLeads = pipeline.leads.filter(lead => 
    lead.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (lead.empresa && lead.empresa.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const totalLeads = pipeline.leads.length;
  const leadsQualificados = pipeline.leads.filter(l => l.statusQualificacao === 'Qualificado').length;
  const valorTotalEstimado = pipeline.leads.reduce((acc, lead) => 
    acc + (lead.valorMedio || 0), 0
  );

  return (
    <Layout>
      <div className="flex flex-col h-full">
        {/* Toolbar */}
        <div className="bg-card border-b border-border p-4 shadow-card">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-foreground">Pipeline de Vendas</h1>
              <p className="text-sm text-muted-foreground">
                Gestão de leads e oportunidades - NAUTILUZ CRM
              </p>
            </div>
            <Button className="bg-gradient-primary hover:bg-primary-hover w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Novo Lead
            </Button>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar leads..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button variant="outline" size="sm" className="w-full sm:w-auto">
                <Filter className="h-4 w-4 mr-2" />
                Filtros
              </Button>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <Badge variant="outline">{totalLeads} Total</Badge>
                <Badge variant="success">{leadsQualificados} Qualificados</Badge>
                <Badge variant="outline" className="text-xs">
                  {valorTotalEstimado.toLocaleString('pt-BR', { 
                    style: 'currency', 
                    currency: 'BRL' 
                  })} Est.
                </Badge>
              </div>
              <Button variant="outline" size="sm" className="w-full sm:w-auto">
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
            </div>
          </div>
        </div>

        {/* Kanban Board */}
        <div className="flex-1 overflow-hidden">
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
        </div>
      </div>

      <LeadDetailsModal
        lead={selectedLead}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onEdit={handleLeadUpdate}
      />
    </Layout>
  );
};

export default Index;