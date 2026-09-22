import { randomUUID } from "node:crypto";
import { neon } from "@neondatabase/serverless";

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required.");
const db = neon(process.env.DATABASE_URL);
const id = `escrow-payload-verification-${randomUUID()}`;
const now = new Date().toISOString();
const [guard] = await db.query(
  "select to_regprocedure($1) is not null as function_present, exists(select 1 from pg_trigger where tgrelid=$2::regclass and tgname=$3) as trigger_present",
  ["public.normalize_escrow_payload()", "public.escrows", "escrows_normalize_payload"],
);
if (!guard?.function_present || !guard?.trigger_present) throw new Error("Escrow payload guard is missing.");
const duplicate = {
  id: "wrong-id", exchangeId: "wrong-exchange", status: "wrong-status",
  participants: { wrong: true }, participantIds: ["wrong"], timeline: ["wrong"],
  dispute: { wrong: true }, createdAt: "wrong", updatedAt: "wrong",
  legacyNote: "retained",
};

const [inserted, updated, deleted] = await db.transaction([
  db.query("insert into escrows(id,status,participants,timeline,created_at,updated_at,payload) values($1,'locked','{}'::jsonb,'[]'::jsonb,$2,$2,$3::jsonb) returning payload", [id, now, JSON.stringify(duplicate)]),
  db.query("update escrows set status='released',updated_at=$2,payload=payload || $3::jsonb where id=$1 returning status,payload", [id, now, JSON.stringify({ status: "wrong-again", updatedAt: "wrong-again" })]),
  db.query("delete from escrows where id=$1 returning id", [id]),
]);

const first = inserted[0]?.payload;
const second = updated[0]?.payload;
if (JSON.stringify(first) !== JSON.stringify({ legacyNote: "retained" }) ||
    JSON.stringify(second) !== JSON.stringify({ legacyNote: "retained" }) ||
    updated[0]?.status !== "released" || deleted[0]?.id !== id) {
  throw new Error("Escrow payload normalization failed.");
}
console.log("Escrow columns remain authoritative; extra metadata survives; test row removed.");
