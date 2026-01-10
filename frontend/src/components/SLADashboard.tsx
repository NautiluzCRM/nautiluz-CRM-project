import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getSLAStatsByPipeline, getLeadsDueSoon } from "@/lib/api";
import { Clock, AlertTriangle, CheckCircle, TrendingUp } from "lucide-react";
import { SLABadge, QualificationBadge } from "./SLAIndicators";
import { useNavigate } from "react-router-dom";

interface SLADashboardProps {
  pipelineId: string;
}

export function SLADashboard({ pipelineId }: SLADashboardProps) {
  const [stats, setStats] = useState<any>(null);
  const [leadsDueSoon, setLeadsDueSoon] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, [pipelineId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [statsData, dueSoonData] = await Promise.all([
        getSLAStatsByPipeline(pipelineId),
        getLeadsDueSoon(24)
      ]);
      setStats(statsData);
      setLeadsDueSoon(dueSoonData);
    } catch (error) {
      console.error('Erro ao carregar dados de SLA:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </CardHeader>
            <CardContent className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!stats) return null;

  const onTimePercentage = stats.total > 0 
    ? Math.round((stats.onTime / stats.total) * 100) 
    : 0;

  const overduePercentage = stats.total > 0 
    ? Math.round((stats.overdue / stats.total) * 100) 
    : 0;

  return (
    <div className="space-y-4">
      {/* Cards de Estatísticas */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Leads</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              {stats.noSLA} sem SLA configurado
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">No Prazo</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.onTime}</div>
            <p className="text-xs text-muted-foreground">
              {onTimePercentage}% do total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Atrasados</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.overdue}</div>
            <p className="text-xs text-muted-foreground">
              {overduePercentage}% do total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Média de Atraso</CardTitle>
            <Clock className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              {stats.avgOverdueHours}h
            </div>
            <p className="text-xs text-muted-foreground">
              {Math.floor(stats.avgOverdueHours / 24)}d {stats.avgOverdueHours % 24}h
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Leads Vencendo em Breve */}
      {leadsDueSoon.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-amber-600" />
              Leads Vencendo nas Próximas 24h
            </CardTitle>
            <CardDescription>
              {leadsDueSoon.length} lead{leadsDueSoon.length !== 1 ? 's' : ''} necessita{leadsDueSoon.length === 1 ? '' : 'm'} atenção
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {leadsDueSoon.map((lead) => (
                <div
                  key={lead._id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent cursor-pointer transition-colors"
                  onClick={() => navigate(`/leads?leadId=${lead._id}`)}
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{lead.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm text-muted-foreground">
                        {lead.company || lead.phone}
                      </span>
                      {lead.stageId && (
                        <span
                          className="text-xs px-2 py-0.5 rounded-full"
                          style={{
                            backgroundColor: `${lead.stageId.color}20`,
                            color: lead.stageId.color
                          }}
                        >
                          {lead.stageId.name}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    {lead.qualificationStatus && (
                      <QualificationBadge status={lead.qualificationStatus} />
                    )}
                    <SLABadge
                      dueDate={lead.dueDate}
                      isOverdue={lead.isOverdue}
                      overdueHours={lead.overdueHours}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
