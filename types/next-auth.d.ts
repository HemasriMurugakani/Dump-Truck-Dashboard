import type { UserRole } from "@/types/auth";
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: UserRole;
      siteId: string;
      assignedTruckId?: string;
    } & DefaultSession["user"];
  }

  interface User {
    role: UserRole;
    siteId: string;
    assignedTruckId?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: UserRole;
    siteId?: string;
    assignedTruckId?: string;
  }
}
