import { useEffect, useState, useCallback } from "react";
import { LeadDetailsModal } from "@/components/LeadDetailsModal";
import { CreateLeadModal } from "@/components/CreateLeadModal";
import { EditLeadModal } from "@/components/EditLeadModal";
import { Lead } from "@/types/crm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table as TableComponent, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Plus, Search, Grid, List, Phone, MessageCircle, Mail, Building, Users, Calendar, Loader2, UserCheck, CalendarIcon, X } from "lucide-react";
import { fetchLeads, mapApiLeadToLead, deleteLeadApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { DateRange } from "react-day-picker";

const Leads = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  
  // REGRA: Admin e Financeiro são "Privilegiados"
  const isPrivileged = user?.role === 'admin' || user?.role === 'financial';

  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [leadToEdit, setLeadToEdit] = useState<Lead | null>(null);

  const [showMine, setShowMine] = useState(!isPrivileged);

  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [origemFilter, setOrigemFilter] = useState<string>("all");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);

  // Debounce para busca
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    if (!isPrivileged) {
      setShowMine(true);
    }
  }, [isPrivileged]);

  const loadLeads = useCallback(async () => {
    setIsLoading(true);
    try {
      const filters: Record<string, string> = {};
      const userId = user?.id || (user as any)?._id || (user as any)?.sub;

      if (showMine && userId) {
        filters.owners = userId;
      }

      // Filtros enviados para a API
      if (debouncedSearch) {
        filters.search = debouncedSearch;
      }

      if (statusFilter && statusFilter !== "all") {
        filters.qualificationStatus = statusFilter;
      }

      if (origemFilter && origemFilter !== "all") {
        filters.origin = origemFilter;
      }

      if (dateRange?.from) {
        filters.startDate = dateRange.from.toISOString();
      }

      if (dateRange?.to) {
        filters.endDate = dateRange.to.toISOString();
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
  }, [showMine, debouncedSearch, statusFilter, origemFilter, dateRange, user, toast]);

  useEffect(() => {
    loadLeads();
  }, [loadLeads]);

  const clearDateFilter = () => {
    setDateRange(undefined);
  };

  // ... (Funções de clique e modais idênticas às anteriores)
  const handleLeadClick = (lead: Lead) => {
    setSelectedLead(lead);
    setIsDetailsOpen(true);
  };

  const handleNewLead = () => {
    setIsCreateOpen(true);
  };

  const handleEditClick = (lead: Lead) => {
    setLeadToEdit(lead);
    setIsDetailsOpen(false);
    setIsEditOpen(true);
  };

  const handleSuccess = () => {
    loadLeads();
    setIsCreateOpen(false);
    setIsEditOpen(false);
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
    <>
      <div className="flex flex-col h-full">
        {/* Header - Mobile First */}
        <div className="bg-card border-b border-border p-3 sm:p-4 md:p-6 shadow-sm">
          {/* Top row: Title + New Lead button */}
          <div className="flex items-center justify-between gap-3 mb-3 sm:mb-4">
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-foreground truncate">
                Leads
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground">
                {isLoading ? "Carregando..." : `${leads.length} encontrados`}
              </p>
            </div>
            
            <Button 
              className="shrink-0 h-9 sm:h-10 px-3 sm:px-4"
              onClick={handleNewLead}
            >
              <Plus className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Novo Lead</span>
            </Button>
          </div>

          {/* Search bar - full width on mobile */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar leads..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-10"
            />
          </div>

          {/* Filters row - scrollable on mobile */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
            {/* Meus Leads toggle */}
            <Button
              variant={showMine ? "default" : "outline"}
              size="sm"
              onClick={() => isPrivileged && setShowMine(!showMine)}
              className={`shrink-0 h-8 text-xs gap-1.5 ${!isPrivileged ? "opacity-100 cursor-not-allowed" : ""}`}
              title={!isPrivileged ? "Filtro fixo" : "Meus leads"}
            >
              <UserCheck className="h-3.5 w-3.5" />
              <span className="hidden xs:inline">Meus</span>
              {!isPrivileged && <span className="text-[9px] bg-black/20 px-1 rounded">FIXO</span>}
            </Button>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-auto min-w-[100px] h-8 text-xs shrink-0">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos Status</SelectItem>
                <SelectItem value="Qualificado">Qualificado</SelectItem>
                <SelectItem value="Incompleto">Incompleto</SelectItem>
                <SelectItem value="Duplicado">Duplicado</SelectItem>
                <SelectItem value="Sem interesse">Sem interesse</SelectItem>
              </SelectContent>
            </Select>

            <Select value={origemFilter} onValueChange={setOrigemFilter}>
              <SelectTrigger className="w-auto min-w-[100px] h-8 text-xs shrink-0">
                <SelectValue placeholder="Origem" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas Origens</SelectItem>
                <SelectItem value="Instagram">Instagram</SelectItem>
                <SelectItem value="Indicação">Indicação</SelectItem>
                <SelectItem value="Site">Site</SelectItem>
                <SelectItem value="Outros">Outros</SelectItem>
              </SelectContent>
            </Select>

            {/* Date filter */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 text-xs shrink-0 gap-1.5">
                  <CalendarIcon className="h-3.5 w-3.5" />
                  {dateRange?.from ? (
                    dateRange.to ? (
                      <span className="hidden sm:inline">
                        {format(dateRange.from, "dd/MM", { locale: ptBR })} - {format(dateRange.to, "dd/MM", { locale: ptBR })}
                      </span>
                    ) : (
                      <span className="hidden sm:inline">{format(dateRange.from, "dd/MM", { locale: ptBR })}</span>
                    )
                  ) : (
                    <span className="hidden sm:inline">Data</span>
                  )}
                  {dateRange?.from && <span className="sm:hidden">•</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange?.from}
                  selected={dateRange}
                  onSelect={setDateRange}
                  numberOfMonths={1}
                  locale={ptBR}
                  className="sm:hidden"
                />
                <CalendarComponent
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange?.from}
                  selected={dateRange}
                  onSelect={setDateRange}
                  numberOfMonths={2}
                  locale={ptBR}
                  className="hidden sm:block"
                />
                {dateRange && (
                  <div className="p-2 border-t">
                    <Button variant="ghost" size="sm" className="w-full h-8 text-xs" onClick={clearDateFilter}>
                      <X className="h-3.5 w-3.5 mr-1" />
                      Limpar
                    </Button>
                  </div>
                )}
              </PopoverContent>
            </Popover>

            {/* Divider + View mode - hidden on small mobile */}
            <div className="hidden sm:flex items-center gap-2 border-l pl-2 ml-auto shrink-0">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="icon"
                className="h-8 w-8"
                onClick={() => setViewMode('grid')}
              >
                <Grid className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant={viewMode === 'table' ? 'default' : 'ghost'}
                size="icon"
                className="h-8 w-8"
                onClick={() => setViewMode('table')}
              >
                <List className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {/* Mobile-only: View mode row */}
          <div className="flex sm:hidden items-center pt-2 mt-2 border-t">
            <div className="flex items-center gap-1">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="icon"
                className="h-8 w-8"
                onClick={() => setViewMode('grid')}
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'table' ? 'default' : 'ghost'}
                size="icon"
                className="h-8 w-8"
                onClick={() => setViewMode('table')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-3 sm:p-4 md:p-6 overflow-auto">
          {isLoading && (
            <div className="flex justify-center items-center h-40">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}

          {!isLoading && leads.length === 0 && (
            <div className="text-center py-12 sm:py-16">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                <Users className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium text-foreground mb-1">Nenhum lead encontrado</h3>
              <p className="text-sm text-muted-foreground">Tente ajustar os filtros ou adicione um novo lead.</p>
            </div>
          )}

          {!isLoading && viewMode === 'grid' && leads.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
              {leads.map((lead) => (
                <Card
                  key={lead.id}
                  className="cursor-pointer hover:shadow-md active:scale-[0.98] transition-all duration-200 border-l-4 border-l-primary bg-card"
                  onClick={() => handleLeadClick(lead)}
                >
                  <CardContent className="p-3 sm:p-4 space-y-2.5">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-9 w-9 sm:h-10 sm:w-10 shrink-0">
                        <AvatarImage src="" alt={lead.nome} />
                        <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                          {lead.nome.split(' ').map(n => n[0]).join('').substring(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-medium text-sm truncate">{lead.nome}</h4>
                        {lead.empresa && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1 truncate">
                            <Building className="h-3 w-3 shrink-0" />
                            <span className="truncate">{lead.empresa}</span>
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1">
                      <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${getOrigemColor(lead.origem)}`}>
                        {lead.origem}
                      </Badge>
                      <Badge variant={getStatusColor(lead.statusQualificacao) as any} className="text-[10px] px-1.5 py-0">
                        {lead.statusQualificacao}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {lead.quantidadeVidas} vida{lead.quantidadeVidas > 1 ? 's' : ''}
                      </span>
                      {lead.valorMedio ? (
                        <span className="font-medium text-foreground">
                          {lead.valorMedio.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </span>
                      ) : null}
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-border">
                      <div className="flex gap-0.5">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 hover:text-primary"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(`tel:${lead.celular}`, '_self');
                          }}
                        >
                          <Phone className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 hover:text-green-600"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(`https://wa.me/55${lead.celular.replace(/\D/g, '')}`, '_blank');
                          }}
                        >
                          <MessageCircle className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 hover:text-blue-600"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(`mailto:${lead.email}`, '_self');
                          }}
                        >
                          <Mail className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {lead.createdAt ? new Date(lead.createdAt).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' }) : '-'}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {!isLoading && viewMode === 'table' && leads.length > 0 && (
            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <TableComponent>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[180px]">Nome</TableHead>
                      <TableHead className="hidden md:table-cell">Empresa</TableHead>
                      <TableHead className="min-w-[140px]">Contato</TableHead>
                      <TableHead className="hidden sm:table-cell text-center w-20">Vidas</TableHead>
                      <TableHead className="w-28">Status</TableHead>
                      <TableHead className="hidden lg:table-cell">Origem</TableHead>
                      <TableHead className="hidden md:table-cell text-right">Valor</TableHead>
                      <TableHead className="hidden sm:table-cell text-right w-24">Data</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leads.map((lead) => (
                      <TableRow
                        key={lead.id}
                        className="cursor-pointer hover:bg-muted/50 active:bg-muted"
                        onClick={() => handleLeadClick(lead)}
                      >
                        <TableCell>
                          <div className="flex items-center gap-2 sm:gap-3">
                            <Avatar className="h-7 w-7 sm:h-8 sm:w-8 shrink-0">
                              <AvatarImage src="" alt={lead.nome} />
                              <AvatarFallback className="bg-primary text-primary-foreground text-[10px]">
                                {lead.nome.split(' ').map(n => n[0]).join('').substring(0, 2)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium text-sm truncate max-w-[120px] sm:max-w-none">{lead.nome}</span>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-muted-foreground">
                          {lead.empresa || '-'}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-0.5">
                            <div className="text-xs sm:text-sm">{lead.celular}</div>
                            <div className="text-[10px] sm:text-xs text-muted-foreground truncate max-w-[100px] sm:max-w-none">
                              {lead.email}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-center">
                          {lead.quantidadeVidas}
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusColor(lead.statusQualificacao) as any} className="text-[10px] whitespace-nowrap">
                            {lead.statusQualificacao}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <Badge variant="outline" className={`text-[10px] ${getOrigemColor(lead.origem)}`}>
                            {lead.origem}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-right font-medium">
                          {lead.valorMedio ? 
                            lead.valorMedio.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) 
                            : '-'
                          }
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-right text-xs text-muted-foreground">
                          {lead.createdAt ? new Date(lead.createdAt).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' }) : '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </TableComponent>
              </div>
            </Card>
          )}
        </div>
      </div>

      <LeadDetailsModal
        lead={selectedLead}
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        onEdit={handleEditClick}
        onDelete={async (leadId: string) => {
          await deleteLeadApi(leadId);
          toast({ title: "Excluído!", description: "Lead removido com sucesso." });
          loadLeads();
        }}
      />

      <CreateLeadModal 
        isOpen={isCreateOpen}
        onClose={() => {
          setIsCreateOpen(false);
        }}
        onSuccess={handleSuccess}
      />

      <EditLeadModal 
        isOpen={isEditOpen}
        onClose={() => {
          setIsEditOpen(false);
          setLeadToEdit(null);
        }}
        onCancel={() => {
          // Volta para o modal de detalhes
          if (leadToEdit) {
            setSelectedLead(leadToEdit);
          }
          setIsEditOpen(false);
          setLeadToEdit(null);
          setIsDetailsOpen(true);
        }}
        onSuccess={handleSuccess}
        leadToEdit={leadToEdit}
      />
    </>
  );
};

export default Leads;