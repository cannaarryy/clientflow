import { ReactNode } from "react";
import { useAuth } from "../hooks/AuthContext.js";

interface PermissionGateProps {
  permission: string;
  children: ReactNode;
  fallback?: ReactNode;
}

export function PermissionGate({ permission, children, fallback = null }: PermissionGateProps) {
  const { hasPermission, loading } = useAuth();

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#050505]">
        <div className="flex items-center gap-3 text-sm text-[#818181]">
          <span className="h-2 w-2 animate-pulse rounded-full bg-[#7C6CFF]" />
          Cargando permisos...
        </div>
      </div>
    );
  }

  if (!hasPermission(permission)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

interface RoleGateProps {
  roles: ("OWNER" | "ADMIN" | "MEMBER" | "VIEWER")[];
  children: ReactNode;
  fallback?: ReactNode;
}

export function RoleGate({ roles, children, fallback = null }: RoleGateProps) {
  const { membership, loading } = useAuth();

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#050505]">
        <div className="flex items-center gap-3 text-sm text-[#818181]">
          <span className="h-2 w-2 animate-pulse rounded-full bg-[#7C6CFF]" />
          Cargando rol...
        </div>
      </div>
    );
  }

  if (!membership || !roles.includes(membership.role)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

export function OwnerOnly({ children, fallback = null }: { children: ReactNode; fallback?: ReactNode }) {
  return <RoleGate roles={["OWNER"]} children={children} fallback={fallback} />;
}

export function AdminOnly({ children, fallback = null }: { children: ReactNode; fallback?: ReactNode }) {
  return <RoleGate roles={["OWNER", "ADMIN"]} children={children} fallback={fallback} />;
}

export function MemberOnly({ children, fallback = null }: { children: ReactNode; fallback?: ReactNode }) {
  return <RoleGate roles={["OWNER", "ADMIN", "MEMBER"]} children={children} fallback={fallback} />;
}

export function ViewerOnly({ children, fallback = null }: { children: ReactNode; fallback?: ReactNode }) {
  return <RoleGate roles={["OWNER", "ADMIN", "MEMBER", "VIEWER"]} children={children} fallback={fallback} />;
}