"use server";

import { auth } from "@/lib/firebase-admin-auth";
import { sql } from "@/lib/neon";
import { userFromRow } from "@/lib/users";
import { requireAdminUser } from "./auth";

export async function getAdminUsersDashboard() {
  await requireAdminUser();
  try {
    const [rows, pendingRows] = await Promise.all([
      sql.query("select u.*,exists(select 1 from portfolio_items p where p.user_id=u.id) as has_portfolio from users u order by created_at desc"),
      sql.query("select count(*)::int as count from invite_applications where status='pending'"),
    ]);
    const users = rows.map(row => ({ ...userFromRow(row), hasPortfolio: row.has_portfolio === true }));
    const now = new Date();
    const today = now.toISOString().split("T")[0];
    const lastWeek = new Date(now.getTime() - 7 * 86_400_000);
    let verifiedCount = 0, newTodayCount = 0, activeTodayCount = 0, suspendedCount = 0, reportedCount = 0, thisWeekCount = 0;
    for (const user of users) {
      if (user.isVerified) verifiedCount++;
      const createdAt = new Date(user.createdAt);
      if (!Number.isNaN(createdAt.getTime()) && createdAt.toISOString().startsWith(today)) newTodayCount++;
      if (createdAt > lastWeek) thisWeekCount++;
      if (user.lastActive?.startsWith(today)) activeTodayCount++;
      if (user.status === "suspended") suspendedCount++;
      if (Number(user.stats?.reportsAgainst || 0) > 0) reportedCount++;
    }
    const totalUsers = users.length;
    return { users, summary: { totalUsers, thisWeekCount, activeTodayCount, activePercentage: totalUsers ? Math.round(activeTodayCount / totalUsers * 100) : 0, verifiedCount, verifiedPercentage: totalUsers ? Math.round(verifiedCount / totalUsers * 100) : 0, pendingInvites: Number(pendingRows[0]?.count ?? 0), pendingVerification: 0, suspendedCount, reportedCount, newTodayCount } };
  } catch (error) { return { error: error instanceof Error ? error.message : "Unable to load users" }; }
}

export async function updateUserStatus(uid: string, status: "active" | "suspended" | "banned") {
  await requireAdminUser();
  const rows = await sql.query("update users set account_status=$2,updated_at=now(),payload=payload || $3::jsonb where id=$1 returning id", [uid, status, JSON.stringify({ status })]);
  return rows.length ? { success: true } : { error: "User not found" };
}

export async function updateUserVerification(uid: string, isVerified: boolean) {
  await requireAdminUser();
  const rows = await sql.query("update users set is_verified=$2,updated_at=now(),payload=payload || $3::jsonb where id=$1 returning id", [uid, isVerified, JSON.stringify({ isVerified })]);
  return rows.length ? { success: true } : { error: "User not found" };
}

export async function saveAdminUserNotes(uid: string, notes: string) {
  await requireAdminUser();
  if (typeof notes !== "string" || notes.length > 5000) return { error: "Invalid notes" };
  const rows = await sql.query("update users set updated_at=now(),payload=payload || $2::jsonb where id=$1 returning id", [uid, JSON.stringify({ adminNotes: notes })]);
  return rows.length ? { success: true } : { error: "User not found" };
}

export async function adjustUserSkillHours(uid: string, amount: number, reason: string) {
  const adminId = await requireAdminUser();
  if (!Number.isInteger(amount) || Math.abs(amount) > 10_000 || !reason.trim() || reason.length > 500) return { error: "Invalid adjustment" };
  const ledgerId = crypto.randomUUID();
  const now = new Date().toISOString();
  const rows = await sql.query(
    `with changed as (update users set skill_hours=skill_hours+$2,updated_at=$4,payload=payload || jsonb_build_object('skillHours',skill_hours+$2,'updatedAt',$4) where id=$1 and skill_hours+$2>=0 returning skill_hours-$2 as before_balance,skill_hours as after_balance),
     entry as (insert into ledger_entries (id,source_collection,user_id,related_user_id,entry_type,entry_status,amount,balance_before,balance_after,description,occurred_at,payload)
       select $3,'skill_ledger',$1,$5,case when $2>0 then 'admin_credit' else 'admin_debit' end,'Completed',$2,before_balance,after_balance,$6,$4,jsonb_build_object('userId',$1,'amount',$2,'type',case when $2>0 then 'admin_credit' else 'admin_debit' end,'description',$6,'balanceAfter',after_balance,'createdAt',$4) from changed returning balance_after)
     select balance_after from entry`,
    [uid, amount, ledgerId, now, adminId, reason.trim()],
  );
  return rows.length ? { success: true, newBalance: Number(rows[0].balance_after) } : { error: "User not found or adjustment would make the balance negative" };
}

export async function deleteUserAccount(uid: string) {
  const adminId = await requireAdminUser();
  if (uid === adminId) return { error: "You cannot delete your own admin account" };
  const rows = await sql.query("delete from users where id=$1 returning payload", [uid]);
  if (!rows.length) return { error: "User not found" };
  try {
    if (auth) await auth.deleteUser(uid);
  } catch (error) {
    console.error("Firebase Auth cleanup failed after Neon account deletion", error);
    return { error: "Account data was deleted, but the Firebase Auth record still needs cleanup" };
  }
  return { success: true };
}
