import { neon } from "@neondatabase/serverless";

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required.");
if (process.env.STORAGE_REFERENCE_APPLY !== "true") throw new Error("Set STORAGE_REFERENCE_APPLY=true to rewrite storage references.");

const sql = neon(process.env.DATABASE_URL);
const objects = await sql.query("select path,bucket,target_bucket,target_key from firebase_storage_objects where migrated_at is not null and target_bucket is not null and target_key is not null");
const mappings = objects.map(object => {
  const path = String(object.path);
  const bucket = String(object.bucket);
  const targetKey = String(object.target_key);
  const isPublic = object.target_bucket === process.env.NEON_STORAGE_PUBLIC_BUCKET;
  const route = `/api/storage/${isPublic ? "public" : "private"}/${targetKey.split("/").map(encodeURIComponent).join("/")}`;
  return {
    route,
    path,
    sources: [
      `gs://${bucket}/${path}`,
      `https://storage.googleapis.com/${bucket}/${path}`,
      `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodeURIComponent(path)}`,
    ],
  };
});

function rewrite(value) {
  let changed = false;
  const visit = current => {
    if (typeof current === "string") {
      for (const mapping of mappings) {
        if (mapping.sources.some(source => current === source || current.startsWith(`${source}?`))) {
          changed = true;
          return mapping.route;
        }
      }
      return current;
    }
    if (Array.isArray(current)) return current.map(visit);
    if (current && typeof current === "object") return Object.fromEntries(Object.entries(current).map(([key, child]) => [key, visit(child)]));
    return current;
  };
  return { value: visit(value), changed };
}

const tables = [
  "users", "invite_applications", "invites", "marketplace_requests", "marketplace_applications", "exchange_requests", "exchanges",
  "exchange_deliveries", "exchange_activity", "escrows", "ledger_entries", "conversations", "messages", "reviews", "notifications", "user_devices", "portfolio_items",
];

let updatedPayloads = 0;
for (const table of tables) {
  const rows = await sql.query(`select id,payload from ${table}`);
  for (const row of rows) {
    const result = rewrite(row.payload);
    if (!result.changed) continue;
    await sql.query(`update ${table} set payload=$2::jsonb where id=$1`, [row.id, JSON.stringify(result.value)]);
    updatedPayloads++;
  }
}

const userRows = await sql.query("select id,photo_url from users where photo_url is not null");
let updatedColumns = 0;
for (const row of userRows) {
  const result = rewrite(row.photo_url);
  if (result.changed) {
    await sql.query("update users set photo_url=$2 where id=$1", [row.id, result.value]);
    updatedColumns++;
  }
}
const portfolioRows = await sql.query("select id,image_url from portfolio_items where image_url is not null");
for (const row of portfolioRows) {
  const result = rewrite(row.image_url);
  if (result.changed) {
    await sql.query("update portfolio_items set image_url=$2 where id=$1", [row.id, result.value]);
    updatedColumns++;
  }
}

console.log(JSON.stringify({ migratedObjects: mappings.length, updatedPayloads, updatedColumns }));
