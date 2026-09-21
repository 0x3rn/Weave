"use server";

import { payload, sql, iso } from "@/lib/neon";
import { storeMessageAttachment } from "@/lib/neon-storage";
import { getCurrentUserId } from "./user";
import { Conversation, Exchange, Message, MessageAttachment } from "@/types";
import { userFromRow } from "@/lib/users";
import { revalidatePath } from "next/cache";
import { scheduleNotificationEmails } from "@/lib/notification-email";

type ConversationRow = Record<string, unknown> & { id: string; payload: unknown };
const MAX_MESSAGE_LENGTH = 5000;
const MESSAGE_EMOJIS = new Set(["👍", "🔥", "👏", "❤️", "😂", "🎉"]);

function conversationFromRow(row: ConversationRow): Conversation {
  const data = payload<Record<string, unknown>>(row.payload);
  return {
    id: row.id,
    type: String(row.conversation_type ?? data.type ?? "exchange") as Conversation["type"],
    contextId: String(row.context_id ?? data.contextId ?? ""),
    participants: [],
    lastMessage: String(row.last_message ?? data.lastMessage ?? "") || undefined,
    lastMessageAt: iso(row.last_message_at) || undefined,
    unreadCount: payload<Record<string, number>>(row.unread_counts),
    createdAt: iso(row.created_at),
    updatedAt: iso(row.updated_at),
    isArchived: row.is_archived === true,
    isMuted: row.is_muted === true,
  };
}

function privateStorageUrl(key: string) {
  return `/api/storage/private/${key.split("/").map(encodeURIComponent).join("/")}`;
}

function safeName(name: string) {
  const normalized = name.replace(/[\\/\r\n]/g, "_").trim();
  return normalized.slice(0, 255) || "attachment";
}

async function memberConversation(conversationId: string, userId: string) {
  if (!/^[A-Za-z0-9_-]{1,128}$/.test(conversationId)) return null;
  const [conversation] = await sql.query(
    "select c.* from conversations c join conversation_participants p on p.conversation_id=c.id where c.id=$1 and p.user_id=$2",
    [conversationId, userId],
  );
  return conversation as ConversationRow | undefined;
}

async function assertNotBlocked(conversationId: string, userId: string) {
  const [blocked] = await sql.query(
    `select 1 from blocked_users b
     join conversation_participants p on p.conversation_id=$1
     where (b.blocker_id=$2 and b.blocked_id=p.user_id) or (b.blocked_id=$2 and b.blocker_id=p.user_id)
     limit 1`,
    [conversationId, userId],
  );
  return !blocked;
}

async function loadMessages(conversationId: string): Promise<Message[]> {
  const rows = await sql.query("select * from messages where conversation_id=$1 order by created_at asc limit 500", [conversationId]);
  const ids = rows.map(row => String(row.id));
  if (ids.length === 0) return [];
  const [attachmentRows, reactionRows, pinRows, replyRows] = await Promise.all([
    sql.query("select * from message_attachments where message_id=any($1::text[]) order by created_at", [ids]),
    sql.query("select message_id,emoji,array_agg(user_id order by created_at) as user_ids from message_reactions where message_id=any($1::text[]) group by message_id,emoji", [ids]),
    sql.query("select message_id from message_pins where message_id=any($1::text[])", [ids]),
    sql.query(
      `select m.id as child_id,p.id,p.content,coalesce(u.full_name,u.username,'Member') as sender_name
       from messages m join messages p on p.id=m.metadata->>'replyToId'
       left join users u on u.id=p.sender_id where m.id=any($1::text[])`,
      [ids],
    ),
  ]);
  const attachments = new Map<string, MessageAttachment[]>();
  for (const row of attachmentRows) {
    const messageId = String(row.message_id);
    const items = attachments.get(messageId) ?? [];
    items.push({ id: String(row.id), name: String(row.original_name), contentType: String(row.content_type), sizeBytes: Number(row.size_bytes), url: privateStorageUrl(String(row.object_key)), createdAt: iso(row.created_at) });
    attachments.set(messageId, items);
  }
  const reactions = new Map<string, { emoji: string; userIds: string[] }[]>();
  for (const row of reactionRows) {
    const messageId = String(row.message_id);
    const items = reactions.get(messageId) ?? [];
    items.push({ emoji: String(row.emoji), userIds: Array.isArray(row.user_ids) ? row.user_ids.map(String) : [] });
    reactions.set(messageId, items);
  }
  const pinned = new Set(pinRows.map(row => String(row.message_id)));
  const replies = new Map(replyRows.map(row => [String(row.child_id), { id: String(row.id), content: String(row.content ?? ""), senderName: String(row.sender_name) }]));
  return rows.map(row => {
    const data = payload<Record<string, unknown>>(row.payload);
    return {
      ...data,
      id: String(row.id),
      conversationId: String(row.conversation_id),
      senderId: String(row.sender_id ?? ""),
      type: String(row.message_type ?? "text") as Message["type"],
      content: String(row.content ?? ""),
      metadata: payload<Record<string, unknown>>(row.metadata),
      readBy: Array.isArray(row.read_by) ? row.read_by.map(String) : [],
      createdAt: iso(row.created_at),
      editedAt: iso(row.edited_at) || undefined,
      replyTo: replies.get(String(row.id)),
      attachments: attachments.get(String(row.id)) ?? [],
      reactions: reactions.get(String(row.id)) ?? [],
      isPinned: pinned.has(String(row.id)),
    } as Message;
  });
}

