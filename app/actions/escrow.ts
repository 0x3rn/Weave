"use server";

import { iso, payload, sql } from "@/lib/neon";
import { Escrow, EscrowEvent, EscrowParticipant, Exchange } from "@/types";
import { revalidatePath } from "next/cache";
import { getCurrentUserId } from "./user";

function escrowFromRow(row: Record<string, unknown>): Escrow {
  return {
    ...payload<Record<string, unknown>>(row.payload), id: String(row.id), exchangeId: String(row.exchange_id ?? ""), status: String(row.status ?? "locked") as Escrow["status"],
    participants: payload<Record<string, EscrowParticipant>>(row.participants), timeline: Array.isArray(row.timeline) ? row.timeline as EscrowEvent[] : [],
    dispute: row.dispute ?? undefined, createdAt: iso(row.created_at), updatedAt: iso(row.updated_at),
  } as Escrow;
}

function exchangeFromRow(row: Record<string, unknown>): Exchange {
  return { ...payload<Record<string, unknown>>(row.payload), id: String(row.id), requesterId: String(row.requester_id ?? ""), providerId: String(row.provider_id ?? ""), skillHours: Number(row.skill_hours ?? 0), status: String(row.status ?? "") as Exchange["status"], isMutual: row.is_mutual === true } as Exchange;
}

async function ownedEscrow(escrowId: string, userId: string) {
  const [row] = await sql.query("select * from escrows where id=$1 and participants ? $2", [escrowId, userId]);
  return row ? { row, escrow: escrowFromRow(row) } : null;
}

async function saveEscrow(row: Record<string, unknown>, escrow: Escrow) {
  const updatedAt = new Date().toISOString();
  const rows = await sql.query("update escrows set status=$2,participants=$3::jsonb,timeline=$4::jsonb,dispute=$5::jsonb,updated_at=$6,payload=$7::jsonb where id=$1 and updated_at is not distinct from $8 returning id", [escrow.id, escrow.status, JSON.stringify(escrow.participants), JSON.stringify(escrow.timeline), escrow.dispute ? JSON.stringify(escrow.dispute) : null, updatedAt, JSON.stringify({ ...escrow, updatedAt }), row.updated_at ?? null]);
  if (!rows.length) throw new Error("Escrow changed while you were editing it. Please try again.");
}

export async function getEscrowByExchangeId(exchangeId: string) {
  const userId = await getCurrentUserId();
  if (!userId) return { success: false, error: "Unauthorized" };
  const [row] = await sql.query("select * from escrows where exchange_id=$1 and participants ? $2", [exchangeId, userId]);
  return row ? { success: true, escrow: escrowFromRow(row) } : { success: false, error: "Escrow not found" };
}

export async function getActiveEscrows() {
  const userId = await getCurrentUserId();
  if (!userId) return { success: false, error: "Unauthorized" };
  const rows = await sql.query("select * from escrows where participants ? $1 order by updated_at desc", [userId]);
  return { success: true, escrows: rows.map(row => escrowFromRow(row)) };
}

export async function initializeEscrow(exchangeId: string) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return { success: false, error: "Unauthorized" };
    const [row] = await sql.query("select * from exchanges where id=$1 and (requester_id=$2 or provider_id=$2)", [exchangeId, userId]);
    if (!row) return { success: false, error: "Exchange not found" };
    const exchange = exchangeFromRow(row);
    const existing = await sql.query("select id from escrows where exchange_id=$1", [exchangeId]);
    if (existing.length) return { success: false, error: "Escrow already exists for this exchange" };
    const participants: Record<string, EscrowParticipant> = {
      [exchange.requesterId]: { userId: exchange.requesterId, role: "requester", skillHoursReserved: exchange.requesterEscrowHours ?? exchange.skillHours, securityDepositAmount: 0, depositStatus: "received", deliverablesStatus: "pending", approvalStatus: "pending", commitments: exchange.requesterDeliverables || ["Complete required deliverables"] },
      [exchange.providerId]: { userId: exchange.providerId, role: "provider", skillHoursReserved: exchange.providerEscrowHours ?? 0, securityDepositAmount: 0, depositStatus: "received", deliverablesStatus: "pending", approvalStatus: "pending", commitments: exchange.providerDeliverables || exchange.deliverables || ["Complete required deliverables"] },
    };
    const now = new Date().toISOString();
    const escrowId = crypto.randomUUID();
    const timeline: EscrowEvent[] = [{ id: crypto.randomUUID(), type: "created", message: "Escrow contract created. Skill Hours are reserved by the exchange workflow.", timestamp: now, actorId: userId }];
    const escrow = { id: escrowId, exchangeId, status: "locked", participants, participantIds: [exchange.requesterId, exchange.providerId], timeline, createdAt: now, updatedAt: now };
    await sql.transaction(tx => [
      tx.query("insert into escrows (id,exchange_id,status,participants,timeline,created_at,updated_at,payload) values ($1,$2,'locked',$3::jsonb,$4::jsonb,$5,$5,$6::jsonb)", [escrowId, exchangeId, JSON.stringify(participants), JSON.stringify(timeline), now, JSON.stringify(escrow)]),
      tx.query("update exchanges set payload=payload || $3::jsonb,updated_at=$4 where id=$1 and (requester_id=$2 or provider_id=$2)", [exchangeId, userId, JSON.stringify({ escrowId }), now]),
    ]);
    revalidatePath(`/dashboard/exchanges/${exchangeId}`);
    return { success: true, escrowId };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Unable to initialize escrow" };
  }
}

