import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { api, authStorage, type AuthSession } from "../api/client";

interface AuthContextValue {
  session: AuthSession | null;
  login(email: string, password: string, tenantSlug: string): Promise<void>;
  logout(): void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function requireSession(value: Record<string, unknown>): AuthSession {
  const user = value.user as Record<string, unknown> | undefined;
  if (
    typeof value.accessToken !== "string" ||
    typeof value.refreshToken !== "string" ||
    typeof value.expiresAt !== "string" ||
    !user ||
    typeof user.id !== "string" ||
    typeof user.tenantId !== "string" ||
    typeof user.email !== "string" ||
    typeof user.displayName !== "string" ||
    typeof user.role !== "string" ||
    typeof user.isActive !== "boolean"
  ) {
    throw new Error("The authentication response was incomplete.");
  }

  return {
    accessToken: value.accessToken,
    refreshToken: value.refreshToken,
    expiresAt: value.expiresAt,
    user: {
      id: user.id,
      tenantId: user.tenantId,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
      isActive: user.isActive,
    },
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(() =>
    authStorage.read(),
  );
  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      async login(email, password, tenantSlug) {
        const { data, error } = await api.POST("/api/v1/auth/login", {
          body: { email, password, tenantSlug },
        });
        if (!data) throw error ?? new Error("Login failed.");
        const next = requireSession(data as unknown as Record<string, unknown>);
        authStorage.write(next);
        setSession(next);
      },
      logout() {
        authStorage.clear();
        setSession(null);
      },
    }),
    [session],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used within AuthProvider.");
  return value;
}