export async function getConversations() {
  const userId = await getCurrentUserId();
  if (!userId) return { success: false, error: "Unauthorized", conversations: [] as Conversation[] };
  try {
    const rows = await sql.query(
      `select c.*, exists(select 1 from conversation_archives a where a.conversation_id=c.id and a.user_id=$1) as is_archived,
       coalesce((select s.is_muted from conversation_member_settings s where s.conversation_id=c.id and s.user_id=$1),false) as is_muted
       from conversations c join conversation_participants p on p.conversation_id=c.id where p.user_id=$1
       order by c.last_message_at desc nulls last,c.updated_at desc`,
      [userId],
    );
    const ids = rows.map(row => String(row.id));
    const participantRows = ids.length ? await sql.query("select conversation_id,user_id from conversation_participants where conversation_id=any($1::text[])", [ids]) : [];
    const participants = new Map<string, string[]>();
    for (const row of participantRows) participants.set(String(row.conversation_id), [...(participants.get(String(row.conversation_id)) ?? []), String(row.user_id)]);
    return { success: true, conversations: rows.map(row => ({ ...conversationFromRow(row as ConversationRow), participants: participants.get(String(row.id)) ?? [] })) };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Failed to load conversations", conversations: [] as Conversation[] };
  }
}

export async function getMessages(conversationId: string) {
  const userId = await getCurrentUserId();
  if (!userId) return { success: false, error: "Unauthorized", messages: [] as Message[] };
  if (!await memberConversation(conversationId, userId)) return { success: false, error: "Conversation not found", messages: [] as Message[] };
  return { success: true, messages: await loadMessages(conversationId) };
}

export async function getConversationPartners(conversationIds: string[]) {
  const userId = await getCurrentUserId();
  if (!userId || !Array.isArray(conversationIds) || conversationIds.length > 100) return { success: false, partners: [] };
  const rows = await sql.query(
    "select distinct u.* from conversation_participants mine join conversation_participants other on other.conversation_id=mine.conversation_id and other.user_id<>mine.user_id join users u on u.id=other.user_id where mine.user_id=$1 and mine.conversation_id=any($2::text[])",
    [userId, conversationIds],
  );
  return { success: true, partners: rows.map(row => userFromRow(row)) };
}

export async function getOrCreateExchangeConversation(exchangeId: string) {
  const userId = await getCurrentUserId();
  if (!userId) return { success: false, error: "Unauthorized" };
  const [exchange] = await sql.query("select * from exchanges where id=$1 and $2 in(requester_id,provider_id)", [exchangeId, userId]);
  if (!exchange) return { success: false, error: "Exchange not found" };
  const now = new Date().toISOString();
  await sql.transaction(tx => [
    tx.query("insert into conversations (id,conversation_type,context_id,unread_counts,created_at,updated_at,payload) values ($1,'exchange',$1,$2::jsonb,$3,$3,$4::jsonb) on conflict(id) do nothing", [exchangeId, JSON.stringify({ [exchange.requester_id]: 0, [exchange.provider_id]: 0 }), now, JSON.stringify({ type: "exchange", contextId: exchangeId })]),
    tx.query("insert into conversation_participants(conversation_id,user_id) values($1,$2),($1,$3) on conflict do nothing", [exchangeId, exchange.requester_id, exchange.provider_id]),
  ]);
  return { success: true, conversationId: exchangeId };
}