export async function processDeposit(escrowId: string) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return { success: false, error: "Unauthorized" };
    const owned = await ownedEscrow(escrowId, userId);
    if (!owned) return { success: false, error: "Escrow not found" };
    const escrow = owned.escrow;
    if (escrow.participants[userId].depositStatus === "received") return { success: true, status: escrow.status };
    escrow.participants[userId].depositStatus = "received";
    const now = new Date().toISOString();
    escrow.timeline.push({ id: crypto.randomUUID(), type: "deposit_received", message: `$${escrow.participants[userId].securityDepositAmount} Security Deposit received.`, timestamp: now, actorId: userId });
    if (Object.values(escrow.participants).every(participant => participant.depositStatus === "received") && escrow.status === "pending_deposits") {
      escrow.status = "locked";
      escrow.timeline.push({ id: crypto.randomUUID(), type: "created", message: "All deposits received. Contract is now locked and active.", timestamp: now });
    }
    await saveEscrow(owned.row, escrow);
    revalidatePath(`/dashboard/escrow/${escrowId}`);
    return { success: true, status: escrow.status };
  } catch (error) { return { success: false, error: error instanceof Error ? error.message : "Unable to process deposit" }; }
}

export async function submitDeliverables(_escrowId: string) {
  void _escrowId;
  const userId = await getCurrentUserId();
  return userId ? { success: false, error: "Submit deliverables from the exchange workspace" } : { success: false, error: "Unauthorized" };
}

export async function approveDeliverables(escrowId: string, partnerId: string) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return { success: false, error: "Unauthorized" };
    const owned = await ownedEscrow(escrowId, userId);
    if (!owned || !owned.escrow.participants[partnerId] || partnerId === userId) return { success: false, error: "Not an escrow participant" };
    const escrow = owned.escrow;
    if (escrow.participants[partnerId].deliverablesStatus !== "submitted") return { success: false, error: "Partner has not submitted deliverables yet" };
    escrow.participants[partnerId].deliverablesStatus = "approved";
    escrow.participants[userId].approvalStatus = "approved";
    escrow.timeline.push({ id: crypto.randomUUID(), type: "approved", message: "Partner deliverables approved.", timestamp: new Date().toISOString(), actorId: userId });
    await saveEscrow(owned.row, escrow);
    revalidatePath(`/dashboard/escrow/${escrowId}`);
    return { success: true };
  } catch (error) { return { success: false, error: error instanceof Error ? error.message : "Unable to approve deliverables" }; }
}

export async function releaseEscrow(escrowId: string) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return { success: false, error: "Unauthorized" };
    const owned = await ownedEscrow(escrowId, userId);
    if (!owned) return { success: false, error: "Escrow not found" };
    const escrow = owned.escrow;
    if (escrow.status === "released") return { success: false, error: "Escrow already released" };
    const [exchange] = await sql.query("select id from exchanges where id=$1 and status='completed'", [escrow.exchangeId]);
    if (!exchange) return { success: false, error: "Complete the exchange from its workspace first" };
    for (const participant of Object.values(escrow.participants)) participant.depositStatus = "returned";
    escrow.status = "released";
    escrow.timeline.push({ id: crypto.randomUUID(), type: "released", message: "Escrow successfully released. Deposits returned and Skill Hours transferred.", timestamp: new Date().toISOString(), actorId: "system" });
    await saveEscrow(owned.row, escrow);
    revalidatePath(`/dashboard/escrow/${escrowId}`);
    return { success: true };
  } catch (error) { return { success: false, error: error instanceof Error ? error.message : "Unable to release escrow" }; }
}

