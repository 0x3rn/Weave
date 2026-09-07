import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import { neon } from "@neondatabase/serverless";

const apply = process.env.MIGRATION_APPLY === "true";
const acknowledgement = process.env.MIGRATION_ACKNOWLEDGEMENT === "I_UNDERSTAND";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required.");
}

if (!getApps().length) {
  const credentials = process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY
    ? {
        credential: cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
        }),
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      }
    : { projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID };
  initializeApp(credentials);
}

const firestore = getFirestore();
const storage = getStorage();
const sql = neon(process.env.DATABASE_URL);
const totals = new Map();
const knownUserIds = new Set();
const knownMarketplaceRequestIds = new Set();
const knownMarketplaceApplicationIds = new Set();
const knownExchangeIds = new Set();

function count(name, amount = 1) {
  totals.set(name, (totals.get(name) ?? 0) + amount);
}

function normalize(value) {
  if (value === undefined) return null;
  if (value === null || typeof value !== "object") return value;
  if (typeof value.toDate === "function") return value.toDate().toISOString();
  if (Array.isArray(value)) return value.map(normalize);
  return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, normalize(entry)]));
}

function timestamp(value) {
  const normalized = normalize(value);
  if (typeof normalized !== "string" || Number.isNaN(Date.parse(normalized))) return null;
  return normalized;
}

function text(value) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed || null;
}

function integer(value) {
  return Number.isInteger(value) ? value : null;
}

function strings(value) {
  return Array.isArray(value) ? value.filter(item => typeof item === "string") : [];
}

function json(value) {
  return JSON.stringify(normalize(value ?? {}));
}

async function write(query, params, label) {
  count(label);
  if (apply) await sql.query(query, params);
}

async function ensureUser(value) {
  const userId = text(value);
  if (!userId || knownUserIds.has(userId)) return userId;
  knownUserIds.add(userId);
  await write("insert into users (id, payload) values ($1,$2::jsonb) on conflict (id) do nothing", [userId, json({ migratedPlaceholder: true, source: "orphaned reference" })], "placeholder_users");
  return userId;
}

async function importUsers() {
  const snapshot = await firestore.collection("users").get();
  for (const document of snapshot.docs) {
    const data = normalize(document.data());
    knownUserIds.add(document.id);
    await write(
      `insert into users (id, email, username, full_name, photo_url, profession, headline, bio, country, time_zone, skill_hours, trust_score, role, account_status, is_verified, onboarded, profile_completion, created_at, last_active_at, updated_at, payload)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21::jsonb)
       on conflict (id) do update set email = excluded.email, username = excluded.username, full_name = excluded.full_name, photo_url = excluded.photo_url, profession = excluded.profession, headline = excluded.headline, bio = excluded.bio, country = excluded.country, time_zone = excluded.time_zone, skill_hours = excluded.skill_hours, trust_score = excluded.trust_score, role = excluded.role, account_status = excluded.account_status, is_verified = excluded.is_verified, onboarded = excluded.onboarded, profile_completion = excluded.profile_completion, created_at = excluded.created_at, last_active_at = excluded.last_active_at, updated_at = excluded.updated_at, payload = excluded.payload`,
      [document.id, text(data.email), text(data.username), text(data.fullName), text(data.photoURL ?? data.photoUrl), text(data.profession), text(data.headline), text(data.bio), text(data.country), text(data.timeZone), integer(data.skillHours) ?? 0, integer(data.trustScore) ?? 0, text(data.role), text(data.status), data.isVerified === true, data.onboarded === true, integer(data.profileCompletion), timestamp(data.createdAt), timestamp(data.lastActive), timestamp(data.updatedAt), json(data)],
      "users",
    );
    await importUserSubcollections(document.id);
  }
}