async function createMemberMessage(conversationId: string, content: string, replyToId?: string) {
  const userId = await getCurrentUserId();
  if (!userId) return { success: false, error: "Unauthorized" };
  const trimmed = typeof content === "string" ? content.trim() : "";
  if (!trimmed || trimmed.length > MAX_MESSAGE_LENGTH) return { success: false, error: "Message must be between 1 and 5000 characters" };
  const conversation = await memberConversation(conversationId, userId);
  if (!conversation) return { success: false, error: "Conversation not found" };
  if (!await assertNotBlocked(conversationId, userId)) return { success: false, error: "Messaging is unavailable for this conversation" };
  if (replyToId) {
    const [reply] = await sql.query("select 1 from messages where id=$1 and conversation_id=$2", [replyToId, conversationId]);
    if (!reply) return { success: false, error: "Reply target was not found" };
  }
  const recipients = await sql.query("select user_id from conversation_participants where conversation_id=$1 and user_id<>$2", [conversationId, userId]);
  const unread = payload<Record<string, number>>(conversation.unread_counts);
  for (const recipient of recipients) unread[String(recipient.user_id)] = (unread[String(recipient.user_id)] ?? 0) + 1;
  const now = new Date().toISOString();
  const messageId = crypto.randomUUID();
  const [sender] = await sql.query("select full_name,username from users where id=$1", [userId]);
  const senderName = String(sender?.full_name || sender?.username || "Someone");
  const notifications = recipients.map(row => ({ userId: String(row.user_id), id: crypto.randomUUID() }));
  await sql.transaction(tx => [
    tx.query("insert into messages(id,conversation_id,sender_id,message_type,content,metadata,read_by,created_at,payload) values($1,$2,$3,'text',$4,$5::jsonb,$6,$7,'{}'::jsonb)", [messageId, conversationId, userId, trimmed, JSON.stringify(replyToId ? { replyToId } : {}), [userId], now]),
    tx.query("update conversations set last_message=$2,last_message_at=$3,unread_counts=$4::jsonb,updated_at=$3 where id=$1", [conversationId, trimmed.slice(0, 160), now, JSON.stringify(unread)]),
    ...notifications.map(notification => tx.query("insert into notifications(id,source_path,user_id,notification_type,title,message,is_read,is_archived,link,related_id,created_at,payload) values($1,$2,$3,'message_received',$4,$5,false,false,$6,$7,$8,$9::jsonb)", [notification.id, `messages/${messageId}/${notification.userId}`, notification.userId, `New message from ${senderName}`, trimmed.slice(0, 160), `/messages/${conversationId}`, conversationId, now, JSON.stringify({ type: "message_received", title: `New message from ${senderName}`, message: trimmed.slice(0, 160), isRead: false, link: `/messages/${conversationId}`, relatedId: conversationId, createdAt: now })])),
  ]);
  scheduleNotificationEmails(notifications.map(notification => notification.id));
  revalidatePath(`/messages/${conversationId}`);
  return { success: true, messageId };
}

export async function sendMessage(conversationId: string, content: string, replyToId?: string) {
  return createMemberMessage(conversationId, content, replyToId);
}

