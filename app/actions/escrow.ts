"use server";

import { db } from "@/lib/firebase-admin";
import { getCurrentUserId } from "./user";
import { Escrow, EscrowParticipant, EscrowEvent, Exchange, User } from "@/types";
import { revalidatePath } from "next/cache";
import { randomUUID } from "crypto";

export async function getEscrowByExchangeId(exchangeId: string) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return { success: false, error: "Unauthorized" };
    if (!db) return { success: false, error: "Database not initialized" };

    const snapshot = await db.collection("escrows").where("exchangeId", "==", exchangeId).get();
    if (snapshot.empty) return { success: false, error: "Escrow not found" };

    const escrow = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as Escrow;
    
    // Ensure the user is a participant or admin
    if (!escrow.participants[userId]) {
      // Check admin status here if needed, but for now just block
      return { success: false, error: "Unauthorized access to escrow" };
    }

    return { success: true, escrow };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getActiveEscrows() {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return { success: false, error: "Unauthorized" };
    if (!db) return { success: false, error: "Database not initialized" };

    const snapshot = await db.collection("escrows").where("participantIds", "array-contains", userId).get();
    const escrows = snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() } as Escrow))
      .filter(escrow => !!escrow.participants[userId]);
      
    return { success: true, escrows };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function initializeEscrow(exchangeId: string) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return { success: false, error: "Unauthorized" };
    if (!db) return { success: false, error: "Database not initialized" };

    const exchangeDoc = await db.collection("exchanges").doc(exchangeId).get();
    if (!exchangeDoc.exists) return { success: false, error: "Exchange not found" };
    const exchange = exchangeDoc.data() as Exchange;
    if (exchange.requesterId !== userId && exchange.providerId !== userId) return { success: false, error: "Unauthorized access to exchange" };

    // Check if escrow already exists
    if (exchange.escrowId) {
      return { success: false, error: "Escrow already exists for this exchange" };
    }

    const participants: Record<string, EscrowParticipant> = {};

    participants[exchange.requesterId] = {
      userId: exchange.requesterId,
      role: "requester",
      skillHoursReserved: exchange.skillHours,
      securityDepositAmount: 0,
      depositStatus: "received",
      deliverablesStatus: "pending",
      approvalStatus: "pending",
      commitments: exchange.requesterDeliverables || ["Complete required deliverables"]
    };

    participants[exchange.providerId] = {
      userId: exchange.providerId,
      role: "provider",
      skillHoursReserved: exchange.isMutual ? exchange.skillHours : 0, // In single exchanges, provider doesn't reserve hours
      securityDepositAmount: 0,
      depositStatus: "received",
      deliverablesStatus: "pending",
      approvalStatus: "pending",
      commitments: exchange.providerDeliverables || exchange.deliverables || ["Complete required deliverables"]
    };

    const initialEvent: EscrowEvent = {
      id: randomUUID(),
      type: "created",
      message: "Escrow contract created. Skill Hours are reserved by the exchange workflow.",
      timestamp: new Date().toISOString(),
      actorId: userId
    };

    const newEscrowRef = db.collection("escrows").doc();
    const newEscrow: Partial<Escrow> = {
      exchangeId,
      status: "locked",
      participants,
      participantIds: [exchange.requesterId, exchange.providerId],
      timeline: [initialEvent],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const batch = db.batch();
    batch.set(newEscrowRef, newEscrow);
    batch.update(exchangeDoc.ref, { escrowId: newEscrowRef.id });
    
    await batch.commit();
    revalidatePath(`/dashboard/exchanges/${exchangeId}`);
    return { success: true, escrowId: newEscrowRef.id };

  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function processDeposit(escrowId: string) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return { success: false, error: "Unauthorized" };
    if (!db) return { success: false, error: "Database not initialized" };

    const escrowRef = db.collection("escrows").doc(escrowId);
    
    const result = await db.runTransaction(async (transaction) => {
      const escrowDoc = await transaction.get(escrowRef);
      if (!escrowDoc.exists) throw new Error("Escrow not found");
      const escrow = escrowDoc.data() as Escrow;

      if (!escrow.participants[userId]) throw new Error("Not a participant");
      if (escrow.participants[userId].depositStatus === "received") return { newStatus: escrow.status };

      // The exchange workflow already reserves Skill Hours. This legacy view never moves balances.
      const updatedParticipants = { ...escrow.participants };
      updatedParticipants[userId].depositStatus = "received";

      // 3. Add timeline events
      const events = [...escrow.timeline];
      events.push({
        id: randomUUID(),
        type: "deposit_received",
        message: `$${updatedParticipants[userId].securityDepositAmount} Security Deposit received.`,
        timestamp: new Date().toISOString(),
        actorId: userId
      });

      // Check if both have deposited
      const allDeposited = Object.values(updatedParticipants).every(p => p.depositStatus === "received");
      let newStatus = escrow.status;

      if (allDeposited && escrow.status === "pending_deposits") {
        newStatus = "locked";
        events.push({
          id: randomUUID(),
          type: "created",
          message: "All deposits received. Contract is now locked and active.",
          timestamp: new Date().toISOString()
        });
      }

      transaction.update(escrowRef, {
        participants: updatedParticipants,
        status: newStatus,
        timeline: events,
        updatedAt: new Date().toISOString()
      });

      return { newStatus };
    });

    revalidatePath(`/dashboard/escrow/${escrowId}`);
    return { success: true, status: result.newStatus };

  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function submitDeliverables(escrowId: string) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return { success: false, error: "Unauthorized" };
    if (!db) return { success: false, error: "Database not initialized" };

    return { success: false, error: "Submit deliverables from the exchange workspace" };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function approveDeliverables(escrowId: string, partnerId: string) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return { success: false, error: "Unauthorized" };
    if (!db) return { success: false, error: "Database not initialized" };

    const escrowRef = db.collection("escrows").doc(escrowId);
    
    const result = await db.runTransaction(async (transaction) => {
      const escrowDoc = await transaction.get(escrowRef);
      if (!escrowDoc.exists) throw new Error("Escrow not found");
      const escrow = escrowDoc.data() as Escrow;
      if (!escrow.participants[userId] || !escrow.participants[partnerId] || partnerId === userId) throw new Error("Not an escrow participant");

      if (escrow.participants[partnerId].deliverablesStatus !== "submitted") {
        throw new Error("Partner has not submitted deliverables yet");
      }

      const participants = { ...escrow.participants };
      participants[partnerId].deliverablesStatus = "approved";
      participants[userId].approvalStatus = "approved";

      const events = [...escrow.timeline];
      events.push({
        id: randomUUID(),
        type: "approved",
        message: "Partner deliverables approved.",
        timestamp: new Date().toISOString(),
        actorId: userId
      });

      // Check if both have approved (or if it's a single exchange and requester approved)
      // For a mutual exchange, both need to approve. For single, only requester approves provider's work.
      const p1 = Object.values(participants)[0];
      const p2 = Object.values(participants)[1];
      
      const singleExchangeComplete = p1.skillHoursReserved === 0 || p2.skillHoursReserved === 0;
      let allApproved = false;

      if (singleExchangeComplete) {
        // Single exchange: Provider gives 0 hours, Requester gives X hours. Requester approves provider's work.
        const requester = Object.values(participants).find(p => p.role === "requester");
        if (userId === requester?.userId) {
          allApproved = true;
        }
      } else {
        // Mutual exchange
        allApproved = p1.approvalStatus === "approved" && p2.approvalStatus === "approved";
      }

      transaction.update(escrowRef, {
        participants,
        timeline: events,
        updatedAt: new Date().toISOString()
      });

      return { allApproved };
    });

    revalidatePath(`/dashboard/escrow/${escrowId}`);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function releaseEscrow(escrowId: string) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return { success: false, error: "Unauthorized" };
    if (!db) return { success: false, error: "Database not initialized" };

    const escrowRef = db.collection("escrows").doc(escrowId);
    
    await db.runTransaction(async (transaction) => {
      const escrowDoc = await transaction.get(escrowRef);
      if (!escrowDoc.exists) throw new Error("Escrow not found");
      const escrow = escrowDoc.data() as Escrow;

      if (!escrow.participants[userId]) throw new Error("Not an escrow participant");

      if (escrow.status === "released") throw new Error("Escrow already released");

      const pArr = Object.values(escrow.participants);
      const requester = pArr.find(p => p.role === "requester")!;
      const provider = pArr.find(p => p.role === "provider")!;

      // Refund logic - simulating refunding standard deposit amount
      const participants = { ...escrow.participants };
      participants[requester.userId].depositStatus = "returned";
      participants[provider.userId].depositStatus = "returned";

      const exchangeRef = db!.collection("exchanges").doc(escrow.exchangeId);
      const exchangeDoc = await transaction.get(exchangeRef);
      if (!exchangeDoc.exists || exchangeDoc.data()?.status !== "completed") throw new Error("Complete the exchange from its workspace first");

      // Add final events
      const events = [...escrow.timeline];
      events.push({
        id: randomUUID(),
        type: "released",
        message: "Escrow successfully released. Deposits returned and Skill Hours transferred.",
        timestamp: new Date().toISOString(),
        actorId: "system"
      });

      // Close Escrow
      transaction.update(escrowRef, {
        status: "released",
        participants,
        timeline: events,
        updatedAt: new Date().toISOString()
      });
    });

    revalidatePath(`/dashboard/escrow/${escrowId}`);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function openDispute(escrowId: string, reason: string, details: string) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return { success: false, error: "Unauthorized" };
    if (!db) return { success: false, error: "Database not initialized" };

    const escrowRef = db.collection("escrows").doc(escrowId);
    const escrowDoc = await escrowRef.get();
    if (!escrowDoc.exists) return { success: false, error: "Escrow not found" };
    
    const escrow = escrowDoc.data() as Escrow;
    if (!escrow.participants[userId]) return { success: false, error: "Unauthorized" };
    if (typeof reason !== "string" || typeof details !== "string" || reason.trim().length === 0 || reason.length > 500 || details.length > 5000) return { success: false, error: "Invalid dispute" };
    
    await escrowRef.update({
      status: "disputed",
      dispute: {
        reason,
        details,
        openedAt: new Date().toISOString(),
        status: "investigating",
        evidenceUrls: []
      },
      timeline: [
        ...escrow.timeline,
        {
          id: randomUUID(),
          type: "disputed",
          message: `Dispute opened: ${reason}`,
          timestamp: new Date().toISOString(),
          actorId: userId
        }
      ],
      updatedAt: new Date().toISOString()
    });

    revalidatePath(`/dashboard/escrow/${escrowId}`);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
