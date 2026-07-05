import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/firebase-admin-auth";
import { db } from "@/lib/firebase-admin";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("session")?.value;

  if (!sessionCookie || !auth || !db) {
    redirect("/login");
  }

  let targetRedirect = "";

  try {
    // 1. Verify the session cookie cryptographically
    const decodedClaims = await auth.verifySessionCookie(sessionCookie, true);
    
    // 2. Fetch the user's document from Firestore to ensure they haven't been deleted
    const userDoc = await db.collection("users").doc(decodedClaims.uid).get();
    
    if (!userDoc.exists) {
      targetRedirect = "/login";
    } else {
      // Unlike /admin, we don't require isAdmin === true here.
      // Any valid, authenticated user can access the dashboard.
      
      // 3. Ensure user has completed onboarding
      const userData = userDoc.data()!;
      if (userData.onboarded !== true) {
        targetRedirect = "/onboarding";
      }
    }

  } catch (error) {
    // If the session cookie is invalid, expired, or tampered with
    console.error("Dashboard route protection error:", error);
    targetRedirect = "/login";
  }

  if (targetRedirect) {
    redirect(targetRedirect);
  }

  return <div className="min-h-screen bg-background">{children}</div>;
}
