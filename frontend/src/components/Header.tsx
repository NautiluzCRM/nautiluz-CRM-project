import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from "@/components/ui/dropdown-menu";
import { Bell, Settings, LogOut, ChevronDown, Check, X, Trash2 } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { useState, useEffect } from "react";
import {
  fetchNotifications,
  fetchUnreadCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  type Notification
} from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export function Header() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { toast } = useToast();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);

  // Verifica se o token JWT está válido (não expirado)
  const getValidToken = (): string | null => {
    const token = localStorage.getItem("authToken") || sessionStorage.getItem("authToken");
    if (!token) return null;

    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;

      const payload = JSON.parse(atob(parts[1]));
      if (payload.exp && Date.now() >= payload.exp * 1000) {
        // Token expirado - limpa storage e faz logout
        logout();
        return null;
      }
      return token;
    } catch {
      return null;
    }
  };

  // Busca notificações ao montar o componente (apenas se autenticado com token válido)
  useEffect(() => {
    const token = getValidToken();

    if (user && token) {
      loadNotifications();
      loadUnreadCount();

      // Atualiza a cada 30 segundos
      const interval = setInterval(() => {
        if (getValidToken()) {
          loadUnreadCount();
        } else {
          clearInterval(interval);
        }
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [user]);

  const loadNotifications = async () => {
    if (!user || !getValidToken()) return;
    try {
      setIsLoadingNotifications(true);
      const data = await fetchNotifications();
      setNotifications(data);
    } catch (error: any) {
      // Ignora erros de autenticação silenciosamente
      const errorMsg = error?.message || '';
      if (!errorMsg.includes('401') && !errorMsg.includes('não autenticado') && !errorMsg.includes('Unauthorized') && !errorMsg.includes('Sessão expirada')) {
        console.error('Erro ao carregar notificações:', error);
      }
    } finally {
      setIsLoadingNotifications(false);
    }
  };

  const loadUnreadCount = async () => {
    if (!user || !getValidToken()) return;
    try {
      const count = await fetchUnreadCount();
      setUnreadCount(count);
    } catch (error: any) {
      // Ignora erros de autenticação silenciosamente
      const errorMsg = error?.message || '';
      if (!errorMsg.includes('401') && !errorMsg.includes('não autenticado') && !errorMsg.includes('Unauthorized') && !errorMsg.includes('Sessão expirada')) {
        console.error('Erro ao carregar contagem:', error);
      }
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markNotificationAsRead(notificationId);
      setNotifications(prev =>
        prev.map(n => n._id === notificationId ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Erro ao marcar como lida:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
      toast({ title: "Sucesso", description: "Todas as notificações foram marcadas como lidas." });
    } catch (error) {
      console.error('Erro ao marcar todas como lidas:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível marcar as notificações como lidas."
      });
    }
  };

  const handleDeleteNotification = async (notificationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteNotification(notificationId);
      setNotifications(prev => prev.filter(n => n._id !== notificationId));
      const wasUnread = notifications.find(n => n._id === notificationId)?.read === false;
      if (wasUnread) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Erro ao deletar notificação:', error);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      handleMarkAsRead(notification._id);
    }
    if (notification.link) {
      navigate(notification.link);
    }
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success': return '✓';
      case 'warning': return '⚠';
      case 'error': return '✕';
      case 'lead': return '👤';
      case 'system': return '⚙';
      default: return 'ℹ';
    }
  };

  const getNotificationColor = (type: Notification['type']) => {
    switch (type) {
      case 'success': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'error': return 'text-red-600';
      case 'lead': return 'text-blue-600';
      case 'system': return 'text-gray-600';
      default: return 'text-blue-600';
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="h-14 md:h-16 bg-card border-b border-border flex items-center justify-between md:justify-end px-3 md:px-4 shadow-sm sticky top-0 z-40">

      {/* Logo e Nome (Visível apenas no Mobile) */}
      <div className="flex items-center gap-2 md:hidden">
        <div className="rounded-lg bg-blue-600 p-1 shadow-sm w-8 h-8 flex items-center justify-center flex-shrink-0">
          <img 
            src="/nautiluz.png" 
            alt="Logo" 
            className="w-full h-full object-contain rounded-sm" 
          />
        </div>
        <span className="font-bold text-foreground tracking-tight text-sm">
          NAUTILUZ
        </span>
      </div>

      <div className="flex items-center gap-1 md:gap-3">
        {/* Dropdown de Notificações */}
        <DropdownMenu onOpenChange={(open) => { if (open) loadNotifications(); }}>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative h-9 w-9">
              <Bell className="h-4 w-4 md:h-5 md:w-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 h-4 w-4 bg-destructive rounded-full flex items-center justify-center">
                  <span className="text-[9px] text-destructive-foreground font-medium">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 md:w-96">
            <DropdownMenuLabel className="flex items-center justify-between">
              <span>Notificações</span>
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleMarkAllAsRead}
                  className="h-7 text-xs"
                >
                  <Check className="h-3 w-3 mr-1" />
                  Marcar todas como lidas
                </Button>
              )}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />

            <ScrollArea className="h-[300px] md:h-[400px]">
              {isLoadingNotifications ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  Carregando...
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <Bell className="h-12 w-12 mx-auto text-muted-foreground/50 mb-2" />
                  <p className="text-sm text-muted-foreground">Nenhuma notificação</p>
                </div>
              ) : (
                <div className="divide-y">
                  {notifications.map((notification) => (
                    <div
                      key={notification._id}
                      onClick={() => handleNotificationClick(notification)}
                      className={`p-3 hover:bg-muted/50 cursor-pointer transition-colors relative group ${!notification.read ? 'bg-blue-50/50 dark:bg-blue-950/20' : ''
                        }`}
                    >
                      <div className="flex gap-3">
                        <div className={`flex-shrink-0 text-lg ${getNotificationColor(notification.type)}`}>
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className={`text-sm font-medium ${!notification.read ? 'font-semibold' : ''}`}>
                              {notification.title}
                            </p>
                            {!notification.read && (
                              <span className="h-2 w-2 rounded-full bg-blue-600 flex-shrink-0 mt-1.5" />
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {notification.message}
                          </p>
                          <p className="text-[10px] text-muted-foreground mt-1">
                            {formatDistanceToNow(new Date(notification.createdAt), {
                              addSuffix: true,
                              locale: ptBR
                            })}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => handleDeleteNotification(notification._id, e)}
                          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Dropdown de Usuário */}
        <div className="hidden md:block">
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
      </div>
    </header>
  );
}