import { AUTH_USERS, MINE_SITES } from "@/lib/mockData";
import type { AuthContextShape } from "@/types/auth";
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET ?? "smartbed-local-dev-secret-2026-04-22",
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        siteId: { label: "Site", type: "text" },
        rememberDevice: { label: "Remember", type: "text" },
      },
      async authorize(credentials) {
        const email = credentials?.email?.toLowerCase().trim();
        const password = credentials?.password ?? "";
        const siteId = credentials?.siteId ?? "alpha";

        const user = AUTH_USERS.find(
          (entry) => entry.email.toLowerCase() === email && entry.password === password && entry.siteId === siteId,
        );

        if (!user) {
          return null;
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          siteId: user.siteId,
          assignedTruckId: user.assignedTruckId,
        } as any;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
        token.siteId = (user as any).siteId;
        token.assignedTruckId = (user as any).assignedTruckId;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? "";
        session.user.role = token.role as any;
        session.user.siteId = token.siteId as string;
        session.user.assignedTruckId = token.assignedTruckId as string | undefined;
      }
      return session;
    },
  },
};

export function authContextFromSession(session: any): AuthContextShape {
  const site = MINE_SITES.find((entry) => entry.id === session?.user?.siteId) ?? MINE_SITES[0];
  const role = session?.user?.role;

  const permissions = {
    canControlActuators: ["SUPER_ADMIN", "SITE_MANAGER", "FLEET_OPERATOR", "TRUCK_OPERATOR"].includes(role),
    canViewAllTrucks: role !== "TRUCK_OPERATOR",
    canEditConfig: ["SUPER_ADMIN", "SITE_MANAGER", "MAINTENANCE_TECH"].includes(role),
    canExportData: role !== "TRUCK_OPERATOR",
    canManageUsers: role === "SUPER_ADMIN",
    canViewGlobalAnalytics: ["SUPER_ADMIN", "ANALYST"].includes(role),
  };

  return {
    user: session?.user
      ? {
          id: session.user.id,
          name: session.user.name ?? "",
          email: session.user.email ?? "",
          role: session.user.role,
          siteId: session.user.siteId,
          assignedTruckId: session.user.assignedTruckId,
        }
      : null,
    site,
    permissions,
  };
}
