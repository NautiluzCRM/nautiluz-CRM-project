import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger, 
  DropdownMenuSeparator 
} from "@/components/ui/dropdown-menu";
import { Bell, Settings, LogOut, ChevronDown } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";

export function Header() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="h-14 md:h-16 bg-card border-b border-border flex items-center justify-end px-3 md:px-4 shadow-sm sticky top-0 z-40">

      <div className="flex items-center gap-1 md:gap-3">
        <Button variant="ghost" size="icon" className="relative h-9 w-9">
          <Bell className="h-4 w-4 md:h-5 md:w-5" />
          <span className="absolute -top-0.5 -right-0.5 h-4 w-4 bg-destructive rounded-full flex items-center justify-center">
            <span className="text-[9px] text-destructive-foreground font-medium">3</span>
          </span>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-1 md:gap-2 px-1.5 md:px-2 h-9 md:h-10">
              <Avatar className="h-7 w-7 md:h-8 md:w-8">
                <AvatarImage src={user?.photoUrl || "/placeholder-avatar.jpg"} alt={user?.name || "Usuário"} />
                <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                  {(user?.name || "N").slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="text-left hidden md:block">
                <p className="text-sm font-medium text-foreground leading-tight">{user?.name || "Usuário"}</p>
                <p className="text-[10px] text-muted-foreground capitalize leading-tight">{user?.role || ""}</p>
              </div>
              <ChevronDown className="h-3 w-3 text-muted-foreground hidden md:block" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            {/* Mobile user info */}
            <div className="md:hidden px-2 py-2 border-b">
              <p className="text-sm font-medium">{user?.name || "Usuário"}</p>
              <p className="text-xs text-muted-foreground capitalize">{user?.role || ""}</p>
            </div>
            <Link to="/configuracoes">
              <DropdownMenuItem className="flex items-center gap-2 cursor-pointer">
                <Settings className="h-4 w-4" />
                Configurações
              </DropdownMenuItem>
            </Link>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="flex items-center gap-2 text-destructive cursor-pointer">
              <LogOut className="h-4 w-4" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}