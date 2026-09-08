"use server";

import { payload, sql, iso } from "@/lib/neon";
import { Exchange, ExchangeDeliverable } from "@/types";
import { getCurrentUserId } from "./user";

function exchangeFromRow(row: Record<string, unknown>): Exchange {
  return {
    ...payload<Record<string, unknown>>(row.payload),
    id: String(row.id),
    requesterId: String(row.requester_id ?? ""),
    providerId: String(row.provider_id ?? ""),
    title: String(row.title ?? ""),
    status: String(row.status ?? "") as Exchange["status"],
    isMutual: row.is_mutual === true,
  } as Exchange;
}

export async function submitDeliverable(exchangeId: string, files: { name: string; url: string; type: string; size: number }[], comments: string) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return { success: false, error: "Unauthorized" };
    if (!Array.isArray(files) || files.length === 0 || files.length > 20 || typeof comments !== "string" || comments.length > 5000) return { success: false, error: "Invalid deliverable" };
    const expectedPrefix = `/api/storage/private/exchanges/${encodeURIComponent(exchangeId)}/`;
    if (files.some(file => !file || typeof file.name !== "string" || file.name.length > 255 || typeof file.type !== "string" || typeof file.url !== "string" || !file.url.startsWith(expectedPrefix) || !Number.isFinite(file.size) || file.size < 0 || file.size > 5 * 1024 * 1024)) {
      return { success: false, error: "Invalid delivery file" };
    }

    const [exchangeRow] = await sql.query("select * from exchanges where id=$1", [exchangeId]);
    if (!exchangeRow) return { success: false, error: "Exchange not found" };
    const exchange = exchangeFromRow(exchangeRow);
    if (!exchange.isMutual && exchange.providerId !== userId) return { success: false, error: "Only the provider can submit deliverables" };
    if (exchange.isMutual && exchange.providerId !== userId && exchange.requesterId !== userId) return { success: false, error: "You are not part of this exchange" };

    const [countRow] = await sql.query("select count(*)::int as count from exchange_deliveries where exchange_id=$1", [exchangeId]);
    const version = Number(countRow?.count ?? 0) + 1;
    const now = new Date().toISOString();
    const deliveryId = crypto.randomUUID();
    const updates: Record<string, unknown> = { updatedAt: now };
    let status = exchange.status;
    if (exchange.isMutual) {
      if (userId === exchange.providerId) updates.providerSubmittedAt = now;
      else updates.requesterSubmittedAt = now;
      const existing = payload<Record<string, unknown>>(exchangeRow.payload);
      if ((updates.providerSubmittedAt || existing.providerSubmittedAt) && (updates.requesterSubmittedAt || existing.requesterSubmittedAt)) status = "in_review";
    } else {
      updates.providerSubmittedAt = now;
      status = "in_review";
    }
    updates.status = status;
    const delivery = { version, files, comments: comments.trim(), submittedBy: userId, uploadedAt: now };
    const otherUserId = userId === exchange.providerId ? exchange.requesterId : exchange.providerId;
    const activityId = crypto.randomUUID();
    const notificationId = crypto.randomUUID();
    const actorName = userId === exchange.providerId ? "Provider" : "Requester";
    await sql.transaction(tx => [
      tx.query("insert into exchange_deliveries (id,exchange_id,submitted_by,version,files,comments,submitted_at,payload) values ($1,$2,$3,$4,$5::jsonb,$6,$7,$8::jsonb)", [deliveryId, exchangeId, userId, version, JSON.stringify(files), comments.trim(), now, JSON.stringify(delivery)]),
      tx.query("update exchanges set status=$2,updated_at=$3,payload=payload || $4::jsonb where id=$1 and (requester_id=$5 or provider_id=$5)", [exchangeId, status, now, JSON.stringify(updates), userId]),
      tx.query("insert into exchange_activity (id,exchange_id,actor_id,event_type,description,occurred_at,payload) values ($1,$2,$3,'files_uploaded',$4,$5,$6::jsonb)", [activityId, exchangeId, userId, `${actorName} submitted deliverables (Version ${version}).`, now, JSON.stringify({ type: "files_uploaded", description: `${actorName} submitted deliverables (Version ${version}).`, timestamp: now })]),
      tx.query("insert into notifications (id,source_path,user_id,notification_type,title,message,is_read,is_archived,link,related_id,created_at,payload) values ($1,$2,$3,'request_update','Work Submitted',$4,false,false,$5,$6,$7,$8::jsonb)", [notificationId, `users/${otherUserId}/notifications/${notificationId}`, otherUserId, `Deliverables have been submitted for '${exchange.title}'. Check your workspace.`, `/exchanges/${exchangeId}/files`, exchangeId, now, JSON.stringify({ type: "request_update", title: "Work Submitted", message: `Deliverables have been submitted for '${exchange.title}'. Check your workspace.`, isRead: false, link: `/exchanges/${exchangeId}/files`, createdAt: now })]),
    ]);
    return { success: true };
  } catch (error) {
    console.error("Error submitting deliverable", error);
    return { success: false, error: error instanceof Error ? error.message : "Unable to submit deliverable" };
  }
}

export async function getDeliverables(exchangeId: string) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return { success: false, error: "Unauthorized", deliveries: [] };
    const [exchange] = await sql.query("select id from exchanges where id=$1 and (requester_id=$2 or provider_id=$2)", [exchangeId, userId]);
    if (!exchange) return { success: false, error: "Unauthorized", deliveries: [] };
    const rows = await sql.query("select * from exchange_deliveries where exchange_id=$1 order by version desc", [exchangeId]);
    const deliveries = rows.map(row => ({
      ...payload<Record<string, unknown>>(row.payload),
      id: String(row.id),
      version: Number(row.version ?? 0),
      files: Array.isArray(row.files) ? row.files : [],
      comments: String(row.comments ?? ""),
      submittedBy: String(row.submitted_by ?? ""),
      uploadedAt: iso(row.submitted_at),
    })) as ExchangeDeliverable[];
    return { success: true, deliveries };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Unable to load deliverables", deliveries: [] };
  }
}
