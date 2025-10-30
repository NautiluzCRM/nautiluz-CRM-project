import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";

/**
 * Componente de Rota Protegida.
 * * - Se o usuário estiver autenticado (useAuth retornar true), ele renderiza
 * a página solicitada através do componente <Outlet />.
 * * - Se o usuário NÃO estiver autenticado, ele o redireciona para a página de login.
 */
const ProtectedRoute = () => {
  const isAuthenticated = useAuth();

  return isAuthenticated ? <Outlet /> : <Navigate to="/login" />;
};

export default ProtectedRoute;