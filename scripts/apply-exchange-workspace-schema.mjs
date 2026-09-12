import { readFile } from "node:fs/promises";
import { neon } from "@neondatabase/serverless";

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required.");

const source = await readFile("database/migrations/0004_exchange_workspace.sql", "utf8");
const forbidden = /\b(drop|truncate|alter\s+table|delete\s+from)\b/i;
if (forbidden.test(source)) throw new Error("The workspace migration contains a forbidden destructive statement.");

function splitStatements(sqlSource) {
  const statements = [];
  let current = "";
  let quote = false;
  let dollar = false;
  for (let index = 0; index < sqlSource.length; index++) {
    const char = sqlSource[index];
    const next = sqlSource[index + 1];
    if (!quote && char === "$" && next === "$") { dollar = !dollar; current += "$$"; index++; continue; }
    if (!dollar && char === "'") {
      current += char;
      if (quote && next === "'") { current += next; index++; } else quote = !quote;
      continue;
    }
    if (char === ";" && !quote && !dollar) { if (current.trim()) statements.push(current.trim()); current = ""; } else current += char;
  }
  if (current.trim()) statements.push(current.trim());
  return statements;
}

const statements = splitStatements(source);
const db = neon(process.env.DATABASE_URL);
await db.transaction(statements.map(statement => db.query(statement)));
const [verification] = await db.query("select to_regclass('public.exchange_milestones') as milestones, to_regclass('public.exchange_notes') as notes, to_regprocedure('cancel_exchange_before_work(text,text,text,text,text,text,text,text,timestamptz)') as cancellation, to_regprocedure('submit_exchange_delivery(text,text,text,text,text,jsonb,text,timestamptz)') as delivery, to_regprocedure('resolve_exchange_dispute(text,text,integer,integer,text,text,text,text,text,text,timestamptz)') as resolution");
if (!verification?.milestones || !verification?.notes || !verification?.cancellation || !verification?.delivery || !verification?.resolution) throw new Error("Workspace schema verification failed.");
console.log("Applied and verified the additive exchange workspace schema.");
