"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { authApi } from "@/lib/api";
import type { Account, AuthSession, LoginPayload, UserRole } from "@/types";

// ─── Context Shape ────────────────────────────────────────────────────────────

interface AuthContextValue {
  session: AuthSession | null;
  loading: boolean;
  role: UserRole | null;
  login: (payload: LoginPayload) => Promise<AuthSession>;
  logout: () => Promise<void>;
  updateAccount: (updates: Partial<Pick<Account, "theme_preference" | "avatar_url" | "bio">>) => Promise<Account>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);

  // Rehydrate session from stored JWT on first mount
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("cf_token") : null;
        if (!token) {
          setSession(null);
          return;
        }

        const sessionData = await authApi.me();
        setSession(sessionData);
        localStorage.setItem("cf_token", sessionData.token);
      } catch {
        localStorage.removeItem("cf_token");
        setSession(null);
      } finally {
        setLoading(false);
      }
    };

    restoreSession();
  }, []);

  const login = useCallback(async (payload: LoginPayload): Promise<AuthSession> => {
    const sessionData = await authApi.login(payload);
    localStorage.setItem("cf_token", sessionData.token);
    setSession(sessionData);
    return sessionData;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // Ignore backend logout failures; clear client session regardless.
    } finally {
      localStorage.removeItem("cf_token");
      setSession(null);
    }
  }, []);

  const updateAccount = useCallback(async (
    updates: Partial<Pick<Account, "theme_preference" | "avatar_url" | "bio">>,
  ): Promise<Account> => {
    if (!session) throw new Error("Sign in to update your account.");
    const account = await authApi.updateAccount(session.account.account_id, updates);
    setSession(current => current ? { ...current, account } : current);
    return account;
  }, [session]);

  const changePassword = useCallback(async (currentPassword: string, newPassword: string) => {
    if (!session) throw new Error("Sign in to change your password.");
    await authApi.changePassword(session.account.account_id, currentPassword, newPassword);
  }, [session]);

  return (
    <AuthContext.Provider
      value={{
        session,
        loading,
        role: session?.account.role ?? null,
        login,
        logout,
        updateAccount,
        changePassword,
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