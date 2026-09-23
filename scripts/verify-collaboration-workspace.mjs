import { readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { neon } from "@neondatabase/serverless";

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");
const db = neon(process.env.DATABASE_URL);
const source = readFileSync(new URL("../app/actions/exchange-workspace.ts", import.meta.url), "utf8");

function milestoneQuery(action) {
  const actionStart = source.indexOf(`export async function ${action}(`);
  const queryStart = source.indexOf("const rows = await sql.query(\n    `", actionStart);
  const bodyStart = queryStart + "const rows = await sql.query(\n    `".length;
  const bodyEnd = source.indexOf("`,\n    [", bodyStart);
  if (actionStart < 0 || queryStart < 0 || bodyEnd < 0) throw new Error(`Could not locate ${action} SQL`);
  return source.slice(bodyStart, bodyEnd);
}

const createQuery = milestoneQuery("createExchangeMilestone");
const updateQuery = milestoneQuery("updateExchangeMilestone");
const suffix = randomUUID();
const requester = `codex-collab-requester-${suffix}`;
const provider = `codex-collab-provider-${suffix}`;
const exchange = `codex-collab-exchange-${suffix}`;
const milestone = `codex-collab-milestone-${suffix}`;
const createdCard = `codex-collab-created-${suffix}`;
const completedCard = `codex-collab-completed-${suffix}`;
const now = new Date().toISOString();

try {
  await db.transaction([
    db.query("insert into users(id,username,full_name,created_at,updated_at,payload) values($1,$2,'Amara Okafor',$3,$3,'{}'::jsonb),($4,$5,'Daniel Brooks',$3,$3,'{}'::jsonb)", [requester, requester, now, provider, provider]),
    db.query("insert into exchanges(id,requester_id,provider_id,title,skill_hours,status,is_mutual,progress,created_at,updated_at,payload) values($1,$2,$3,'Northstar website launch',5,'in_progress',false,0,$4,$4,'{}'::jsonb)", [exchange, requester, provider, now]),
    db.query("insert into conversations(id,conversation_type,context_id,unread_counts,created_at,updated_at,payload) values($1,'exchange',$1,$2::jsonb,$3,$3,'{}'::jsonb)", [exchange, JSON.stringify({ [requester]: 0, [provider]: 0 }), now]),
    db.query("insert into conversation_participants(conversation_id,user_id) values($1,$2),($1,$3)", [exchange, requester, provider]),
  ]);

  const createParams = [exchange, requester, ["in_progress", "revision_requested"], milestone, "Responsive homepage", "Desktop and mobile layouts", null, now, randomUUID(), randomUUID(), createdCard];
  const created = await db.query(createQuery, createParams);
  if (created.length !== 1) throw new Error("Milestone creation failed");

  const updateParams = [exchange, provider, ["in_progress", "revision_requested"], milestone, "completed", now, randomUUID(), randomUUID(), completedCard];
  const updated = await db.query(updateQuery, updateParams);
  if (updated.length !== 1) throw new Error("Milestone completion failed");

  const [state] = await db.query(`select m.status,c.last_message,c.unread_counts,
    (select count(*)::int from messages where conversation_id=$1 and message_type='rich_card') as card_count,
    (select metadata from messages where id=$2) as completion_metadata,
    (select count(*)::int from exchange_activity where exchange_id=$1 and event_type='milestone_completed') as activity_count
    from exchange_milestones m join conversations c on c.id=m.exchange_id where m.id=$3`, [exchange, completedCard, milestone]);
  if (state?.status !== "completed" || Number(state.card_count) !== 2 || state.completion_metadata?.kind !== "milestone" || state.completion_metadata?.status !== "completed" || state.completion_metadata?.milestoneId !== milestone || !String(state.last_message).includes("Responsive homepage") || Number(state.activity_count) !== 1 || Number(state.unread_counts?.[requester]) !== 1 || Number(state.unread_counts?.[provider]) !== 1) throw new Error(`Milestone conversation state is inconsistent: ${JSON.stringify(state)}`);

  const repeat = await db.query(updateQuery, [exchange, provider, ["in_progress", "revision_requested"], milestone, "completed", now, randomUUID(), randomUUID(), randomUUID()]);
  if (repeat.length !== 0) throw new Error("Repeated completion created another event");

  let rolledBack = false;
  try {
    await db.query(updateQuery, [exchange, provider, ["in_progress", "revision_requested"], milestone, "pending", now, randomUUID(), randomUUID(), completedCard]);
  } catch (error) {
    rolledBack = error instanceof Error && error.message.toLowerCase().includes("duplicate key");
  }
  const [afterFailure] = await db.query("select status from exchange_milestones where id=$1", [milestone]);
  if (!rolledBack || afterFailure?.status !== "completed") throw new Error("A failed card write changed the milestone");

  console.log("Verified milestone cards, partner unread counts, no duplicate completion, and atomic rollback.");
} finally {
  await db.query("delete from notifications where related_id=$1", [exchange]);
  await db.query("delete from messages where conversation_id=$1", [exchange]);
  await db.query("delete from conversation_participants where conversation_id=$1", [exchange]);
  await db.query("delete from conversations where id=$1", [exchange]);
  await db.query("delete from exchanges where id=$1", [exchange]);
  await db.query("delete from users where id in($1,$2)", [requester, provider]);
}
