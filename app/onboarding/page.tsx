import { cookies } from "next/headers";
import { auth } from "@/lib/firebase-admin-auth";
import { getUserById } from "@/lib/users";
import OnboardingWizard from "@/components/onboarding/onboarding-wizard";

export const metadata = {
  title: "Complete Your Profile | Weave",
};

export default async function OnboardingPage() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("session")?.value;

  if (!sessionCookie || !auth) return null;

  try {
    const decodedClaims = await auth.verifySessionCookie(sessionCookie, true);
    const userData = await getUserById(decodedClaims.uid);
    if (!userData) return null;

    return (
      <main className="min-h-screen py-4 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        <OnboardingWizard initialData={userData} userId={decodedClaims.uid} />
      </main>
    );
  } catch (error) {
    console.error("Onboarding data fetch error:", error);
    return null;
  }
}
