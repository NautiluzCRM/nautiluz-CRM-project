import { NavLink } from "react-router-dom";
import {
  Kanban,
  Users,
  BarChart3,
  Settings,
  FileText,
  Calendar,
  Target,
  TrendingUp
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

const navigationItems = [
  { title: "Pipeline", url: "/", icon: Kanban },
  { title: "Leads", url: "/leads", icon: Users },
  { title: "Relatórios", url: "/relatorios", icon: BarChart3 },
  { title: "Calendário", url: "/calendario", icon: Calendar },
  { title: "Metas", url: "/metas", icon: Target },
];

const managementItems = [
  { title: "Configurações", url: "/configuracoes", icon: Settings },
  { title: "Exportações", url: "/exportacoes", icon: FileText },
  { title: "Analytics", url: "/analytics", icon: TrendingUp },
];

export function AppSidebar() {
  const { state, open } = useSidebar();
  const isCollapsed = state === "collapsed";

  return (
    <Sidebar 
      className="border-r border-sidebar-border bg-gradient-sidebar"
      collapsible="icon"
    >
      <div className="flex items-center gap-2 p-4 border-b border-sidebar-border">
        <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
          <span className="text-sm font-bold text-white">N</span>
        </div>
        {!isCollapsed && (
          <div>
            <h2 className="text-sm font-semibold text-sidebar-primary">NAUTILUZ</h2>
            <p className="text-xs text-sidebar-foreground/70">CRM</p>
          </div>
        )}
      </div>

      <SidebarContent className="px-2 py-4">
        <SidebarGroup>
          {!isCollapsed && (
            <SidebarGroupLabel className="text-sidebar-primary font-semibold text-xs uppercase tracking-wider mb-2">
              Navegação Principal
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      className={({ isActive }) => 
                        `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                          isActive 
                            ? "bg-sidebar-accent text-sidebar-primary font-medium" 
                            : "hover:bg-sidebar-accent/50 text-sidebar-foreground"
                        }`
                      }
                      title={isCollapsed ? item.title : undefined}
                    >
                      <item.icon className="h-4 w-4 flex-shrink-0" />
                      {!isCollapsed && <span className="truncate">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-6">
          {!isCollapsed && (
            <SidebarGroupLabel className="text-sidebar-primary font-semibold text-xs uppercase tracking-wider mb-2">
              Gestão
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {managementItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      className={({ isActive }) => 
                        `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                          isActive 
                            ? "bg-sidebar-accent text-sidebar-primary font-medium" 
                            : "hover:bg-sidebar-accent/50 text-sidebar-foreground"
                        }`
                      }
                      title={isCollapsed ? item.title : undefined}
                    >
                      <item.icon className="h-4 w-4 flex-shrink-0" />
                      {!isCollapsed && <span className="truncate">{item.title}</span>}
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