async function importUserSubcollections(userId) {
  const user = firestore.collection("users").doc(userId);
  const [portfolio, devices, saved, nestedNotifications] = await Promise.all([
    user.collection("portfolio").get(), user.collection("devices").get(), user.collection("saved").get(), user.collection("notifications").get(),
  ]);
  for (const document of portfolio.docs) {
    const data = normalize(document.data());
    await write(`insert into portfolio_items (id, user_id, title, description, image_url, link, technologies, created_at, payload) values ($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb) on conflict (id) do update set user_id=excluded.user_id,title=excluded.title,description=excluded.description,image_url=excluded.image_url,link=excluded.link,technologies=excluded.technologies,created_at=excluded.created_at,payload=excluded.payload`, [document.id, userId, text(data.title), text(data.description), text(data.imageURL ?? data.imageUrl), text(data.link), strings(data.technologies), timestamp(data.createdAt), json(data)], "portfolio_items");
  }
  for (const document of devices.docs) {
    const data = normalize(document.data());
    await write(`insert into user_devices (id, user_id, os, browser, device_type, ip, last_active_at, payload) values ($1,$2,$3,$4,$5,$6,$7,$8::jsonb) on conflict (id) do update set user_id=excluded.user_id,os=excluded.os,browser=excluded.browser,device_type=excluded.device_type,ip=excluded.ip,last_active_at=excluded.last_active_at,payload=excluded.payload`, [`${userId}:${document.id}`, userId, text(data.os), text(data.browser), text(data.deviceType), text(data.ip), timestamp(data.lastActive), json(data)], "user_devices");
  }
  for (const document of saved.docs) {
    const data = normalize(document.data());
    await write(`insert into saved_items (user_id, target_id, target_type, saved_at, payload) values ($1,$2,$3,$4,$5::jsonb) on conflict (user_id,target_id) do update set target_type=excluded.target_type,saved_at=excluded.saved_at,payload=excluded.payload`, [userId, document.id, text(data.type), timestamp(data.savedAt), json(data)], "saved_items");
  }
  for (const document of nestedNotifications.docs) await importNotification(document.id, dataWithId(document), `users/${userId}/notifications/${document.id}`, userId);
}

function dataWithId(document) {
  return normalize(document.data());
}

async function importSimpleCollection(collection, importer) {
  const snapshot = await firestore.collection(collection).get();
  for (const document of snapshot.docs) await importer(document.id, dataWithId(document));
}

async function importInviteApplications() {
  await importSimpleCollection("invite_applications", async (id, data) => {
    await write(`insert into invite_applications (id,email,full_name,status,submitted_at,approved_at,payload) values ($1,$2,$3,$4,$5,$6,$7::jsonb) on conflict (id) do update set email=excluded.email,full_name=excluded.full_name,status=excluded.status,submitted_at=excluded.submitted_at,approved_at=excluded.approved_at,payload=excluded.payload`, [id, text(data.email), text(data.fullName), text(data.status), timestamp(data.createdAt), timestamp(data.approvedAt), json(data)], "invite_applications");
  });
}

async function importInvites() {
  await importSimpleCollection("invites", async (id, data) => {
    await write(`insert into invites (id,code,email,status,created_at,expires_at,payload) values ($1,$2,$3,$4,$5,$6,$7::jsonb) on conflict (id) do update set code=excluded.code,email=excluded.email,status=excluded.status,created_at=excluded.created_at,expires_at=excluded.expires_at,payload=excluded.payload`, [id, text(data.code), text(data.email), text(data.status), timestamp(data.createdAt), timestamp(data.expiresAt), json(data)], "invites");
  });
}

