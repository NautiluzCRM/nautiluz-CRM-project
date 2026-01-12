import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { fetchSellersStats } from '@/lib/api';

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
    try {
      setIsLoading(true);
      const data = await fetchSellersStats();
      setVendedores(data.sellers);
      setTotals(data.totals);
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Erro ao carregar estatísticas:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Carrega inicialmente
  useEffect(() => {
    refreshStats();
  }, [refreshStats]);

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