export async function openDispute(escrowId: string, reason: string, details: string) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return { success: false, error: "Unauthorized" };
    if (typeof reason !== "string" || typeof details !== "string" || !reason.trim() || !details.trim() || reason.length > 500 || details.length > 5000) return { success: false, error: "Invalid dispute" };
    const owned = await ownedEscrow(escrowId, userId);
    if (!owned) return { success: false, error: "Escrow not found" };
    const now = new Date().toISOString();
    if (owned.escrow.status === "disputed") return { success: false, error: "A dispute is already open" };
    if (["released", "refunded"].includes(owned.escrow.status)) return { success: false, error: "This escrow can no longer be disputed" };
    owned.escrow.status = "disputed";
    owned.escrow.dispute = { reason: reason.trim(), details: details.trim(), openedAt: now, status: "investigating", evidenceUrls: [] };
    owned.escrow.timeline.push({ id: crypto.randomUUID(), type: "disputed", message: `Dispute opened: ${reason.trim()}`, timestamp: now, actorId: userId });
    const activityId = crypto.randomUUID();
    const notificationId = crypto.randomUUID();
    const updatedPayload = JSON.stringify({ ...owned.escrow, updatedAt: now });
    const message = `A dispute was opened for \"${String(owned.row.payload && typeof owned.row.payload === "object" && "title" in owned.row.payload ? owned.row.payload.title : "your exchange")}\".`;
    const rows = await sql.query(
      `with updated_escrow as (
         update escrows s set status='disputed',timeline=$2::jsonb,dispute=$3::jsonb,updated_at=$4,payload=$5::jsonb
         where s.id=$1 and s.updated_at is not distinct from $6 and s.status not in ('released','refunded','disputed') and exists (
           select 1 from exchanges e where e.id=s.exchange_id and (e.requester_id=$7 or e.provider_id=$7) and e.status in ('in_progress','in_review','revision_requested')
         ) returning s.exchange_id
       ), updated_exchange as (
         update exchanges e set status='disputed',updated_at=$4,payload=e.payload || jsonb_build_object('status','disputed','dispute',$3::jsonb,'updatedAt',$4)
         where e.id in(select exchange_id from updated_escrow) returning e.id,e.requester_id,e.provider_id
       ), activity as (
         insert into exchange_activity (id,exchange_id,actor_id,event_type,description,occurred_at,payload)
         select $8,id,$7,'dispute_opened',$9,$4,$10::jsonb from updated_exchange returning id
       ), notified as (
         insert into notifications (id,source_path,user_id,notification_type,title,message,is_read,is_archived,link,related_id,created_at,payload)
         select $11,$12,case when requester_id=$7 then provider_id else requester_id end,'request_update','Dispute Opened',$13,false,false,$14,id,$4,$15::jsonb from updated_exchange returning id
       ) select id from updated_exchange`,
      [escrowId, JSON.stringify(owned.escrow.timeline), JSON.stringify(owned.escrow.dispute), now, updatedPayload, owned.row.updated_at ?? null, userId, activityId, `Dispute opened: ${reason.trim()}`, JSON.stringify({ type: "dispute_opened", description: `Dispute opened: ${reason.trim()}`, timestamp: now }), notificationId, `notifications/${notificationId}`, message, `/exchanges/${owned.escrow.exchangeId}`, JSON.stringify({ type: "request_update", title: "Dispute Opened", message: "A dispute was opened for your exchange.", isRead: false, link: `/exchanges/${owned.escrow.exchangeId}`, createdAt: now })],
    );
    if (!rows.length) throw new Error("Exchange changed or cannot be disputed in its current state. Please refresh and try again.");
    revalidatePath(`/dashboard/escrow/${escrowId}`);
    revalidatePath(`/exchanges/${owned.escrow.exchangeId}`);
    return { success: true };
  } catch (error) { return { success: false, error: error instanceof Error ? error.message : "Unable to open dispute" }; }
}
