import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { fetchSellersStats } from '@/lib/api';
import { useAuth } from '@/hooks/use-auth';

interface VendedorStats {
  id: string;
  nome: string;
  email: string;
  foto: string | null;
  ativo: boolean;
  perfil: string;
  cargo?: string;
  ultimoAcesso: string;
  totalLeads: number;
  leadsQualificados: number;
  leadsConvertidos: number;
  valorTotalPipeline: number;
  valorConvertido: number;
  taxaConversao: number;
  ticketMedio: number;
  leadsUltimos30Dias: number;
  tendencia: 'up' | 'down' | 'stable';
  distribution?: any;
}

interface Totals {
  totalVendedores: number;
  vendedoresAtivos: number;
  totalLeadsEquipe: number;
  totalConvertidos: number;
  valorTotalEquipe: number;
  valorConvertidoEquipe: number;
  mediaConversao: number;
}

interface StatsContextType {
  vendedores: VendedorStats[];
  totals: Totals;
  isLoading: boolean;
  refreshStats: () => Promise<void>;
  lastUpdated: Date | null;
}

const StatsContext = createContext<StatsContextType | undefined>(undefined);

export function StatsProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const [vendedores, setVendedores] = useState<VendedorStats[]>([]);
  const [totals, setTotals] = useState<Totals>({
    totalVendedores: 0,
    vendedoresAtivos: 0,
    totalLeadsEquipe: 0,
    totalConvertidos: 0,
    valorTotalEquipe: 0,
    valorConvertidoEquipe: 0,
    mediaConversao: 0
  });
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const refreshStats = useCallback(async () => {
    // Só carrega se estiver autenticado e for admin
    if (!isAuthenticated || user?.role !== 'admin') {
      console.log('[StatsContext] Usuário não autenticado ou não é admin. Pulando carregamento.');
      return;
    }

    try {
      setIsLoading(true);
      console.log('[StatsContext] Carregando estatísticas de vendedores...');
      const data = await fetchSellersStats();
      console.log('[StatsContext] Dados recebidos:', data);
      setVendedores(data.sellers);
      setTotals(data.totals);
      setLastUpdated(new Date());
    } catch (error) {
      console.error("[StatsContext] Erro ao carregar estatísticas:", error);
      // Não re-throw aqui para evitar quebrar a UI
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user]);

  // Carrega inicialmente apenas se autenticado e admin
  useEffect(() => {
    if (isAuthenticated && user?.role === 'admin') {
      refreshStats();
    }
  }, [isAuthenticated, user?.role, refreshStats]);

  return (
    <StatsContext.Provider value={{ vendedores, totals, isLoading, refreshStats, lastUpdated }}>
      {children}
    </StatsContext.Provider>
  );
}

export function useStats() {
  const context = useContext(StatsContext);
  if (context === undefined) {
    throw new Error('useStats deve ser usado dentro de um StatsProvider');
  }
  return context;
}
