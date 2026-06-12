import React, { createContext, useContext, useEffect, useState } from "react";
import type { RegisterRequestData, LoginRequestData, LoginResponseData, UserData } from "@/lib/auth/types";
import { loginUser, registerUser } from "@/lib/auth/api";
import api from "@/lib/api";
import { getAuthState, subscribe as subscribeAuthStore, setAccessToken as setStoreAccessToken, setUser as setStoreUser } from "@/lib/auth/authStore";

type AuthResult = { ok: true } | { ok: false; error?: string };

type AuthContextType = {
  user: UserData | null;
  accessToken: string | null;
  loading: boolean;
  login: (data: LoginRequestData) => Promise<AuthResult>;
  register: (data: RegisterRequestData) => Promise<AuthResult>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const initialAuth = getAuthState();
  const [user, setUser] = useState<UserData | null>(initialAuth.user);
  const [accessToken, setAccessToken] = useState<string | null>(initialAuth.accessToken);
  const [loading, setLoading] = useState(false);

  // Keep axios Authorization header in sync
  useEffect(() => {
    if (accessToken) {
      api.defaults.headers.common["Authorization"] = `Bearer ${accessToken}`;
    } else {
      delete api.defaults.headers.common["Authorization"];
    }
  }, [accessToken]);

  // Subscribe to shared auth store so external token updates (e.g. from other tabs) propagate to React
  useEffect(() => {
    const unsubscribe = subscribeAuthStore((s) => {
      setUser(s.user);
      setAccessToken(s.accessToken);
    });
    return unsubscribe;
  }, []);

  const login = async (data: LoginRequestData): Promise<AuthResult> => {
    setLoading(true);
    try {
      const res = await loginUser(data);
      setLoading(false);

      if ((res as any).error) return { ok: false, error: (res as any).error };

      const success = res as LoginResponseData;
      if (success.access_token) {
        setAccessToken(success.access_token);
        try { localStorage.setItem("access_token", success.access_token); } catch {}
        try { setStoreAccessToken(success.access_token); } catch {}
      }
      if (success.user) {
        setUser(success.user);
        try { localStorage.setItem("user_data", JSON.stringify(success.user)); } catch {}
        try { setStoreUser(success.user); } catch {}
      }
      return { ok: true };
    } catch (err: any) {
      setLoading(false);
      return { ok: false, error: err?.message || "Network error" };
    }
  };

  const register = async (data: RegisterRequestData): Promise<AuthResult> => {
    setLoading(true);
    try {
      const res = await registerUser(data);
      setLoading(false);

      if ((res as any).error) return { ok: false, error: (res as any).error };

      // Registration may or may not auto-login (depends on backend).
      // If the response contains a token + user, log the user in automatically.
      const success = res as LoginResponseData;
      if (success.access_token) {
        setAccessToken(success.access_token);
        try { localStorage.setItem("access_token", success.access_token); } catch {}
        try { setStoreAccessToken(success.access_token); } catch {}
      }
      if (success.user) {
        setUser(success.user);
        try { localStorage.setItem("user_data", JSON.stringify(success.user)); } catch {}
        try { setStoreUser(success.user); } catch {}
      }
      return { ok: true };
    } catch (err: any) {
      setLoading(false);
      return { ok: false, error: err?.message || "Network error" };
    }
  };

  const logout = () => {
    setUser(null);
    setAccessToken(null);
    try { localStorage.removeItem("access_token"); localStorage.removeItem("user_data"); } catch {}
    delete api.defaults.headers.common["Authorization"];
    try { setStoreAccessToken(null); setStoreUser(null); } catch {}
  };

  return (
    <AuthContext.Provider value={{ user, accessToken, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export default AuthContext;
