"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { api, type AuthUser } from "./api";
import { supabase } from "./supabase";

interface AuthCtx {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  deleteAccount: () => Promise<void>;
}

const AuthContext = createContext<AuthCtx>({
  user: null,
  loading: true,
  login: async () => {},
  register: async () => {},
  loginWithGoogle: async () => {},
  logout: () => {},
  refreshUser: async () => {},
  deleteAccount: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Check token on mount & handle OAuth callback
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const data = await api.getMe();
        setUser(data.user);
      } catch (err) {
        console.error("[Auth] getMe error:", err);
        localStorage.removeItem("token");
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Listen for token changes (e.g., from OAuth callback)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "token") {
        if (e.newValue) {
          // Token was added - fetch user data
          api
            .getMe()
            .then((data) => {
              console.log("[Auth] Token updated, user fetched:", data.user.email);
              setUser(data.user);
            })
            .catch((err) => {
              console.error("[Auth] getMe error after token update:", err);
              localStorage.removeItem("token");
            });
        } else {
          // Token was removed
          setUser(null);
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const data = await api.login(email, password);
    localStorage.setItem("token", data.token);
    setUser(data.user);
  }, []);

  const register = useCallback(async (name: string, email: string, password: string) => {
    const data = await api.register(name, email, password);
    localStorage.setItem("token", data.token);
    setUser(data.user);
  }, []);

  const loginWithGoogle = useCallback(async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${typeof window !== 'undefined' ? window.location.origin : ''}/auth/callback`,
      },
    });
    if (error) {
      console.error("[LoginWithGoogle] Error:", error);
      throw error;
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    setUser(null);
    supabase.auth.signOut();
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const data = await api.getMe();
      console.log("[Auth] User refreshed:", data.user.email);
      setUser(data.user);
    } catch (err) {
      console.error("[Auth] refreshUser error:", err);
      localStorage.removeItem("token");
      setUser(null);
    }
  }, []);

  const deleteAccount = useCallback(async () => {
    try {
      await api.deleteAccount();
      localStorage.removeItem("token");
      setUser(null);
      supabase.auth.signOut();
    } catch (err) {
      console.error("[Auth] deleteAccount error:", err);
      throw err;
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, loginWithGoogle, logout, refreshUser, deleteAccount }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
