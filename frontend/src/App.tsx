import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/use-auth";

import Linktree from "./pages/Linktree";

import ProtectedRoute from "./components/ProtectedRoute";

import Index from "./pages/Index";
import Leads from "./pages/Leads";
import GestaoVendedores from "./pages/GestaoVendedores";
import Configuracoes from "./pages/Configuracoes";
import Exportacoes from "./pages/Exportacoes";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";

// Se você tiver esses componentes criados, pode descomentar:
// import Relatorios from "./pages/Relatorios";
// import Calendario from "./pages/Calendario";
// import Metas from "./pages/Metas";
// import Analytics from "./pages/Analytics";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* --- ROTAS PÚBLICAS (Qualquer um acessa) --- */}
            <Route path="/login" element={<Login />} />
            <Route path="/recuperar-senha" element={<ForgotPassword />} />
            <Route path="/redefinir-senha" element={<ResetPassword />} />
            
            {/* AQUI ESTÁ O PULO DO GATO: O Linktree fica FORA do ProtectedRoute */}
            <Route path="/linktree" element={<Linktree />} />

            {/* --- ROTAS PRIVADAS (Só com Login) --- */}
            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<Index />} />
              <Route path="/leads" element={<Leads />} />
              <Route path="/gestao-vendedores" element={<GestaoVendedores />} />
              
              <Route path="/configuracoes" element={<Configuracoes />} />
              <Route path="/exportacoes" element={<Exportacoes />} />

              {/* Rotas futuras/comentadas
              <Route path="/relatorios" element={<Relatorios />} />
              <Route path="/calendario" element={<Calendario />} />
              <Route path="/metas" element={<Metas />} />
              <Route path="/analytics" element={<Analytics />} />
              */}
            </Route>

            {/* Rota de Erro 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;