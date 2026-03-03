import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME, verifySession } from "@/lib/auth-session";
import DashboardTabs from "@/components/account/DashboardTabs";

export default async function AccountPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const session = token ? await verifySession(token) : null;

  return (
    <DashboardTabs
      session={session ? { userId: session.userId, email: session.email, name: session.name } : null}
    />
  );
}
