import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/firebase-admin-auth";
import { getUserById } from "@/lib/users";

export default async function OnboardingLayout({
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

  try {
    // 1. Verify the session cookie cryptographically
    const decodedClaims = await auth.verifySessionCookie(sessionCookie, true);
    
    // 2. Fetch the user's application profile
    const userData = await getUserById(decodedClaims.uid);
    if (!userData) {
      targetRedirect = "/api/auth/logout";
    } else {
      // 3. If they are already onboarded, send them to the dashboard
      if (userData.onboarded === true) {
        targetRedirect = "/dashboard";
      }
    }

  } catch (error) {
    // If the session cookie is invalid, expired, or tampered with
    console.error("Onboarding route protection error:", error);
    targetRedirect = "/api/auth/logout";
  }

  if (targetRedirect) {
    redirect(targetRedirect);
  }

  return <div className="min-h-screen bg-background">{children}</div>;
}