export async function sendMessageAttachment(conversationId: string, formData: FormData, caption = "") {
  const userId = await getCurrentUserId();
  if (!userId) return { success: false, error: "Unauthorized" };
  const file = formData.get("file");
  if (!(file instanceof File)) return { success: false, error: "Choose a file to upload" };
  if (caption.length > MAX_MESSAGE_LENGTH) return { success: false, error: "Caption is too long" };
  const conversation = await memberConversation(conversationId, userId);
  if (!conversation || !await assertNotBlocked(conversationId, userId)) return { success: false, error: "Conversation is unavailable" };
  try {
    const uploaded = await storeMessageAttachment(userId, conversationId, file);
    const now = new Date().toISOString();
    const messageId = crypto.randomUUID();
    const attachmentId = crypto.randomUUID();
    const recipients = await sql.query("select user_id from conversation_participants where conversation_id=$1 and user_id<>$2", [conversationId, userId]);
    const unread = payload<Record<string, number>>(conversation.unread_counts);
    for (const recipient of recipients) unread[String(recipient.user_id)] = (unread[String(recipient.user_id)] ?? 0) + 1;
    const [sender] = await sql.query("select full_name,username from users where id=$1", [userId]);
    const senderName = String(sender?.full_name || sender?.username || "Someone");
    const notifications = recipients.map(row => ({ userId: String(row.user_id), id: crypto.randomUUID() }));
    await sql.transaction(tx => [
      tx.query("insert into messages(id,conversation_id,sender_id,message_type,content,metadata,read_by,created_at,payload) values($1,$2,$3,'file',$4,'{}'::jsonb,$5,$6,'{}'::jsonb)", [messageId, conversationId, userId, caption.trim() || `Shared ${safeName(file.name)}`, [userId], now]),
      tx.query("insert into message_attachments(id,message_id,conversation_id,uploaded_by,object_key,original_name,content_type,size_bytes,created_at) values($1,$2,$3,$4,$5,$6,$7,$8,$9)", [attachmentId, messageId, conversationId, userId, uploaded.key, safeName(file.name), uploaded.contentType, uploaded.sizeBytes, now]),
      tx.query("update conversations set last_message='Shared an attachment',last_message_at=$2,unread_counts=$3::jsonb,updated_at=$2 where id=$1", [conversationId, now, JSON.stringify(unread)]),
      ...notifications.map(notification => tx.query("insert into notifications(id,source_path,user_id,notification_type,title,message,is_read,is_archived,link,related_id,created_at,payload) values($1,$2,$3,'message_received',$4,$5,false,false,$6,$7,$8,$9::jsonb)", [notification.id, `messages/${messageId}/${notification.userId}`, notification.userId, `New attachment from ${senderName}`, safeName(file.name), `/messages/${conversationId}`, conversationId, now, JSON.stringify({ type: "message_received", title: `New attachment from ${senderName}`, message: safeName(file.name), isRead: false, link: `/messages/${conversationId}`, relatedId: conversationId, createdAt: now })])),
    ]);
    scheduleNotificationEmails(notifications.map(notification => notification.id));
    revalidatePath(`/messages/${conversationId}`);
    return { success: true, messageId };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Upload failed" };
  }
}

export async function editMessage(messageId: string, content: string) {
  const userId = await getCurrentUserId();
  const trimmed = typeof content === "string" ? content.trim() : "";
  if (!userId || !trimmed || trimmed.length > MAX_MESSAGE_LENGTH) return { success: false, error: "Invalid message" };
  const [message] = await sql.query("select m.conversation_id from messages m join conversation_participants p on p.conversation_id=m.conversation_id where m.id=$1 and m.sender_id=$2 and p.user_id=$2 and m.message_type='text'", [messageId, userId]);
  if (!message) return { success: false, error: "Message cannot be edited" };
  await sql.query("update messages set content=$2,edited_at=now() where id=$1", [messageId, trimmed]);
  revalidatePath(`/messages/${message.conversation_id}`);
  return { success: true };
}

export async function toggleMessageReaction(messageId: string, emoji: string) {
  const userId = await getCurrentUserId();
  if (!userId || !MESSAGE_EMOJIS.has(emoji)) return { success: false, error: "Invalid reaction" };
  const [message] = await sql.query("select m.conversation_id from messages m join conversation_participants p on p.conversation_id=m.conversation_id where m.id=$1 and p.user_id=$2", [messageId, userId]);
  if (!message) return { success: false, error: "Message not found" };
  const [existing] = await sql.query("select 1 from message_reactions where message_id=$1 and user_id=$2 and emoji=$3", [messageId, userId, emoji]);
  if (existing) await sql.query("delete from message_reactions where message_id=$1 and user_id=$2 and emoji=$3", [messageId, userId, emoji]);
  else await sql.query("insert into message_reactions(message_id,user_id,emoji) values($1,$2,$3)", [messageId, userId, emoji]);
  revalidatePath(`/messages/${message.conversation_id}`);
  return { success: true };
}

export async function toggleMessagePin(messageId: string) {
  const userId = await getCurrentUserId();
  if (!userId) return { success: false, error: "Unauthorized" };
  const [message] = await sql.query("select m.conversation_id from messages m join conversation_participants p on p.conversation_id=m.conversation_id where m.id=$1 and p.user_id=$2", [messageId, userId]);
  if (!message) return { success: false, error: "Message not found" };
  const [existing] = await sql.query("select 1 from message_pins where message_id=$1", [messageId]);
  if (existing) await sql.query("delete from message_pins where message_id=$1", [messageId]);
  else await sql.query("insert into message_pins(message_id,conversation_id,pinned_by) values($1,$2,$3)", [messageId, message.conversation_id, userId]);
  revalidatePath(`/messages/${message.conversation_id}`);
  return { success: true };
}