async function importMarketplaceRequests() {
  await importSimpleCollection("marketplace_requests", async (id, data) => {
    knownMarketplaceRequestIds.add(id);
    const requesterId = await ensureUser(data.requesterId);
    await write(`insert into marketplace_requests (id,requester_id,title,description,category,skills_required,deliverables,attachments,estimated_hours,exchange_type,timeline,status,is_mutual,applicants_count,created_at,updated_at,payload) values ($1,$2,$3,$4,$5,$6,$7::jsonb,$8::jsonb,$9,$10,$11,$12,$13,$14,$15,$16,$17::jsonb) on conflict (id) do update set requester_id=excluded.requester_id,title=excluded.title,description=excluded.description,category=excluded.category,skills_required=excluded.skills_required,deliverables=excluded.deliverables,attachments=excluded.attachments,estimated_hours=excluded.estimated_hours,exchange_type=excluded.exchange_type,timeline=excluded.timeline,status=excluded.status,is_mutual=excluded.is_mutual,applicants_count=excluded.applicants_count,created_at=excluded.created_at,updated_at=excluded.updated_at,payload=excluded.payload`, [id, requesterId, text(data.title), text(data.description), text(data.category), strings(data.skillsRequired), json(data.deliverables ?? []), json(data.attachments ?? []), text(data.estimatedHours), text(data.exchangeType), text(data.timeline), text(data.status), data.isMutual === true, integer(data.applicantsCount) ?? 0, timestamp(data.createdAt), timestamp(data.updatedAt), json(data)], "marketplace_requests");
  });
}

async function importMarketplaceApplications() {
  await importSimpleCollection("marketplace_applications", async (id, data) => {
    knownMarketplaceApplicationIds.add(id);
    const applicantId = await ensureUser(data.applicantId);
    const requestId = text(data.requestId);
    await write(`insert into marketplace_applications (id,request_id,applicant_id,cover_message,portfolio_links,availability,estimated_hours,status,is_mutual_proposal,offered_hours,estimated_completion_at,created_at,updated_at,payload) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14::jsonb) on conflict (id) do update set request_id=excluded.request_id,applicant_id=excluded.applicant_id,cover_message=excluded.cover_message,portfolio_links=excluded.portfolio_links,availability=excluded.availability,estimated_hours=excluded.estimated_hours,status=excluded.status,is_mutual_proposal=excluded.is_mutual_proposal,offered_hours=excluded.offered_hours,estimated_completion_at=excluded.estimated_completion_at,created_at=excluded.created_at,updated_at=excluded.updated_at,payload=excluded.payload`, [id, knownMarketplaceRequestIds.has(requestId) ? requestId : null, applicantId, text(data.coverMessage), strings(data.portfolioLinks), text(data.availability), integer(data.estimatedHours), text(data.status), data.isMutualProposal === true, integer(data.offeredHours), timestamp(data.estimatedCompletionDate), timestamp(data.createdAt), timestamp(data.updatedAt), json(data)], "marketplace_applications");
  });
}

async function importExchangeRequests() {
  await importSimpleCollection("exchange_requests", async (id, data) => {
    const senderId = await ensureUser(data.senderId);
    const receiverId = await ensureUser(data.receiverId);
    await write(`insert into exchange_requests (id,sender_id,receiver_id,skill_needed,date_options,time_needed,hours_needed,message,status,created_at,updated_at,payload) values ($1,$2,$3,$4,$5::jsonb,$6,$7,$8,$9,$10,$11,$12::jsonb) on conflict (id) do update set sender_id=excluded.sender_id,receiver_id=excluded.receiver_id,skill_needed=excluded.skill_needed,date_options=excluded.date_options,time_needed=excluded.time_needed,hours_needed=excluded.hours_needed,message=excluded.message,status=excluded.status,created_at=excluded.created_at,updated_at=excluded.updated_at,payload=excluded.payload`, [id, senderId, receiverId, text(data.skillNeeded), json(data.dateOptions ?? []), text(data.timeNeeded), integer(data.hoursNeeded), text(data.message), text(data.status), timestamp(data.createdAt), timestamp(data.updatedAt), json(data)], "exchange_requests");
  });
}

