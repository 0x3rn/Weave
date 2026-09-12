"use server";

import { payload, sql, iso } from "@/lib/neon";
import { Exchange, ExchangeDeliverable } from "@/types";
import { revalidatePath } from "next/cache";
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

    const now = new Date().toISOString();
    const ids = Array.from({ length: 3 }, () => crypto.randomUUID());
    const [row] = await sql.query(
      "select submit_exchange_delivery($1,$2,$3,$4,$5,$6::jsonb,$7,$8) as version",
      [userId, exchangeId, ids[0], ids[1], ids[2], JSON.stringify(files), comments.trim(), now],
    );
    revalidatePath(`/exchanges/${exchangeId}`);
    revalidatePath(`/exchanges/${exchangeId}/files`);
    return { success: true, version: Number(row.version) };
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
