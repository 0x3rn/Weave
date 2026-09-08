import { getCurrentUserId } from "@/app/actions/user";
import { getUserById } from "@/lib/users";
import { redirect } from "next/navigation";
import NotificationPreferencesClient from "@/components/settings/notification-preferences-client";

export const metadata = {
  title: "Notification Settings | Weave"
};

export default async function NotificationSettingsPage() {
  const userId = await getCurrentUserId();
  
  if (!userId) {
    redirect("/api/auth/logout");
  }

  const user = await getUserById(userId);
  const preferences = user?.notificationPreferences || null;

  return (
    <div className="p-8">
      <div className="border-b border-border pb-6 mb-8">
        <h2 className="text-2xl font-black text-heading mb-2">Notifications</h2>
        <p className="text-muted">Control how and when you want to be notified about activity on Weave.</p>
      </div>

      <NotificationPreferencesClient initialPreferences={preferences} />
    </div>
  );
}
