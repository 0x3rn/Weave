"use server";

import { iso, payload, sql } from "@/lib/neon";
import { revalidatePath } from "next/cache";
import { requireAdminUser } from "./auth";

export type AdminDispute = {
  exchangeId: string;
  escrowId: string;
  title: string;
  requester: { id: string; name: string; username: string };
  provider: { id: string; name: string; username: string };
  requesterHours: number;
  providerHours: number;
  reason: string;
  details: string;
  openedAt: string;
  activityCount: number;
  deliveryCount: number;
  activity: { id: string; description: string; occurredAt: string }[];
  deliveries: { id: string; version: number; comments: string; submittedAt: string; files: { name: string; url: string }[] }[];
  messages: { id: string; senderId: string; content: string; createdAt: string }[];
};

export async function getAdminDisputes() {
  await requireAdminUser();
  const rows = await sql.query(
    `select e.id as exchange_id,s.id as escrow_id,e.title,e.requester_id,e.provider_id,e.requester_escrow_hours,e.provider_escrow_hours,
       s.dispute,requester.full_name as requester_name,requester.username as requester_username,provider.full_name as provider_name,provider.username as provider_username,
       (select count(*)::int from exchange_activity a where a.exchange_id=e.id) as activity_count,
       (select count(*)::int from exchange_deliveries d where d.exchange_id=e.id) as delivery_count
     from exchanges e join escrows s on s.exchange_id=e.id
     join users requester on requester.id=e.requester_id join users provider on provider.id=e.provider_id
     where e.status='disputed' and s.status='disputed' order by coalesce((s.dispute->>'openedAt')::timestamptz,s.updated_at) asc`,
  );
  const disputes: AdminDispute[] = await Promise.all(rows.map(async row => {
    const dispute = payload<Record<string, unknown>>(row.dispute);
    const [activityRows, deliveryRows, messageRows] = await Promise.all([
      sql.query("select id,description,occurred_at from exchange_activity where exchange_id=$1 order by occurred_at desc limit 100", [row.exchange_id]),
      sql.query("select id,version,comments,submitted_at,files from exchange_deliveries where exchange_id=$1 order by version desc limit 50", [row.exchange_id]),
      sql.query("select m.id,m.sender_id,m.content,m.created_at from messages m join conversations c on c.id=m.conversation_id where c.id=$1 or c.context_id=$1 order by m.created_at desc limit 100", [row.exchange_id]),
    ]);
    return {
      exchangeId: String(row.exchange_id), escrowId: String(row.escrow_id), title: String(row.title ?? "Exchange"),
      requester: { id: String(row.requester_id), name: String(row.requester_name ?? row.requester_username ?? "Member"), username: String(row.requester_username ?? "") },
      provider: { id: String(row.provider_id), name: String(row.provider_name ?? row.provider_username ?? "Member"), username: String(row.provider_username ?? "") },
      requesterHours: Number(row.requester_escrow_hours ?? 0), providerHours: Number(row.provider_escrow_hours ?? 0),
      reason: String(dispute.reason ?? "Other"), details: String(dispute.details ?? ""), openedAt: iso(dispute.openedAt ?? row.updated_at),
      activityCount: Number(row.activity_count ?? 0), deliveryCount: Number(row.delivery_count ?? 0),
      activity: activityRows.map(event => ({ id: String(event.id), description: String(event.description ?? "Activity"), occurredAt: iso(event.occurred_at) })),
      deliveries: deliveryRows.map(delivery => ({ id: String(delivery.id), version: Number(delivery.version ?? 0), comments: String(delivery.comments ?? ""), submittedAt: iso(delivery.submitted_at), files: (Array.isArray(delivery.files) ? delivery.files : []).flatMap(file => file && typeof file === "object" && "name" in file && "url" in file ? [{ name: String(file.name), url: String(file.url) }] : []) })),
      messages: messageRows.map(message => ({ id: String(message.id), senderId: String(message.sender_id ?? ""), content: String(message.content ?? ""), createdAt: iso(message.created_at) })),
    };
  }));
  return { disputes };
}

export async function resolveAdminDispute(exchangeId: string, providerAward: number, requesterAward: number, notes: string) {
  try {
    const adminId = await requireAdminUser();
    if (!exchangeId || !Number.isInteger(providerAward) || !Number.isInteger(requesterAward) || providerAward < 0 || requesterAward < 0 || typeof notes !== "string" || notes.trim().length < 3 || notes.length > 5000) return { success: false, error: "Invalid resolution" };
    const ids = Array.from({ length: 5 }, () => crypto.randomUUID());
    const [row] = await sql.query(
      "select resolve_exchange_dispute($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) as outcome",
      [adminId, exchangeId, providerAward, requesterAward, notes.trim(), ...ids, new Date().toISOString()],
    );
    revalidatePath("/admin/disputes");
    revalidatePath(`/exchanges/${exchangeId}`);
    return { success: true, outcome: String(row.outcome) };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message.replace(/^.*error:\s*/i, "") : "Unable to resolve dispute" };
  }
}
