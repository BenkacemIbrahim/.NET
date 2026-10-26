import createClient, { type Middleware } from "openapi-fetch";
import type { components, paths } from "./schema";

export type ApiSchemas = components["schemas"];

export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  user: {
    id: string;
    tenantId: string;
    email: string;
    displayName: string;
    role: string;
    isActive: boolean;
  };
}

const storageKey = "slotly.session";

export const authStorage = {
  read(): AuthSession | null {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as AuthSession;
    } catch {
      window.localStorage.removeItem(storageKey);
      return null;
    }
  },
  write(value: AuthSession) {
    window.localStorage.setItem(storageKey, JSON.stringify(value));
  },
  clear() {
    window.localStorage.removeItem(storageKey);
  },
};

const authentication: Middleware = {
  onRequest({ request }) {
    const session = authStorage.read();
    if (session) {
      request.headers.set("Authorization", `Bearer ${session.accessToken}`);
      request.headers.set("X-Tenant-Id", session.user.tenantId);
    }
    return request;
  },
};

export const api = createClient<paths>({ baseUrl: "" });
api.use(authentication);

export function tenantHeaders(slug: string): HeadersInit {
  return { "X-Tenant": slug };
}

export function apiMessage(
  error: unknown,
  fallback = "Something went wrong. Please try again.",
) {
  if (error && typeof error === "object") {
    const value = error as { detail?: unknown; title?: unknown };
    if (typeof value.detail === "string") return value.detail;
    if (typeof value.title === "string") return value.title;
  }
  return fallback;
}
