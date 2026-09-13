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
    db.query("delete from marketplace_applications where id=$1", [`${exchange}-application`]),
    db.query("delete from marketplace_requests where id=$1", [`${exchange}-request`]),
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
  await db.query("update exchanges set status='revision_requested',review_round=2,reveal_at=null,payload=payload || jsonb_build_object('status','revision_requested','reviewRound',2,'providerSubmittedAt',null,'pendingSubmissions',jsonb_build_array($2::text)) where id=$1", [exchange, provider]);
  const [resubmitted] = await db.query("select submit_exchange_delivery($1,$2,$3,$4,$5,$6::jsonb,$7,$8) as version", [provider, exchange, "codex-workflow-test-delivery-2", "codex-workflow-test-delivery-activity-2", "codex-workflow-test-delivery-notification-2", files, "Revised delivery", now]);
  if (Number(resubmitted?.version) !== 2) throw new Error(`Expected revised delivery version 2, received ${String(resubmitted?.version)}`);
  console.log("Verified atomic delivery versions, state transitions, escrow status, and invalid-state rejection.");

  await cleanup();
  const requestId = `${exchange}-request`;
  const applicationId = `${exchange}-application`;
  await db.transaction([
    db.query("insert into users (id,username,skill_hours,created_at,updated_at,payload) values ($1,$2,20,$3,$3,$4::jsonb),($5,$6,20,$3,$3,$7::jsonb)", [requester, requester, now, JSON.stringify({ username: requester, skillHours: 20 }), provider, provider, JSON.stringify({ username: provider, skillHours: 20 })]),
    db.query("insert into marketplace_requests(id,requester_id,title,deliverables,status,is_mutual,estimated_hours,created_at,updated_at,payload) values($1,$2,'Atomic brand and web exchange',$3::jsonb,'open',true,'5',$4,$4,$5::jsonb)", [requestId, requester, JSON.stringify(["Brand identity package"]), now, JSON.stringify({ id: requestId, requesterId: requester, title: "Atomic brand and web exchange", deliverables: ["Brand identity package"], offeredHours: "4", offeredDeliverables: ["Responsive landing page"], isMutual: true, status: "open" })]),
    db.query("insert into marketplace_applications(id,request_id,applicant_id,cover_message,estimated_hours,status,is_mutual_proposal,offered_hours,hour_difference_choice,difference_deliverables,estimated_completion_at,created_at,updated_at,payload) values($1,$2,$3,'I can deliver the brand identity.',5,'pending',true,5,'increase_deliverables',$4::jsonb,$5,$6,$6,$7::jsonb)", [applicationId, requestId, provider, JSON.stringify(["Mobile landing page state"]), new Date(Date.now() + 86400000).toISOString(), now, JSON.stringify({ offeredDeliverables: ["Brand identity package"], hourDifferenceChoice: "increase_deliverables", differenceDeliverables: ["Mobile landing page state"] })]),
  ]);
  const proposalIds = Array.from({ length: 5 }, (_, index) => `codex-protocol-proposal-${index}`);
  await db.query("select create_exchange_from_application($1,$2,$3,$4,$5,$6,$7,$8,$9)", [requester, applicationId, exchange, ...proposalIds, now]);
  const [proposal] = await db.query("select e.status,u1.skill_hours as requester_hours,u2.skill_hours as provider_hours,c.requester_pays_hours,c.provider_pays_hours,c.hour_difference,c.difference_resolution,jsonb_array_length(c.requester_deliverables) as requester_deliverable_count,(select count(*)::int from exchange_contract_approvals where exchange_id=e.id) as approvals from exchanges e join users u1 on u1.id=e.requester_id join users u2 on u2.id=e.provider_id join exchange_contracts c on c.exchange_id=e.id where e.id=$1", [exchange]);
  if (proposal?.status !== "pending_proposal" || Number(proposal.requester_hours) !== 20 || Number(proposal.provider_hours) !== 20 || Number(proposal.requester_pays_hours) !== 5 || Number(proposal.provider_pays_hours) !== 5 || Number(proposal.hour_difference) !== 1 || proposal.difference_resolution !== "deliverables_increased" || Number(proposal.requester_deliverable_count) !== 2 || Number(proposal.approvals) !== 1) throw new Error(`Contract proposal verification failed: ${JSON.stringify(proposal)}`);
  let immutable = false;
  try { await db.query("update exchange_contracts set requester_pays_hours=1 where exchange_id=$1", [exchange]); } catch (error) { immutable = error instanceof Error && error.message.includes("immutable"); }
  if (!immutable) throw new Error("The final contract was mutable.");

  const approvalIds = Array.from({ length: 6 }, (_, index) => `codex-protocol-approval-${index}`);
  const [approval] = await db.query("select approve_exchange_contract($1,$2,$3,$4,$5,$6,$7,$8,$9) as result", [provider, exchange, ...approvalIds, now]);
  const [active] = await db.query("select e.status,u1.skill_hours as requester_hours,u2.skill_hours as provider_hours,s.status as escrow_status,(select count(*)::int from ledger_entries where exchange_id=e.id and entry_type='Reserved') as reservations from exchanges e join users u1 on u1.id=e.requester_id join users u2 on u2.id=e.provider_id join escrows s on s.exchange_id=e.id where e.id=$1", [exchange]);
  if (approval?.result !== "active" || active?.status !== "in_progress" || Number(active.requester_hours) !== 15 || Number(active.provider_hours) !== 15 || active.escrow_status !== "locked" || Number(active.reservations) !== 2) throw new Error(`Contract activation verification failed: ${JSON.stringify(active)}`);

  const providerFiles = JSON.stringify([{ name: "brand.pdf", url: `/api/storage/private/exchanges/${exchange}/${provider}/brand.pdf`, type: "application/pdf", size: 42 }]);
  const requesterFiles = JSON.stringify([{ name: "landing.png", url: `/api/storage/private/exchanges/${exchange}/${requester}/landing.png`, type: "image/png", size: 42 }]);
  await db.query("select submit_exchange_delivery($1,$2,$3,$4,$5,$6::jsonb,$7,$8)", [provider, exchange, "codex-protocol-delivery-provider-1", "codex-protocol-delivery-activity-provider-1", "codex-protocol-delivery-notification-provider-1", providerFiles, "Brand package", now]);
  const [sealed] = await db.query("select status,reveal_at,files_released_at from exchanges where id=$1", [exchange]);
  if (sealed?.status !== "in_progress" || sealed.reveal_at || sealed.files_released_at) throw new Error(`First mutual commit was revealed: ${JSON.stringify(sealed)}`);
  await db.query("select submit_exchange_delivery($1,$2,$3,$4,$5,$6::jsonb,$7,$8)", [requester, exchange, "codex-protocol-delivery-requester-1", "codex-protocol-delivery-activity-requester-1", "codex-protocol-delivery-notification-requester-1", requesterFiles, "Landing page", now]);
  const [review] = await db.query("select status,review_round,reveal_at,files_released_at from exchanges where id=$1", [exchange]);
  if (review?.status !== "in_review" || Number(review.review_round) !== 1 || !review.reveal_at || review.files_released_at) throw new Error(`Review reveal verification failed: ${JSON.stringify(review)}`);

  const decisionIdsA = Array.from({ length: 6 }, (_, index) => `codex-protocol-decision-a-${index}`);
  const [firstDecision] = await db.query("select record_exchange_review_decision($1,$2,$3,'revision',$4,$5,$6,$7,$8,$9,$10) as result", [requester, exchange, decisionIdsA[0], "Please include the editable logo source.", ...decisionIdsA.slice(1), now]);
  const [hidden] = await db.query("select e.status,e.files_released_at,(select count(*)::int from exchange_review_decisions where exchange_id=e.id and review_round=1 and revealed_at is null) as hidden_decisions from exchanges e where e.id=$1", [exchange]);
  if (firstDecision?.result !== "waiting" || hidden?.status !== "in_review" || hidden.files_released_at || Number(hidden.hidden_decisions) !== 1) throw new Error(`Hidden decision verification failed: ${JSON.stringify(hidden)}`);
  const decisionIdsB = Array.from({ length: 6 }, (_, index) => `codex-protocol-decision-b-${index}`);
  const [revision] = await db.query("select record_exchange_review_decision($1,$2,$3,'accept','',$4,$5,$6,$7,$8,$9) as result", [provider, exchange, ...decisionIdsB, now]);
  const [revisionState] = await db.query("select status,review_round,reveal_at,files_released_at,payload->'pendingSubmissions' as pending from exchanges where id=$1", [exchange]);
  if (revision?.result !== "revision_requested" || revisionState?.status !== "revision_requested" || Number(revisionState.review_round) !== 2 || revisionState.reveal_at || revisionState.files_released_at || !Array.isArray(revisionState.pending) || !revisionState.pending.includes(provider)) throw new Error(`Revision round verification failed: ${JSON.stringify(revisionState)}`);

  await db.query("select submit_exchange_delivery($1,$2,$3,$4,$5,$6::jsonb,$7,$8)", [provider, exchange, "codex-protocol-delivery-provider-2", "codex-protocol-delivery-activity-provider-2", "codex-protocol-delivery-notification-provider-2", providerFiles, "Brand package with source", now]);
  const decisionIdsC = Array.from({ length: 6 }, (_, index) => `codex-protocol-decision-c-${index}`);
  const decisionIdsD = Array.from({ length: 6 }, (_, index) => `codex-protocol-decision-d-${index}`);
  const [acceptedWaiting] = await db.query("select record_exchange_review_decision($1,$2,$3,'accept','',$4,$5,$6,$7,$8,$9) as result", [requester, exchange, ...decisionIdsC, now]);
  const [accepted] = await db.query("select record_exchange_review_decision($1,$2,$3,'accept','',$4,$5,$6,$7,$8,$9) as result", [provider, exchange, ...decisionIdsD, now]);
  const [settled] = await db.query("select e.status,e.files_released_at,s.status as escrow_status,u1.skill_hours as requester_hours,u2.skill_hours as provider_hours,(select count(*)::int from ledger_entries where exchange_id=e.id and entry_type='Earned') as earnings from exchanges e join escrows s on s.exchange_id=e.id join users u1 on u1.id=e.requester_id join users u2 on u2.id=e.provider_id where e.id=$1", [exchange]);
  if (acceptedWaiting?.result !== "waiting" || accepted?.result !== "completed" || settled?.status !== "completed" || !settled.files_released_at || settled.escrow_status !== "released" || Number(settled.requester_hours) !== 20 || Number(settled.provider_hours) !== 20 || Number(settled.earnings) !== 2) throw new Error(`Atomic settlement verification failed: ${JSON.stringify(settled)}`);
  console.log("Verified immutable approval, distinct mutual obligations, sealed commits, hidden decisions, revision rounds, and atomic file and ledger release.");

  await cleanup();
  await db.transaction([
    db.query("insert into users (id,username,skill_hours,created_at,updated_at,payload) values ($1,$2,10,$3,$3,$4::jsonb),($5,$6,2,$3,$3,$7::jsonb)", [requester, requester, now, JSON.stringify({ username: requester, skillHours: 10 }), provider, provider, JSON.stringify({ username: provider, skillHours: 2 })]),
    db.query("insert into marketplace_requests(id,requester_id,title,deliverables,status,is_mutual,estimated_hours,created_at,updated_at,payload) values($1,$2,'Standard landing page exchange',$3::jsonb,'open',false,'3',$4,$4,$5::jsonb)", [requestId, requester, JSON.stringify(["Responsive landing page"]), now, JSON.stringify({ id: requestId, requesterId: requester, title: "Standard landing page exchange", deliverables: ["Responsive landing page"], isMutual: false, status: "open" })]),
    db.query("insert into marketplace_applications(id,request_id,applicant_id,cover_message,estimated_hours,status,is_mutual_proposal,offered_hours,estimated_completion_at,created_at,updated_at,payload) values($1,$2,$3,'I can build this landing page.',3,'pending',false,3,$4,$5,$5,$6::jsonb)", [applicationId, requestId, provider, new Date(Date.now() + 86400000).toISOString(), now, JSON.stringify({ offeredDeliverables: [] })]),
  ]);
  const standardProposalIds = Array.from({ length: 5 }, (_, index) => `codex-standard-proposal-${index}`);
  await db.query("select create_exchange_from_application($1,$2,$3,$4,$5,$6,$7,$8,$9)", [requester, applicationId, exchange, ...standardProposalIds, now]);
  const standardApprovalIds = Array.from({ length: 6 }, (_, index) => `codex-standard-approval-${index}`);
  await db.query("select approve_exchange_contract($1,$2,$3,$4,$5,$6,$7,$8,$9)", [provider, exchange, ...standardApprovalIds, now]);
  const [standard] = await db.query("select e.status,e.requester_escrow_hours,e.provider_escrow_hours,u1.skill_hours as requester_hours,u2.skill_hours as provider_hours,jsonb_array_length(c.provider_deliverables) as provider_deliverables from exchanges e join exchange_contracts c on c.exchange_id=e.id join users u1 on u1.id=e.requester_id join users u2 on u2.id=e.provider_id where e.id=$1", [exchange]);
  if (standard?.status !== "in_progress" || Number(standard.requester_escrow_hours) !== 3 || Number(standard.provider_escrow_hours) !== 0 || Number(standard.requester_hours) !== 7 || Number(standard.provider_hours) !== 2 || Number(standard.provider_deliverables) !== 1) throw new Error(`Standard contract verification failed: ${JSON.stringify(standard)}`);
  console.log("Verified the standard one-way contract path reserves only requester hours and preserves requested deliverables.");

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
