"use server";

import { calculateProfileCompletion, calculateTrustScore } from "@/lib/user-metrics";
import { iso, payload, sql } from "@/lib/neon";
import { getUserById, userFromRow } from "@/lib/users";
import { Exchange, ExchangeRequest, Notification, SkillLedgerEntry, User } from "@/types";
import { getCurrentUserId } from "./user";

export async function getDashboardData() {
  const uid = await getCurrentUserId();
  if (!uid) throw new Error("Unauthorized");
  const user = await getUserById(uid);
  if (!user) throw new Error("User not found");

  const [portfolio, exchangeRows, requestRows, ledgerRows, notificationRows] = await Promise.all([
    sql.query("select id from portfolio_items where user_id=$1 limit 1", [uid]),
    sql.query("select * from exchanges where (requester_id=$1 or provider_id=$1) and status in ('pending_proposal','in_progress','in_review','revision_requested','disputed') order by updated_at desc", [uid]),
    sql.query("select * from exchange_requests where sender_id=$1 or receiver_id=$1 order by created_at desc", [uid]),
    sql.query("select * from ledger_entries where user_id=$1 order by occurred_at desc limit 5", [uid]),
    sql.query("select * from notifications where user_id=$1 and is_archived=false and in_app_enabled=true order by created_at desc limit 10", [uid]),
  ]);
  user.hasPortfolio = portfolio.length > 0;
  const profileCompletion = calculateProfileCompletion(user);
  user.profileCompletion = profileCompletion;
  user.trustScore = calculateTrustScore(user, profileCompletion);
  user.stats = user.stats || { rating: 0, reviewsCount: 0, exchangesCompleted: 0, skillHoursEarned: 0, skillHoursSpent: 0, completionRate: 0, responseTimeHours: 0, repeatCollaborations: 0 };

  const activeExchanges = exchangeRows.map(row => ({
    ...payload<Record<string, unknown>>(row.payload), id: String(row.id), requesterId: String(row.requester_id ?? ""), providerId: String(row.provider_id ?? ""),
    title: String(row.title ?? ""), status: String(row.status ?? "") as Exchange["status"], isMutual: row.is_mutual === true,
  })) as Exchange[];
  const myRequests = requestRows.map(row => ({
    ...payload<Record<string, unknown>>(row.payload), id: String(row.id), senderId: String(row.sender_id ?? ""), receiverId: String(row.receiver_id ?? ""),
    skillNeeded: String(row.skill_needed ?? ""), status: String(row.status ?? "") as ExchangeRequest["status"], createdAt: iso(row.created_at), updatedAt: iso(row.updated_at),
  })) as ExchangeRequest[];
  const pendingRequestsCount = myRequests.filter(request => request.status === "pending" || request.status === "reviewing").length;
  const ledgerSnapshot = ledgerRows.map(row => ({
    ...payload<Record<string, unknown>>(row.payload), id: String(row.id), userId: String(row.user_id ?? ""), amount: Number(row.amount ?? 0),
    reason: String(row.description ?? row.entry_type ?? ""), relatedId: row.exchange_id ? String(row.exchange_id) : undefined, createdAt: iso(row.occurred_at),
  })) as SkillLedgerEntry[];
  const notifications = notificationRows.map(row => ({
    ...payload<Record<string, unknown>>(row.payload), id: String(row.id), userId: String(row.user_id ?? ""), type: String(row.notification_type ?? "system") as Notification["type"],
    category: row.category ? String(row.category) as Notification["category"] : undefined,
    priority: row.priority ? String(row.priority) as Notification["priority"] : undefined,
    title: String(row.title ?? ""), message: String(row.message ?? ""), isRead: row.is_read === true,
    isArchived: row.is_archived === true, link: row.link ? String(row.link) : undefined,
    actionLabel: row.action_label ? String(row.action_label) : undefined,
    relatedId: row.related_id ? String(row.related_id) : undefined, createdAt: iso(row.created_at),
  })) as Notification[];

  let matches: User[] = [];
  const firstSkill = user.skillsLookingFor?.[0];
  if (typeof firstSkill === "string" && firstSkill) {
    const rows = await sql.query("select * from users where id<>$1 and coalesce(account_status,payload->>'status','active')='active' and payload->'skillsOffered' ? $2 limit 5", [uid, firstSkill]);
    matches = rows.map(row => userFromRow(row));
  }

  const tasks: { id: string; title: string; actionText: string; actionUrl: string; isUrgent: boolean }[] = [];
  if (profileCompletion < 100) tasks.push({ id: "complete_profile", title: `Complete your profile (${profileCompletion}% done)`, actionText: "Edit Profile", actionUrl: "/profile", isUrgent: profileCompletion < 50 });
  if (!user.isVerified) tasks.push({ id: "get_verified", title: "Become verified to earn Trust points", actionText: "Start Verification", actionUrl: "/verification", isUrgent: false });
  const receivedPending = myRequests.filter(request => request.receiverId === uid && request.status === "pending");
  if (receivedPending.length) tasks.push({ id: "pending_requests", title: `You have ${receivedPending.length} new collaboration request(s)`, actionText: "Review", actionUrl: "/requests", isUrgent: true });
  const unread = notifications.filter(notification => !notification.isRead).length;
  if (unread) tasks.push({ id: "unread_notifications", title: `You have ${unread} unread notification(s)`, actionText: "View All", actionUrl: "/notifications", isUrgent: false });
  return { user, activeExchanges, myRequests, pendingRequestsCount, ledgerSnapshot, notifications, matches, tasks };
}
