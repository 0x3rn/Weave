import { neon } from "@neondatabase/serverless";

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required.");
const db = neon(process.env.DATABASE_URL);
const requester = "codex-workflow-test-requester";
const provider = "codex-workflow-test-provider";
const admin = "codex-workflow-test-admin";
const exchange = "codex-workflow-test-cancellation";
const testIds = ["codex-workflow-test-requester-refund", "codex-workflow-test-provider-refund", "codex-workflow-test-activity", "codex-workflow-test-requester-notification", "codex-workflow-test-provider-notification"];

async function cleanup() {
  await db.transaction([
    db.query("delete from notifications where user_id in ($1,$2) or related_id=$3", [requester, provider, exchange]),
    db.query("delete from ledger_entries where user_id in ($1,$2) or exchange_id=$3", [requester, provider, exchange]),
    db.query("delete from escrows where exchange_id=$1", [exchange]),
    db.query("delete from exchanges where id=$1", [exchange]),
    db.query("delete from users where id in ($1,$2,$3)", [requester, provider, admin]),
  ]);
  const [remaining] = await db.query(
    `select (select count(*)::int from users where id in ($1,$2,$3)) +
      (select count(*)::int from exchanges where id=$4) +
      (select count(*)::int from escrows where exchange_id=$4) +
      (select count(*)::int from ledger_entries where exchange_id=$4) +
      (select count(*)::int from notifications where related_id=$4 or user_id in ($1,$2,$3)) as count`,
    [requester, provider, admin, exchange],
  );
  if (Number(remaining?.count) !== 0) throw new Error("Some automated exchange workflow fixtures remain.");
}

