"use client";

import { authContextFromSession } from "@/lib/auth";
import { permissionsForRole } from "@/lib/permissions";
import type { AuthContextShape } from "@/types/auth";
import { SessionProvider, useSession } from "next-auth/react";
import { createContext, useContext, useMemo } from "react";

const emptyContext: AuthContextShape = {
  user: null,
  site: null,
  permissions: {
    canControlActuators: false,
    canViewAllTrucks: false,
    canEditConfig: false,
    canExportData: false,
    canManageUsers: false,
    canViewGlobalAnalytics: false,
  },
};

const AuthContext = createContext<AuthContextShape>(emptyContext);

export function AppSessionProvider({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();

  const value = useMemo(() => {
    if (!session?.user) {
      return emptyContext;
    }
    const base = authContextFromSession(session);
    return {
      ...base,
      permissions: permissionsForRole(session.user.role),
    };
  }, [session]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
