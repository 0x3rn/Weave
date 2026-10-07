import { type Metadata } from "next";
import { redirect } from "next/navigation";
import AdminShell from "@/components/admin/admin-shell";
import { adminSession } from "@/lib/admin-ops-access";
export const metadata: Metadata = {
  title: { default: "Admin Dashboard | Weave", template: "%s | Weave Admin" },
  robots: { index: false, follow: false },
};
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let session: Awaited<ReturnType<typeof adminSession>>;
  try {
    session = await adminSession();
  } catch (error) {
    if (error instanceof Error && error.message === "Forbidden")
      redirect("/dashboard");
    redirect("/api/auth/logout");
  }
  return <AdminShell session={session}>{children}</AdminShell>;
}
