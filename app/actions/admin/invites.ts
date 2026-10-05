"use server";
import { sendEmail } from "@/lib/email";
import { sql } from "@/lib/neon";
import {
  deliverInvite,
  escapeHtml,
  generateInviteCode,
  inviteForAdmin,
  applicationForAdmin,
} from "@/lib/admin-invites";
import { requireAdminUser } from "./auth";
import { revalidatePath } from "next/cache";
export async function getInviteApplications() {
  await requireAdminUser();
  const rows = await sql.query(
    "select * from invite_applications order by submitted_at desc",
  );
  return { applications: rows.map(applicationForAdmin) };
}
export async function saveInternalNotes(id: string, notes: string) {
  const actor = await requireAdminUser();
  if (
    typeof id !== "string" ||
    typeof notes !== "string" ||
    notes.length > 5000
  )
    return { error: "Invalid notes" };
  try {
    const rows = await sql.query(
      "with changed as (update invite_applications set payload=payload||$2::jsonb where id=$1 returning id), audited as (insert into admin_audit_events(actor_id,event_type,resource_id,description) select $3,'invite_notes',id,'Private applicant notes updated' from changed returning id) select id from changed",
      [id, JSON.stringify({ internalNotes: notes }), actor],
    );
    revalidatePath("/admin");
    return rows.length ? { success: true } : { error: "Application not found" };
  } catch {
    return { error: "Could not save notes. Retry." };
  }
}
export async function approveInvite(
  id: string,
  data: {
    startingHours: number;
    welcomeMessage: string;
    badge: boolean;
    expiresInDays: number | null;
  },
) {
  const actor = await requireAdminUser();
  if (
    !data ||
    typeof id !== "string" ||
    !Number.isInteger(data.startingHours) ||
    data.startingHours < 0 ||
    data.startingHours > 10000 ||
    typeof data.badge !== "boolean" ||
    typeof data.welcomeMessage !== "string" ||
    data.welcomeMessage.length > 2000 ||
    (data.expiresInDays !== null &&
      (!Number.isInteger(data.expiresInDays) ||
        data.expiresInDays < 1 ||
        data.expiresInDays > 365))
  )
    return { error: "Invalid invite settings" };
  try {
    const [row] = await sql.query(
      "select * from admin_approve_invite($1,$2,$3,$4,$5::jsonb,$6::integer)",
      [
        actor,
        id,
        crypto.randomUUID(),
        generateInviteCode(),
        JSON.stringify({
          startingHours: data.startingHours,
          badge: data.badge,
        }),
        data.expiresInDays,
      ],
    );
    const [application] = await sql.query(
      "select full_name from invite_applications where id=$1",
      [id],
    );
    const warning = await deliverInvite(
      row,
      application?.full_name,
      data.welcomeMessage,
    );
    revalidatePath("/admin", "layout");
    return { success: true, warning, invite: inviteForAdmin(row) };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Could not approve application",
    };
  }
}
export async function rejectInvite(
  id: string,
  data: { reason: string; feedback: string },
) {
  const actor = await requireAdminUser();
  if (
    !data ||
    typeof id !== "string" ||
    typeof data.reason !== "string" ||
    typeof data.feedback !== "string" ||
    !data.reason.trim() ||
    data.reason.length > 500 ||
    data.feedback.length > 2000
  )
    return { error: "Invalid rejection" };
  try {
    const [row] = await sql.query(
      "select * from admin_reject_invite($1,$2,$3,$4)",
      [actor, id, data.reason.trim(), data.feedback.trim()],
    );
    let warning: string | undefined;
    try {
      const sent = await sendEmail({
        to: String(row.email),
        subject: "Update regarding your Weave application",
        html:
          "<h2>Hi " +
          escapeHtml(row.full_name || "there") +
          ",</h2><p>We are currently unable to offer you an invite.</p><p>" +
          escapeHtml(data.feedback) +
          "</p>",
      });
      if (!sent.success)
        warning =
          "Application rejected and codes revoked, but the email could not be delivered.";
    } catch {
      warning =
        "Application rejected and codes revoked, but the email could not be delivered.";
    }
    revalidatePath("/admin", "layout");
    return { success: true, warning };
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Could not reject application",
    };
  }
}
