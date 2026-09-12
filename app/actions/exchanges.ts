"use server";

import { iso, payload, sql } from "@/lib/neon";
import { getUserById } from "@/lib/users";
import { Exchange, ExchangeRequest } from "@/types";
import { getCurrentUserId } from "./user";

function requestFromRow(row: Record<string, unknown>): ExchangeRequest {
  return {
    ...payload<Record<string, unknown>>(row.payload), id: String(row.id), senderId: String(row.sender_id ?? ""), receiverId: String(row.receiver_id ?? ""),
    skillNeeded: String(row.skill_needed ?? ""), dateOptions: Array.isArray(row.date_options) ? row.date_options as string[] : [], timeNeeded: String(row.time_needed ?? ""),
    hoursNeeded: row.hours_needed == null ? undefined : Number(row.hours_needed), message: row.message ? String(row.message) : undefined,
    status: String(row.status ?? "pending") as ExchangeRequest["status"], createdAt: iso(row.created_at), updatedAt: iso(row.updated_at),
  } as ExchangeRequest;
}

function exchangeFromRow(row: Record<string, unknown>): Exchange {
  return {
    ...payload<Record<string, unknown>>(row.payload), id: String(row.id), requestId: row.marketplace_request_id ? String(row.marketplace_request_id) : undefined,
    applicationId: row.marketplace_application_id ? String(row.marketplace_application_id) : undefined, requesterId: String(row.requester_id ?? ""), providerId: String(row.provider_id ?? ""),
    title: String(row.title ?? ""), skillHours: Number(row.skill_hours ?? 0), requesterEscrowHours: Number(row.requester_escrow_hours ?? 0), providerEscrowHours: Number(row.provider_escrow_hours ?? 0),
    status: String(row.status ?? "") as Exchange["status"], isMutual: row.is_mutual === true, deadline: iso(row.deadline_at), progress: Number(row.progress ?? 0), createdAt: iso(row.created_at), completedAt: iso(row.completed_at), updatedAt: iso(row.updated_at),
  } as Exchange;
}

export async function createExchangeRequest(data: Omit<ExchangeRequest, "id" | "status" | "createdAt" | "updatedAt">) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return { success: false, error: "Unauthorized" };
    if (!data || data.senderId !== userId || !data.receiverId || data.receiverId === userId || typeof data.skillNeeded !== "string" || !data.skillNeeded.trim() || data.skillNeeded.length > 120 || !Array.isArray(data.dateOptions) || data.dateOptions.length > 10 || data.dateOptions.some(date => typeof date !== "string" || date.length > 32) || (data.message && data.message.length > 2000) || (data.hoursNeeded !== undefined && (!Number.isInteger(data.hoursNeeded) || data.hoursNeeded < 1 || data.hoursNeeded > 1000))) return { success: false, error: "Invalid exchange request" };
    const id = crypto.randomUUID();
    const notificationId = crypto.randomUUID();
    const now = new Date().toISOString();
    const request = { ...data, id, skillNeeded: data.skillNeeded.trim(), status: "pending", createdAt: now, updatedAt: now };
    const notification = { id: notificationId, userId: data.receiverId, type: "exchange_request", title: "New Exchange Request", message: `You have a new request for ${request.skillNeeded}.`, isRead: false, relatedId: id, createdAt: now };
    const rows = await sql.query(
      `with recipient as (select id from users where id=$2), inserted as (
        insert into exchange_requests (id,sender_id,receiver_id,skill_needed,date_options,time_needed,hours_needed,message,status,created_at,updated_at,payload)
        select $1,$3,$2,$4,$5::jsonb,$6,$7,$8,'pending',$9,$9,$10::jsonb from recipient returning id
      ), notified as (insert into notifications (id,source_path,user_id,notification_type,title,message,is_read,is_archived,related_id,created_at,payload)
        select $11,$12,$2,'exchange_request','New Exchange Request',$13,false,false,$1,$9,$14::jsonb from inserted returning id)
      select id from inserted`,
      [id, data.receiverId, userId, request.skillNeeded, JSON.stringify(data.dateOptions), data.timeNeeded ?? null, data.hoursNeeded ?? null, data.message?.trim() ?? null, now, JSON.stringify(request), notificationId, `notifications/${notificationId}`, notification.message, JSON.stringify(notification)],
    );
    return rows.length ? { success: true, id } : { success: false, error: "Recipient not found" };
  } catch (error) { return { success: false, error: error instanceof Error ? error.message : "Unable to create exchange request" }; }
}

