"use server";

import { iso, payload, sql } from "@/lib/neon";
import { Notification, NotificationPreferences } from "@/types";
import { getCurrentUserId } from "./user";

function notificationFromRow(row: Record<string, unknown>): Notification {
  return {
    ...payload<Record<string, unknown>>(row.payload),
    id: String(row.id),
    userId: String(row.user_id ?? ""),
    type: String(row.notification_type ?? "system") as Notification["type"],
    category: row.category ? String(row.category) as Notification["category"] : undefined,
    priority: row.priority ? String(row.priority) as Notification["priority"] : undefined,
    title: String(row.title ?? ""),
    message: String(row.message ?? ""),
    isRead: row.is_read === true,
    isArchived: row.is_archived === true,
    link: row.link ? String(row.link) : undefined,
    actionLabel: row.action_label ? String(row.action_label) : undefined,
    relatedId: row.related_id ? String(row.related_id) : undefined,
    createdAt: iso(row.created_at),
  };
}

export async function getNotifications() {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return { success: false, error: "Unauthorized", notifications: [] };
    const rows = await sql.query("select * from notifications where user_id=$1 and in_app_enabled=true order by created_at desc limit 500", [userId]);
    return { success: true, notifications: rows.map(row => notificationFromRow(row)) };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Unable to load notifications", notifications: [] };
  }
}

export async function markNotificationAsRead(notificationId: string) {
  const userId = await getCurrentUserId();
  if (!userId) return { success: false, error: "Unauthorized" };
  const rows = await sql.query("update notifications set is_read=true,payload=payload || '{\"isRead\":true}'::jsonb where id=$1 and user_id=$2 returning id", [notificationId, userId]);
  return rows.length ? { success: true } : { success: false, error: "Notification not found or unauthorized" };
}

export async function getUnreadNotificationsCount() {
  const userId = await getCurrentUserId();
  if (!userId) return { success: false, error: "Unauthorized", count: 0 };
  const [row] = await sql.query("select count(*)::int as count from notifications where user_id=$1 and is_read=false and is_archived=false and in_app_enabled=true", [userId]);
  return { success: true, count: Number(row?.count ?? 0) };
}

export async function markAllNotificationsAsRead() {
  const userId = await getCurrentUserId();
  if (!userId) return { success: false, error: "Unauthorized" };
  const rows = await sql.query("update notifications set is_read=true,payload=payload || '{\"isRead\":true}'::jsonb where user_id=$1 and is_read=false and is_archived=false and in_app_enabled=true returning id", [userId]);
  return { success: true, count: rows.length };
}

export async function bulkUpdateNotifications(notificationIds: string[], updates: { isRead?: boolean; isArchived?: boolean }) {
  const userId = await getCurrentUserId();
  if (!userId) return { success: false, error: "Unauthorized" };
  if (!Array.isArray(notificationIds) || notificationIds.length === 0 || notificationIds.length > 100 || notificationIds.some(id => typeof id !== "string")) return { success: false, error: "Invalid notification selection" };
  const patch: Record<string, boolean> = {};
  if (typeof updates.isRead === "boolean") patch.isRead = updates.isRead;
  if (typeof updates.isArchived === "boolean") patch.isArchived = updates.isArchived;
  if (!Object.keys(patch).length) return { success: false, error: "Invalid notification update" };
  const rows = await sql.query(
    "update notifications set is_read=coalesce($3,is_read),is_archived=coalesce($4,is_archived),payload=payload || $5::jsonb where user_id=$1 and id=any($2::text[]) returning id",
    [userId, notificationIds, updates.isRead ?? null, updates.isArchived ?? null, JSON.stringify(patch)],
  );
  return rows.length === new Set(notificationIds).size ? { success: true } : { success: false, error: "One or more notifications were not found" };
}

export async function bulkDeleteNotifications(notificationIds: string[]) {
  const userId = await getCurrentUserId();
  if (!userId) return { success: false, error: "Unauthorized" };
  if (!Array.isArray(notificationIds) || notificationIds.length === 0 || notificationIds.length > 100 || notificationIds.some(id => typeof id !== "string")) return { success: false, error: "Invalid notification selection" };
  const rows = await sql.query("delete from notifications where user_id=$1 and id=any($2::text[]) returning id", [userId, notificationIds]);
  return rows.length === new Set(notificationIds).size ? { success: true } : { success: false, error: "One or more notifications were not found" };
}

export async function updateNotificationPreferences(preferences: NotificationPreferences) {
  const userId = await getCurrentUserId();
  if (!userId) return { success: false, error: "Unauthorized" };
  if (!preferences || typeof preferences !== "object" || JSON.stringify(preferences).length > 20_000) return { success: false, error: "Invalid notification preferences" };
  const booleanKeys = ["exchangeActivity", "marketplace", "messages", "reviews", "community"] as const;
  if (booleanKeys.some(key => typeof preferences[key] !== "boolean") ||
      !preferences.deliveryMethod ||
      typeof preferences.deliveryMethod.inApp !== "boolean" ||
      typeof preferences.deliveryMethod.email !== "boolean") {
    return { success: false, error: "Invalid notification preferences" };
  }
  const safePreferences: NotificationPreferences = {
    exchangeActivity: preferences.exchangeActivity,
    marketplace: preferences.marketplace,
    messages: preferences.messages,
    reviews: preferences.reviews,
    community: preferences.community,
    security: true,
    deliveryMethod: {
      inApp: preferences.deliveryMethod.inApp,
      email: preferences.deliveryMethod.email,
    },
  };
  const rows = await sql.query("update users set payload=payload || $2::jsonb,updated_at=now() where id=$1 returning id", [userId, JSON.stringify({ notificationPreferences: safePreferences })]);
  return rows.length ? { success: true } : { success: false, error: "User not found" };
}
