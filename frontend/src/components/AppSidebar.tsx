import { NavLink } from "react-router-dom";
import {
  Kanban,
  Users,
  Settings,
  FileText,
  ChevronLeft,
  ChevronRight,
  X,
  LogOut,
  UsersRound,
  Plug,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";

const navigationItems = [
  { title: "Pipeline", url: "/", icon: Kanban },
  { title: "Leads", url: "/leads", icon: Users },
];

// Itens apenas para admin
const adminItems = [
  { title: "Gestão de Vendedores", url: "/gestao-vendedores", icon: UsersRound },
  { title: "Integrações", url: "/integracoes", icon: Plug },
];

const managementItems = [
  { title: "Configurações", url: "/configuracoes", icon: Settings },
  { title: "Exportações", url: "/exportacoes", icon: FileText },
];

export function AppSidebar() {
  const { state, isMobile, setOpenMobile, toggleSidebar } = useSidebar();
  const { logout, user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const isCollapsed = state === "collapsed";

  const handleNavClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  return (
    <Sidebar
      className="border-r border-gray-200 bg-white"
      collapsible="icon"
    >
      {/* Header */}
      <div 
        className={cn(
          "flex items-center border-b border-gray-200",
          isCollapsed ? "justify-center p-3" : "justify-between px-4 py-3"
        )}
      >
        <div className={cn("flex items-center", isCollapsed ? "justify-center" : "gap-3")}>
          <div className={cn(
            "rounded-xl bg-blue-600 p-1.5 shadow-md flex-shrink-0",
            isCollapsed ? "w-9 h-9" : "w-10 h-10"
          )}>
            <img 
              src="/nautiluz.png" 
              alt="Nautiluz Logo" 
              className="w-full h-full rounded-lg object-contain"
            />
          </div>
          
          {!isCollapsed && (
            <div>
              <h2 className="text-sm font-bold text-gray-900 tracking-tight">
                NAUTILUZ
              </h2>
              <p className="text-[10px] text-gray-500">
                CRM de Leads
              </p>
            </div>
          )}
        </div>
        
        {!isCollapsed && (
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 text-gray-500 hover:text-gray-900 hover:bg-gray-100"
            onClick={() => isMobile ? setOpenMobile(false) : toggleSidebar()}
          >
            {isMobile ? <X className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        )}
      </div>
      
      {/* Expand button when collapsed */}
      {isCollapsed && !isMobile && (
        <div className="flex justify-center py-2 border-b border-gray-200">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 text-gray-500 hover:text-gray-900 hover:bg-gray-100"
            onClick={toggleSidebar}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      <SidebarContent className="py-4 bg-white">
        {/* Navegação */}
        <div className={cn("mb-6", isCollapsed ? "px-0" : "px-3")}>
          {!isCollapsed && (
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2 px-3">
              Navegação
            </p>
          )}
          <nav className="space-y-1">
            {navigationItems.map((item) => (
              <NavLink
                key={item.title}
                to={item.url}
                onClick={handleNavClick}
                className={({ isActive }) =>
                  cn(
                    "flex items-center rounded-lg transition-colors",
                    isCollapsed 
                      ? "w-10 h-10 justify-center mx-auto" 
                      : "gap-3 px-3 py-2.5",
                    isActive
                      ? "bg-blue-600 text-white shadow-md"
                      : "text-gray-700 hover:bg-gray-100 hover:text-blue-600"
                  )
                }
                title={isCollapsed ? item.title : undefined}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                {!isCollapsed && (
                  <span className="text-sm font-medium">{item.title}</span>
                )}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Separador */}
        <div className={cn("h-px bg-gray-200", isCollapsed ? "mx-1" : "mx-4")} />

        {/* Admin Only */}
        {isAdmin && (
          <>
            <div className={cn("mt-6", isCollapsed ? "px-0" : "px-3")}>
              {!isCollapsed && (
                <p className="text-[10px] font-semibold text-blue-500 uppercase tracking-wider mb-2 px-3">
                  Administração
                </p>
              )}
              <nav className="space-y-1">
                {adminItems.map((item) => (
                  <NavLink
                    key={item.title}
                    to={item.url}
                    onClick={handleNavClick}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center rounded-lg transition-colors",
                        isCollapsed 
                          ? "w-10 h-10 justify-center mx-auto" 
                          : "gap-3 px-3 py-2.5",
                        isActive
                          ? "bg-blue-600 text-white shadow-md"
                          : "text-gray-700 hover:bg-blue-50 hover:text-blue-600"
                      )
                    }
                    title={isCollapsed ? item.title : undefined}
                  >
                    <item.icon className="h-5 w-5 flex-shrink-0" />
                    {!isCollapsed && (
                      <span className="text-sm font-medium">{item.title}</span>
                    )}
                  </NavLink>
                ))}
              </nav>
            </div>

            {/* Separador */}
            <div className={cn("h-px bg-gray-200 mt-6", isCollapsed ? "mx-1" : "mx-4")} />
          </>
        )}

        {/* Gestão */}
        <div className={cn("mt-6", isCollapsed ? "px-0" : "px-3")}>
          {!isCollapsed && (
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2 px-3">
              Gestão
            </p>
          )}
          <nav className="space-y-1">
            {managementItems.map((item) => (
              <NavLink
                key={item.title}
                to={item.url}
                onClick={handleNavClick}
                className={({ isActive }) =>
                  cn(
                    "flex items-center rounded-lg transition-colors",
                    isCollapsed 
                      ? "w-10 h-10 justify-center mx-auto" 
                      : "gap-3 px-3 py-2.5",
                    isActive
                      ? "bg-blue-600 text-white shadow-md"
                      : "text-gray-700 hover:bg-gray-100 hover:text-blue-600"
                  )
                }
                title={isCollapsed ? item.title : undefined}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                {!isCollapsed && (
                  <span className="text-sm font-medium">{item.title}</span>
                )}
              </NavLink>
            ))}
          </nav>
        </div>
      </SidebarContent>
      
      {/* Footer com botão de logout */}
      <div className="mt-auto py-4 px-4 border-t border-gray-200 bg-white">
        {!isCollapsed && (
          <>
            <div className="flex justify-center mb-3">
              <Button
                onClick={logout}
                variant="outline"
                className="w-full justify-center text-red-500 hover:text-red-600 hover:bg-red-50 border-red-300"
                size="default"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </Button>
            </div>
            <p className="text-[10px] text-center text-gray-400">
              © 2026 Nautiluz CRM
            </p>
          </>
        )}
        
        {isCollapsed && (
          <div className="flex justify-center">
            <Button
              onClick={logout}
              variant="outline"
              size="icon"
              className="h-9 w-9 text-red-500 hover:text-red-600 hover:bg-red-50 border-red-300"
              title="Sair"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </Sidebar>
  );
}
