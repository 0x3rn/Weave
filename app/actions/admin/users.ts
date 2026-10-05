"use server";
import { sql, payload } from "@/lib/neon";
import { userFromRow, getUserById } from "@/lib/users";
import { scheduleNotificationEmails } from "@/lib/notification-email";
import { requireAdminUser } from "./auth";
import { revalidatePath } from "next/cache";
import { summarizeAdminUsers } from "@/lib/admin-summary";
import { calculateProfileCompletion } from "@/lib/user-metrics";
type ActionResult = { success: boolean; error?: string; newBalance?: number };
function failure(error: unknown): ActionResult {
  return {
    success: false,
    error: error instanceof Error ? error.message : "Operation failed. Retry.",
  };
}
export async function getAdminUsersDashboard() {
  const actor = await requireAdminUser();
  try {
    const [rows, pending, admin] = await Promise.all([
      sql.query(
        "select u.*,exists(select 1 from portfolio_items p where p.user_id=u.id) as has_portfolio from users u order by created_at desc",
      ),
      sql.query(
        "select count(*)::int as count from invite_applications where coalesce(status,'pending')='pending'",
      ),
      getUserById(actor),
    ]);
    const users = rows.map((row) => {
      const user = {
        ...userFromRow(row),
        hasPortfolio: row.has_portfolio === true,
        adminNotes: String(
          payload<Record<string, unknown>>(row.payload).adminNotes || "",
        ),
      };
      return { ...user, profileCompletion: calculateProfileCompletion(user) };
    });
    const timeZone = admin?.timeZone || "UTC";
    return {
      users,
      timeZone,
      actorId: actor,
      summary: summarizeAdminUsers(
        users,
        Number(pending[0]?.count ?? 0),
        timeZone,
      ),
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Could not load members",
    };
  }
}
export async function updateUserStatus(
  uid: string,
  status: "active" | "suspended" | "banned",
): Promise<ActionResult> {
  const actor = await requireAdminUser();
  if (
    typeof uid !== "string" ||
    !["active", "suspended", "banned"].includes(status)
  )
    return { success: false, error: "Invalid status" };
  try {
    const id = crypto.randomUUID(),
      title = status === "active" ? "Account restored" : "Account " + status;
    const message =
      status === "active"
        ? "Your Weave account is active again."
        : "Your account was " +
          status +
          ". Contact support if you believe this is an error.";
    await sql.query(
      "with changed as (select id from admin_update_member($1,$2,'status',$3::jsonb)) insert into notifications(id,source_path,user_id,notification_type,title,message,is_read,is_archived,link,created_at,payload) select $4,$5,id,case when $6='active' then 'system' else 'security_alert' end,$7,$8,false,false,'/settings/security',now(),$9::jsonb from changed",
      [
        actor,
        uid,
        JSON.stringify(status),
        id,
        "admin/status/" + id,
        status,
        title,
        message,
        JSON.stringify({
          type: status === "active" ? "system" : "security_alert",
          title,
          message,
          isRead: false,
          link: "/settings/security",
          createdAt: new Date().toISOString(),
        }),
      ],
    );
    scheduleNotificationEmails([id]);
    revalidatePath("/admin", "layout");
    return { success: true };
  } catch (error) {
    return failure(error);
  }
}
export async function updateUserVerification(
  uid: string,
  isVerified: boolean,
): Promise<ActionResult> {
  const actor = await requireAdminUser();
  if (typeof uid !== "string" || typeof isVerified !== "boolean")
    return { success: false, error: "Invalid verification" };
  try {
    const id = crypto.randomUUID(),
      title = isVerified
        ? "Verification approved"
        : "Verification status updated",
      message = isVerified
        ? "Your profile is now verified."
        : "Your verified badge was removed.";
    await sql.query(
      "with changed as (select id from admin_update_member($1,$2,'verification',$3::jsonb)) insert into notifications(id,source_path,user_id,notification_type,title,message,is_read,is_archived,link,created_at,payload) select $4,$5,id,$6,$7,$8,false,false,'/profile',now(),$9::jsonb from changed",
      [
        actor,
        uid,
        JSON.stringify(isVerified),
        id,
        "admin/verification/" + id,
        isVerified ? "verification_approved" : "system",
        title,
        message,
        JSON.stringify({
          type: isVerified ? "verification_approved" : "system",
          title,
          message,
          isRead: false,
          link: "/profile",
          createdAt: new Date().toISOString(),
        }),
      ],
    );
    scheduleNotificationEmails([id]);
    revalidatePath("/admin", "layout");
    return { success: true };
  } catch (error) {
    return failure(error);
  }
}
export async function saveAdminUserNotes(
  uid: string,
  notes: string,
): Promise<ActionResult> {
  const actor = await requireAdminUser();
  if (
    typeof uid !== "string" ||
    typeof notes !== "string" ||
    notes.length > 5000
  )
    return { success: false, error: "Invalid notes" };
  try {
    await sql.query(
      "select id from admin_update_member($1,$2,'notes',$3::jsonb)",
      [actor, uid, JSON.stringify(notes)],
    );
    revalidatePath("/admin", "layout");
    return { success: true };
  } catch (error) {
    return failure(error);
  }
}
export async function adjustUserSkillHours(
  uid: string,
  amount: number,
  reason: string,
  operationId: string,
): Promise<ActionResult> {
  const actor = await requireAdminUser();
  if (
    typeof uid !== "string" ||
    !Number.isInteger(amount) ||
    amount === 0 ||
    Math.abs(amount) > 10000 ||
    typeof reason !== "string" ||
    !reason.trim() ||
    reason.length > 500 ||
    typeof operationId !== "string" ||
    !/^[a-f0-9-]{36}$/.test(operationId)
  )
    return { success: false, error: "Invalid adjustment" };
  try {
    const [row] = await sql.query(
      "select admin_adjust_skill_hours($1,$2,$3::integer,$4,$5) as balance",
      [actor, uid, amount, reason.trim(), operationId],
    );
    scheduleNotificationEmails([
      "admin-" + actor + "-" + operationId + "-notification",
    ]);
    revalidatePath("/admin", "layout");
    return { success: true, newBalance: Number(row.balance) };
  } catch (error) {
    return failure(error);
  }
}
export async function deleteUserAccount(uid: string): Promise<ActionResult> {
  const actor = await requireAdminUser();
  if (typeof uid !== "string")
    return { success: false, error: "Invalid member" };
  try {
    await sql.query(
      "select id from admin_update_member($1,$2,'delete','null'::jsonb)",
      [actor, uid],
    );
    revalidatePath("/admin", "layout");
    return { success: true };
  } catch (error) {
    return failure(error);
  }
}
