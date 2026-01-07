import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Users, Target, DollarSign } from "lucide-react";

const Analytics = () => {
  return (
    <>
      <div className="flex flex-col h-full">
        <div className="bg-card border-b border-border p-4 sm:p-6 shadow-card">
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Analytics Avançado</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">Insights detalhados e métricas avançadas</p>
        </div>

        <div className="flex-1 p-4 sm:p-6 space-y-4 sm:space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            {[
              { titulo: 'ROI Médio', valor: '340%', icone: TrendingUp },
              { titulo: 'LTV Cliente', valor: 'R$ 8.500', icone: DollarSign },
              { titulo: 'Retenção', valor: '92%', icone: Target },
              { titulo: 'NPS', valor: '78', icone: Users }
            ].map((item, i) => (
              <Card key={i}>
                <CardContent className="p-4 sm:p-6 flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm text-muted-foreground truncate">{item.titulo}</p>
                    <h3 className="text-lg sm:text-2xl font-bold">{item.valor}</h3>
                  </div>
                  <item.icone className="h-6 w-6 sm:h-8 sm:w-8 text-primary shrink-0 ml-2" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default Analytics;