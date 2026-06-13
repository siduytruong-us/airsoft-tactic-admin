"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import axios from "axios";
import apiClient, { TOKEN_KEY } from "@/lib/axios";
import type { AdminInfo, AuthResponse, LoginDto } from "@/types/api";

interface AuthContextType {
  user: AdminInfo | null;
  accessToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (dto: LoginDto) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AdminInfo | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Khôi phục session từ localStorage
  useEffect(() => {
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      const storedUser = localStorage.getItem("adminUser");
      if (token && storedUser) {
        setAccessToken(token);
        setUser(JSON.parse(storedUser) as AdminInfo);
      }
    } catch {
      // SSR — bỏ qua
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(async (dto: LoginDto) => {
    try {
      const response = await apiClient.post<AuthResponse>(
        "/v1/admin/auth/login",
        dto,
      );

      const payload = response.data;

      // Backend trả success: false trong body (không phải HTTP error)

      if (!payload.data) {
        throw new Error(payload.message || "Đăng nhập thất bại");
      }

      const { accessToken: token, user: adminUser } = payload.data;

      if (!token) {
        throw new Error("Server không trả về token");
      }

      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem("adminUser", JSON.stringify(adminUser));
      setAccessToken(token);
      setUser(adminUser);
    } catch (error) {
      // Axios HTTP error (4xx, 5xx) → lấy message từ response body
      if (axios.isAxiosError(error) && error.response) {
        const body = error.response.data as { message?: string } | undefined;
        throw new Error(
          body?.message || `Lỗi ${error.response.status}: Đăng nhập thất bại`,
        );
      }
      // Re-throw lỗi khác (network, timeout, v.v.)
      throw error;
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem("adminUser");
    setAccessToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        isLoading,
        isAuthenticated: !!accessToken,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