export async function reportMessage(messageId: string, reason: string) {
  const userId = await getCurrentUserId();
  const cleanReason = typeof reason === "string" ? reason.trim() : "";
  if (!userId || cleanReason.length < 3 || cleanReason.length > 1000) return { success: false, error: "Give a short report reason" };
  const [message] = await sql.query("select m.conversation_id from messages m join conversation_participants p on p.conversation_id=m.conversation_id where m.id=$1 and p.user_id=$2", [messageId, userId]);
  if (!message) return { success: false, error: "Message not found" };
  await sql.query("insert into message_reports(id,message_id,conversation_id,reporter_id,reason) values($1,$2,$3,$4,$5) on conflict(message_id,reporter_id) do update set reason=excluded.reason,status='open'", [crypto.randomUUID(), messageId, message.conversation_id, userId, cleanReason]);
  return { success: true };
}

export async function setConversationTyping(conversationId: string, isTyping: boolean) {
  const userId = await getCurrentUserId();
  if (!userId || !await memberConversation(conversationId, userId)) return { success: false };
  if (isTyping) await sql.query("insert into conversation_typing(conversation_id,user_id,updated_at) values($1,$2,now()) on conflict(conversation_id,user_id) do update set updated_at=now()", [conversationId, userId]);
  else await sql.query("delete from conversation_typing where conversation_id=$1 and user_id=$2", [conversationId, userId]);
  return { success: true };
}
export async function markConversationRead(conversationId: string) {
  const userId = await getCurrentUserId();
  if (!userId) return { success: false, error: "Unauthorized" };
  const conversation = await memberConversation(conversationId, userId);
  if (!conversation) return { success: false, error: "Conversation not found" };
  const unread = payload<Record<string, number>>(conversation.unread_counts);
  unread[userId] = 0;
  await sql.transaction(tx => [
    tx.query("update conversations set unread_counts=$2::jsonb,updated_at=now() where id=$1", [conversationId, JSON.stringify(unread)]),
    tx.query("update messages set read_by=array(select distinct unnest(read_by || $2::text[])) where conversation_id=$1 and sender_id<>$2", [conversationId, userId]),
  ]);
  return { success: true };
}

export async function setConversationArchived(conversationId: string, archived: boolean) {
  const userId = await getCurrentUserId();
  if (!userId || !await memberConversation(conversationId, userId)) return { success: false, error: "Conversation not found" };
  if (archived) await sql.query("insert into conversation_archives(conversation_id,user_id) values($1,$2) on conflict do nothing", [conversationId, userId]);
  else await sql.query("delete from conversation_archives where conversation_id=$1 and user_id=$2", [conversationId, userId]);
  revalidatePath("/messages");
  return { success: true };
}

export async function leaveConversation(conversationId: string) {
  const userId = await getCurrentUserId();
  const conversation = userId ? await memberConversation(conversationId, userId) : null;
  if (!userId || !conversation) return { success: false, error: "Conversation not found" };
  if (String(conversation.conversation_type) === "exchange") return { success: false, error: "Exchange conversations remain available as a protected collaboration record" };
  await sql.query("delete from conversation_participants where conversation_id=$1 and user_id=$2", [conversationId, userId]);
  revalidatePath("/messages");
  return { success: true };
}
export async function setConversationMuted(conversationId: string, muted: boolean) {
  const userId = await getCurrentUserId();
  if (!userId || !await memberConversation(conversationId, userId)) return { success: false, error: "Conversation not found" };
  await sql.query("insert into conversation_member_settings(conversation_id,user_id,is_muted) values($1,$2,$3) on conflict(conversation_id,user_id) do update set is_muted=excluded.is_muted", [conversationId, userId, muted]);
  return { success: true };
}

export async function saveConversationNote(conversationId: string, content: string) {
  const userId = await getCurrentUserId();
  const note = typeof content === "string" ? content.trim() : "";
  if (!userId || note.length > 10000 || !await memberConversation(conversationId, userId)) return { success: false, error: "Invalid note" };
  if (!note) await sql.query("delete from conversation_notes where conversation_id=$1 and user_id=$2", [conversationId, userId]);
  else await sql.query("insert into conversation_notes(id,conversation_id,user_id,content,created_at,updated_at) values($1,$2,$3,$4,now(),now()) on conflict(conversation_id,user_id) do update set content=excluded.content,updated_at=now()", [crypto.randomUUID(), conversationId, userId, note]);
  return { success: true };
}

