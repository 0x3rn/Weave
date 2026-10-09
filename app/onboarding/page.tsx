import { cookies } from "next/headers";
import { requireAuth } from "@/app/actions/user";
import { getUserById } from "@/lib/users";
import OnboardingWizard from "@/components/onboarding/onboarding-wizard";
import Link from "next/link";
import WeaveLogo from "@/components/brand/weave-logo";

export const metadata = {
  title: "Complete Your Profile | Weave",
};

export default async function OnboardingPage() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("session")?.value;

  if (!sessionCookie) return null;

  let userId = "";
  let userData: Awaited<ReturnType<typeof getUserById>> = null;
  try {
    const decodedClaims = await requireAuth();
    userId = decodedClaims.uid;
    userData = await getUserById(userId);
  } catch (error) {
    console.error("Onboarding data fetch error:", error);
    return null;
  }

  if (!userData) return null;
  return (
    <main className="min-h-screen py-4 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
      <div className="flex justify-center">
        <Link href="/" aria-label="Weave home">
          <WeaveLogo />
        </Link>
      </div>
      <OnboardingWizard initialData={userData} userId={userId} />
    </main>
  );
}