export async function updateExchangeRequest(requestId: string, status: string, message?: string, updates?: Partial<ExchangeRequest>) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return { success: false, error: "Unauthorized" };
    if (!["reviewing", "accepted", "rejected"].includes(status) || (message && message.length > 2000)) return { success: false, error: "Invalid request update" };
    const [row] = await sql.query("select * from exchange_requests where id=$1 and receiver_id=$2 and status not in ('accepted','rejected')", [requestId, userId]);
    if (!row) return { success: false, error: "Request not found or unauthorized" };
    const request = requestFromRow(row);
    const changes: Record<string, unknown> = { status, updatedAt: new Date().toISOString() };
    if (updates?.hoursNeeded !== undefined && Number.isInteger(updates.hoursNeeded) && updates.hoursNeeded > 0 && updates.hoursNeeded <= 1000) changes.hoursNeeded = updates.hoursNeeded;
    if (typeof updates?.timeNeeded === "string" && updates.timeNeeded.length <= 32) changes.timeNeeded = updates.timeNeeded;
    if (Array.isArray(updates?.dateOptions) && updates.dateOptions.length <= 10 && updates.dateOptions.every(date => typeof date === "string" && date.length <= 32)) changes.dateOptions = updates.dateOptions;
    const now = String(changes.updatedAt);
    let notificationMessage = `Your request for ${request.skillNeeded} was ${status}.`;
    if (status === "reviewing") notificationMessage = `The provider has countered your request for ${request.skillNeeded}.`;
    if (message) notificationMessage += ` Message: ${message.trim()}`;
    const notificationId = crypto.randomUUID();
    const nextPayload = { ...payload<Record<string, unknown>>(row.payload), ...changes };
    await sql.transaction(tx => [
      tx.query("update exchange_requests set status=$3,time_needed=$4,hours_needed=$5,date_options=$6::jsonb,updated_at=$7,payload=$8::jsonb where id=$1 and receiver_id=$2", [requestId, userId, status, nextPayload.timeNeeded ?? row.time_needed, nextPayload.hoursNeeded ?? row.hours_needed, JSON.stringify(nextPayload.dateOptions ?? row.date_options), now, JSON.stringify(nextPayload)]),
      tx.query("insert into notifications (id,source_path,user_id,notification_type,title,message,is_read,is_archived,related_id,created_at,payload) values ($1,$2,$3,'request_update',$4,$5,false,false,$6,$7,$8::jsonb)", [notificationId, `notifications/${notificationId}`, request.senderId, `Request ${status === "reviewing" ? "Update" : status}`, notificationMessage, requestId, now, JSON.stringify({ type: "request_update", title: `Request ${status}`, message: notificationMessage, isRead: false, relatedId: requestId, createdAt: now })]),
    ]);
    return { success: true };
  } catch (error) { return { success: false, error: error instanceof Error ? error.message : "Unable to update request" }; }
}

export async function getExchangeRequests(userId: string, role: "sender" | "receiver") {
  const currentUserId = await getCurrentUserId();
  if (!currentUserId || currentUserId !== userId) return { success: false, error: "Unauthorized", requests: [] };
  const column = role === "sender" ? "sender_id" : "receiver_id";
  const rows = await sql.query(`select * from exchange_requests where ${column}=$1 order by created_at desc`, [userId]);
  return { success: true, requests: rows.map(row => requestFromRow(row)) };
}

export async function createExchangeFromApplication(applicationId: string) {
  const userId = await getCurrentUserId();
  if (!userId) return { success: false, error: "Unauthorized" };
  try {
    const ids = Array.from({ length: 7 }, () => crypto.randomUUID());
    const [row] = await sql.query("select create_exchange_from_application($1,$2,$3,$4,$5,$6,$7,$8,$9) as exchange_id", [userId, applicationId, ids[0], ids[1], ids[2], ids[3], ids[4], ids[5], new Date().toISOString()]);
    return { success: true, exchangeId: String(row.exchange_id) };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message.replace(/^.*error:\s*/i, "") : "Failed to create exchange" };
  }
}

