import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/firebase-admin-auth";
import { db } from "@/lib/firebase-admin";

export default async function OnboardingLayout({
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
    
    // 2. Fetch the user's document from Firestore
    const userDoc = await db.collection("users").doc(decodedClaims.uid).get();
    
    if (!userDoc.exists) {
      targetRedirect = "/login";
    } else {
      const userData = userDoc.data()!;
      
      // 3. If they are already onboarded, send them to the dashboard
      if (userData.onboarded === true) {
        targetRedirect = "/dashboard";
      }
    }

  } catch (error) {
    console.error("Onboarding route protection error:", error);
    targetRedirect = "/login";
  }

  if (targetRedirect) {
    redirect(targetRedirect);
  }

  return <div className="min-h-screen bg-background">{children}</div>;
}
