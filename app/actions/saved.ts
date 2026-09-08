"use server";

import { sql } from "@/lib/neon";
import { DEMO_SAVED_ITEMS, USE_DEMO_MARKETPLACE } from "@/lib/demo-marketplace-data";
import { getCurrentUserId } from "./user";

export async function toggleSavedItem(targetId: string, type: "professional" | "request") {
  if (USE_DEMO_MARKETPLACE) return { success: true, saved: true };
  const userId = await getCurrentUserId();
  if (!userId || !targetId || targetId.length > 200) return { success: false, error: "Unauthorized" };
  const deleted = await sql.query("delete from saved_items where user_id=$1 and target_id=$2 returning target_id", [userId, targetId]);
  if (deleted.length) return { success: true, saved: false };
  const savedAt = new Date().toISOString();
  await sql.query("insert into saved_items (user_id,target_id,target_type,saved_at,payload) values ($1,$2,$3,$4,$5::jsonb) on conflict (user_id,target_id) do nothing", [userId, targetId, type, savedAt, JSON.stringify({ type, savedAt })]);
  return { success: true, saved: true };
}

export async function getSavedItemIds() {
  if (USE_DEMO_MARKETPLACE) return DEMO_SAVED_ITEMS;
  const userId = await getCurrentUserId();
  if (!userId) return [];
  const rows = await sql.query("select target_id,target_type from saved_items where user_id=$1 order by saved_at desc", [userId]);
  return rows.map(row => ({ id: String(row.target_id), type: String(row.target_type) }));
}