export async function getExchange(exchangeId: string) {
  const userId = await getCurrentUserId();
  if (!userId) return { success: false, error: "Unauthorized" };
  const [row] = await sql.query("select * from exchanges where id=$1 and (requester_id=$2 or provider_id=$2)", [exchangeId, userId]);
  if (!row) return { success: false, error: "Exchange not found or unauthorized" };
  const exchange = exchangeFromRow(row);
  const [requester, provider] = await Promise.all([getUserById(exchange.requesterId), getUserById(exchange.providerId)]);
  return { success: true, exchange, requester: { id: exchange.requesterId, username: requester?.username || "", name: requester?.fullName || requester?.username || "Unknown", avatar: requester?.photoURL || null, timezone: requester?.timeZone || "UTC" }, provider: { id: exchange.providerId, username: provider?.username || "", name: provider?.fullName || provider?.username || "Unknown", avatar: provider?.photoURL || null, timezone: provider?.timeZone || "UTC" } };
}

export async function requestRevision(exchangeId: string, message: string) {
  const userId = await getCurrentUserId();
  if (!userId) return { success: false, error: "Unauthorized" };
  if (typeof message !== "string" || !message.trim() || message.length > 3000) return { success: false, error: "Invalid revision request" };
  const now = new Date().toISOString();
  const activityId = crypto.randomUUID();
  const notificationId = crypto.randomUUID();
  const rows = await sql.query(
    `with updated as (update exchanges set status='revision_requested',updated_at=$4,payload=payload || $5::jsonb where id=$1 and requester_id=$2 and status='in_review' returning id,provider_id,title),
     activity as (insert into exchange_activity (id,exchange_id,actor_id,event_type,description,occurred_at,payload) select $6,id,$2,'revision_requested',$7,$4,$8::jsonb from updated returning id),
     notified as (insert into notifications (id,source_path,user_id,notification_type,title,message,is_read,is_archived,link,related_id,created_at,payload) select $9,$10,provider_id,'revision_requested','Revisions Requested','Revisions were requested for "'||title||'".',false,false,'/exchanges/'||id,id,$4,$11::jsonb from updated returning id)
     select id from updated`,
    [exchangeId, userId, message.trim(), now, JSON.stringify({ status: "revision_requested", providerSubmittedAt: null, updatedAt: now }), activityId, `Requester asked for revisions: "${message.trim()}"`, JSON.stringify({ type: "revision_requested", description: `Requester asked for revisions: "${message.trim()}"`, timestamp: now }), notificationId, `notifications/${notificationId}`, JSON.stringify({ type: "revision_requested", title: "Revisions Requested", message: "Revisions were requested.", isRead: false, link: `/exchanges/${exchangeId}`, createdAt: now })],
  );
  return rows.length ? { success: true } : { success: false, error: "Exchange must be in review and owned by the requester" };
}

export async function acceptDelivery(exchangeId: string) {
  const userId = await getCurrentUserId();
  if (!userId) return { success: false, error: "Unauthorized" };
  try {
    const ids = Array.from({ length: 5 }, () => crypto.randomUUID());
    const now = new Date().toISOString();
    const [completionRows] = await sql.transaction(tx => [
      tx.query("select complete_exchange_delivery($1,$2,$3,$4,$5,$6,$7,$8) as result", [userId, exchangeId, ids[0], ids[1], ids[2], ids[3], ids[4], now]),
      tx.query("update ledger_entries set entry_status='Completed',payload=payload || '{\"status\":\"Completed\"}'::jsonb where exchange_id=$1 and entry_type='Reserved' and entry_status='Active' and exists(select 1 from exchanges where id=$1 and status='completed')", [exchangeId]),
    ]);
    return { success: true, status: String(completionRows[0]?.result) };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message.replace(/^.*error:\s*/i, "") : "Unable to accept delivery" };
  }
}
