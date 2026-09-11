import { Metadata } from "next";
import AdminShell from "../../components/admin/admin-shell";

export const metadata: Metadata = {
  title: {
    default: "Admin Dashboard | Weave",
    template: "%s | Weave Admin"
  },
  robots: {
    index: false,
    follow: false,
  }
};

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyFirebaseSessionCookie } from "@/lib/firebase-auth-server";
import { getUserById } from "@/lib/users";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("session")?.value;

  if (!sessionCookie) {
    redirect("/api/auth/logout");
  }

  let targetRedirect = "";

  try {
    // 1. Verify the session cookie
    const decodedClaims = await verifyFirebaseSessionCookie(sessionCookie, true);
    
    // 2. Fetch the user's application profile
    const userData = await getUserById(decodedClaims.uid);
    if (!userData) {
      targetRedirect = "/api/auth/logout";
    } else {
      // 3. Check for admin privileges
      if (userData.isAdmin !== true) {
        targetRedirect = "/dashboard"; // Send non-admins back to their dashboard
      }
    }

  } catch (error) {
    // If the session cookie is invalid, expired, or tampered with
    console.error("Admin route protection error:", error);
    targetRedirect = "/api/auth/logout";
  }

  if (targetRedirect) {
    redirect(targetRedirect);
  }

  return <AdminShell>{children}</AdminShell>;
}
