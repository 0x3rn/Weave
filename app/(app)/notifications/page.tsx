import { getNotifications } from "@/app/actions/notifications";
import { getExchangeRequests } from "@/app/actions/exchanges";
import { getCurrentUserId } from "@/app/actions/user";
import { redirect } from "next/navigation";
import NotificationsView from "@/components/notifications/notifications-view";

export const metadata = {
  title: "Notifications | Weave",
  description: "View your notifications and exchange requests."
};

export default async function NotificationsPage() {
  const userId = await getCurrentUserId();
  
  if (!userId) {
    redirect("/api/auth/logout");
  }
  
  const [notifResult, sentReqs, receivedReqs] = await Promise.all([
    getNotifications(userId),
    getExchangeRequests(userId, "sender"),
    getExchangeRequests(userId, "receiver")
  ]);
  
  const notifications = notifResult.success ? notifResult.notifications : [];
  const requests = [...(sentReqs.requests || []), ...(receivedReqs.requests || [])];

  return <NotificationsView initialNotifications={notifications} initialRequests={requests} currentUserId={userId} />;
}
