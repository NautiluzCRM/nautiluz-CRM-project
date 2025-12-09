import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";

// Protege rotas exigindo token válido; mostra carregamento breve enquanto estado é restaurado.
const ProtectedRoute = () => {
  const location = useLocation();
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div className="p-6 text-sm text-muted-foreground">Carregando sessão...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;