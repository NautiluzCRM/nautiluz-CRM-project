import { useMemo } from "react";
import { loginApi } from "@/lib/api";

export const useAuth = () => {
  const authToken = localStorage.getItem("authToken");

  const isAuthenticated = useMemo(() => !!authToken, [authToken]);

  const login = async (email: string, password: string) => {
    const { accessToken, refreshToken, user } = await loginApi(email, password);
    localStorage.setItem("authToken", accessToken);
    localStorage.setItem("refreshToken", refreshToken);
    localStorage.setItem("authUser", JSON.stringify(user));
    return user;
  };

  const logout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("authUser");
  };

  return { isAuthenticated, login, logout };
};