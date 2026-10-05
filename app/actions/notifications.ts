"use server";

import { iso, sql } from "@/lib/neon";
import { Notification, NotificationPreferences } from "@/types";
import { getCurrentUserId, requireAuth } from "./user";
import { publicMember } from "@/lib/public-member";
import {
  NOTIFICATION_EVENTS,
  notificationEvent,
  normalizeNotificationQuery,
  type NotificationQuery,
  type NotificationPage,
  safeNotificationLink,
} from "@/lib/notification-catalog";
import {
  NOTIFICATION_CATEGORIES,
  object,
  notificationSettings,
  type NotificationSettings,
} from "@/lib/settings";

function notificationFromRow(row: Record<string, unknown>): Notification {
  return {
    id: String(row.id),
    userId: String(row.user_id ?? ""),
    type: String(row.notification_type ?? "system") as Notification["type"],
    category: row.category
      ? (String(row.category) as Notification["category"])
      : undefined,
    priority: row.priority
      ? (String(row.priority) as Notification["priority"])
      : undefined,
    title: String(row.title ?? ""),
    message: String(row.message ?? ""),
    isRead: row.is_read === true,
    isArchived: row.is_archived === true,
    link: row.link ? String(row.link) : undefined,
    actionLabel: row.action_label ? String(row.action_label) : undefined,
    relatedId: row.related_id ? String(row.related_id) : undefined,
    createdAt: iso(row.created_at) || new Date(0).toISOString(),
    requiresAction: row.needs_action === true,
    actionResolvedAt: iso(row.action_resolved_at) || undefined,
    canAcknowledge:
      notificationEvent(String(row.notification_type)).acknowledge === true,
    why: String(
      row.why || notificationEvent(String(row.notification_type)).why,
    ),
    groupKey: row.group_key ? String(row.group_key) : undefined,
    relatedUserId: row.related_user_id
      ? String(row.related_user_id)
      : undefined,
  };
}

const enrichedSelect = `select n.*,notification_needs_action(n) as needs_action,
 actor.id as actor_id,actor.full_name as actor_name,actor.username as actor_username,actor.photo_url as actor_photo,actor.payload as actor_payload,
 e.id as exchange_id,e.title as exchange_title,r.id as request_id,r.title as request_title
 from notifications n left join users actor on actor.id=n.related_user_id
 left join exchanges e on e.id=n.related_id and n.user_id in(e.requester_id,e.provider_id)
 left join marketplace_requests r on r.id=n.related_id and (r.requester_id=n.user_id or exists(select 1 from marketplace_applications a where a.request_id=r.id and a.applicant_id=n.user_id))`;
function enrichedNotification(row: Record<string, unknown>): Notification {
  const result = notificationFromRow(row);
  result.link = safeNotificationLink(result.link);
  if (row.actor_id) {
    const actor = publicMember({
      id: String(row.actor_id),
      full_name: row.actor_name,
      username: row.actor_username,
      photo_url: row.actor_photo,
      payload: row.actor_payload,
    });
    result.relatedUser = {
      id: actor.uid,
      name: actor.fullName || "Member",
      username: actor.username,
      avatar: actor.photoURL,
      link:
        actor.publicPrivacy?.profileVisibility !== "hidden" && actor.username
          ? `/u/${actor.username}`
          : undefined,
    };
  }
  if (row.exchange_id)
    result.relatedProject = {
      id: String(row.exchange_id),
      title: String(row.exchange_title),
      link: `/exchanges/${row.exchange_id}`,
    };
  else if (row.request_id)
    result.relatedProject = {
      id: String(row.request_id),
      title: String(row.request_title),
      link: `/marketplace/${row.request_id}`,
    };
  return result;
}

export async function getNotifications(
  input: NotificationQuery = {},
): Promise<
  | ({ success: true } & NotificationPage)
  | ({ success: false; error: string } & NotificationPage)
