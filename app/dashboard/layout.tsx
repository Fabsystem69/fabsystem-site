import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE_NAME, verifySession } from "@/lib/session";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const secret = process.env.AUTH_SESSION_SECRET;

  if (!token || !secret || !verifySession(token, secret)) {
    redirect("/login?next=/dashboard");
  }

  return <>{children}</>;
}
