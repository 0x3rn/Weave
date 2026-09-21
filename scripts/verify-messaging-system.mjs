import { neon } from "@neondatabase/serverless";

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required.");
const db = neon(process.env.DATABASE_URL);
const first = "codex-messaging-test-first";
const second = "codex-messaging-test-second";
const conversation = "codex-messaging-test-conversation";
const message = "codex-messaging-test-message";
const attachment = "codex-messaging-test-attachment";

async function cleanup() {
  await db.query("delete from blocked_users where blocker_id in($1,$2) or blocked_id in($1,$2)", [first, second]);
  await db.query("delete from messages where conversation_id=$1", [conversation]);
  await db.query("delete from conversations where id=$1", [conversation]);
  await db.query("delete from users where id in($1,$2)", [first, second]);
  const [left] = await db.query(`select (select count(*)::int from users where id in($1,$2)) + (select count(*)::int from conversations where id=$3) + (select count(*)::int from messages where id=$4) as count`, [first, second, conversation, message]);
  if (Number(left?.count) !== 0) throw new Error("Messaging verification fixtures remain.");
}

await cleanup();
try {
  const now = new Date().toISOString();
  await db.transaction([
    db.query("insert into users(id,username,full_name,created_at,updated_at,payload) values($1,$2,'Messaging Test One',$3,$3,'{}'::jsonb),($4,$5,'Messaging Test Two',$3,$3,'{}'::jsonb)", [first, first, now, second, second]),
    db.query("insert into conversations(id,conversation_type,context_id,unread_counts,created_at,updated_at,payload) values($1,'exchange',$1,$2::jsonb,$3,$3,'{}'::jsonb)", [conversation, JSON.stringify({ [first]: 0, [second]: 1 }), now]),
    db.query("insert into conversation_participants(conversation_id,user_id) values($1,$2),($1,$3)", [conversation, first, second]),
    db.query("insert into messages(id,conversation_id,sender_id,message_type,content,metadata,read_by,created_at,payload) values($1,$2,$3,'text','Please review the landing page.', $4::jsonb,$5,$6,'{}'::jsonb)", [message, conversation, first, JSON.stringify({}), [first], now]),
    db.query("insert into message_attachments(id,message_id,conversation_id,uploaded_by,object_key,original_name,content_type,size_bytes,created_at) values($1,$2,$3,$4,$5,'landing-page.pdf','application/pdf',42,$6)", [attachment, message, conversation, first, `messages/${conversation}/${first}/test.pdf`, now]),
    db.query("insert into message_reactions(message_id,user_id,emoji) values($1,$2,'👍')", [message, second]),
    db.query("insert into message_pins(message_id,conversation_id,pinned_by) values($1,$2,$3)", [message, conversation, first]),
    db.query("insert into conversation_notes(id,conversation_id,user_id,content,created_at,updated_at) values('codex-messaging-test-note',$1,$2,'Follow up after review.',$3,$3)", [conversation, second, now]),
    db.query("insert into conversation_archives(conversation_id,user_id) values($1,$2)", [conversation, second]),
    db.query("insert into conversation_member_settings(conversation_id,user_id,is_muted) values($1,$2,true)", [conversation, second]),
    db.query("insert into conversation_typing(conversation_id,user_id,updated_at) values($1,$2,now())", [conversation, first]),
    db.query("insert into message_reports(id,message_id,conversation_id,reporter_id,reason) values('codex-messaging-test-report',$1,$2,$3,'Automated report test')", [message, conversation, second]),
    db.query("insert into blocked_users(blocker_id,blocked_id) values($1,$2)", [second, first]),
  ]);
  const [result] = await db.query(`select
    (select count(*)::int from message_attachments where message_id=$1) as attachments,
    (select count(*)::int from message_reactions where message_id=$1 and emoji='👍') as reactions,
    (select count(*)::int from message_pins where message_id=$1) as pins,
    (select count(*)::int from conversation_notes where conversation_id=$2 and user_id=$3) as notes,
    (select count(*)::int from conversation_archives where conversation_id=$2 and user_id=$3) as archives,
    (select is_muted from conversation_member_settings where conversation_id=$2 and user_id=$3) as muted,
    (select count(*)::int from conversation_typing where conversation_id=$2 and user_id=$4) as typing,
    (select count(*)::int from message_reports where message_id=$1 and reporter_id=$3) as reports,
    (select count(*)::int from blocked_users where blocker_id=$3 and blocked_id=$4) as blocks`, [message, conversation, second, first]);
  if (!result || Number(result.attachments) !== 1 || Number(result.reactions) !== 1 || Number(result.pins) !== 1 || Number(result.notes) !== 1 || Number(result.archives) !== 1 || result.muted !== true || Number(result.typing) !== 1 || Number(result.reports) !== 1 || Number(result.blocks) !== 1) throw new Error(`Messaging records failed verification: ${JSON.stringify(result)}`);
  let rejectedSelfBlock = false;
  try { await db.query("insert into blocked_users(blocker_id,blocked_id) values($1,$1)", [first]); } catch { rejectedSelfBlock = true; }
  if (!rejectedSelfBlock) throw new Error("Blocked-user self-protection constraint is missing.");
  console.log("Verified messaging collaboration records, ownership relations, archive and mute settings, reports, pins, reactions, attachments, and block safeguards.");
} finally {
  await cleanup();
}