export async function getConversationNote(conversationId: string) {
  const userId = await getCurrentUserId();
  if (!userId || !await memberConversation(conversationId, userId)) return { success: false, note: "" };
  const [note] = await sql.query("select content,updated_at from conversation_notes where conversation_id=$1 and user_id=$2", [conversationId, userId]);
  return { success: true, note: String(note?.content ?? ""), updatedAt: iso(note?.updated_at) };
}

export async function blockConversationPartner(conversationId: string) {
  const userId = await getCurrentUserId();
  if (!userId || !await memberConversation(conversationId, userId)) return { success: false, error: "Conversation not found" };
  const [partner] = await sql.query("select user_id from conversation_participants where conversation_id=$1 and user_id<>$2 limit 1", [conversationId, userId]);
  if (!partner) return { success: false, error: "No member to block" };
  await sql.query("insert into blocked_users(blocker_id,blocked_id) values($1,$2) on conflict do nothing", [userId, partner.user_id]);
  return { success: true };
}

export async function getConversationContext(conversationId: string) {
  const userId = await getCurrentUserId();
  if (!userId) return { success: false, error: "Unauthorized" };
  const conversation = await memberConversation(conversationId, userId);
  if (!conversation) return { success: false, error: "Conversation not found" };
  const data = conversationFromRow(conversation);
  const participants = await sql.query("select user_id from conversation_participants where conversation_id=$1", [conversationId]);
  const partnerId = participants.map(row => String(row.user_id)).find(id => id !== userId);
  const [partner] = partnerId ? await sql.query("select id,full_name,username,photo_url,is_verified,trust_score from users where id=$1", [partnerId]) : [];
  const [exchange, activityRows, typingRows] = await Promise.all([
    data.type === "exchange" ? sql.query("select * from exchanges where id=$1", [data.contextId]).then(rows => rows[0]) : Promise.resolve(undefined),
    data.type === "exchange" ? sql.query("select description,occurred_at from exchange_activity where exchange_id=$1 order by occurred_at desc limit 100", [data.contextId]) : Promise.resolve([]),
    sql.query("select user_id from conversation_typing where conversation_id=$1 and user_id<>$2 and updated_at>now()-interval '15 seconds'", [conversationId, userId]),
  ]);
  return { success: true, partner: partner ? { uid: partner.id, fullName: partner.full_name || partner.username || "Unknown User", photoURL: partner.photo_url || null, isVerified: partner.is_verified === true, trustScore: Number(partner.trust_score || 0) } : null, exchange: exchange ? { id: exchange.id, ...payload<Record<string, unknown>>(exchange.payload) } as Exchange : null, activity: activityRows.map(row => ({ description: String(row.description ?? "Exchange updated"), createdAt: iso(row.occurred_at) })), typingUserIds: typingRows.map(row => String(row.user_id)) };
}

export async function getExchangeQuickContext(exchangeId: string) {
  const userId = await getCurrentUserId();
  if (!userId) return { success: false, exchange: null, escrow: null };
  const [exchange] = await sql.query("select * from exchanges where id=$1 and $2 in(requester_id,provider_id)", [exchangeId, userId]);
  if (!exchange) return { success: false, exchange: null, escrow: null };
  const exchangeData = { ...payload<Record<string, unknown>>(exchange.payload), id: exchange.id, requesterId: exchange.requester_id, providerId: exchange.provider_id, status: exchange.status, title: exchange.title, skillHours: Number(exchange.skill_hours ?? 0) } as Exchange;
  const [escrow, countRow, fileRow] = await Promise.all([
    sql.query("select * from escrows where exchange_id=$1", [exchangeId]).then(rows => rows[0]),
    sql.query("select count(*)::int as count from messages where conversation_id=$1", [exchangeId]).then(rows => rows[0]),
    sql.query("select count(*)::int as count from message_attachments where conversation_id=$1", [exchangeId]).then(rows => rows[0]),
  ]);
  const escrowData = escrow ? { ...payload<Record<string, unknown>>(escrow.payload), id: escrow.id, exchangeId: escrow.exchange_id, status: escrow.status, participants: escrow.participants, timeline: escrow.timeline } : null;
  return { success: true, exchange: exchangeData, escrow: escrowData, stats: { messages: Number(countRow?.count ?? 0), files: Number(fileRow?.count ?? 0) } };
}