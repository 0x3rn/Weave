"use server";

import { sendEmail } from "@/lib/email";
import { iso, payload, sql } from "@/lib/neon";
import { createInviteCode } from "./invite-codes";
import { requireAdminUser } from "./auth";

function escapeHtml(value: unknown) {
  return String(value ?? "").replace(/[&<>'"]/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character]!);
}

export async function getInviteApplications() {
  await requireAdminUser();
  try {
    const rows = await sql.query("select * from invite_applications order by submitted_at desc");
    return { applications: rows.map(row => ({ ...payload<Record<string, unknown>>(row.payload), id: row.id, email: row.email, fullName: row.full_name, status: row.status, createdAt: iso(row.submitted_at), approvedAt: iso(row.approved_at) || undefined })) };
  } catch (error) { return { error: error instanceof Error ? error.message : "Unable to load applications" }; }
}

export async function saveInternalNotes(id: string, notes: string) {
  await requireAdminUser();
  if (typeof notes !== "string" || notes.length > 5000) return { error: "Invalid notes" };
  const rows = await sql.query("update invite_applications set payload=payload || $2::jsonb where id=$1 returning id", [id, JSON.stringify({ internalNotes: notes, updatedAt: new Date().toISOString() })]);
  return rows.length ? { success: true } : { error: "Application not found" };
}

export async function approveInvite(id: string, data: { startingHours: number; welcomeMessage: string; badge: boolean; expiresInDays: number | null }) {
  await requireAdminUser();
  if (!Number.isInteger(data.startingHours) || data.startingHours < 0 || data.startingHours > 10_000 || typeof data.welcomeMessage !== "string" || data.welcomeMessage.length > 2000 || (data.expiresInDays !== null && (!Number.isInteger(data.expiresInDays) || data.expiresInDays < 1 || data.expiresInDays > 365))) return { error: "Invalid invite settings" };
  const [row] = await sql.query("select * from invite_applications where id=$1", [id]);
  if (!row) return { error: "Application not found" };
  const application = { ...payload<Record<string, unknown>>(row.payload), email: row.email, fullName: row.full_name };
  const invite = await createInviteCode(String(application.email), data.expiresInDays, id);
  if (!invite.code) return { error: invite.error || "Failed to generate invite code" };
  const now = new Date().toISOString();
  await sql.query("update invite_applications set status='approved',approved_at=$2,payload=payload || $3::jsonb where id=$1", [id, now, JSON.stringify({ status: "approved", approvedAt: now, approvedSettings: { startingHours: data.startingHours, badge: data.badge } })]);
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://weavenetwork.vercel.app";
  const signupUrl = `${baseUrl.replace(/\/$/, "")}/signup?invite=${encodeURIComponent(invite.code)}`;
  const firstName = String(application.fullName || "there").split(" ")[0];
  const emailHtml = `<div style="font-family:sans-serif;max-width:600px;margin:0 auto"><h2>Welcome to Weave, ${escapeHtml(firstName)}!</h2><p>Your invite request has been approved.</p>${data.welcomeMessage ? `<p><em>"${escapeHtml(data.welcomeMessage)}"</em></p>` : ""}<p>You have been credited with <strong>${data.startingHours}</strong> starting Skill Hours.</p><div style="background:#f5f5f5;padding:16px;border-radius:8px;margin:24px 0;text-align:center"><p>Your unique invite code:</p><div style="font-size:24px;font-weight:bold;letter-spacing:2px">${escapeHtml(invite.code)}</div></div><a href="${escapeHtml(signupUrl)}">Create Your Account</a></div>`;
  await sendEmail({ to: String(application.email), subject: "Welcome to Weave! Your invite is approved.", html: emailHtml });
  return { success: true };
}

export async function rejectInvite(id: string, data: { reason: string; feedback: string }) {
  await requireAdminUser();
  if (typeof data.reason !== "string" || typeof data.feedback !== "string" || !data.reason.trim() || data.reason.length > 500 || data.feedback.length > 2000) return { error: "Invalid rejection" };
  const now = new Date().toISOString();
  const rows = await sql.query("update invite_applications set status='rejected',payload=payload || $2::jsonb where id=$1 returning email,full_name,payload", [id, JSON.stringify({ status: "rejected", rejectionReason: data.reason.trim(), rejectionFeedback: data.feedback.trim(), rejectedAt: now })]);
  if (!rows.length) return { error: "Application not found" };
  const application = payload<Record<string, unknown>>(rows[0].payload);
  const firstName = String(rows[0].full_name ?? application.fullName ?? "there").split(" ")[0];
  const emailHtml = `<div style="font-family:sans-serif;max-width:600px;margin:0 auto"><h2>Hi ${escapeHtml(firstName)},</h2><p>Thank you for your interest in joining Weave.</p><p>We are currently unable to offer you an invite.</p>${data.feedback ? `<p><strong>Feedback:</strong> ${escapeHtml(data.feedback)}</p>` : ""}<p>- The Weave Team</p></div>`;
  await sendEmail({ to: String(rows[0].email), subject: "Update regarding your Weave invite request", html: emailHtml });
  return { success: true };
}