> {
  const empty: NotificationPage = {
    notifications: [],
    total: 0,
    page: 0,
    hasMore: false,
    summary: { unread: 0, today: 0, week: 0, actionable: 0 },
    timeZone: "UTC",
  };
  try {
    const { uid } = await requireAuth();
    const query = normalizeNotificationQuery(input);
    const [member] = await sql.query(
      "select time_zone,payload from users where id=$1",
      [uid],
    );
    let timeZone = String(member?.time_zone || "UTC");
    try {
      new Intl.DateTimeFormat("en", { timeZone }).format();
    } catch {
      timeZone = "UTC";
    }
    const sunday =
      object(object(member?.payload).preferences).weekStartsOn === "sunday";
    const clock = `(now() at time zone $2)`;
    const week = sunday
      ? `date_trunc('week',${clock}+interval '1 day')-interval '1 day'`
      : `date_trunc('week',${clock})`;
    const args: unknown[] = [uid, timeZone];
    const add = (value: unknown) => {
      args.push(value);
      return "$" + args.length;
    };
    const conditions = [
      "n.user_id=$1",
      "n.in_app_enabled=true",
      "$2::text is not null",
      query.tab === "archive" ? "n.is_archived=true" : "n.is_archived=false",
    ];
    if (query.tab === "actionable")
      conditions.push("notification_needs_action(n)");
    if (query.status !== "All")
      conditions.push(
        `n.is_read=${query.status === "Read" ? "true" : "false"}`,
      );
    if (query.search) {
      const term = add(query.search.replace(/[\\%_]/g, "\\$&"));
      conditions.push(
        `(n.title ilike '%'||${term}||'%' or n.message ilike '%'||${term}||'%' or n.why ilike '%'||${term}||'%')`,
      );
    }
    if (query.category !== "All")
      conditions.push(`n.category=${add(query.category)}`);
    if (query.priority !== "All")
      conditions.push(`n.priority=${add(query.priority)}`);
    if (query.date === "Today")
      conditions.push(
        `n.created_at >= (date_trunc('day',${clock}) at time zone $2)`,
      );
    if (query.date === "This Week")
      conditions.push(`n.created_at >= (${week} at time zone $2)`);
    if (query.date === "This Month")
      conditions.push(
        `n.created_at >= (date_trunc('month',${clock}) at time zone $2)`,
      );
    if (query.date === "Custom") {
      if (query.from)
        conditions.push(
          `n.created_at>=(${add(query.from)}::date::timestamp at time zone $2)`,
        );
      if (query.to)
        conditions.push(
          `n.created_at<((${add(query.to)}::date+1)::timestamp at time zone $2)`,
        );
    }
    const where = conditions.join(" and ");
    const order =
      query.sort === "Oldest"
        ? "n.created_at asc,n.id asc"
        : query.sort === "Unread First"
          ? "n.is_read asc,n.created_at desc,n.id desc"
          : query.sort === "Priority"
            ? "case n.priority when 'Critical' then 4 when 'High' then 3 when 'Normal' then 2 else 1 end desc,n.created_at desc,n.id desc"
            : "n.created_at desc,n.id desc";
    const [rows, countRows, summaryRows] = await Promise.all([
      sql.query(
        `${enrichedSelect} where ${where} order by ${order} limit ${query.limit} offset ${query.page * query.limit}`,
        args,
      ),
      sql.query(
        `select count(*) as total from notifications n where ${where}`,
        args,
      ),
      sql.query(
        `select count(*) filter(where not n.is_read and not n.is_archived) as unread,count(*) filter(where not n.is_archived and n.created_at>=(date_trunc('day',${clock}) at time zone $2)) as today,count(*) filter(where not n.is_archived and n.created_at>=(${week} at time zone $2)) as week,count(*) filter(where not n.is_archived and notification_needs_action(n)) as actionable from notifications n where n.user_id=$1 and n.in_app_enabled=true`,
        [uid, timeZone],
      ),
    ]);
    const total = Number(countRows[0]?.total || 0),
      counts = summaryRows[0] || {};
    return {
      success: true,
      notifications: rows.map(enrichedNotification),
      total,
      page: query.page,
      hasMore: (query.page + 1) * query.limit < total,
      timeZone,
      summary: {
        unread: Number(counts.unread || 0),
        today: Number(counts.today || 0),
        week: Number(counts.week || 0),
        actionable: Number(counts.actionable || 0),
      },
    };
  } catch (error) {
    return {
      ...empty,
      success: false,
      error:
        error instanceof Error ? error.message : "Unable to load notifications",
    };
  }
}

