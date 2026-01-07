import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { loginApi } from "@/lib/api";

type AuthUser = {
  id?: string;
  name?: string;
  email?: string;
  role?: string;
  photoUrl?: string;
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

// Verifica se o token JWT está expirado (sem fazer chamada HTTP)
function isTokenExpired(token: string | null): boolean {
  if (!token) return true;
  
  try {
    // JWT tem 3 partes separadas por ponto
    const parts = token.split('.');
    if (parts.length !== 3) return true;
    
    // Decodifica o payload (segunda parte)
    const payload = JSON.parse(atob(parts[1]));
    
    // Verifica expiração (exp é em segundos, Date.now() em ms)
    if (payload.exp) {
      const expirationTime = payload.exp * 1000;
      // Considera expirado se faltar menos de 10 segundos
      return Date.now() >= expirationTime - 10000;
    }
    
    return false; // Sem exp = não expira
  } catch {
    return true; // Token inválido = expirado
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

function readStoredAuth(): { token: string | null; refresh: string | null; user: AuthUser } {
  const storages = [localStorage, sessionStorage];
  const read = (key: string) => {
    for (const storage of storages) {
      const value = storage.getItem(key);
      if (value) return value;
    }
    return null;
  };

  try {
    const token = read("authToken");
    const refresh = read("refreshToken");
    const userRaw = read("authUser");
    
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

  useEffect(() => {
    // Verifica se o token está expirado ao montar
    if (token && isTokenExpired(token) && !refresh) {
      clearAllAuthStorage();
      setAuth({ token: null, refresh: null, user: null });
    }
    setLoading(false);
  }, []);

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
    localStorage.removeItem("authToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("authUser");
    sessionStorage.removeItem("authToken");
    sessionStorage.removeItem("refreshToken");
    sessionStorage.removeItem("authUser");
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

  // isAuthenticated só é true se tem token E não está expirado
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