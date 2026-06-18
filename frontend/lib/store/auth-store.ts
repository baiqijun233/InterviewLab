import { create } from "zustand";
import { apiClient } from "@/lib/api/client";

export interface User {
  id: number;
  email: string;
  full_name: string | null;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, fullName: string) => Promise<void>;
  fetchUser: () => Promise<void>;
  logout: () => void;
}

interface TokenResponse {
  access_token: string;
  token_type: string;
}

function setStoredToken(token: string) {
  if (typeof window !== "undefined") {
    localStorage.setItem("auth_token", token);
  }
}

function clearStoredToken() {
  if (typeof window !== "undefined") {
    localStorage.removeItem("auth_token");
  }
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,

  login: async (email, password) => {
    set({ isLoading: true });
    try {
      const token = await apiClient.post<TokenResponse>(
        "/api/v1/auth/login",
        { email, password },
        { skipAuth: true }
      );
      setStoredToken(token.access_token);
      const user = await apiClient.get<User>("/api/v1/auth/me");
      set({ user, isAuthenticated: true, isLoading: false });
    } catch (error) {
      clearStoredToken();
      set({ user: null, isAuthenticated: false, isLoading: false });
      throw error;
    }
  },

  register: async (email, password, fullName) => {
    set({ isLoading: true });
    try {
      await apiClient.post<User>(
        "/api/v1/auth/register",
        { email, password, full_name: fullName },
        { skipAuth: true }
      );
      const token = await apiClient.post<TokenResponse>(
        "/api/v1/auth/login",
        { email, password },
        { skipAuth: true }
      );
      setStoredToken(token.access_token);
      const user = await apiClient.get<User>("/api/v1/auth/me");
      set({ user, isAuthenticated: true, isLoading: false });
    } catch (error) {
      clearStoredToken();
      set({ user: null, isAuthenticated: false, isLoading: false });
      throw error;
    }
  },

  fetchUser: async () => {
    set({ isLoading: true });
    try {
      const user = await apiClient.get<User>("/api/v1/auth/me");
      set({ user, isAuthenticated: true, isLoading: false });
    } catch (error) {
      clearStoredToken();
      set({ user: null, isAuthenticated: false, isLoading: false });
      throw error;
    }
  },

  logout: () => {
    clearStoredToken();
    set({ user: null, isAuthenticated: false, isLoading: false });
  },
}));
