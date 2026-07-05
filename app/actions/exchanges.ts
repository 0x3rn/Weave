"use server";

import { db } from "@/lib/firebase-admin";
import { ExchangeRequest, Notification } from "@/types";

export async function createExchangeRequest(data: Omit<ExchangeRequest, "id" | "status" | "createdAt" | "updatedAt">) {
  try {
    if (!db) throw new Error("Database not initialized");
    const docRef = db.collection("exchangeRequests").doc();
    
    const request: ExchangeRequest = {
      ...data,
      id: docRef.id,
      status: "pending",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    await docRef.set(request);
    
    // Create a notification for the receiver
    const notifRef = db.collection("notifications").doc();
    const notification: Notification = {
      id: notifRef.id,
      userId: data.receiverId,
      type: "exchange_request",
      title: "New Exchange Request",
      message: `You have a new request for ${data.skillNeeded}.`,
      isRead: false,
      relatedId: request.id,
      createdAt: new Date().toISOString()
    };
    
    await notifRef.set(notification);
    
    return { success: true, id: docRef.id };
  } catch (error: any) {
    console.error("Error creating exchange request:", error);
    return { success: false, error: error.message };
  }
}

export async function updateExchangeRequest(requestId: string, status: string, message?: string, updates?: Partial<ExchangeRequest>) {
  try {
    if (!db) throw new Error("Database not initialized");
    const reqRef = db.collection("exchangeRequests").doc(requestId);
    const doc = await reqRef.get();
    
    if (!doc.exists) {
      throw new Error("Request not found");
    }
    
    const request = doc.data() as ExchangeRequest;
    
    const payload: any = { 
      status, 
      updatedAt: new Date().toISOString() 
    };
    
    if (updates) {
      if (updates.hoursNeeded !== undefined) payload.hoursNeeded = updates.hoursNeeded;
      if (updates.timeNeeded !== undefined) payload.timeNeeded = updates.timeNeeded;
      if (updates.dateOptions !== undefined) payload.dateOptions = updates.dateOptions;
    }
    
    await reqRef.update(payload);
    
    // Notify the sender
    let notifMsg = `Your request for ${request.skillNeeded} was ${status}.`;
    if (status === "reviewing") notifMsg = `The provider has countered your request for ${request.skillNeeded}.`;
    if (message) notifMsg += ` Message: ${message}`;
    
    const notifRef = db.collection("notifications").doc();
    const notification: Notification = {
      id: notifRef.id,
      userId: request.senderId,
      type: "request_update",
      title: `Request ${status === "reviewing" ? "Update" : status}`,
      message: notifMsg,
      isRead: false,
      relatedId: requestId,
      createdAt: new Date().toISOString()
    };
    
    await notifRef.set(notification);
    
    return { success: true };
  } catch (error: any) {
    console.error("Error updating exchange request:", error);
    return { success: false, error: error.message };
  }
}

export async function getExchangeRequests(userId: string, role: "sender" | "receiver") {
  try {
    if (!db) throw new Error("Database not initialized");
    const field = role === "sender" ? "senderId" : "receiverId";
    const snapshot = await db.collection("exchangeRequests")
      .where(field, "==", userId)
      .orderBy("createdAt", "desc")
      .get();
      
    return {
      success: true,
      requests: snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as ExchangeRequest)
    };
  } catch (error: any) {
    console.error("Error fetching exchange requests:", error);
    return { success: false, error: error.message, requests: [] };
  }
}
