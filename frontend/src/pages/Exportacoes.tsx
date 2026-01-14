import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Download, FileSpreadsheet, FileText, BarChart3, Filter, RotateCcw, Loader2 } from "lucide-react";
// Importamos as funções de busca da API
import { exportToXLSX, exportToCSV, exportToPDF, fetchUsers, fetchPipelines, fetchStages } from "@/lib/api"; 
import { useToast } from "@/hooks/use-toast"; 

// Lista de origens padrão do sistema
const ORIGENS_DISPONIVEIS = [
  "Google Ads",
  "Indicação",
  "Instagram",
  "Meta Ads",
  "Site",
  "WhatsApp",
  "Outros"
];

const Exportacoes = () => {
  const [isExporting, setIsExporting] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const { toast } = useToast();

  // Estados de Dados do Sistema
  const [listaEtapas, setListaEtapas] = useState<any[]>([]);
  const [listaUsuarios, setListaUsuarios] = useState<any[]>([]);

  // Estados dos Filtros
  const [filtroEtapa, setFiltroEtapa] = useState<string>("");
  const [filtroOrigem, setFiltroOrigem] = useState<string>("");
  const [filtroResponsavel, setFiltroResponsavel] = useState<string>("");
  const [dataInicio, setDataInicio] = useState<string>("");
  const [dataFim, setDataFim] = useState<string>("");

  // Estados dos Campos a Exportar
  const [camposExportar, setCamposExportar] = useState({
    basico: true,
    contato: true,
    cnpj: true,
    vidas: true,
    hospitais: true,
    responsaveis: true,
    etapa: true,
    observacoes: true,
  });

  useEffect(() => {
    async function loadSystemData() {
      try {
        setIsLoadingData(true);

        // Carrega Usuários
        const users = await fetchUsers();
        
        // Filtra ativos e ordena alfabeticamente
        const activeUsers = users
          .filter((u: any) => u.ativo)
          .sort((a: any, b: any) => {
            const nomeA = a.nome || "";
            const nomeB = b.nome || "";
            return nomeA.localeCompare(nomeB);
          });

        setListaUsuarios(activeUsers);

        // Carrega Etapas
        const pipelines = await fetchPipelines();
        if (pipelines && pipelines.length > 0) {
          const pipelineId = pipelines[0]._id || pipelines[0].id;
          const stages = await fetchStages(pipelineId);
          setListaEtapas(stages);
        }

      } catch (error) {
        console.error("Erro ao carregar dados para filtros:", error);
        toast({
          variant: "destructive",
          title: "Erro ao carregar filtros",
          description: "Não foi possível carregar as listas de usuários e etapas."
        });
      } finally {
        setIsLoadingData(false);
      }
    }

    loadSystemData();
  }, []);

  const handleExportXlsx = async () => {
    setIsExporting(true);
    try {
      const filters = {
        stageId: filtroEtapa || undefined,
        origin: filtroOrigem || undefined,
        owners: filtroResponsavel ? [filtroResponsavel] : undefined,
        startDate: dataInicio || undefined,
        endDate: dataFim || undefined,
      };

      await exportToXLSX(filters, camposExportar);
      toast({ title: "Sucesso", description: "Arquivo Excel gerado e baixado com sucesso." });
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Erro ao exportar",
        description: err.message || "Não foi possível gerar o arquivo.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportCSV = async () => {
    setIsExporting(true);
    try {
      const filters = {
        stageId: filtroEtapa || undefined,
        origin: filtroOrigem || undefined,
        owners: filtroResponsavel ? [filtroResponsavel] : undefined,
        startDate: dataInicio || undefined,
        endDate: dataFim || undefined,
      };

      await exportToCSV(filters, camposExportar);
      toast({ title: "Sucesso", description: "Arquivo CSV gerado e baixado com sucesso." });
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Erro ao exportar",
        description: err.message || "Não foi possível gerar o arquivo.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      const filters = {
        stageId: filtroEtapa || undefined,
        origin: filtroOrigem || undefined,
        owners: filtroResponsavel ? [filtroResponsavel] : undefined,
        startDate: dataInicio || undefined,
        endDate: dataFim || undefined,
      };

      await exportToPDF(filters, camposExportar);
      toast({ title: "Sucesso", description: "Arquivo PDF gerado e baixado com sucesso." });
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Erro ao exportar",
        description: err.message || "Não foi possível gerar o arquivo.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const limparFiltros = () => {
    setFiltroEtapa("");
    setFiltroOrigem("");
    setFiltroResponsavel("");
    setDataInicio("");
    setDataFim("");
  };

  return (
    <>
      <div className="flex flex-col h-full bg-background">
        {/* Header */}
        <div className="bg-card border-b border-border p-4 sm:p-6 shadow-card">
          <h1 className="text-lg sm:text-2xl font-bold text-foreground">Exportações</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">Exporte dados do CRM em diferentes formatos</p>
        </div>

        {/* Content */}
        <div className="flex-1 p-4 sm:p-6 overflow-auto">
          <div className="w-full space-y-6">
            
            {/* Seção de Filtros */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Filter className="h-5 w-5" />
                    Filtros de Exportação
                  </CardTitle>
                  {(filtroEtapa || filtroOrigem || filtroResponsavel || dataInicio || dataFim) && (
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={limparFiltros}
                      className="text-xs"
                    >
                      <RotateCcw className="h-3.5 w-3.5 mr-1" />
                      Limpar Filtros
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {isLoadingData ? (
                   <div className="flex items-center justify-center py-4 text-muted-foreground text-sm">
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Carregando opções de filtro...
                   </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    {/* Filtro Etapa */}
                    <div className="space-y-2">
                      <Label htmlFor="filtro-etapa" className="text-xs">Etapa</Label>
                      <Select value={filtroEtapa} onValueChange={setFiltroEtapa}>
                        <SelectTrigger id="filtro-etapa" className="h-9 text-xs">
                          <SelectValue placeholder="Todas as etapas" />
                        </SelectTrigger>
                        <SelectContent>
                          {listaEtapas.map((etapa) => (
                            <SelectItem key={etapa._id || etapa.id} value={etapa._id || etapa.id}>
                              {etapa.name || etapa.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Filtro Origem */}
                    <div className="space-y-2">
                      <Label htmlFor="filtro-origem" className="text-xs">Origem</Label>
                      <Select value={filtroOrigem} onValueChange={setFiltroOrigem}>
                        <SelectTrigger id="filtro-origem" className="h-9 text-xs">
                          <SelectValue placeholder="Todas" />
                        </SelectTrigger>
                        <SelectContent>
                          {ORIGENS_DISPONIVEIS.map((origem) => (
                            <SelectItem key={origem} value={origem}>
                              {origem}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Data Início */}
                    <div className="space-y-2">
                      <Label htmlFor="data-inicio" className="text-xs">De (Data)</Label>
                      <Input
                        id="data-inicio"
                        type="date"
                        value={dataInicio}
                        onChange={(e) => setDataInicio(e.target.value)}
                        className="h-9 text-xs"
                      />
                    </div>

                    {/* Data Fim */}
                    <div className="space-y-2">
                      <Label htmlFor="data-fim" className="text-xs">Até (Data)</Label>
                      <Input
                        id="data-fim"
                        type="date"
                        value={dataFim}
                        onChange={(e) => setDataFim(e.target.value)}
                        className="h-9 text-xs"
                      />
                    </div>

                    {/* Filtro Responsável */}
                    <div className="space-y-2">
                      <Label htmlFor="filtro-responsavel" className="text-xs">Responsável</Label>
                      <Select value={filtroResponsavel} onValueChange={setFiltroResponsavel}>
                        <SelectTrigger id="filtro-responsavel" className="h-9 text-xs">
                          <SelectValue placeholder="Todos" />
                        </SelectTrigger>
                        <SelectContent>
                          {listaUsuarios.map((usuario) => (
                            <SelectItem key={usuario.id} value={usuario.id}>
                              {usuario.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Seção de Campos a Exportar */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Selecionar Campos para Exportar</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="flex items-center space-x-3 p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => setCamposExportar({...camposExportar, basico: !camposExportar.basico})}>
                    <Checkbox 
                      id="campo-basico"
                      checked={camposExportar.basico}
                      onCheckedChange={(checked) => 
                        setCamposExportar({...camposExportar, basico: checked as boolean})
                      }
                      className="flex-shrink-0"
                    />
                    <Label htmlFor="campo-basico" className="text-sm cursor-pointer flex-1">Dados Básicos</Label>
                  </div>
                  <div className="flex items-center space-x-3 p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => setCamposExportar({...camposExportar, contato: !camposExportar.contato})}>
                    <Checkbox 
                      id="campo-contato"
                      checked={camposExportar.contato}
                      onCheckedChange={(checked) => 
                        setCamposExportar({...camposExportar, contato: checked as boolean})
                      }
                      className="flex-shrink-0"
                    />
                    <Label htmlFor="campo-contato" className="text-sm cursor-pointer flex-1">Dados de Contato</Label>
                  </div>
                  <div className="flex items-center space-x-3 p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => setCamposExportar({...camposExportar, cnpj: !camposExportar.cnpj})}>
                    <Checkbox 
                      id="campo-cnpj"
                      checked={camposExportar.cnpj}
                      onCheckedChange={(checked) => 
                        setCamposExportar({...camposExportar, cnpj: checked as boolean})
                      }
                      className="flex-shrink-0"
                    />
                    <Label htmlFor="campo-cnpj" className="text-sm cursor-pointer flex-1">Dados CNPJ e Plano</Label>
                  </div>
                  <div className="flex items-center space-x-3 p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => setCamposExportar({...camposExportar, vidas: !camposExportar.vidas})}>
                    <Checkbox 
                      id="campo-vidas"
                      checked={camposExportar.vidas}
                      onCheckedChange={(checked) => 
                        setCamposExportar({...camposExportar, vidas: checked as boolean})
                      }
                      className="flex-shrink-0"
                    />
                    <Label htmlFor="campo-vidas" className="text-sm cursor-pointer flex-1">Distribuição de Vidas</Label>
                  </div>
                  <div className="flex items-center space-x-3 p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => setCamposExportar({...camposExportar, hospitais: !camposExportar.hospitais})}>
                    <Checkbox 
                      id="campo-hospitais"
                      checked={camposExportar.hospitais}
                      onCheckedChange={(checked) => 
                        setCamposExportar({...camposExportar, hospitais: checked as boolean})
                      }
                      className="flex-shrink-0"
                    />
                    <Label htmlFor="campo-hospitais" className="text-sm cursor-pointer flex-1">Hospitais Preferidos</Label>
                  </div>
                  <div className="flex items-center space-x-3 p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => setCamposExportar({...camposExportar, responsaveis: !camposExportar.responsaveis})}>
                    <Checkbox 
                      id="campo-responsaveis"
                      checked={camposExportar.responsaveis}
                      onCheckedChange={(checked) => 
                        setCamposExportar({...camposExportar, responsaveis: checked as boolean})
                      }
                      className="flex-shrink-0"
                    />
                    <Label htmlFor="campo-responsaveis" className="text-sm cursor-pointer flex-1">Responsáveis e Etapa</Label>
                  </div>
                  <div className="flex items-center space-x-3 p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => setCamposExportar({...camposExportar, observacoes: !camposExportar.observacoes})}>
                    <Checkbox 
                      id="campo-observacoes"
                      checked={camposExportar.observacoes}
                      onCheckedChange={(checked) => 
                        setCamposExportar({...camposExportar, observacoes: checked as boolean})
                      }
                      className="flex-shrink-0"
                    />
                    <Label htmlFor="campo-observacoes" className="text-sm cursor-pointer flex-1">Observações</Label>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Separator />

            {/* Seção de Tipos de Exportação */}
            <div>
              <h2 className="text-lg font-semibold mb-4 text-foreground">Formatos de Exportação</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                
                {/* Card Excel */}
                <Card className="flex flex-col hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <FileSpreadsheet className="h-5 w-5 text-green-600" />
                      Excel (.xlsx)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col">
                    <p className="text-xs text-muted-foreground mb-4 flex-1">
                      Planilha completa com dados estruturados. Ideal para análise e relatórios.
                    </p>
                    <Button 
                      className="w-full bg-gradient-primary hover:bg-primary-hover h-9 text-xs"
                      onClick={handleExportXlsx}
                      disabled={isExporting}
                    >
                      <Download className="h-3.5 w-3.5 mr-2" />
                      {isExporting ? "Gerando..." : "Exportar"}
                    </Button>
                  </CardContent>
                </Card>

                {/* Card CSV */}
                <Card className="flex flex-col hover:shadow-lg transition-shadow opacity-75">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <FileText className="h-5 w-5 text-blue-600" />
                      CSV (.csv)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col">
                    <p className="text-xs text-muted-foreground mb-4 flex-1">
                      Formato texto separado por vírgulas. Compatível com a maioria dos sistemas.
                    </p>
                    <Button 
                      onClick={handleExportCSV}
                      disabled
                      className="w-full h-9 text-xs"
                      variant="outline"
                    >
                      <Download className="h-3.5 w-3.5 mr-2" />
                      {isExporting ? "Exportando..." : "Em breve"}
                    </Button>
                  </CardContent>
                </Card>

                {/* Card PDF */}
                <Card className="flex flex-col hover:shadow-lg transition-shadow opacity-75">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <FileText className="h-5 w-5 text-red-600" />
                      PDF (.pdf)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col">
                    <p className="text-xs text-muted-foreground mb-4 flex-1">
                      Documento formatado. Perfeito para compartilhar relatórios impressos.
                    </p>
                    <Button 
                      onClick={handleExportPDF}
                      disabled
                      className="w-full h-9 text-xs"
                      variant="outline"
                    >
                      <Download className="h-3.5 w-3.5 mr-2" />
                      {isExporting ? "Exportando..." : "Em breve"}
                    </Button>
                  </CardContent>
                </Card>

                {/* Card Relatório */}
                <Card className="flex flex-col hover:shadow-lg transition-shadow opacity-75">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <BarChart3 className="h-5 w-5 text-purple-600" />
                      Relatório
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col">
                    <p className="text-xs text-muted-foreground mb-4 flex-1">
                      Análise visual com gráficos e estatísticas do período selecionado.
                    </p>
                    <Button 
                      className="w-full h-9 text-xs"
                      variant="outline"
                      disabled
                    >
                      <Download className="h-3.5 w-3.5 mr-2" />
                      Em breve
                    </Button>
                  </CardContent>
                </Card>

              </div>
            </div>

            {/* Info Card */}
            <Card className="bg-muted/50">
              <CardContent className="pt-6">
                <div className="space-y-2 text-xs text-muted-foreground">
                  <p>💡 <strong>Dica:</strong> Selecione os filtros e campos desejados antes de exportar para obter exatamente os dados que você precisa.</p>
                  <p>📊 Os dados serão exportados apenas dos registros que correspondem aos filtros aplicados.</p>
                  <p>✓ O arquivo será nomeado automaticamente com a data de exportação.</p>
                </div>
              </CardContent>
            </Card>

          </div>
        </div>
      </div>
    </>
  );
};

export default Exportacoes;