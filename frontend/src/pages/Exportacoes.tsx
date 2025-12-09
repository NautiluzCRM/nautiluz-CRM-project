import { useState } from "react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, FileSpreadsheet, Calendar } from "lucide-react";
import { exportLeadsXlsx, API_URL } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const Exportacoes = () => {
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const handleExportXlsx = async () => {
    setIsExporting(true);
    try {
      const { url } = await exportLeadsXlsx();
      const fullUrl = url.startsWith("http") ? url : `${API_URL}${url}`;
      window.open(fullUrl, "_blank", "noopener,noreferrer");
      toast({ title: "Exportação iniciada", description: "O download da planilha foi disparado." });
    } catch (err: any) {
      toast({
        title: "Erro ao exportar",
        description: err?.message || "Não foi possível gerar a planilha",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Layout>
      <div className="flex flex-col h-full">
        <div className="bg-card border-b border-border p-6 shadow-card">
          <h1 className="text-2xl font-bold text-foreground">Exportações</h1>
          <p className="text-sm text-muted-foreground">Exporte dados do CRM em diferentes formatos</p>
        </div>

        <div className="flex-1 p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileSpreadsheet className="h-5 w-5" />
                  Leads Completos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Exportar todos os dados dos leads em planilha Excel
                </p>
                <Button 
                  className="w-full bg-gradient-primary hover:bg-primary-hover"
                  onClick={handleExportXlsx}
                  disabled={isExporting}
                >
                  <Download className="h-4 w-4 mr-2" />
                  {isExporting ? "Exportando..." : "Exportar (.xlsx)"}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Relatório Mensal
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Relatório completo de performance do mês
                </p>
                <Button className="w-full" variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Gerar PDF
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