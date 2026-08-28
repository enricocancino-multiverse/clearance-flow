"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { mockLogin, mockMe, mockLogout } from "@/lib/mockAuth";
import type { AuthSession, LoginPayload, UserRole } from "@/types";

// ─── Context Shape ────────────────────────────────────────────────────────────

interface AuthContextValue {
  session: AuthSession | null;
  loading: boolean;
  role: UserRole | null;
  login: (payload: LoginPayload) => Promise<AuthSession>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);

  // Rehydrate session from stored JWT on first mount
  useEffect(() => {
    mockMe()
      .then(setSession)
      .catch(() => localStorage.removeItem("cf_token"))
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (payload: LoginPayload): Promise<AuthSession> => {
    const s = await mockLogin(payload);
    setSession(s);
    return s;
  }, []);

  const logout = useCallback(async () => {
    await mockLogout();
    setSession(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        session,
        loading,
        role: session?.account.role ?? null,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}

// ─── Role Guards ──────────────────────────────────────────────────────────────

export function useRequireRole(allowed: UserRole | UserRole[]) {
  const { session, loading } = useAuth();
  const roles = Array.isArray(allowed) ? allowed : [allowed];
  const authorized = session ? roles.includes(session.account.role) : false;
  return { session, loading, authorized };
}