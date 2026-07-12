import { getDashboardData } from "@/app/actions/dashboard";
import DashboardClient from "@/components/dashboard/dashboard-client";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Dashboard | Weave",
  description: "Your Weave professional workspace",
};

export default async function DashboardPage() {
  try {
    const data = await getDashboardData();
    return <DashboardClient initialData={data} />;
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      redirect("/api/auth/logout");
    }
    // For other errors, we might want to render a subtle error state or error boundary
    return (
      <div className="min-h-full bg-background flex flex-col items-center justify-center p-4 text-center">
        <h1 className="text-2xl font-bold text-heading mb-2">Failed to load dashboard</h1>
        <p className="text-body max-w-md">{error.message || "An unexpected error occurred."}</p>
      </div>
    );
  }
}