async function importExchanges() {
  const snapshot = await firestore.collection("exchanges").get();
  for (const document of snapshot.docs) {
    const data = dataWithId(document);
    knownExchangeIds.add(document.id);
    const requesterId = await ensureUser(data.requesterId);
    const providerId = await ensureUser(data.providerId);
    const requestId = text(data.requestId);
    const applicationId = text(data.applicationId);
    await write(`insert into exchanges (id,marketplace_request_id,marketplace_application_id,requester_id,provider_id,title,skill_hours,requester_escrow_hours,provider_escrow_hours,status,is_mutual,deadline_at,progress,created_at,completed_at,updated_at,payload) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17::jsonb) on conflict (id) do update set marketplace_request_id=excluded.marketplace_request_id,marketplace_application_id=excluded.marketplace_application_id,requester_id=excluded.requester_id,provider_id=excluded.provider_id,title=excluded.title,skill_hours=excluded.skill_hours,requester_escrow_hours=excluded.requester_escrow_hours,provider_escrow_hours=excluded.provider_escrow_hours,status=excluded.status,is_mutual=excluded.is_mutual,deadline_at=excluded.deadline_at,progress=excluded.progress,created_at=excluded.created_at,completed_at=excluded.completed_at,updated_at=excluded.updated_at,payload=excluded.payload`, [document.id, knownMarketplaceRequestIds.has(requestId) ? requestId : null, knownMarketplaceApplicationIds.has(applicationId) ? applicationId : null, requesterId, providerId, text(data.title), integer(data.skillHours) ?? 0, integer(data.requesterEscrowHours) ?? 0, integer(data.providerEscrowHours) ?? 0, text(data.status) ?? "unknown", data.isMutual === true, timestamp(data.deadline), integer(data.progress), timestamp(data.createdAt), timestamp(data.completedAt), timestamp(data.updatedAt), json(data)], "exchanges");
    await importExchangeSubcollections(document.id, document.ref);
  }
}

async function importExchangeSubcollections(exchangeId, exchange) {
  const [deliveries, activity, exchangeMessages] = await Promise.all([exchange.collection("deliveries").get(), exchange.collection("activity").get(), exchange.collection("messages").get()]);
  for (const document of deliveries.docs) {
    const data = dataWithId(document);
    const submittedBy = await ensureUser(data.submittedBy);
    await write(`insert into exchange_deliveries (id,exchange_id,submitted_by,version,files,comments,submitted_at,payload) values ($1,$2,$3,$4,$5::jsonb,$6,$7,$8::jsonb) on conflict (id) do update set exchange_id=excluded.exchange_id,submitted_by=excluded.submitted_by,version=excluded.version,files=excluded.files,comments=excluded.comments,submitted_at=excluded.submitted_at,payload=excluded.payload`, [`${exchangeId}:${document.id}`, exchangeId, submittedBy, integer(data.version), json(data.files ?? []), text(data.comments), timestamp(data.uploadedAt ?? data.createdAt), json(data)], "exchange_deliveries");
  }
  for (const document of activity.docs) {
    const data = dataWithId(document);
    const actorId = await ensureUser(data.actorId);
    await write(`insert into exchange_activity (id,exchange_id,actor_id,event_type,description,occurred_at,payload) values ($1,$2,$3,$4,$5,$6,$7::jsonb) on conflict (id) do update set exchange_id=excluded.exchange_id,actor_id=excluded.actor_id,event_type=excluded.event_type,description=excluded.description,occurred_at=excluded.occurred_at,payload=excluded.payload`, [`${exchangeId}:${document.id}`, exchangeId, actorId, text(data.type), text(data.description), timestamp(data.timestamp ?? data.createdAt), json(data)], "exchange_activity");
  }
  for (const document of exchangeMessages.docs) await importMessage(`${exchangeId}:${document.id}`, dataWithId(document), exchangeId);
}

