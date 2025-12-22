import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { LeadDetailsModal } from "@/components/LeadDetailsModal";
import { CreateLeadModal } from "@/components/CreateLeadModal";
import { Lead } from "@/types/crm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table as TableComponent, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, Grid, List, Download, Phone, MessageCircle, Mail, Building, Users, Calendar, Loader2, UserCheck } from "lucide-react";
import { fetchLeads, mapApiLeadToLead } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

const Leads = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  
  // REGRA: Admin e Financeiro são "Privilegiados"
  const isPrivileged = user?.role === 'admin' || user?.role === 'financial';

  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [leadToEdit, setLeadToEdit] = useState<Lead | null>(null);

  const [showMine, setShowMine] = useState(!isPrivileged);

  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [origemFilter, setOrigemFilter] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isPrivileged) {
      setShowMine(true);
    }
  }, [isPrivileged]);

  const loadLeads = async () => {
    setIsLoading(true);
    try {
      const filters: Record<string, string> = {};
      const userId = user?.id || (user as any)?._id || (user as any)?.sub;

      if (showMine) {
        if (userId) {
          filters.owners = userId;
          console.log("Filtro aplicado: owners =", userId);
        } else {
          console.error("ERRO: showMine está true, mas não encontrei ID no usuário!");
        }
      } else {
        console.log("Filtro desligado (Admin vendo tudo)");
      }

      const data = await fetchLeads(filters);
      setLeads(data.map(mapApiLeadToLead));
    } catch (error) {
      console.error("Erro ao carregar leads", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível carregar a lista de leads."
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLeads();
  }, [showMine]);

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = 
      lead.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (lead.empresa && lead.empresa.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === "all" || lead.statusQualificacao === statusFilter;
    const matchesOrigem = origemFilter === "all" || lead.origem === origemFilter;
    
    return matchesSearch && matchesStatus && matchesOrigem;
  });

  // ... (Funções de clique e modais idênticas às anteriores)
  const handleLeadClick = (lead: Lead) => {
    setSelectedLead(lead);
    setIsDetailsOpen(true);
  };

  const handleNewLead = () => {
    setLeadToEdit(null);
    setIsCreateOpen(true);
  };

  const handleEditClick = (lead: Lead) => {
    setSelectedLead(lead); 
    setLeadToEdit(lead);
    setIsDetailsOpen(false); 
    setIsCreateOpen(true);
  };

  const handleSuccess = () => {
    loadLeads();
    setIsCreateOpen(false);
    setLeadToEdit(null);
    if (leadToEdit) setIsDetailsOpen(false);
  };

  // Helpers de Cor
  const getOrigemColor = (origem: string) => {
    const colors = {
      'Instagram': 'bg-purple-100 text-purple-700',
      'Indicação': 'bg-green-100 text-green-700',
      'Site': 'bg-blue-100 text-blue-700',
      'Outros': 'bg-gray-100 text-gray-700'
    };
    return colors[origem as keyof typeof colors] || colors['Outros'];
  };

  const getStatusColor = (status: string) => {
    const colors = {
      'Qualificado': 'success',
      'Incompleto': 'warning',
      'Duplicado': 'secondary',
      'Sem interesse': 'destructive'
    };
    return colors[status as keyof typeof colors] || 'secondary';
  };

  return (
    <Layout>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="bg-card border-b border-border p-6 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Gerenciar Leads</h1>
              <p className="text-sm text-muted-foreground">
                {isLoading ? "Carregando..." : `${filteredLeads.length} de ${leads.length} leads encontrados`}
              </p>
            </div>
            
            <Button 
              className="bg-gradient-primary hover:bg-primary-hover"
              onClick={handleNewLead}
            >
              <Plus className="h-4 w-4 mr-2" />
              Novo Lead
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, email ou empresa..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {/* BOTÃO DE FILTRO COM LÓGICA DE TRAVA */}
            <Button
              variant={showMine ? "default" : "outline"}
              onClick={() => isPrivileged && setShowMine(!showMine)}
              className={`gap-2 ${!isPrivileged ? "opacity-100 cursor-not-allowed bg-primary/90 text-primary-foreground" : ""}`}
              title={!isPrivileged ? "Filtro obrigatório para vendedores" : "Filtrar por meus leads"}
            >
              <UserCheck className="h-4 w-4" />
              Meus Leads
              {/* Se não for admin, mostra badge sutil dizendo que é fixo */}
              {!isPrivileged && <span className="text-[10px] ml-1 bg-black/20 px-1 rounded">FIXO</span>}
            </Button>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="Qualificado">Qualificado</SelectItem>
                <SelectItem value="Incompleto">Incompleto</SelectItem>
                <SelectItem value="Duplicado">Duplicado</SelectItem>
                <SelectItem value="Sem interesse">Sem interesse</SelectItem>
              </SelectContent>
            </Select>

            <Select value={origemFilter} onValueChange={setOrigemFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Origem" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Origens</SelectItem>
                <SelectItem value="Instagram">Instagram</SelectItem>
                <SelectItem value="Indicação">Indicação</SelectItem>
                <SelectItem value="Site">Site</SelectItem>
                <SelectItem value="Outros">Outros</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center gap-2 border-l pl-4 ml-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="icon"
                className="h-9 w-9"
                onClick={() => setViewMode('grid')}
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'table' ? 'default' : 'outline'}
                size="icon"
                className="h-9 w-9"
                onClick={() => setViewMode('table')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>

            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 overflow-auto">
          {isLoading && (
            <div className="flex justify-center items-center h-40">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}

          {!isLoading && filteredLeads.length === 0 && (
            <div className="text-center py-10 text-muted-foreground">
              Nenhum lead encontrado com os filtros atuais.
            </div>
          )}

          {!isLoading && viewMode === 'grid' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredLeads.map((lead) => (
                <Card
                  key={lead.id}
                  className="cursor-pointer hover:shadow-lg transition-all duration-200 border-l-4 border-l-primary"
                  onClick={() => handleLeadClick(lead)}
                >
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src="" alt={lead.nome} />
                          <AvatarFallback className="bg-primary text-primary-foreground">
                            {lead.nome.split(' ').map(n => n[0]).join('').substring(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h4 className="font-medium text-sm">{lead.nome}</h4>
                          {lead.empresa && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <Building className="h-3 w-3" />
                              {lead.empresa}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1">
                      <Badge variant="outline" className={`text-xs ${getOrigemColor(lead.origem)}`}>
                        {lead.origem}
                      </Badge>
                      <Badge variant={getStatusColor(lead.statusQualificacao) as any} className="text-xs">
                        {lead.statusQualificacao}
                      </Badge>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Users className="h-3 w-3" />
                        <span>{lead.quantidadeVidas} vida{lead.quantidadeVidas > 1 ? 's' : ''}</span>
                      </div>
                      
                      {lead.valorMedio && (
                        <div className="text-xs text-muted-foreground">
                          Valor: {lead.valorMedio.toLocaleString('pt-BR', { 
                            style: 'currency', 
                            currency: 'BRL' 
                          })}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-border">
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0 hover:text-primary"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(`tel:${lead.celular}`, '_self');
                          }}
                        >
                          <Phone className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0 hover:text-green-600"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(`https://wa.me/55${lead.celular.replace(/\D/g, '')}`, '_blank');
                          }}
                        >
                          <MessageCircle className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0 hover:text-blue-600"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(`mailto:${lead.email}`, '_self');
                          }}
                        >
                          <Mail className="h-3 w-3" />
                        </Button>
                      </div>
                      
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>{lead.dataCriacao.toLocaleDateString('pt-BR')}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {!isLoading && viewMode === 'table' && (
            <Card>
              <TableComponent>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Empresa</TableHead>
                    <TableHead>Contato</TableHead>
                    <TableHead>Vidas</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Origem</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Criado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLeads.map((lead) => (
                    <TableRow
                      key={lead.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleLeadClick(lead)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src="" alt={lead.nome} />
                            <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                              {lead.nome.split(' ').map(n => n[0]).join('').substring(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{lead.nome}</span>
                        </div>
                      </TableCell>
                      <TableCell>{lead.empresa || '-'}</TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="text-sm">{lead.celular}</div>
                          <div className="text-xs text-muted-foreground">{lead.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>{lead.quantidadeVidas}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusColor(lead.statusQualificacao) as any} className="text-xs">
                          {lead.statusQualificacao}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-xs ${getOrigemColor(lead.origem)}`}>
                          {lead.origem}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {lead.valorMedio ? 
                          lead.valorMedio.toLocaleString('pt-BR', { 
                            style: 'currency', 
                            currency: 'BRL' 
                          }) : '-'
                        }
                      </TableCell>
                      <TableCell>{lead.dataCriacao.toLocaleDateString('pt-BR')}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </TableComponent>
            </Card>
          )}
        </div>
      </div>

      <LeadDetailsModal
        lead={selectedLead}
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        onEdit={handleEditClick} 
      />

      <CreateLeadModal 
        isOpen={isCreateOpen}
        onClose={() => {
          setIsCreateOpen(false);
          setLeadToEdit(null);
        }}
        onSuccess={handleSuccess}
        leadToEdit={leadToEdit}
      />
    </Layout>
  );
};

export default Leads;