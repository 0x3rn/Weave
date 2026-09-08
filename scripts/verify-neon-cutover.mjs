import { neon } from "@neondatabase/serverless";

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required.");
const sql = neon(process.env.DATABASE_URL);
const failures = [];

const functions = await sql.query("select proname from pg_proc join pg_namespace n on n.oid=pronamespace where n.nspname='public' and proname=any($1::text[])", [["create_exchange_from_application", "complete_exchange_delivery"]]);
if (functions.length !== 2) failures.push("Exchange workflow functions are missing");

const [storage] = await sql.query("select count(*)::int as total,count(*) filter(where migrated_at is not null and target_bucket is not null and target_key is not null)::int as migrated from firebase_storage_objects");
if (Number(storage.total) !== Number(storage.migrated)) failures.push("One or more storage objects were not migrated");

const payloadTables = ["users", "invite_applications", "invites", "marketplace_requests", "marketplace_applications", "exchange_requests", "exchanges", "exchange_deliveries", "exchange_activity", "escrows", "ledger_entries", "conversations", "messages", "reviews", "notifications", "user_devices", "portfolio_items"];
let legacyPayloadReferences = 0;
for (const table of payloadTables) {
  const [row] = await sql.query(`select count(*)::int as count from ${table} where payload::text like '%storage.googleapis.com%' or payload::text like '%firebasestorage.googleapis.com%' or payload::text like '%gs://%'`);
  legacyPayloadReferences += Number(row.count);
}
const [legacyColumns] = await sql.query("select (select count(*) from users where photo_url like '%storage.googleapis.com%' or photo_url like '%firebasestorage.googleapis.com%' or photo_url like 'gs://%') + (select count(*) from portfolio_items where image_url like '%storage.googleapis.com%' or image_url like '%firebasestorage.googleapis.com%' or image_url like 'gs://%') as count");
if (legacyPayloadReferences + Number(legacyColumns.count) > 0) failures.push("Legacy Firebase Storage URLs remain in application records");

const integrityChecks = {
  applicationsWithoutRequest: "select count(*)::int as count from marketplace_applications a left join marketplace_requests r on r.id=a.request_id where r.id is null",
  exchangesWithoutParticipant: "select count(*)::int as count from exchanges e left join users r on r.id=e.requester_id left join users p on p.id=e.provider_id where r.id is null or p.id is null",
  deliveriesWithoutExchange: "select count(*)::int as count from exchange_deliveries d left join exchanges e on e.id=d.exchange_id where e.id is null",
  notificationsWithoutUser: "select count(*)::int as count from notifications n left join users u on u.id=n.user_id where u.id is null",
  portfolioWithoutUser: "select count(*)::int as count from portfolio_items p left join users u on u.id=p.user_id where u.id is null",
};
const integrity = {};
for (const [name, query] of Object.entries(integrityChecks)) {
  const [row] = await sql.query(query);
  integrity[name] = Number(row.count);
  if (integrity[name] !== 0) failures.push(`${name}: ${integrity[name]}`);
}

const summary = {
  workflowFunctions: functions.map(row => row.proname).sort(),
  storageObjects: { total: Number(storage.total), migrated: Number(storage.migrated) },
  legacyStorageReferences: legacyPayloadReferences + Number(legacyColumns.count),
  integrity,
};
console.log(JSON.stringify(summary, null, 2));
if (failures.length) throw new Error(`Cutover verification failed: ${failures.join("; ")}`);