async function importEscrows() {
  await importSimpleCollection("escrows", async (id, data) => {
    const exchangeId = text(data.exchangeId);
    await write(`insert into escrows (id,exchange_id,status,participants,timeline,dispute,created_at,updated_at,payload) values ($1,$2,$3,$4::jsonb,$5::jsonb,$6::jsonb,$7,$8,$9::jsonb) on conflict (id) do update set exchange_id=excluded.exchange_id,status=excluded.status,participants=excluded.participants,timeline=excluded.timeline,dispute=excluded.dispute,created_at=excluded.created_at,updated_at=excluded.updated_at,payload=excluded.payload`, [id, knownExchangeIds.has(exchangeId) ? exchangeId : null, text(data.status), json(data.participants ?? {}), json(data.timeline ?? []), json(data.dispute ?? null), timestamp(data.createdAt), timestamp(data.updatedAt), json(data)], "escrows");
  });
}

async function importLedger() {
  for (const collection of ["transactions", "skill_ledger"]) {
    await importSimpleCollection(collection, async (id, data) => {
      const userId = await ensureUser(data.userId);
      const relatedUserId = await ensureUser(data.relatedId ?? data.linkedUserId);
      const exchangeId = text(data.exchangeId);
      await write(`insert into ledger_entries (id,source_collection,user_id,exchange_id,related_user_id,entry_type,entry_status,amount,balance_before,balance_after,description,notes,occurred_at,payload) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14::jsonb) on conflict (id) do update set source_collection=excluded.source_collection,user_id=excluded.user_id,exchange_id=excluded.exchange_id,related_user_id=excluded.related_user_id,entry_type=excluded.entry_type,entry_status=excluded.entry_status,amount=excluded.amount,balance_before=excluded.balance_before,balance_after=excluded.balance_after,description=excluded.description,notes=excluded.notes,occurred_at=excluded.occurred_at,payload=excluded.payload`, [`${collection}:${id}`, collection, userId, knownExchangeIds.has(exchangeId) ? exchangeId : null, relatedUserId, text(data.type), text(data.status), integer(data.amount) ?? 0, integer(data.balanceBefore), integer(data.balanceAfter), text(data.description ?? data.reason), text(data.notes), timestamp(data.date ?? data.createdAt), json(data)], "ledger_entries");
    });
  }
}

async function importConversations() {
  await importSimpleCollection("conversations", async (id, data) => {
    await write(`insert into conversations (id,conversation_type,context_id,last_message,last_message_at,unread_counts,created_at,updated_at,payload) values ($1,$2,$3,$4,$5,$6::jsonb,$7,$8,$9::jsonb) on conflict (id) do update set conversation_type=excluded.conversation_type,context_id=excluded.context_id,last_message=excluded.last_message,last_message_at=excluded.last_message_at,unread_counts=excluded.unread_counts,created_at=excluded.created_at,updated_at=excluded.updated_at,payload=excluded.payload`, [id, text(data.type), text(data.contextId), text(data.lastMessage), timestamp(data.lastMessageAt), json(data.unreadCount ?? {}), timestamp(data.createdAt), timestamp(data.updatedAt), json(data)], "conversations");
    for (const participant of strings(data.participants)) {
      const userId = await ensureUser(participant);
      await write(`insert into conversation_participants (conversation_id,user_id) values ($1,$2) on conflict do nothing`, [id, userId], "conversation_participants");
    }
  });
}

async function importMessage(id, data, fallbackConversationId = null) {
  const senderId = await ensureUser(data.senderId);
  await write(`insert into messages (id,conversation_id,sender_id,message_type,content,metadata,read_by,created_at,payload) values ($1,$2,$3,$4,$5,$6::jsonb,$7,$8,$9::jsonb) on conflict (id) do update set conversation_id=excluded.conversation_id,sender_id=excluded.sender_id,message_type=excluded.message_type,content=excluded.content,metadata=excluded.metadata,read_by=excluded.read_by,created_at=excluded.created_at,payload=excluded.payload`, [id, text(data.conversationId) ?? fallbackConversationId, senderId, text(data.type), text(data.content ?? data.text), json(data.metadata ?? null), strings(data.readBy), timestamp(data.createdAt), json(data)], "messages");
}

async function importMessages() {
  await importSimpleCollection("messages", async (id, data) => importMessage(id, data));
}

