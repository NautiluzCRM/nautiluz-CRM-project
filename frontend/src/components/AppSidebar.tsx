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
      className="border-r border-sidebar-border bg-sidebar"
      collapsible="icon"
    >
      {/* Header */}
      <div 
        className={cn(
          "flex items-center border-b border-sidebar-border",
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
              <h2 className="text-sm font-bold text-sidebar-foreground tracking-tight">
                NAUTILUZ
              </h2>
              <p className="text-[10px] text-sidebar-foreground/70">
                CRM de Leads
              </p>
            </div>
          )}
        </div>
        
        {!isCollapsed && (
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
            onClick={() => isMobile ? setOpenMobile(false) : toggleSidebar()}
          >
            {isMobile ? <X className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        )}
      </div>
      
      {/* Expand button when collapsed */}
      {isCollapsed && !isMobile && (
        <div className="flex justify-center py-2 border-b border-sidebar-border">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
            onClick={toggleSidebar}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      <SidebarContent className="py-4 bg-sidebar">
        {/* Navegação */}
        <div className={cn("mb-6", isCollapsed ? "px-0" : "px-3")}>
          {!isCollapsed && (
            <p className="text-[10px] font-semibold text-sidebar-foreground/60 uppercase tracking-wider mb-2 px-3">
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
                      ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-md"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-primary"
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
        <div className={cn("h-px bg-sidebar-border", isCollapsed ? "mx-1" : "mx-4")} />

        {/* Admin Only */}
        {isAdmin && (
          <>
            <div className={cn("mt-6", isCollapsed ? "px-0" : "px-3")}>
              {!isCollapsed && (
                <p className="text-[10px] font-semibold text-sidebar-primary uppercase tracking-wider mb-2 px-3">
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
                          ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-md"
                          : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-primary"
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
            <div className={cn("h-px bg-sidebar-border mt-6", isCollapsed ? "mx-1" : "mx-4")} />
          </>
        )}

        {/* Gestão */}
        <div className={cn("mt-6", isCollapsed ? "px-0" : "px-3")}>
          {!isCollapsed && (
            <p className="text-[10px] font-semibold text-sidebar-foreground/60 uppercase tracking-wider mb-2 px-3">
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
                      ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-md"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-primary"
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
      <div className="mt-auto py-4 px-4 border-t border-sidebar-border bg-sidebar">
        {!isCollapsed && (
          <>
            <div className="flex justify-center mb-3">
              <Button
                onClick={logout}
                variant="outline"
                className="w-full justify-center text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30"
                size="default"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </Button>
            </div>
            <p className="text-[10px] text-center text-sidebar-foreground/60">
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
              className="h-9 w-9 text-destructive hover:text-destructive hover:bg-destructive/10 border-none"
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
