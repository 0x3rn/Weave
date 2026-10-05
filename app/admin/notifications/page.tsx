import { getNotificationAnnouncements } from "@/app/actions/admin/notification-announcements";
import AnnouncementClient from "@/components/notifications/announcement-client";
export default async function Page() {
  const rows = await getNotificationAnnouncements();
  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <header>
        <h1 className="text-3xl font-bold text-heading">
          Notification announcements
        </h1>
        <p className="mt-2 text-muted">
          Schedule community and platform updates for members.
        </p>
      </header>
      <AnnouncementClient
        initial={rows.map((row) => ({
          id: String(row.id),
          title: String(row.title),
          type: String(row.event_type),
          publishAt: new Date(row.publish_at).toISOString(),
          published: !!row.published_at,
        }))}
      />
    </div>
  );
}