export async function getNotificationDetails(id: string) {
  try {
    const { uid } = await requireAuth();
    const [row] = await sql.query(
      `${enrichedSelect} where n.id=$1 and n.user_id=$2 and n.in_app_enabled=true`,
      [id, uid],
    );
    return row
      ? { success: true, notification: enrichedNotification(row) }
      : { success: false, error: "Notification not found" };
  } catch {
    return { success: false, error: "Could not load notification details" };
  }
}
export async function acknowledgeNotification(id: string) {
  try {
    const { uid } = await requireAuth();
    const rows = await sql.query(
      "update notifications n set action_resolved_at=now() where n.id=$1 and n.user_id=$2 and exists(select 1 from notification_event_catalog c where c.event_type=n.notification_type and c.acknowledge) returning id",
      [id, uid],
    );
    return rows.length
      ? { success: true }
      : {
          success: false,
          error: "Complete the related task to resolve this notification",
        };
  } catch {
    return { success: false, error: "Could not acknowledge notification" };
  }
}

export async function markNotificationAsRead(notificationId: string) {
  const userId = await getCurrentUserId();
  if (!userId) return { success: false, error: "Unauthorized" };
  const rows = await sql.query(
    "update notifications set is_read=true,payload=payload || '{\"isRead\":true}'::jsonb where id=$1 and user_id=$2 returning id",
    [notificationId, userId],
  );
  return rows.length
    ? { success: true }
    : { success: false, error: "Notification not found or unauthorized" };
}

export async function getUnreadNotificationsCount() {
  const userId = await getCurrentUserId();
  if (!userId) return { success: false, error: "Unauthorized", count: 0 };
  const [row] = await sql.query(
    "select count(*)::int as count from notifications where user_id=$1 and is_read=false and is_archived=false and in_app_enabled=true",
    [userId],
  );
  return { success: true, count: Number(row?.count ?? 0) };
}

export async function markAllNotificationsAsRead() {
  const userId = await getCurrentUserId();
  if (!userId) return { success: false, error: "Unauthorized" };
  const rows = await sql.query(
    "update notifications set is_read=true,payload=payload || '{\"isRead\":true}'::jsonb where user_id=$1 and is_read=false and is_archived=false and in_app_enabled=true returning id",
    [userId],
  );
  return { success: true, count: rows.length };
}

export async function bulkUpdateNotifications(
  notificationIds: string[],
  updates: { isRead?: boolean; isArchived?: boolean },
) {
  const userId = await getCurrentUserId();
  if (!userId) return { success: false, error: "Unauthorized" };
  if (
    !Array.isArray(notificationIds) ||
    notificationIds.length === 0 ||
    notificationIds.length > 5000 ||
    notificationIds.some(
      (id) => typeof id !== "string" || !id || id.length > 128,
    )
  )
    return { success: false, error: "Invalid notification selection" };
  const patch: Record<string, boolean> = {};
  if (typeof updates.isRead === "boolean") patch.isRead = updates.isRead;
  if (typeof updates.isArchived === "boolean")
    patch.isArchived = updates.isArchived;
  if (!Object.keys(patch).length)
    return { success: false, error: "Invalid notification update" };
  const rows = await sql.query(
    "with selected as(select id from notifications where user_id=$1 and id=any($2::text[]) for update) update notifications set is_read=coalesce($3,is_read),is_archived=coalesce($4,is_archived),payload=payload || $5::jsonb where id in(select id from selected) and (select count(*) from selected)=cardinality($2::text[]) returning id",
    [
      userId,
      [...new Set(notificationIds)],
      updates.isRead ?? null,
      updates.isArchived ?? null,
      JSON.stringify(patch),
    ],
  );
  return rows.length === new Set(notificationIds).size
    ? { success: true }
    : { success: false, error: "One or more notifications were not found" };
}

export async function bulkDeleteNotifications(notificationIds: string[]) {
  const userId = await getCurrentUserId();
  if (!userId) return { success: false, error: "Unauthorized" };
  if (
    !Array.isArray(notificationIds) ||
    notificationIds.length === 0 ||
    notificationIds.length > 100 ||
    notificationIds.some((id) => typeof id !== "string")
  )
    return { success: false, error: "Invalid notification selection" };
  const rows = await sql.query(
    "with selected as(select id from notifications where user_id=$1 and id=any($2::text[]) for update) delete from notifications where id in(select id from selected) and (select count(*) from selected)=cardinality($2::text[]) returning id",
    [userId, [...new Set(notificationIds)]],
  );
  return rows.length === new Set(notificationIds).size
    ? { success: true }
    : { success: false, error: "One or more notifications were not found" };
}

