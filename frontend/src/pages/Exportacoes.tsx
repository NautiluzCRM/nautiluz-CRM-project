import { useState } from "react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, FileSpreadsheet, Calendar } from "lucide-react";
import { fetchLeads } from "@/lib/api"; 
import { useToast } from "@/hooks/use-toast";
import * as XLSX from "xlsx"; 

const Exportacoes = () => {
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  // Definição das etiquetas das faixas para manter a ordem correta
  const LABELS_FAIXAS = [
    "Vidas 0 a 18", "Vidas 19 a 23", "Vidas 24 a 28", "Vidas 29 a 33", "Vidas 34 a 38",
    "Vidas 39 a 43", "Vidas 44 a 48", "Vidas 49 a 53", "Vidas 54 a 58", "Vidas 59 ou mais"
  ];

  const handleExportXlsx = async () => {
    setIsExporting(true);
    try {
      // 1. Busca os dados brutos da API
      const leads = await fetchLeads();

      if (!leads || leads.length === 0) {
        throw new Error("Não há leads cadastrados para exportar.");
      }

      // 2. Mapeamento Granular (Coluna por Coluna)
      const dadosParaExcel = leads.map((lead: any) => {
        
        // Preparação de Arrays (para evitar erro se vier null)
        const listaHospitais = Array.isArray(lead.hospitaisPreferencia) 
          ? lead.hospitaisPreferencia.join(", ") 
          : "";
        
        // Tenta pegar o nome dos donos se vier populado, ou deixa vazio
        const listaDonos = Array.isArray(lead.owners) 
          ? lead.owners.map((o: any) => o.nome || o.name || "").filter(Boolean).join(", ")
          : "";

        // Garante que o array de idades tenha 10 posições preenchidas com 0 se vier vazio
        const arrayIdades = (Array.isArray(lead.idades) && lead.idades.length === 10)
          ? lead.idades
          : Array(10).fill(0);

        // Objeto Base
        const linhaExcel: any = {
          "ID do Sistema": lead.id || lead._id,
          "Nome do Lead": lead.nome || lead.name || "--",
          "Empresa": lead.empresa || lead.company || "",
          "E-mail": lead.email || "",
          "Celular": lead.celular || lead.phone || "",
          "Cidade": lead.cidade || "",
          "UF": lead.uf || "",
          "Origem": lead.origem || "",
          "Data de Entrada": lead.dataCriacao ? new Date(lead.dataCriacao).toLocaleDateString('pt-BR') : "",
          
          // Dados Financeiros/Seguro
          "Valor Estimado (R$)": Number(lead.valorMedio) || 0,
          "Possui CNPJ?": lead.possuiCnpj ? "Sim" : "Não",
          "Tipo CNPJ": lead.tipoCnpj || "",
          "Já tem Plano?": lead.possuiPlano ? "Sim" : "Não",
          "Plano Atual": lead.planoAtual || "",
          "Hospitais Preferência": listaHospitais,
          "Total de Vidas": Number(lead.quantidadeVidas) || 0,
        };

        // Adiciona as 10 colunas de Faixa Etária dinamicamente
        LABELS_FAIXAS.forEach((label, index) => {
          linhaExcel[label] = Number(arrayIdades[index]) || 0;
        });

        // Dados de Gestão (Adicionados ao final)
        linhaExcel["Observações"] = lead.observacoes || lead.informacoes || "";
        linhaExcel["Responsáveis"] = listaDonos;
        linhaExcel["Etapa Atual"] = lead.colunaAtual || ""; // Idealmente seria o nome da etapa, mas o ID serve para filtro
        linhaExcel["Ativo"] = lead.active !== false ? "Sim" : "Não"; // Assume ativo se undefined

        return linhaExcel;
      });

      // 3. Cria a planilha
      const worksheet = XLSX.utils.json_to_sheet(dadosParaExcel);
      
      // Ajuste de largura das colunas (Cosmético)
      const wscols = [
        { wch: 25 }, // ID
        { wch: 30 }, // Nome
        { wch: 20 }, // Empresa
        { wch: 25 }, // Email
        { wch: 15 }, // Celular
        { wch: 15 }, // Cidade
        { wch: 5 },  // UF
        { wch: 12 }, // Origem
        { wch: 12 }, // Data
        { wch: 15 }, // Valor
        { wch: 8 },  // CNPJ
        { wch: 10 }, // Tipo
        { wch: 8 },  // Plano
        { wch: 15 }, // Nome Plano
        { wch: 30 }, // Hospitais
        { wch: 13 }, // Vidas

        // ... As 10 colunas de idade virão na sequência
        { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 },
        { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 },

        { wch: 50 }, // Observações
        { wch: 20 }, // Responsáveis
        { wch: 15 }, // Etapa
        { wch: 8 },  // Ativo
      ];
      worksheet['!cols'] = wscols;

      // 4. Gera o Arquivo
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Base Completa");

      // 5. Download
      const dataHoje = new Date().toISOString().split('T')[0];
      XLSX.writeFile(workbook, `Leads_Nautiluz_Completo_${dataHoje}.xlsx`);

      toast({ title: "Sucesso", description: "Download da planilha iniciado." });
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Erro ao exportar",
        description: err?.message || "Erro desconhecido",
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
            
            {/* CARD EXCEL */}
            <Card>
              <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-4">
                <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                  <FileSpreadsheet className="h-4 w-4 sm:h-5 sm:w-5" />
                  Leads Completos
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4">
                  Relatório detalhado com todas as colunas (Vidas, Faixas Etárias, Valores, etc).
                </p>
                <Button 
                  className="w-full bg-gradient-primary hover:bg-primary-hover h-9 sm:h-10 text-xs sm:text-sm"
                  onClick={handleExportXlsx}
                  disabled={isExporting}
                >
                  <Download className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2" />
                  {isExporting ? "Gerando planilha..." : "Exportar (.xlsx)"}
                </Button>
              </CardContent>
            </Card>

            {/* CARD PDF (Futuro) */}
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