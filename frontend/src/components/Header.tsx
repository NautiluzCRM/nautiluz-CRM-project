import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator 
} from "@/components/ui/dropdown-menu";
import { Bell, Settings, LogOut, Menu } from "lucide-react";
import { useSidebar } from "@/components/ui/sidebar";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";

export function Header() {
  const { toggleSidebar } = useSidebar();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="h-16 bg-card border-b border-border flex items-center justify-between px-1 shadow-card">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="hover:bg-muted"
        >
          <Menu className="h-5 w-5" />
        </Button>
        
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
            <span className="text-sm font-bold text-white">N</span>
          </div>
          <div>
            <h1 className="text-lg font-semibold text-foreground">NAUTILUZ CRM</h1>
            <p className="text-xs text-muted-foreground">Sistema de Gestão de Leads</p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <span className="absolute -top-1 -right-1 h-3 w-3 bg-destructive rounded-full flex items-center justify-center">
            <span className="text-[10px] text-destructive-foreground">3</span>
          </span>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 p-2 h-auto">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.photoUrl || "/placeholder-avatar.jpg"} alt={user?.name || "Usuário"} />
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {(user?.name || "N").slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="text-left hidden md:block">
                <p className="text-sm font-medium text-foreground">{user?.name || "Usuário"}</p>
                <p className="text-xs text-muted-foreground">{user?.role || ""}</p>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            
            <Link to="/configuracoes">
              <DropdownMenuItem className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Configurações
              </DropdownMenuItem>
            </Link>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="flex items-center gap-2 text-destructive">
              <LogOut className="h-4 w-4" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}