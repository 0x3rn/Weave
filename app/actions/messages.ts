"use server";

import { db } from "@/lib/firebase-admin";
import { getCurrentUserId } from "./user";
import { Conversation, Message, Exchange } from "@/types";
import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";

export async function getConversations() {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return { success: false, error: "Unauthorized" };
    if (!db) return { success: false, error: "Database not initialized" };

    const snapshot = await db.collection("conversations")
      .where("participants", "array-contains", userId)
      .orderBy("lastMessageAt", "desc")
      .get();

    const conversations = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Conversation));
    
    return { success: true, conversations };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getOrCreateExchangeConversation(exchangeId: string) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return { success: false, error: "Unauthorized" };
    if (!db) return { success: false, error: "Database not initialized" };

    const convDoc = await db.collection("conversations").doc(exchangeId).get();
    
    if (convDoc.exists) {
      return { success: true, conversationId: convDoc.id };
    }

    // Create it if it doesn't exist
    const exchangeDoc = await db.collection("exchanges").doc(exchangeId).get();
    if (!exchangeDoc.exists) return { success: false, error: "Exchange not found" };
    const exchange = exchangeDoc.data() as Exchange;

    const newConv: Partial<Conversation> = {
      type: "exchange",
      contextId: exchangeId,
      participants: [exchange.requesterId, exchange.providerId],
      unreadCount: {
        [exchange.requesterId]: 0,
        [exchange.providerId]: 0
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await db.collection("conversations").doc(exchangeId).set(newConv);
    return { success: true, conversationId: exchangeId };

  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function sendMessage(conversationId: string, content: string, type: Message["type"] = "text", metadata?: any) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return { success: false, error: "Unauthorized" };
    if (!db) return { success: false, error: "Database not initialized" };

    const convRef = db.collection("conversations").doc(conversationId);
    
    await db.runTransaction(async (transaction) => {
      const convDoc = await transaction.get(convRef);
      if (!convDoc.exists) throw new Error("Conversation not found");
      const conv = convDoc.data() as Conversation;

      if (!conv.participants.includes(userId)) throw new Error("Not a participant");

      const messageId = randomUUID();
      const messageRef = db.collection("messages").doc(messageId);
      
      const newMessage: Partial<Message> = {
        conversationId,
        senderId: userId,
        type,
        content,
        metadata: metadata || null,
        readBy: [userId],
        createdAt: new Date().toISOString()
      };

      transaction.set(messageRef, newMessage);

      // Update Conversation unread counts
      const newUnreadCount = { ...conv.unreadCount };
      conv.participants.forEach(pId => {
        if (pId !== userId) {
          newUnreadCount[pId] = (newUnreadCount[pId] || 0) + 1;
        }
      });

      transaction.update(convRef, {
        lastMessage: type === "text" ? content : `Sent a ${type}`,
        lastMessageAt: newMessage.createdAt,
        unreadCount: newUnreadCount,
        updatedAt: new Date().toISOString()
      });
    });

    revalidatePath(`/messages/${conversationId}`);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function markConversationRead(conversationId: string) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return { success: false, error: "Unauthorized" };
    if (!db) return { success: false, error: "Database not initialized" };

    const convRef = db.collection("conversations").doc(conversationId);
    
    await db.runTransaction(async (transaction) => {
      const convDoc = await transaction.get(convRef);
      if (!convDoc.exists) throw new Error("Conversation not found");
      const conv = convDoc.data() as Conversation;

      if (!conv.participants.includes(userId)) return;

      const newUnreadCount = { ...conv.unreadCount };
      if (newUnreadCount[userId] === 0) return; // Already read

      newUnreadCount[userId] = 0;

      transaction.update(convRef, {
        unreadCount: newUnreadCount,
        updatedAt: new Date().toISOString()
      });
    });

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