async function importReviews() {
  await importSimpleCollection("reviews", async (id, data) => {
    const reviewerId = await ensureUser(data.reviewerId);
    const targetUserId = await ensureUser(data.targetUserId);
    const exchangeId = text(data.exchangeId);
    await write(`insert into reviews (id,exchange_id,reviewer_id,target_user_id,rating,comment,is_positive,created_at,payload) values ($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb) on conflict (id) do update set exchange_id=excluded.exchange_id,reviewer_id=excluded.reviewer_id,target_user_id=excluded.target_user_id,rating=excluded.rating,comment=excluded.comment,is_positive=excluded.is_positive,created_at=excluded.created_at,payload=excluded.payload`, [id, knownExchangeIds.has(exchangeId) ? exchangeId : null, reviewerId, targetUserId, integer(data.rating), text(data.comment), data.isPositive === true, timestamp(data.createdAt), json(data)], "reviews");
  });
}

async function importNotification(id, data, sourcePath = `notifications/${id}`, parentUserId = null) {
  const userId = await ensureUser(text(data.userId) ?? parentUserId);
  await write(`insert into notifications (id,source_path,user_id,notification_type,category,priority,title,message,is_read,is_archived,link,related_id,created_at,payload) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14::jsonb) on conflict (id) do update set source_path=excluded.source_path,user_id=excluded.user_id,notification_type=excluded.notification_type,category=excluded.category,priority=excluded.priority,title=excluded.title,message=excluded.message,is_read=excluded.is_read,is_archived=excluded.is_archived,link=excluded.link,related_id=excluded.related_id,created_at=excluded.created_at,payload=excluded.payload`, [sourcePath, sourcePath, userId, text(data.type), text(data.category), text(data.priority), text(data.title), text(data.message), data.isRead === true, data.isArchived === true, text(data.link), text(data.relatedId), timestamp(data.createdAt), json(data)], "notifications");
}

async function importNotifications() {
  await importSimpleCollection("notifications", async (id, data) => importNotification(id, data));
}

async function importStorageObjects() {
  const bucket = storage.bucket(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET);
  const [files] = await bucket.getFiles({ autoPaginate: true });
  for (const file of files) {
    const metadata = normalize(file.metadata ?? {});
    const ownerId = file.name.split("/")[0];
    const hasUserOwner = /^[A-Za-z0-9_-]{20,}$/.test(ownerId);
    const normalizedOwnerId = hasUserOwner ? await ensureUser(ownerId) : null;
    await write(`insert into firebase_storage_objects (path,bucket,owner_id,content_type,size_bytes,source_url,created_at,updated_at,metadata) values ($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb) on conflict (path) do update set bucket=excluded.bucket,owner_id=excluded.owner_id,content_type=excluded.content_type,size_bytes=excluded.size_bytes,source_url=excluded.source_url,created_at=excluded.created_at,updated_at=excluded.updated_at,metadata=excluded.metadata`, [file.name, bucket.name, normalizedOwnerId, text(metadata.contentType), Number.isFinite(Number(metadata.size)) ? Number(metadata.size) : null, `gs://${bucket.name}/${file.name}`, timestamp(metadata.timeCreated), timestamp(metadata.updated), json(metadata)], "firebase_storage_objects");
  }
}

async function main() {
  if (apply && !acknowledgement) throw new Error("Set MIGRATION_ACKNOWLEDGEMENT=I_UNDERSTAND before allowing writes.");
  await sql.query("select 1");
  await importUsers();
  await importInviteApplications();
  await importInvites();
  await importMarketplaceRequests();
  await importMarketplaceApplications();
  await importExchangeRequests();
  await importExchanges();
  await importEscrows();
  await importLedger();
  await importConversations();
  await importMessages();
  await importReviews();
  await importNotifications();
  await importStorageObjects();
  console.table(Object.fromEntries(totals));
  console.log(apply ? "Migration writes completed." : "Dry run completed. No Neon rows were written.");
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
