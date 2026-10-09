"use client";
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { api, tokenStore } from "./api";
import type { User } from "./types";

const APP_BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

interface AuthState {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  signup: (name: string, email: string, password: string) => Promise<User>;
  logout: () => void;
}

const Ctx = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tokenStore.get()) return setLoading(false);
    api<{ user: User }>("/auth/me")
      .then((r) => setUser(r.user))
      .catch(() => tokenStore.clear())
      .finally(() => setLoading(false));
  }, []);

  const finish = useCallback((r: { token: string; user: User }) => {
    tokenStore.set(r.token);
    setUser(r.user);
    return r.user;
  }, []);

  const value: AuthState = {
    user,
    loading,
    login: async (email, password) => finish(await api("/auth/login", { method: "POST", body: { email, password } })),
    signup: async (name, email, password) => finish(await api("/auth/signup", { method: "POST", body: { name, email, password } })),
    logout: () => {
      tokenStore.clear();
      setUser(null);
      window.location.assign(`${APP_BASE_PATH}/login`);
    },
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useAuth = () => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};
