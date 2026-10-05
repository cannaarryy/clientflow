import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { api } from "../services/api.js";
import type { User } from "../types/index.js";

export type OrganizationRole = "OWNER" | "ADMIN" | "MEMBER" | "VIEWER";

interface Membership {
  organizationId: string;
  role: OrganizationRole;
}

interface AuthState {
  user: User | null;
  loading: boolean;
  membership: Membership | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
  isOwner: () => boolean;
  isAdmin: () => boolean;
  isMember: () => boolean;
  isViewer: () => boolean;
}

const AuthContext = createContext<AuthState | null>(null);

const ROLE_PERMISSIONS: Record<OrganizationRole, string[]> = {
  OWNER: [
    "clients:read", "clients:write", "clients:delete",
    "projects:read", "projects:write", "projects:delete",
    "tasks:read", "tasks:write", "tasks:delete",
    "notes:read", "notes:write", "notes:delete",
    "requests:read", "requests:write", "requests:delete",
    "comments:read", "comments:write", "comments:delete",
    "automations:read", "automations:write", "automations:delete",
    "users:read", "users:write", "users:delete",
    "settings:read", "settings:write",
    "admin:access",
  ],
  ADMIN: [
    "clients:read", "clients:write", "clients:delete",
    "projects:read", "projects:write", "projects:delete",
    "tasks:read", "tasks:write", "tasks:delete",
    "notes:read", "notes:write", "notes:delete",
    "requests:read", "requests:write", "requests:delete",
    "comments:read", "comments:write", "comments:delete",
    "automations:read", "automations:write", "automations:delete",
    "users:read", "users:write",
    "settings:read", "settings:write",
  ],
  MEMBER: [
    "clients:read", "clients:write",
    "projects:read", "projects:write",
    "tasks:read", "tasks:write",
    "notes:read", "notes:write",
    "requests:read", "requests:write",
    "comments:read", "comments:write",
    "automations:read",
    "settings:read",
  ],
  VIEWER: [
    "clients:read",
    "projects:read",
    "tasks:read",
    "notes:read",
    "requests:read",
    "comments:read",
    "automations:read",
    "settings:read",
  ],
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [membership, setMembership] = useState<Membership | null>(null);

  const refresh = useCallback(async () => {
    try {
      const data = await api.get<{ user: User; membership?: { organizationId: string; role: OrganizationRole } }>("/api/auth/me");
      setUser(data.user);
      if (data.membership) {
        setMembership(data.membership);
      }
    } catch {
      setUser(null);
      setMembership(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const login = useCallback(async (email: string, password: string) => {
    const data = await api.post<{ user: User; membership?: { organizationId: string; role: OrganizationRole } }>("/api/auth/login", { email, password });
    setUser(data.user);
    if (data.membership) {
      setMembership(data.membership);
    }
  }, []);

  const register = useCallback(async (name: string, email: string, password: string) => {
    const data = await api.post<{ user: User; membership?: { organizationId: string; role: OrganizationRole } }>("/api/auth/register", { name, email, password });
    setUser(data.user);
    if (data.membership) {
      setMembership(data.membership);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post("/api/auth/logout");
    } finally {
      setUser(null);
      setMembership(null);
    }
  }, []);

  const hasPermission = useCallback((permission: string) => {
    if (!membership) return false;
    const permissions = ROLE_PERMISSIONS[membership.role] ?? [];
    return permissions.includes(permission);
  }, [membership]);

  const isOwner = useCallback(() => membership?.role === "OWNER", [membership]);
  const isAdmin = useCallback(() => membership?.role === "ADMIN" || membership?.role === "OWNER", [membership]);
  const isMember = useCallback(() => membership?.role === "MEMBER" || membership?.role === "ADMIN" || membership?.role === "OWNER", [membership]);
  const isViewer = useCallback(() => membership?.role === "VIEWER", [membership]);

  const value = useMemo(() => ({
    user,
    loading,
    membership,
    login,
    register,
    logout,
    refresh,
    hasPermission,
    isOwner,
    isAdmin,
    isMember,
    isViewer,
  }), [user, loading, membership, login, register, logout, refresh, hasPermission, isOwner, isAdmin, isMember, isViewer]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}