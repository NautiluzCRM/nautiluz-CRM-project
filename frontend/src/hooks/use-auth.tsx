import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { loginApi, API_URL } from "@/lib/api"; // Importe API_URL aqui

type AuthUser = {
  id?: string;
  name?: string;
  email?: string;
  role?: string;
  photoUrl?: string;
  photoBase64?: string;
} | null;

type AuthContextValue = {
  user: AuthUser;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string, remember?: boolean) => Promise<AuthUser>;
  logout: () => void;
  updateUserLocal: (dados: Partial<AuthUser>) => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// --- HELPER LOCAL PARA EVITAR O REFERENCE ERROR ---
function getStoredItem(key: string): string | null {
  return localStorage.getItem(key) ?? sessionStorage.getItem(key);
}

function setStoredItem(key: string, value: string) {
  // Se já existe no session, atualiza lá. Senão, vai pro local (padrão ou persistência)
  if (sessionStorage.getItem(key)) {
    sessionStorage.setItem(key, value);
  } else {
    localStorage.setItem(key, value);
  }
}

function clearAllAuthStorage() {
  const storages = [localStorage, sessionStorage];
  for (const storage of storages) {
    storage.removeItem("authToken");
    storage.removeItem("refreshToken");
    storage.removeItem("authUser");
  }
}

// Verifica se o token JWT está expirado (sem fazer chamada HTTP)
function isTokenExpired(token: string | null): boolean {
  if (!token) return true;
  
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return true;
    
    const payload = JSON.parse(atob(parts[1]));
    
    if (payload.exp) {
      const expirationTime = payload.exp * 1000;
      // Considera expirado se faltar menos de 10 segundos
      return Date.now() >= expirationTime - 10000;
    }
    
    return false;
  } catch {
    return true;
  }
}

