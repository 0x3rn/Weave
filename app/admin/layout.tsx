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
import { auth } from "@/lib/firebase-admin-auth";
import { db } from "@/lib/firebase-admin";

export default async function AdminLayout({
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

  try {
    // 1. Verify the session cookie
    const decodedClaims = await auth.verifySessionCookie(sessionCookie, true);
    
    // 2. Fetch the user's document from Firestore
    const userDoc = await db.collection("users").doc(decodedClaims.uid).get();
    
    if (!userDoc.exists) {
      targetRedirect = "/api/auth/logout";
    } else {
      const userData = userDoc.data()!;

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
