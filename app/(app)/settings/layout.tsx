import { SettingsSidebar } from "@/components/settings/sidebar";
import { getCurrentUserId } from "@/app/actions/user";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Settings - Weave",
  description: "Manage your account, security, preferences, privacy, and workspace settings.",
};

export default async function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const userId = await getCurrentUserId();
  
  if (!userId) {
    redirect("/login");
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-10">
        <h1 className="text-4xl font-black text-heading mb-2 tracking-tight">Settings</h1>
        <p className="text-muted text-lg">Manage your account, security, preferences, privacy, and workspace settings.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-10">
        {/* Left Sidebar */}
        <div className="w-full lg:w-64 shrink-0">
          <SettingsSidebar />
        </div>

        {/* Main Content Area */}
        <div className="flex-1 min-w-0">
          <div className="bg-surface border border-border rounded-[var(--radius-card)] shadow-subtle overflow-hidden min-h-[500px]">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
