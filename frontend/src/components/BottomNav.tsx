import { NavLink, Link } from "react-router-dom";
import { 
  Kanban, 
  Users, 
  FileText, 
  Settings, 
  UsersRound, 
  Plug, 
  LogOut, 
  Menu 
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function BottomNav() {
  const { user, logout } = useAuth();
  const isAdmin = user?.role === 'admin';

  const navItems = [
    { title: "Pipeline", url: "/", icon: Kanban },
    { title: "Leads", url: "/leads", icon: Users },
    { title: "Exportações", url: "/exportacoes", icon: FileText },
    { title: "Configurações", url: "/configuracoes", icon: Settings },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 h-16 bg-background border-t border-border flex items-center justify-between px-4 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
      
      {/* Itens de Navegação Direta */}
      {navItems.map((item) => (
        <NavLink
          key={item.url}
          to={item.url}
          className={({ isActive }) => cn(
            "flex flex-col items-center justify-center gap-1 min-w-[3.5rem] h-full transition-all active:scale-95",
            isActive 
              ? "text-primary" 
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {({ isActive }) => (
            <>
              <item.icon 
                className={cn("h-5 w-5", isActive && "fill-current/20")} 
                strokeWidth={isActive ? 2.5 : 2}
              />
              <span className="text-[9px] font-medium">{item.title}</span>
            </>
          )}
        </NavLink>
      ))}

      {/* Menu de Perfil (Dropdown) */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex flex-col items-center justify-center gap-1 min-w-[3.5rem] h-full focus:outline-none">
            <div className={cn("rounded-full border-2 p-0.5 transition-colors", isAdmin ? "border-blue-200" : "border-transparent")}>
              <Avatar className="h-6 w-6">
                <AvatarImage src={user?.photoUrl} />
                <AvatarFallback className="bg-primary text-[9px] text-primary-foreground">
                  {(user?.name || "U").slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>
            <span className="text-[9px] font-medium text-muted-foreground">Perfil</span>
          </button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent side="top" align="end" className="w-56 mb-2">
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{user?.name}</p>
              <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          {/* Itens Exclusivos de Admin */}
          {isAdmin && (
            <>
              <DropdownMenuLabel className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                Administração
              </DropdownMenuLabel>
              <Link to="/gestao-vendedores">
                <DropdownMenuItem className="gap-2 cursor-pointer">
                  <UsersRound className="h-4 w-4" />
                  Gestão de Vendedores
                </DropdownMenuItem>
              </Link>
              <Link to="/integracoes">
                <DropdownMenuItem className="gap-2 cursor-pointer">
                  <Plug className="h-4 w-4" />
                  Integrações
                </DropdownMenuItem>
              </Link>
              <DropdownMenuSeparator />
            </>
          )}

          <Link to="/configuracoes">
             <DropdownMenuItem className="gap-2 cursor-pointer">
               <Settings className="h-4 w-4" />
               Configurações
             </DropdownMenuItem>
          </Link>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem 
            className="text-destructive focus:text-destructive gap-2 cursor-pointer"
            onClick={logout}
          >
            <LogOut className="h-4 w-4" />
            Sair do Sistema
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

    </div>
  );
}