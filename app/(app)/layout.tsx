import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/firebase-admin-auth";
import { db } from "@/lib/firebase-admin";
import DashboardShell from "@/components/dashboard/dashboard-shell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("session")?.value;

  if (!sessionCookie || !auth || !db) {
    redirect("/api/auth/logout");
  }

  let targetRedirect = "";
  let userData: any = null;

  try {
    // 1. Verify the session cookie cryptographically
    const decodedClaims = await auth.verifySessionCookie(sessionCookie, true);
    
    // 2. Fetch the user's document from Firestore to ensure they haven't been deleted
    const userDoc = await db.collection("users").doc(decodedClaims.uid).get();
    
    if (!userDoc.exists) {
      targetRedirect = "/api/auth/logout";
    } else {
      // Unlike /admin, we don't require isAdmin === true here.
      // Any valid, authenticated user can access the dashboard.
      
      // 3. Ensure user has completed onboarding
      userData = userDoc.data()!;
      if (userData.onboarded !== true) {
        targetRedirect = "/onboarding";
      } else {
        // 4. Verify the specific device session if deviceId is present
        const deviceId = cookieStore.get("deviceId")?.value;
        if (deviceId) {
          const deviceDoc = await db.collection("users").doc(decodedClaims.uid).collection("devices").doc(deviceId).get();
          if (!deviceDoc.exists) {
            // Device was revoked or deleted
            targetRedirect = "/api/auth/logout";
          } else {
            // Update lastActive if it's older than 24 hours (optimization to save writes)
            const deviceData = deviceDoc.data()!;
            const lastActive = new Date(deviceData.lastActive || 0);
            const now = new Date();
            if (now.getTime() - lastActive.getTime() > 24 * 60 * 60 * 1000) {
              // Fire and forget
              deviceDoc.ref.update({ lastActive: now.toISOString() }).catch(() => {});
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
