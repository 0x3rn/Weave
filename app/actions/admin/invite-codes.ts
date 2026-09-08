"use server";

import { sendEmail } from "@/lib/email";
import { iso, payload, sql } from "@/lib/neon";
import { requireAdminUser } from "./auth";

function generateSecureCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  const encoded = Array.from(bytes, byte => chars[byte % chars.length]).join("");
  return `WV-${encoded.slice(0, 4)}-${encoded.slice(4)}`;
}

function escapeHtml(value: unknown) {
  return String(value ?? "").replace(/[&<>'"]/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character]!);
}

export async function createInviteCode(email: string, expiresInDays: number | null, applicationId?: string) {
  await requireAdminUser();
  const normalizedEmail = email.trim().toLowerCase();
  if (!/^\S+@\S+\.\S+$/.test(normalizedEmail) || (expiresInDays !== null && (!Number.isInteger(expiresInDays) || expiresInDays < 1 || expiresInDays > 365))) return { error: "Invalid invite details" };
  const now = new Date();
  const expiresAt = expiresInDays === null ? null : new Date(now.getTime() + expiresInDays * 86_400_000).toISOString();
  for (let attempt = 0; attempt < 3; attempt++) {
    const id = crypto.randomUUID();
    const code = generateSecureCode();
    const invite = { code, email: normalizedEmail, status: "pending", createdAt: now.toISOString(), expiresAt, inviteApplicationId: applicationId || null, usedAt: null, userId: null };
    try {
      await sql.query("insert into invites (id,code,email,status,created_at,expires_at,payload) values ($1,$2,$3,'pending',$4,$5,$6::jsonb)", [id, code, normalizedEmail, now.toISOString(), expiresAt, JSON.stringify(invite)]);
      return { success: true, code, id };
    } catch (error) {
      if (!error || typeof error !== "object" || !("code" in error) || error.code !== "23505") return { error: error instanceof Error ? error.message : "Unable to create invite" };
    }
  }
  return { error: "Unable to generate a unique invite code" };
}

export async function getIssuedInvites() {
  await requireAdminUser();
  const rows = await sql.query("select * from invites order by created_at desc");
  return { invites: rows.map(row => ({ ...payload<Record<string, unknown>>(row.payload), id: row.id, code: row.code, email: row.email, status: row.status, createdAt: iso(row.created_at), expiresAt: iso(row.expires_at) || null })) };
}

export async function revokeInviteCode(id: string) {
  await requireAdminUser();
  const now = new Date().toISOString();
  const rows = await sql.query("update invites set status='revoked',payload=payload || $2::jsonb where id=$1 and status<>'used' returning id", [id, JSON.stringify({ status: "revoked", revokedAt: now })]);
  return rows.length ? { success: true } : { error: "Invite not found or already used" };
}

export async function extendInviteCode(id: string, additionalDays: number) {
  await requireAdminUser();
  if (!Number.isInteger(additionalDays) || additionalDays < 1 || additionalDays > 365) return { error: "Invalid extension" };
  const [invite] = await sql.query("select * from invites where id=$1", [id]);
  if (!invite) return { error: "Invite not found" };
  if (["used", "revoked"].includes(String(invite.status))) return { error: "Cannot extend a used or revoked invite" };
  const base = iso(invite.expires_at) ? new Date(iso(invite.expires_at)) : new Date();
  const expiresAt = new Date(base.getTime() + additionalDays * 86_400_000).toISOString();
  await sql.query("update invites set expires_at=$2,status='pending',payload=payload || $3::jsonb where id=$1", [id, expiresAt, JSON.stringify({ expiresAt, status: "pending" })]);
  return { success: true };
}

export async function resendInviteEmail(id: string) {
  await requireAdminUser();
  const [invite] = await sql.query("select * from invites where id=$1", [id]);
  if (!invite) return { error: "Invite not found" };
  if (["used", "revoked"].includes(String(invite.status))) return { error: "Cannot resend email for a used or revoked invite" };
  const data = payload<Record<string, unknown>>(invite.payload);
  let fullName = "there";
  let startingHours = 0;
  if (typeof data.inviteApplicationId === "string") {
    const [application] = await sql.query("select full_name,payload from invite_applications where id=$1", [data.inviteApplicationId]);
    if (application) {
      const applicationData = payload<Record<string, unknown>>(application.payload);
      fullName = String(application.full_name ?? applicationData.fullName ?? "there").split(" ")[0];
      startingHours = Number(payload<Record<string, unknown>>(applicationData.approvedSettings).startingHours ?? 0);
    }
  }
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://weavenetwork.vercel.app";
  const signupUrl = `${baseUrl.replace(/\/$/, "")}/signup?invite=${encodeURIComponent(String(invite.code))}`;
  const emailHtml = `<div style="font-family:sans-serif;max-width:600px;margin:0 auto"><h2>Welcome to Weave, ${escapeHtml(fullName)}!</h2><p>This is a reminder that your invite to join Weave is still pending.</p><p>You have been credited with <strong>${startingHours}</strong> starting Skill Hours.</p><div style="background:#f5f5f5;padding:16px;border-radius:8px;margin:24px 0;text-align:center"><p>Your unique invite code:</p><div style="font-size:24px;font-weight:bold;letter-spacing:2px">${escapeHtml(invite.code)}</div></div><a href="${escapeHtml(signupUrl)}">Create Your Account</a></div>`;
  await sendEmail({ to: String(invite.email), subject: "Reminder: Your Weave invite is waiting!", html: emailHtml });
  return { success: true };
}
