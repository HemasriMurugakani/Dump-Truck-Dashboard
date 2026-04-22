import { LoginView } from "@/components/auth/LoginView";
import { authOptions } from "@/lib/auth";
import { routeForRole } from "@/lib/routes";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

export default async function Home() {
  const session = await getServerSession(authOptions);

  if (session?.user) {
    redirect(routeForRole(session.user.role, session.user.assignedTruckId));
  }

  return <LoginView />;
}
