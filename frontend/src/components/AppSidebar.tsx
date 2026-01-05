import { NavLink } from "react-router-dom";
import {
  Kanban,
  Users,
  BarChart3,
  Settings,
  FileText,
  Calendar,
  Target,
  TrendingUp,
  X,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";

const navigationItems = [
  { title: "Pipeline", url: "/", icon: Kanban },
  { title: "Leads", url: "/leads", icon: Users },
  //{ title: "Relatórios", url: "/relatorios", icon: BarChart3 },

  //{ title: "Calendário", url: "/calendario", icon: Calendar },

  //{ title: "Metas", url: "/metas", icon: Target },
];

const managementItems = [
  { title: "Configurações", url: "/configuracoes", icon: Settings },
  { title: "Exportações", url: "/exportacoes", icon: FileText },
  //{ title: "Analytics", url: "/analytics", icon: TrendingUp },
];

export function AppSidebar() {
  const { state, open, isMobile, setOpenMobile } = useSidebar();
  const isCollapsed = state === "collapsed";

  const handleNavClick = () => {
    // Fecha sidebar no mobile ao clicar em um link
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  return (
    <Sidebar
      className="border-r border-sidebar-border bg-gradient-sidebar"
      collapsible="icon"
    >
      <div 
        className={`
          flex items-center gap-2 p-3 sm:p-4 border-b border-sidebar-border 
          ${isCollapsed ? 'justify-center' : 'justify-between'}
        `}
      >
        <div className={`flex items-center gap-2 ${isCollapsed ? 'justify-center' : ''}`}>
          <img 
            src="/nautiluz.png" 
            alt="Nautiluz Logo" 
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex-shrink-0 object-contain bg-white" 
          />
          
          {!isCollapsed && (
            <div>
              <h2 className="text-sm font-semibold text-sidebar-primary">
                NAUTILUZ
              </h2>
              <p className="text-[10px] sm:text-xs text-sidebar-foreground/70">CRM</p>
            </div>
          )}
        </div>
        
        {/* Mobile close button */}
        {isMobile && !isCollapsed && (
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 hover:bg-sidebar-accent"
            onClick={() => setOpenMobile(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      <SidebarContent className="py-3 sm:py-4">
        <SidebarGroup>
          {!isCollapsed && (
            <SidebarGroupLabel className="text-sidebar-primary font-semibold text-[10px] sm:text-xs uppercase tracking-wider mb-2 px-3">
              Navegação
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu className="space-y-0.5 px-2">
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      onClick={handleNavClick}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 ${
                          isActive
                            ? "bg-sidebar-accent text-sidebar-primary font-medium shadow-sm"
                            : "hover:bg-sidebar-accent/50 text-sidebar-foreground active:scale-[0.98]"
                        }`
                      }
                      title={isCollapsed ? item.title : undefined}
                    >
                      <item.icon className="h-4 w-4 flex-shrink-0" />
                      {!isCollapsed && (
                        <span className="truncate text-sm">{item.title}</span>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-4 sm:mt-6">
          {!isCollapsed && (
            <SidebarGroupLabel className="text-sidebar-primary font-semibold text-[10px] sm:text-xs uppercase tracking-wider mb-2 px-3">
              Gestão
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu className="space-y-0.5 px-2">
              {managementItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      onClick={handleNavClick}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 ${
                          isActive
                            ? "bg-sidebar-accent text-sidebar-primary font-medium shadow-sm"
                            : "hover:bg-sidebar-accent/50 text-sidebar-foreground active:scale-[0.98]"
                        }`
                      }
                      title={isCollapsed ? item.title : undefined}
                    >
                      <item.icon className="h-4 w-4 flex-shrink-0" />
                      {!isCollapsed && (
                        <span className="truncate text-sm">{item.title}</span>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}