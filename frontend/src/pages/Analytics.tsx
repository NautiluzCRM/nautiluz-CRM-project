import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Users, Target, DollarSign } from "lucide-react";

const Analytics = () => {
  return (
    <Layout>
      <div className="flex flex-col h-full">
        <div className="bg-card border-b border-border p-6 shadow-card">
          <h1 className="text-2xl font-bold text-foreground">Analytics Avançado</h1>
          <p className="text-sm text-muted-foreground">Insights detalhados e métricas avançadas</p>
        </div>

        <div className="flex-1 p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { titulo: 'ROI Médio', valor: '340%', icone: TrendingUp },
              { titulo: 'LTV Cliente', valor: 'R$ 8.500', icone: DollarSign },
              { titulo: 'Retenção', valor: '92%', icone: Target },
              { titulo: 'NPS', valor: '78', icone: Users }
            ].map((item, i) => (
              <Card key={i}>
                <CardContent className="p-6 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{item.titulo}</p>
                    <h3 className="text-2xl font-bold">{item.valor}</h3>
                  </div>
                  <item.icone className="h-8 w-8 text-primary" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Analytics;