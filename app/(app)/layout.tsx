import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/firebase-admin-auth";
import { getUserById } from "@/lib/users";
import { iso, sql } from "@/lib/neon";
import DashboardShell from "@/components/dashboard/dashboard-shell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("session")?.value;

  if (!sessionCookie || !auth) {
    redirect("/api/auth/logout");
  }

  let targetRedirect = "";
  let userData: any = null;

  try {
    // 1. Verify the session cookie cryptographically
    const decodedClaims = await auth.verifySessionCookie(sessionCookie, true);
    
    // 2. Fetch the user's application profile to ensure it still exists
    const user = await getUserById(decodedClaims.uid);
    if (!user) {
      targetRedirect = "/api/auth/logout";
    } else {
      // Unlike /admin, we don't require isAdmin === true here.
      // Any valid, authenticated user can access the dashboard.
      
      // 3. Ensure user has completed onboarding
      userData = user;
      if (userData.onboarded !== true) {
        targetRedirect = "/onboarding";
      } else {
        // 4. Verify the specific device session if deviceId is present
        const deviceId = cookieStore.get("deviceId")?.value;
        if (deviceId) {
          const [device] = await sql.query("select last_active_at from user_devices where id=$1 and user_id=$2", [deviceId, decodedClaims.uid]);
          if (!device) {
            // Device was revoked or deleted
            targetRedirect = "/api/auth/logout";
          } else {
            // Update lastActive if it's older than 24 hours (optimization to save writes)
            const lastActive = new Date(iso(device.last_active_at) || 0);
            const now = new Date();
            if (now.getTime() - lastActive.getTime() > 24 * 60 * 60 * 1000) {
              // Fire and forget
              await sql.query("update user_devices set last_active_at=$3,payload=payload || $4::jsonb where id=$1 and user_id=$2", [deviceId, decodedClaims.uid, now.toISOString(), JSON.stringify({ lastActive: now.toISOString() })]);
            }
          }
        }
      }
    }

  } catch (error) {
    // If the session cookie is invalid, expired, or tampered with
    console.error("Dashboard route protection error:", error);
    targetRedirect = "/api/auth/logout";
  }

  if (targetRedirect) {
    redirect(targetRedirect);
  }

  return <DashboardShell user={userData}>{children}</DashboardShell>;
}
