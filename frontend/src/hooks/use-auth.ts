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
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

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

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: Boolean(token),
      loading,
      login,
      logout,
    }),
    [token, user, loading, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  return ctx;
};