await cleanup();
try {
  const now = new Date().toISOString();
  await db.transaction([
    db.query("insert into users (id,username,skill_hours,created_at,updated_at,payload) values ($1,$2,7,$3,$3,$4::jsonb),($5,$6,9,$3,$3,$7::jsonb)", [requester, requester, now, JSON.stringify({ username: requester, skillHours: 7 }), provider, provider, JSON.stringify({ username: provider, skillHours: 9 })]),
    db.query("insert into exchanges (id,requester_id,provider_id,title,skill_hours,requester_escrow_hours,provider_escrow_hours,status,is_mutual,progress,created_at,updated_at,payload) values ($1,$2,$3,'Codex cancellation verification',3,3,1,'in_progress',true,0,$4,$4,$5::jsonb)", [exchange, requester, provider, now, JSON.stringify({ id: exchange, requesterId: requester, providerId: provider, title: "Codex cancellation verification", skillHours: 3, requesterEscrowHours: 3, providerEscrowHours: 1, status: "in_progress", isMutual: true, escrowStatus: "reserved", createdAt: now, updatedAt: now })]),
    db.query("insert into escrows (id,exchange_id,status,participants,timeline,created_at,updated_at,payload) values ($1,$2,'locked','{}'::jsonb,'[]'::jsonb,$3,$3,$4::jsonb)", ["codex-workflow-test-escrow", exchange, now, JSON.stringify({ id: "codex-workflow-test-escrow", exchangeId: exchange, status: "locked", participants: {}, timeline: [], createdAt: now, updatedAt: now })]),
    db.query("insert into ledger_entries (id,source_collection,user_id,exchange_id,related_user_id,entry_type,entry_status,amount,balance_before,balance_after,description,occurred_at,payload) values ($1,'transactions',$2,$3,$4,'Reserved','Active',-3,10,7,'Test reservation',$5,$6::jsonb)", ["codex-workflow-test-reservation", requester, exchange, provider, now, JSON.stringify({ status: "Active", type: "Reserved" })]),
  ]);
  await db.query("select cancel_exchange_before_work($1,$2,$3,$4,$5,$6,$7,$8,$9)", [requester, exchange, ...testIds, "Automated cancellation verification", now]);
  const [result] = await db.query("select e.status,u1.skill_hours as requester_hours,u2.skill_hours as provider_hours,es.status as escrow_status,(select count(*)::int from ledger_entries where exchange_id=e.id and entry_type='Refunded' and entry_status='Completed') as refunds from exchanges e join users u1 on u1.id=e.requester_id join users u2 on u2.id=e.provider_id join escrows es on es.exchange_id=e.id where e.id=$1", [exchange]);
  if (!result || result.status !== "cancelled" || Number(result.requester_hours) !== 10 || Number(result.provider_hours) !== 10 || result.escrow_status !== "refunded" || Number(result.refunds) !== 2) throw new Error(`Cancellation verification failed: ${JSON.stringify(result)}`);
  console.log("Verified cancellation state, both refunds, ledger entries, and escrow status.");

  await cleanup();
  const participants = {
    [requester]: { userId: requester, role: "requester", deliverablesStatus: "pending" },
    [provider]: { userId: provider, role: "provider", deliverablesStatus: "pending" },
  };
  await db.transaction([
    db.query("insert into users (id,username,skill_hours,created_at,updated_at,payload) values ($1,$2,7,$3,$3,$4::jsonb),($5,$6,9,$3,$3,$7::jsonb)", [requester, requester, now, JSON.stringify({ username: requester, skillHours: 7 }), provider, provider, JSON.stringify({ username: provider, skillHours: 9 })]),
    db.query("insert into exchanges (id,requester_id,provider_id,title,skill_hours,requester_escrow_hours,provider_escrow_hours,status,is_mutual,progress,created_at,updated_at,payload) values ($1,$2,$3,'Codex delivery verification',3,3,0,'in_progress',false,0,$4,$4,$5::jsonb)", [exchange, requester, provider, now, JSON.stringify({ id: exchange, requesterId: requester, providerId: provider, title: "Codex delivery verification", status: "in_progress", isMutual: false, createdAt: now, updatedAt: now })]),
    db.query("insert into escrows (id,exchange_id,status,participants,timeline,created_at,updated_at,payload) values ($1,$2,'locked',$3::jsonb,'[]'::jsonb,$4,$4,$5::jsonb)", ["codex-workflow-test-escrow", exchange, JSON.stringify(participants), now, JSON.stringify({ id: "codex-workflow-test-escrow", exchangeId: exchange, status: "locked", participants, timeline: [], createdAt: now, updatedAt: now })]),
  ]);
  const files = JSON.stringify([{ name: "result.pdf", url: `/api/storage/private/exchanges/${exchange}/result.pdf`, type: "application/pdf", size: 42 }]);
  const [submitted] = await db.query("select submit_exchange_delivery($1,$2,$3,$4,$5,$6::jsonb,$7,$8) as version", [provider, exchange, "codex-workflow-test-delivery-1", "codex-workflow-test-delivery-activity-1", "codex-workflow-test-delivery-notification-1", files, "First delivery", now]);
  const [deliveryResult] = await db.query("select e.status,(select count(*)::int from exchange_deliveries where exchange_id=e.id) as deliveries,es.participants #>> $2::text[] as delivery_status from exchanges e join escrows es on es.exchange_id=e.id where e.id=$1", [exchange, [provider, "deliverablesStatus"]]);
  if (Number(submitted?.version) !== 1 || deliveryResult?.status !== "in_review" || Number(deliveryResult?.deliveries) !== 1 || deliveryResult?.delivery_status !== "submitted") throw new Error(`Delivery verification failed: ${JSON.stringify(deliveryResult)}`);
  let rejectedInvalidState = false;
  try {
    await db.query("select submit_exchange_delivery($1,$2,$3,$4,$5,$6::jsonb,$7,$8)", [provider, exchange, "codex-workflow-test-invalid-delivery", "codex-workflow-test-invalid-activity", "codex-workflow-test-invalid-notification", files, "Invalid duplicate", now]);
  } catch (error) {
    rejectedInvalidState = error instanceof Error && error.message.includes("current exchange state");
  }
  if (!rejectedInvalidState) throw new Error("Delivery submission was not rejected while the exchange was in review.");
  await db.query("update exchanges set status='revision_requested',payload=payload || '{\"status\":\"revision_requested\",\"providerSubmittedAt\":null}'::jsonb where id=$1", [exchange]);
  const [resubmitted] = await db.query("select submit_exchange_delivery($1,$2,$3,$4,$5,$6::jsonb,$7,$8) as version", [provider, exchange, "codex-workflow-test-delivery-2", "codex-workflow-test-delivery-activity-2", "codex-workflow-test-delivery-notification-2", files, "Revised delivery", now]);
  if (Number(resubmitted?.version) !== 2) throw new Error(`Expected revised delivery version 2, received ${String(resubmitted?.version)}`);
  console.log("Verified atomic delivery versions, state transitions, escrow status, and invalid-state rejection.");

  await cleanup();
  const disputed = { reason: "Work Quality", details: "Automated dispute resolution verification", openedAt: now, status: "investigating", evidenceUrls: [] };
  await db.transaction([
    db.query("insert into users (id,username,role,skill_hours,created_at,updated_at,payload) values ($1,$2,null,7,$3,$3,$4::jsonb),($5,$6,null,9,$3,$3,$7::jsonb),($8,$9,'Admin',0,$3,$3,$10::jsonb)", [requester, requester, now, JSON.stringify({ username: requester, skillHours: 7 }), provider, provider, JSON.stringify({ username: provider, skillHours: 9 }), admin, admin, JSON.stringify({ username: admin, isAdmin: true })]),
    db.query("insert into exchanges (id,requester_id,provider_id,title,skill_hours,requester_escrow_hours,provider_escrow_hours,status,is_mutual,progress,created_at,updated_at,payload) values ($1,$2,$3,'Codex dispute verification',3,3,1,'disputed',true,0,$4,$4,$5::jsonb)", [exchange, requester, provider, now, JSON.stringify({ id: exchange, requesterId: requester, providerId: provider, title: "Codex dispute verification", status: "disputed", isMutual: true, dispute: disputed, createdAt: now, updatedAt: now })]),
    db.query("insert into escrows (id,exchange_id,status,participants,timeline,dispute,created_at,updated_at,payload) values ($1,$2,'disputed',$3::jsonb,'[]'::jsonb,$4::jsonb,$5,$5,$6::jsonb)", ["codex-workflow-test-escrow", exchange, JSON.stringify(participants), JSON.stringify(disputed), now, JSON.stringify({ id: "codex-workflow-test-escrow", exchangeId: exchange, status: "disputed", participants, timeline: [], dispute: disputed, createdAt: now, updatedAt: now })]),
    db.query("insert into ledger_entries (id,source_collection,user_id,exchange_id,related_user_id,entry_type,entry_status,amount,balance_before,balance_after,description,occurred_at,payload) values ($1,'transactions',$2,$3,$4,'Reserved','Active',-3,10,7,'Test reservation',$5,$6::jsonb),($7,'transactions',$4,$3,$2,'Reserved','Active',-1,10,9,'Test mutual reservation',$5,$6::jsonb)", ["codex-workflow-test-reservation-requester", requester, exchange, provider, now, JSON.stringify({ status: "Active", type: "Reserved" }), "codex-workflow-test-reservation-provider"]),
  ]);
  const [resolution] = await db.query("select resolve_exchange_dispute($1,$2,2,1,$3,$4,$5,$6,$7,$8,$9) as outcome", [admin, exchange, "Verified partial resolution", "codex-workflow-test-resolution-provider-ledger", "codex-workflow-test-resolution-requester-ledger", "codex-workflow-test-resolution-activity", "codex-workflow-test-resolution-provider-notification", "codex-workflow-test-resolution-requester-notification", now]);
  const [resolutionResult] = await db.query("select e.status,s.status as escrow_status,s.dispute->>'status' as dispute_status,u1.skill_hours as requester_hours,u2.skill_hours as provider_hours,(select count(*)::int from ledger_entries where exchange_id=e.id and entry_type='Dispute Resolution') as resolution_entries from exchanges e join escrows s on s.exchange_id=e.id join users u1 on u1.id=e.requester_id join users u2 on u2.id=e.provider_id where e.id=$1", [exchange]);
  if (resolution?.outcome !== "partial" || resolutionResult?.status !== "completed" || resolutionResult?.escrow_status !== "released" || resolutionResult?.dispute_status !== "resolved" || Number(resolutionResult?.requester_hours) !== 9 || Number(resolutionResult?.provider_hours) !== 11 || Number(resolutionResult?.resolution_entries) !== 2) throw new Error(`Dispute resolution verification failed: ${JSON.stringify(resolutionResult)}`);
  console.log("Verified partial dispute resolution, balance conservation, ledger entries, and resolved states.");
} finally {
  await cleanup();
}