function readStoredAuth(): { token: string | null; refresh: string | null; user: AuthUser } {
  try {
    const token = getStoredItem("authToken");
    const refresh = getStoredItem("refreshToken");
    const userRaw = getStoredItem("authUser");
    
    // Se o token está expirado E não há refresh token, limpa tudo
    if (isTokenExpired(token) && !refresh) {
      clearAllAuthStorage();
      return { token: null, refresh: null, user: null };
    }
    
    return {
      token,
      refresh,
      user: userRaw ? (JSON.parse(userRaw) as AuthUser) : null,
    };
  } catch (err) {
    console.error("Erro ao ler credenciais do storage", err);
    return { token: null, refresh: null, user: null };
  }
}

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [{ token, refresh, user }, setAuth] = useState(readStoredAuth);
  const [loading, setLoading] = useState(true);

  // Função para renovar o token automaticamente
  const renewToken = useCallback(async () => {
    // CORREÇÃO: Usa helper local em vez de getAuthStorage inexistente
    const refreshToken = getStoredItem("refreshToken");
    
    if (!refreshToken) {
      console.warn('[Auth Hook] Nenhum refresh token disponível');
      return false;
    }

    try {
      const baseUrl = API_URL || "http://localhost:10000/api";
      
      console.log('[Auth Hook] Tentando renovar token...');
      const res = await fetch(`${baseUrl}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: refreshToken }),
      });

      if (!res.ok) {
        // Se for erro de servidor (500+), NÃO desloga, apenas retorna false
        if (res.status >= 500) {
            console.warn(`[Auth Hook] Erro servidor (${res.status}) ao renovar. Tentando depois.`);
            return false;
        }

        // Se for 401/403, aí sim desloga
        const errText = await res.text();
        let errorDetail = errText;
        try {
          const errorJson = JSON.parse(errText);
          errorDetail = errorJson.message || errText;
        } catch {}
        
        console.error(`[Auth Hook] Token inválido (${res.status}): ${errorDetail}`);
        clearAllAuthStorage();
        setAuth({ token: null, refresh: null, user: null });
        return false;
      }

      const data = await res.json();
      if (data?.accessToken) {
        console.log('[Auth Hook] Token renovado com sucesso');
        setStoredItem("authToken", data.accessToken);
        
        // Se vier novo refresh, salva também
        if (data.refreshToken) {
            setStoredItem("refreshToken", data.refreshToken);
            console.log('[Auth Hook] Refresh token também atualizado');
        }

        setAuth(prev => ({ 
            ...prev, 
            token: data.accessToken,
            refresh: data.refreshToken || prev.refresh
        }));
        return true;
      }
      console.warn('[Auth Hook] Resposta sem accessToken');
      return false;
    } catch (error) {
      console.error("[Auth Hook] Erro de rede ao renovar:", error);
      return false;
    }
  }, []);

  useEffect(() => {
    if (token && isTokenExpired(token) && !refresh) {
      clearAllAuthStorage();
      setAuth({ token: null, refresh: null, user: null });
    }
    setLoading(false);
  }, []);

  // Sistema de renovação automática
  useEffect(() => {
    if (!token || !refresh) return;

    const checkAndRenew = async () => {
      try {
        const parts = token.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1]));
          if (payload.exp) {
            const expirationTime = payload.exp * 1000;
            const timeUntilExpiry = expirationTime - Date.now();
            
            // Se faltar menos de 5 minutos, tenta renovar
            if (timeUntilExpiry < 5 * 60 * 1000) {
              console.log('[Auth] Token expirando, renovando...');
              await renewToken();
            }
          }
        }
      } catch (error) {
        console.error('[Auth] Erro check expiração:', error);
      }
    };

    checkAndRenew();
    const interval = setInterval(checkAndRenew, 2 * 60 * 1000); // Checa a cada 2 min

    // Listener de atividade (com throttle para não spammar)
    let lastActivityCheck = Date.now();
    const handleUserActivity = () => {
      const now = Date.now();
      if (now - lastActivityCheck > 60 * 1000) { 
        lastActivityCheck = now;
        checkAndRenew();
      }
    };

    const activityEvents = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    activityEvents.forEach(event => {
      window.addEventListener(event, handleUserActivity, { passive: true });
    });

    return () => {
      clearInterval(interval);
      activityEvents.forEach(event => {
        window.removeEventListener(event, handleUserActivity);
      });
    };
  }, [token, refresh, renewToken]);

  const login = useCallback(async (email: string, password: string, remember = false) => {
    const { accessToken, refreshToken, user } = await loginApi(email, password, remember);
    const target = remember ? localStorage : sessionStorage;
    const other = remember ? sessionStorage : localStorage;

    target.setItem("authToken", accessToken);
    target.setItem("refreshToken", refreshToken);
    target.setItem("authUser", JSON.stringify(user));

    other.removeItem("authToken");
    other.removeItem("refreshToken");
    other.removeItem("authUser");

    setAuth({ token: accessToken, refresh: refreshToken, user });
    return user;
  }, []);

  const logout = useCallback(() => {
    clearAllAuthStorage();
    setAuth({ token: null, refresh: null, user: null });
  }, []);

  const updateUserLocal = useCallback((dados: Partial<AuthUser>) => {
    setAuth((current) => {
      if (!current.user) return current;

      const newUser = { ...current.user, ...dados };

      if (localStorage.getItem("authUser")) {
        localStorage.setItem("authUser", JSON.stringify(newUser));
      }
      if (sessionStorage.getItem("authUser")) {
        sessionStorage.setItem("authUser", JSON.stringify(newUser));
      }

      return { ...current, user: newUser };
    });
  }, []);

  const isAuthenticated = useMemo(() => {
    return Boolean(token) && !isTokenExpired(token);
  }, [token]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user: isAuthenticated ? user : null,
      isAuthenticated,
      loading,
      login,
      logout,
      updateUserLocal,
    }),
    [isAuthenticated, user, loading, login, logout, updateUserLocal]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  return ctx;
};