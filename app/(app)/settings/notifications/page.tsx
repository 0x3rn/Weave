import { getCurrentUserId } from "@/app/actions/user";
import { db } from "@/lib/firebase-admin";
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

  let preferences = null;
  if (db) {
    const userDoc = await db.collection("users").doc(userId).get();
    if (userDoc.exists) {
      preferences = userDoc.data()?.notificationPreferences || null;
    }
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="mb-8 border-b border-border pb-6">
        <h1 className="text-3xl font-black text-heading mb-2">Notification Preferences</h1>
        <p className="text-muted">Control how and when you want to be notified about activity on Weave.</p>
      </div>

      <NotificationPreferencesClient initialPreferences={preferences} />
    </div>
  );
}
