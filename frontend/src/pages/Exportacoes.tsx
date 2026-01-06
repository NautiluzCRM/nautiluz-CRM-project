import { useState } from "react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, FileSpreadsheet, Calendar } from "lucide-react";
import { fetchLeads, fetchUsers, fetchPipelines, fetchStages } from "@/lib/api"; 
import { useToast } from "@/hooks/use-toast";
import * as XLSX from "xlsx"; 

const Exportacoes = () => {
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const LABELS_FAIXAS = [
    "Vidas 0 a 18", "Vidas 19 a 23", "Vidas 24 a 28", "Vidas 29 a 33", "Vidas 34 a 38",
    "Vidas 39 a 43", "Vidas 44 a 48", "Vidas 49 a 53", "Vidas 54 a 58", "Vidas 59 ou mais"
  ];

  const handleExportXlsx = async () => {
    setIsExporting(true);
    try {
      // Busca Leads, Usuários e Pipelines
      const [leads, users, pipelines] = await Promise.all([
        fetchLeads(),
        fetchUsers().catch(() => []),
        fetchPipelines().catch(() => [])
      ]);

      if (!leads || leads.length === 0) {
        throw new Error("Não há leads cadastrados para exportar.");
      }

      // Mapa de Usuários (ID -> Nome)
      const userMap: Record<string, string> = {};
      if (Array.isArray(users)) {
        users.forEach((u: any) => {
          if (u.id) userMap[u.id] = u.nome || u.name;
          if (u._id) userMap[u._id] = u.nome || u.name;
        });
      }

      // Mapa de Etapas (ID -> Nome)
      const stageMap: Record<string, string> = {};
      
      // Se houver pipelines, buscamos as etapas de CADA um deles
      if (pipelines.length > 0) {
        const stagesPromises = pipelines.map((p: any) => 
          fetchStages(p._id || p.id).catch(() => [])
        );
        const allStagesArrays = await Promise.all(stagesPromises);
        
        // Junta todas as etapas de todos os pipelines num lugar só
        allStagesArrays.flat().forEach((stage: any) => {
          const id = stage._id || stage.id;
          const nome = stage.name || stage.nome;
          if (id && nome) {
            stageMap[id] = nome;
          }
        });
      }

      // MAPEAMENTO DOS DADOS
      const dadosParaExcel = leads.map((lead: any) => {
        
        // Tratamento de Hospitais
        let listaHospitais = "";
        if (Array.isArray(lead.preferredHospitals)) {
          listaHospitais = lead.preferredHospitals.join(", ");
        }

        // Tratamento de Responsáveis (ID -> Nome usando userMap)
        let listaDonos = "";
        if (Array.isArray(lead.owners)) {
          listaDonos = lead.owners
            .map((o: any) => {
              // Se já for objeto com nome
              if (o.name || o.nome) return o.name || o.nome;
              // Se for ID (string), busca no mapa
              if (typeof o === 'string') return userMap[o] || "";
              return "";
            })
            .filter(Boolean)
            .join(", ");
        }

        // Tratamento de Idades
        const rawIdades = lead.ageRanges || lead.idades;
        const arrayIdades = (Array.isArray(rawIdades) && rawIdades.length === 10)
          ? rawIdades
          : Array(10).fill(0);

        // Tradução da Etapa
        const nomeEtapa = stageMap[lead.stageId] || "Desconhecida/Arquivada";

        return {
          "ID do Sistema": lead._id || lead.id,
          "Nome do Lead": lead.name || "--",
          "Empresa": lead.company || "",
          "E-mail": lead.email || "",
          "Celular": lead.phone || "",
          "Cidade": lead.city || "",
          "UF": lead.state || "",
          "Origem": lead.origin || "",
          
          "Data de Entrada": lead.createdAt 
            ? new Date(lead.createdAt).toLocaleDateString('pt-BR') 
            : "",
          "Última Atualização": lead.updatedAt
            ? new Date(lead.updatedAt).toLocaleDateString('pt-BR')
            : "",

          "Total de Vidas": Number(lead.livesCount) || 0,
          "Valor Médio (R$)": Number(lead.avgPrice) || 0,
          
          "Possui CNPJ?": lead.hasCnpj ? "Sim" : "Não",
          "CNPJ": lead.cnpj || "",
          "Tipo CNPJ": lead.cnpjType || "",
          "Já tem Plano?": lead.hasCurrentPlan ? "Sim" : "Não",
          "Plano Atual": lead.currentOperadora || "",
          "Hospitais Preferência": listaHospitais,

          ...LABELS_FAIXAS.reduce((acc: any, label, index) => {
            acc[label] = Number(arrayIdades[index]) || 0;
            return acc;
          }, {}),

          "Responsáveis": listaDonos,
          "Etapa Atual": nomeEtapa,
          "Status Qualificação": lead.qualificationStatus || "",
          "Motivo Perda": lead.lostReason || "",
          "Observações": lead.notes || ""
        };
      });

      // GERAÇÃO DO ARQUIVO
      const worksheet = XLSX.utils.json_to_sheet(dadosParaExcel);
      
      const wscols = [
        { wch: 25 }, // ID
        { wch: 30 }, // Nome
        { wch: 25 }, // Empresa
        { wch: 30 }, // Email
        { wch: 15 }, // Celular
        { wch: 15 }, // Cidade
        { wch: 5 },  // UF
        { wch: 12 }, // Origem
        { wch: 12 }, // Data Criacao
        { wch: 12 }, // Data Update
        { wch: 12 }, // Vidas
        { wch: 15 }, // Valor
        { wch: 10 }, // Tem CNPJ
        { wch: 18 }, // CNPJ
        { wch: 10 }, // Tipo
        { wch: 10 }, // Tem Plano
        { wch: 15 }, // Plano Atual
        { wch: 30 }, // Hospitais
        { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 },
        { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 },
        { wch: 30 }, // Responsáveis
        { wch: 20 }, // Etapa
        { wch: 15 }, // Status
        { wch: 20 }, // Motivo Perda
        { wch: 50 }, // Observações
      ];
      worksheet['!cols'] = wscols;

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Base Completa");
      
      const dataHoje = new Date().toISOString().split('T')[0];
      XLSX.writeFile(workbook, `Leads_Nautiluz_Completo_${dataHoje}.xlsx`);

      toast({ title: "Sucesso", description: "Planilha gerada com sucesso." });
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Erro ao exportar",
        description: "Não foi possível gerar a planilha. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Layout>
      <div className="flex flex-col h-full">
        <div className="bg-card border-b border-border p-4 sm:p-6 shadow-card">
          <h1 className="text-lg sm:text-2xl font-bold text-foreground">Exportações</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">Exporte dados do CRM em diferentes formatos</p>
        </div>

        <div className="flex-1 p-4 sm:p-6 space-y-4 sm:space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            <Card>
              <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-4">
                <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                  <FileSpreadsheet className="h-4 w-4 sm:h-5 sm:w-5" />
                  Leads Completos
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4">
                  Exportar base completa para análise em Excel.
                </p>
                <Button 
                  className="w-full bg-gradient-primary hover:bg-primary-hover h-9 sm:h-10 text-xs sm:text-sm"
                  onClick={handleExportXlsx}
                  disabled={isExporting}
                >
                  <Download className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2" />
                  {isExporting ? "Gerando..." : "Exportar (.xlsx)"}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-4">
                <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                  <Calendar className="h-4 w-4 sm:h-5 sm:w-5" />
                  Relatório Mensal
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4">
                  Relatório visual de performance do mês (PDF).
                </p>
                <Button className="w-full h-9 sm:h-10 text-xs sm:text-sm" variant="outline" disabled>
                  <Download className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2" />
                  Gerar PDF (Em breve)
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Exportacoes;