export async function updateNotificationPreferences(
  preferences: NotificationPreferences | NotificationSettings,
) {
  const userId = await getCurrentUserId();
  if (!userId) return { success: false, error: "Unauthorized" };
  if (
    !preferences ||
    typeof preferences !== "object" ||
    JSON.stringify(preferences).length > 20_000
  )
    return { success: false, error: "Invalid notification preferences" };
  if (
    "channels" in preferences &&
    "quietHours" in preferences &&
    "digest" in preferences
  ) {
    const data = preferences as NotificationSettings;
    if (
      !["instant", "daily", "weekly", "never"].includes(data.digest) ||
      ["inApp", "email"].some((channel) =>
        NOTIFICATION_CATEGORIES.some(
          (key) =>
            typeof object(object(data.channels)[channel])[key] !== "boolean",
        ),
      ) ||
      typeof data.quietHours?.enabled !== "boolean" ||
      !/^([01]\d|2[0-3]):[0-5]\d$/.test(data.quietHours.start) ||
      !/^([01]\d|2[0-3]):[0-5]\d$/.test(data.quietHours.end) ||
      data.quietHours.start === data.quietHours.end
    )
      return {
        success: false,
        error:
          "Check notification categories and quiet-hour times. Start and end must be different.",
      };
    try {
      new Intl.DateTimeFormat("en", { timeZone: data.quietHours.timeZone });
    } catch {
      return { success: false, error: "Choose a valid time zone" };
    }
    if (
      data.messageFrequency !== undefined &&
      !["default", "instant", "daily", "weekly", "never"].includes(
        data.messageFrequency,
      )
    )
      return {
        success: false,
        error: "Choose a valid message delivery frequency",
      };
    if (
      data.dailySummary !== undefined &&
      (typeof data.dailySummary.enabled !== "boolean" ||
        !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(data.dailySummary.time))
    )
      return { success: false, error: "Choose a valid digest time" };
    if (
      data.events !== undefined &&
      ["inApp", "email"].some((channel) =>
        Object.entries(object(object(data.events)[channel])).some(
          ([key, value]) =>
            !(key in NOTIFICATION_EVENTS) || typeof value !== "boolean",
        ),
      )
    )
      return { success: false, error: "Check notification event preferences" };
    const normalized = notificationSettings(data);
    const safe = {
      events: normalized.events,
      messageFrequency: normalized.messageFrequency,
      dailySummary: normalized.dailySummary,
      channels: {
        inApp: Object.fromEntries(
          NOTIFICATION_CATEGORIES.map((key) => [key, data.channels.inApp[key]]),
        ),
        email: Object.fromEntries(
          NOTIFICATION_CATEGORIES.map((key) => [key, data.channels.email[key]]),
        ),
      },
      digest: data.digest,
      quietHours: {
        enabled: data.quietHours.enabled,
        start: data.quietHours.start,
        end: data.quietHours.end,
        timeZone: data.quietHours.timeZone,
      },
    };
    try {
      const rows = await sql.query(
        "update users set payload=payload || $2::jsonb,updated_at=now() where id=$1 returning id",
        [userId, JSON.stringify({ notificationPreferences: safe })],
      );
      return rows.length
        ? { success: true }
        : { success: false, error: "Account not found" };
    } catch {
      return {
        success: false,
        error: "Could not save notification preferences",
      };
    }
  }
  const legacy = preferences as NotificationPreferences;
  const booleanKeys = [
    "exchangeActivity",
    "marketplace",
    "messages",
    "reviews",
    "community",
  ] as const;
  if (
    booleanKeys.some((key) => typeof legacy[key] !== "boolean") ||
    !legacy.deliveryMethod ||
    typeof legacy.deliveryMethod.inApp !== "boolean" ||
    typeof legacy.deliveryMethod.email !== "boolean"
  ) {
    return { success: false, error: "Invalid notification preferences" };
  }
  const safePreferences: NotificationPreferences = {
    exchangeActivity: legacy.exchangeActivity,
    marketplace: legacy.marketplace,
    messages: legacy.messages,
    reviews: legacy.reviews,
    community: legacy.community,
    security: true,
    deliveryMethod: {
      inApp: legacy.deliveryMethod.inApp,
      email: legacy.deliveryMethod.email,
    },
  };
  const rows = await sql.query(
    "update users set payload=payload || $2::jsonb,updated_at=now() where id=$1 returning id",
    [userId, JSON.stringify({ notificationPreferences: safePreferences })],
  );
  return rows.length
    ? { success: true }
    : { success: false, error: "User not found" };
}
