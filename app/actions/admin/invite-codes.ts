"use server";
import { payload, sql } from "@/lib/neon";
import {
  generateInviteCode,
  inviteForAdmin,
  deliverInvite,
} from "@/lib/admin-invites";
import { requireAdminUser } from "./auth";
import { revalidatePath } from "next/cache";
export async function createInviteCode(
  email: string,
  expiresInDays: number | null,
) {
  const actor = await requireAdminUser();
  if (
    typeof email !== "string" ||
    !/^\S+@\S+\.\S+$/.test(email.trim()) ||
    email.length > 320 ||
    (expiresInDays !== null &&
      (!Number.isInteger(expiresInDays) ||
        expiresInDays < 1 ||
        expiresInDays > 365))
  )
    return { error: "Invalid invite details" };
  try {
    const id = crypto.randomUUID(),
      code = generateInviteCode();
    const [row] = await sql.query(
      "with created as (insert into invites(id,code,email,status,created_at,expires_at,payload) values($1,$2,$3,'pending',now(),case when $4::integer is null then null else now()+$4::integer*interval '1 day' end,'{\"approvedSettings\":{\"startingHours\":5,\"badge\":false}}') returning *), audited as (insert into admin_audit_events(actor_id,event_type,resource_id,description) select $5,'invite_issued',id,'Direct member invite issued' from created returning id) select * from created",
      [id, code, email.trim().toLowerCase(), expiresInDays, actor],
    );
    revalidatePath("/admin", "layout");
    return { success: true, code, id, invite: inviteForAdmin(row) };
  } catch {
    return { error: "Could not create invite. Retry." };
  }
}
export async function getIssuedInvites() {
  await requireAdminUser();
  return {
    invites: (
      await sql.query("select * from invites order by created_at desc")
    ).map(inviteForAdmin),
  };
}
export async function revokeInviteCode(id: string) {
  const actor = await requireAdminUser();
  if (typeof id !== "string") return { error: "Invalid invite" };
  try {
    const rows = await sql.query(
      "with changed as (update invites set status='revoked',payload=payload||jsonb_build_object('status','revoked','revokedAt',now()) where id=$1 and status<>'used' returning *), audited as (insert into admin_audit_events(actor_id,event_type,resource_id,description) select $2,'invite_revoked',id,'Invite revoked' from changed returning id) select * from changed",
      [id, actor],
    );
    revalidatePath("/admin", "layout");
    return rows.length
      ? { success: true, invite: inviteForAdmin(rows[0]) }
      : { error: "Invite not found or already used" };
  } catch {
    return { error: "Could not revoke invite. Retry." };
  }
}
export async function extendInviteCode(id: string, additionalDays: number) {
  const actor = await requireAdminUser();
  if (
    typeof id !== "string" ||
    !Number.isInteger(additionalDays) ||
    additionalDays < 1 ||
    additionalDays > 365
  )
    return { error: "Invalid extension" };
  try {
    const [row] = await sql.query(
      "select * from admin_extend_invite($1,$2,$3::integer)",
      [actor, id, additionalDays],
    );
    revalidatePath("/admin", "layout");
    return { success: true, invite: inviteForAdmin(row) };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Could not extend invite",
    };
  }
}
export async function resendInviteEmail(id: string) {
  await requireAdminUser();
  if (typeof id !== "string") return { error: "Invalid invite" };
  try {
    const [row] = await sql.query("select * from invites where id=$1", [id]);
    if (!row || inviteForAdmin(row).status !== "pending")
      return { error: "Only an unexpired, unused invitation can be resent" };
    const applicationId = payload<Record<string, unknown>>(
      row.payload,
    ).inviteApplicationId;
    const [application] =
      typeof applicationId === "string"
        ? await sql.query(
            "select full_name,status,payload from invite_applications where id=$1",
            [applicationId],
          )
        : [];
    if (applicationId && application?.status !== "approved")
      return { error: "Application is not approved" };
    const warning = await deliverInvite(
      row,
      application?.full_name,
      "",
      payload<Record<string, unknown>>(application?.payload).approvedSettings,
    );
    return warning
      ? { error: "Email delivery failed. Check SMTP configuration and retry." }
      : { success: true };
  } catch {
    return { error: "Could not resend invite. Retry." };
  }
}
