import { getCurrentUserId } from "@/app/actions/user";
import { getUserById } from "@/lib/users";
import { redirect } from "next/navigation";
import { PreferencesClient } from "@/components/settings/preferences-client";

export const metadata = {
  title: "Preferences - Weave",
};

export default async function PreferencesSettingsPage() {
  const userId = await getCurrentUserId();
  
  if (!userId) {
    redirect("/login");
  }

  const user = await getUserById(userId);

  if (!user) {
    return <div className="p-8 text-error">Failed to load account data.</div>;
  }

  return (
    <div className="p-8">
      <div className="border-b border-border pb-6 mb-8">
        <h2 className="text-2xl font-black text-heading mb-2">Preferences</h2>
        <p className="text-muted">Manage your workspace layout, appearance, and exchange preferences.</p>
      </div>

      <PreferencesClient user={user} />
    </div>
  );
}
