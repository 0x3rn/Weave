"use server";
import { requireAdminUser } from "./auth";
import { sql } from "@/lib/neon";
import { safeNotificationLink } from "@/lib/notification-catalog";
import { revalidatePath } from "next/cache";
export async function getNotificationAnnouncements() {
  await requireAdminUser();
  return sql.query(
    "select id,event_type,title,message,link,publish_at,published_at from notification_announcements order by publish_at desc limit 100",
  );
}
export async function publishNotificationAnnouncement(data: {
  type: string;
  title: string;
  message: string;
  link?: string;
  publishAt?: string;
}) {
  try {
    const uid = await requireAdminUser();
    if (
      ![
        "community_update",
        "community_event",
        "newsletter",
        "platform_update",
        "maintenance",
        "feature_released",
        "bug_fix",
        "performance_update",
      ].includes(data.type) ||
      typeof data.title !== "string" ||
      !data.title.trim() ||
      data.title.length > 160 ||
      typeof data.message !== "string" ||
      !data.message.trim() ||
      data.message.length > 3000
    )
      throw new Error("Check the announcement type, title, and description");
    if (data.link && !safeNotificationLink(data.link))
      throw new Error("Use a link to a page within Weave");
    const date = data.publishAt ? new Date(data.publishAt) : new Date();
    if (!Number.isFinite(date.getTime()))
      throw new Error("Choose a valid publish date");
    await sql.query(
      "insert into notification_announcements(id,author_id,event_type,title,message,link,publish_at) values($1,$2,$3,$4,$5,$6,$7)",
      [
        crypto.randomUUID(),
        uid,
        data.type,
        data.title.trim(),
        data.message.trim(),
        data.link || null,
        date.toISOString(),
      ],
    );
    revalidatePath("/admin/notifications");
    return { success: true };
  } catch (cause) {
    return {
      success: false,
      error:
        cause instanceof Error
          ? cause.message
          : "Could not schedule announcement",
    };
  }
}
export async function cancelNotificationAnnouncement(id: string) {
  const uid = await requireAdminUser();
  const rows = await sql.query(
    "delete from notification_announcements where id=$1 and published_at is null and $2::text is not null returning id",
    [id, uid],
  );
  revalidatePath("/admin/notifications");
  return rows.length
    ? { success: true }
    : { success: false, error: "Published announcements cannot be cancelled" };
}
