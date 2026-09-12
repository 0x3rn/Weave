import { neon } from "@neondatabase/serverless";

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required.");
const db = neon(process.env.DATABASE_URL);
const mode = process.argv[2];
const partnerId = "codex-exchange-ui-test-partner";
const activeId = "codex-exchange-ui-test-active";
const completedId = "codex-exchange-ui-test-completed";

async function cleanup() {
  await db.transaction([
    db.query("delete from notifications where related_id in ($1,$2) or user_id=$3", [activeId, completedId, partnerId]),
    db.query("delete from reviews where exchange_id in ($1,$2) or reviewer_id=$3 or target_user_id=$3", [activeId, completedId, partnerId]),
    db.query("delete from conversations where id in ($1,$2) or context_id in ($1,$2)", [activeId, completedId]),
    db.query("delete from escrows where exchange_id in ($1,$2)", [activeId, completedId]),
    db.query("delete from exchanges where id in ($1,$2)", [activeId, completedId]),
    db.query("delete from users where id=$1", [partnerId]),
  ]);
  const [remaining] = await db.query(
    `select (select count(*)::int from users where id=$1) +
      (select count(*)::int from exchanges where id in ($2,$3)) +
      (select count(*)::int from escrows where id='codex-exchange-ui-test-escrow') +
      (select count(*)::int from exchange_activity where id like 'codex-exchange-ui-test-%') +
      (select count(*)::int from exchange_milestones where exchange_id in ($2,$3)) +
      (select count(*)::int from exchange_notes where exchange_id in ($2,$3)) +
      (select count(*)::int from reviews where exchange_id in ($2,$3)) +
      (select count(*)::int from conversations where id in ($2,$3) or context_id in ($2,$3)) as count`,
    [partnerId, activeId, completedId],
  );
  if (Number(remaining?.count) !== 0) throw new Error("Some Codex exchange UI fixtures remain.");
}

if (mode === "cleanup") {
  await cleanup();
  console.log("Removed all Codex exchange UI fixtures.");
  process.exit(0);
}
if (mode !== "seed") throw new Error("Use seed or cleanup.");

await cleanup();
const [owner] = await db.query("select id from users where lower(username)='somto' limit 1");
if (!owner) throw new Error("The authenticated test profile @somto was not found.");
const now = new Date();
const completedAt = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
const deadline = new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000).toISOString();
const partnerPayload = { uid: partnerId, username: "codex-test-partner", fullName: "Weave Test Partner", photoURL: null, profession: "Product Designer", skillHours: 20, trustScore: 86, createdAt: now.toISOString(), updatedAt: now.toISOString(), stats: { rating: 4.8, exchangesCompleted: 12 } };
const activePayload = { id: activeId, title: "Codex UI Test · Brand identity system", requesterId: owner.id, providerId: partnerId, participants: [owner.id, partnerId], skillHours: 3, requesterEscrowHours: 3, providerEscrowHours: 0, status: "in_progress", escrowStatus: "reserved", deliverables: ["Logo system and usage guide", "Exported SVG and PNG assets"], deadline, progress: 0, createdAt: now.toISOString(), updatedAt: now.toISOString(), isMutual: false };
const completePayload = { id: completedId, title: "Codex UI Test · Landing page review", requesterId: owner.id, providerId: partnerId, participants: [owner.id, partnerId], skillHours: 2, requesterEscrowHours: 2, providerEscrowHours: 0, status: "completed", escrowStatus: "released", deliverables: ["Annotated UX review"], progress: 100, createdAt: completedAt, completedAt, updatedAt: completedAt, isMutual: false };
const participants = { [owner.id]: { userId: owner.id, role: "requester", skillHoursReserved: 3, securityDepositAmount: 0, depositStatus: "received", deliverablesStatus: "pending", approvalStatus: "pending", commitments: [] }, [partnerId]: { userId: partnerId, role: "provider", skillHoursReserved: 0, securityDepositAmount: 0, depositStatus: "received", deliverablesStatus: "pending", approvalStatus: "pending", commitments: activePayload.deliverables } };
await db.transaction([
  db.query("insert into users (id,email,username,full_name,profession,skill_hours,trust_score,created_at,updated_at,payload) values ($1,$2,$3,$4,$5,20,86,$6,$6,$7::jsonb)", [partnerId, "codex-test-partner@example.invalid", partnerPayload.username, partnerPayload.fullName, partnerPayload.profession, now.toISOString(), JSON.stringify(partnerPayload)]),
  db.query("insert into exchanges (id,requester_id,provider_id,title,skill_hours,requester_escrow_hours,provider_escrow_hours,status,is_mutual,deadline_at,progress,created_at,updated_at,payload) values ($1,$2,$3,$4,3,3,0,'in_progress',false,$5,0,$6,$6,$7::jsonb)", [activeId, owner.id, partnerId, activePayload.title, deadline, now.toISOString(), JSON.stringify(activePayload)]),
  db.query("insert into exchanges (id,requester_id,provider_id,title,skill_hours,requester_escrow_hours,provider_escrow_hours,status,is_mutual,progress,created_at,completed_at,updated_at,payload) values ($1,$2,$3,$4,2,2,0,'completed',false,100,$5,$5,$5,$6::jsonb)", [completedId, owner.id, partnerId, completePayload.title, completedAt, JSON.stringify(completePayload)]),
  db.query("insert into escrows (id,exchange_id,status,participants,timeline,created_at,updated_at,payload) values ($1,$2,'locked',$3::jsonb,'[]'::jsonb,$4,$4,$5::jsonb)", ["codex-exchange-ui-test-escrow", activeId, JSON.stringify(participants), now.toISOString(), JSON.stringify({ id: "codex-exchange-ui-test-escrow", exchangeId: activeId, status: "locked", participants, participantIds: [owner.id, partnerId], timeline: [], createdAt: now.toISOString(), updatedAt: now.toISOString() })]),
  db.query("insert into exchange_activity (id,exchange_id,actor_id,event_type,description,occurred_at,payload) values ($1,$2,$3,'created',$4,$5,$6::jsonb)", ["codex-exchange-ui-test-activity", activeId, owner.id, "Exchange created and Skill Hours escrowed.", now.toISOString(), JSON.stringify({ type: "created", description: "Exchange created and Skill Hours escrowed.", timestamp: now.toISOString() })]),
]);
console.log(`Seeded temporary fixtures: /exchanges/${activeId} and /exchanges/${completedId}/complete`);
