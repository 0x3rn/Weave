import { getNotifications } from "@/app/actions/notifications";
import { getCurrentUserId } from "@/app/actions/user";
import { redirect } from "next/navigation";
import NotificationsView from "@/components/notifications/notifications-view";

export const metadata = {
  title: "Notifications | Weave",
  description: "View your notifications and exchange requests.",
};

export default async function NotificationsPage() {
  const userId = await getCurrentUserId();

  if (!userId) {
    redirect("/api/auth/logout");
  }

  const notifResult = await getNotifications();

  return (
    <NotificationsView
      initialPage={notifResult}
      initialError={notifResult.success ? undefined : notifResult.error}
    />
  );
}
