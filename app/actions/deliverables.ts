"use server";

import { db } from "@/lib/firebase-admin";
import { getCurrentUserId } from "./user";
import { ExchangeDeliverable, Exchange } from "@/types";

export async function submitDeliverable(
  exchangeId: string, 
  files: { name: string; url: string; type: string; size: number }[],
  comments: string
) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return { success: false, error: "Unauthorized" };
    if (!db) return { success: false, error: "Database not initialized" };

    const exchangeRef = db.collection("exchanges").doc(exchangeId);
    const exchangeDoc = await exchangeRef.get();

    if (!exchangeDoc.exists) return { success: false, error: "Exchange not found" };
    
    const exchangeData = exchangeDoc.data() as Exchange;
    const isMutual = !!exchangeData.isMutual;

    if (!isMutual && exchangeData.providerId !== userId) {
      return { success: false, error: "Only the provider can submit deliverables" };
    }

    if (isMutual && exchangeData.providerId !== userId && exchangeData.requesterId !== userId) {
      return { success: false, error: "You are not part of this exchange" };
    }

    // Determine new version number
    const deliveriesRef = exchangeRef.collection("deliveries");
    const snapshot = await deliveriesRef.get();
    const version = snapshot.size + 1;

    const now = new Date().toISOString();

    await db.runTransaction(async (t) => {
      // 1. Create the deliverable
      const newDelivRef = deliveriesRef.doc();
      const deliverable: Omit<ExchangeDeliverable, "id"> = {
        version,
        files,
        comments,
        submittedBy: userId,
        uploadedAt: now
      };
      t.set(newDelivRef, deliverable);

      // 2. Update Exchange Status
      const updates: any = { updatedAt: now };

      if (isMutual) {
        if (userId === exchangeData.providerId) {
          updates.providerSubmittedAt = now;
        } else if (userId === exchangeData.requesterId) {
          updates.requesterSubmittedAt = now;
        }
        
        // If both have submitted, status becomes 'in_review'
        const willBeProviderSubmitted = updates.providerSubmittedAt || exchangeData.providerSubmittedAt;
        const willBeRequesterSubmitted = updates.requesterSubmittedAt || exchangeData.requesterSubmittedAt;
        
        if (willBeProviderSubmitted && willBeRequesterSubmitted) {
          updates.status = "in_review";
        }
      } else {
        updates.status = "in_review";
      }

      t.update(exchangeRef, updates);

      // 3. Log Activity
      const activityRef = exchangeRef.collection("activity").doc();
      const actorName = userId === exchangeData.providerId ? "Provider" : "Requester";
      t.set(activityRef, {
        type: "files_uploaded",
        description: `${actorName} submitted deliverables (Version ${version}).`,
        timestamp: now
      });

      // 4. Notify the other party
      const targetUserId = userId === exchangeData.providerId ? exchangeData.requesterId : exchangeData.providerId;
      const notifRef = db!.collection("users").doc(targetUserId).collection("notifications").doc();
      t.set(notifRef, {
        type: "request_update",
        title: "Work Submitted",
        message: `Deliverables have been submitted for '${exchangeData.title}'. Check your workspace.`,
        isRead: false,
        link: `/exchanges/${exchangeId}/files`,
        createdAt: now
      });
    });

    return { success: true };
  } catch (error: any) {
    console.error("Error submitting deliverable:", error);
    return { success: false, error: error.message };
  }
}

export async function getDeliverables(exchangeId: string) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return { success: false, error: "Unauthorized" };
    if (!db) return { success: false, error: "Database not initialized" };

    // Basic access check could be added here, but typically this is fetched client-side or we rely on the page layout's auth check.
    const snapshot = await db.collection("exchanges").doc(exchangeId).collection("deliveries").orderBy("version", "desc").get();
    
    const deliveries = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as ExchangeDeliverable[];

    return { success: true, deliveries };
  } catch (error: any) {
    console.error("Error fetching deliverables:", error);
    return { success: false, error: error.message, deliveries: [] };
  }
}
