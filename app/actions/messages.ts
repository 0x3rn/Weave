"use server";

import { payload, sql, iso } from "@/lib/neon";
import { getCurrentUserId } from "./user";
import { Conversation, Exchange, Message } from "@/types";
import { revalidatePath } from "next/cache";

type ConversationRow = Record<string, unknown> & { id: string; payload: unknown };

function conversationFromRow(row: ConversationRow): Conversation {
  const data = payload<Record<string, unknown>>(row.payload);
  return {
    id: row.id,
    type: String(row.conversation_type ?? data.type ?? "exchange") as Conversation["type"],
    contextId: String(row.context_id ?? data.contextId ?? ""),
    participants: Array.isArray(data.participants) ? data.participants.filter((id): id is string => typeof id === "string") : [],
    lastMessage: String(row.last_message ?? data.lastMessage ?? "") || undefined,
    lastMessageAt: iso(row.last_message_at) || undefined,
    unreadCount: payload<Record<string, number>>(row.unread_counts),
    createdAt: iso(row.created_at),
    updatedAt: iso(row.updated_at),
  };
}

export async function getConversations() {
  const userId = await getCurrentUserId();
  if (!userId) return { success: false, error: "Unauthorized" };
  try {
    const rows = await sql.query(
      "select c.* from conversations c join conversation_participants p on p.conversation_id = c.id where p.user_id = $1 order by c.last_message_at desc nulls last, c.updated_at desc",
      [userId],
    );
    const conversations = await Promise.all(rows.map(async row => {
      const participants = await sql.query("select user_id from conversation_participants where conversation_id = $1", [row.id]);
      const conversation = conversationFromRow(row as ConversationRow);
      conversation.participants = participants.map(participant => String(participant.user_id));
      return conversation;
    }));
    return { success: true, conversations };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Failed to load conversations" };
  }
}

export async function getOrCreateExchangeConversation(exchangeId: string) {
  const userId = await getCurrentUserId();
  if (!userId) return { success: false, error: "Unauthorized" };
  const [exchange] = await sql.query("select * from exchanges where id = $1 and (requester_id = $2 or provider_id = $2)", [exchangeId, userId]);
  if (!exchange) return { success: false, error: "Exchange not found" };
  const now = new Date().toISOString();
  await sql.query(
    "insert into conversations (id,conversation_type,context_id,unread_counts,created_at,updated_at,payload) values ($1,'exchange',$1,$2::jsonb,$3,$3,$4::jsonb) on conflict (id) do nothing",
    [exchangeId, JSON.stringify({ [exchange.requester_id]: 0, [exchange.provider_id]: 0 }), now, JSON.stringify({ type: "exchange", contextId: exchangeId })],
  );
  await sql.query(
    "insert into conversation_participants (conversation_id,user_id) values ($1,$2),($1,$3) on conflict do nothing",
    [exchangeId, exchange.requester_id, exchange.provider_id],
  );
  return { success: true, conversationId: exchangeId };
}

export async function sendMessage(conversationId: string, content: string, type: Message["type"] = "text", metadata?: Record<string, unknown>) {
  const userId = await getCurrentUserId();
  if (!userId) return { success: false, error: "Unauthorized" };
  if (typeof content !== "string" || !content.trim() || content.length > 5000 || !["text", "file", "system_event", "rich_card"].includes(type)) return { success: false, error: "Invalid message" };
  if (metadata && JSON.stringify(metadata).length > 5000) return { success: false, error: "Invalid message metadata" };
  try {
    const [conversation] = await sql.query(
      "select c.* from conversations c join conversation_participants p on p.conversation_id=c.id where c.id=$1 and p.user_id=$2",
      [conversationId, userId],
    );
    if (!conversation) return { success: false, error: "Conversation not found" };
    const recipients = await sql.query("select user_id from conversation_participants where conversation_id=$1 and user_id <> $2", [conversationId, userId]);
    const unread = payload<Record<string, number>>(conversation.unread_counts);
    for (const recipient of recipients) unread[String(recipient.user_id)] = (unread[String(recipient.user_id)] ?? 0) + 1;
    const now = new Date().toISOString();
    const messageId = crypto.randomUUID();
    await sql.transaction(tx => [
      tx.query("insert into messages (id,conversation_id,sender_id,message_type,content,metadata,read_by,created_at,payload) values ($1,$2,$3,$4,$5,$6::jsonb,$7,$8,$9::jsonb)", [messageId, conversationId, userId, type, content.trim(), JSON.stringify(metadata ?? null), [userId], now, JSON.stringify({})]),
      tx.query("update conversations set last_message=$2,last_message_at=$3,unread_counts=$4::jsonb,updated_at=$3 where id=$1", [conversationId, type === "text" ? content.trim() : `Sent a ${type}`, now, JSON.stringify(unread)]),
    ]);
    revalidatePath(`/messages/${conversationId}`);
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Failed to send message" };
  }
}

export async function getConversationContext(conversationId: string) {
  const userId = await getCurrentUserId();
  if (!userId) return { success: false, error: "Unauthorized" };
  const [conversation] = await sql.query(
    "select c.* from conversations c join conversation_participants p on p.conversation_id=c.id where c.id=$1 and p.user_id=$2",
    [conversationId, userId],
  );
  if (!conversation) return { success: false, error: "Conversation not found" };
  const data = conversationFromRow(conversation as ConversationRow);
  const participants = await sql.query("select user_id from conversation_participants where conversation_id=$1", [conversationId]);
  const partnerId = participants.map(row => String(row.user_id)).find(id => id !== userId);
  const [partner] = partnerId ? await sql.query("select id,full_name,username,photo_url,is_verified,trust_score from users where id=$1", [partnerId]) : [];
  const [exchange] = data.type === "exchange" ? await sql.query("select * from exchanges where id=$1", [data.contextId]) : [];
  return {
    success: true,
    partner: partner ? { uid: partner.id, fullName: partner.full_name || partner.username || "Unknown User", photoURL: partner.photo_url || null, isVerified: partner.is_verified === true, trustScore: Number(partner.trust_score || 0) } : null,
    exchange: exchange ? { id: exchange.id, ...payload<Record<string, unknown>>(exchange.payload) } as Exchange : null,
  };
}

export async function markConversationRead(conversationId: string) {
  const userId = await getCurrentUserId();
  if (!userId) return { success: false, error: "Unauthorized" };
  const [conversation] = await sql.query(
    "select c.* from conversations c join conversation_participants p on p.conversation_id=c.id where c.id=$1 and p.user_id=$2",
    [conversationId, userId],
  );
  if (!conversation) return { success: false, error: "Conversation not found" };
  const unread = payload<Record<string, number>>(conversation.unread_counts);
  unread[userId] = 0;
  await sql.query("update conversations set unread_counts=$2::jsonb,updated_at=now() where id=$1", [conversationId, JSON.stringify(unread)]);
  return { success: true };
}
