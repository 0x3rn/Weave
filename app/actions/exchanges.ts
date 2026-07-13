"use server";

import { db } from "@/lib/firebase-admin";
import { ExchangeRequest, Notification, MarketplaceApplication, MarketplaceRequest, Exchange, LedgerTransaction, User } from "@/types";
import { getCurrentUserId } from "./user";

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

export async function createExchangeFromApplication(applicationId: string) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    if (!db) {
      return { success: false, error: "Database not initialized" };
    }

    const appRef = db.collection("marketplace_applications").doc(applicationId);
    const appDoc = await appRef.get();
    
    if (!appDoc.exists) {
      return { success: false, error: "Application not found" };
    }

    const appData = appDoc.data() as MarketplaceApplication;

    // Verify ownership of the associated request
    const requestRef = db.collection("marketplace_requests").doc(appData.requestId);
    const requestDoc = await requestRef.get();
    
    if (!requestDoc.exists) {
      return { success: false, error: "Associated request not found" };
    }
    
    const requestData = requestDoc.data() as MarketplaceRequest;
    if (requestData.requesterId !== userId) {
      return { success: false, error: "Unauthorized" };
    }

    if (appData.status === "accepted") {
      return { success: false, error: "Application is already accepted" };
    }

    const requiredHours = appData.estimatedHours;
    const providerRef = db.collection("users").doc(appData.applicantId);
    const requesterRef = db.collection("users").doc(userId);

    const isMutual = !!appData.isMutualProposal;
    const mutualHours = appData.offeredHours || requiredHours;

    let newExchangeId = "";

    // Run transaction for Escrow (Skill Hours Reservation)
    await db.runTransaction(async (t) => {
      const requesterDoc = await t.get(requesterRef);
      if (!requesterDoc.exists) throw new Error("Requester profile not found");
      
      const providerDoc = await t.get(providerRef);
      if (!providerDoc.exists) throw new Error("Applicant profile not found");

      const requesterData = requesterDoc.data() as User;
      const providerData = providerDoc.data() as User;
      
      const reqBalance = requesterData.skillHours || 0;
      const provBalance = providerData.skillHours || 0;

      if (reqBalance < requiredHours) {
        throw new Error(`Insufficient Skill Hours. You need ${requiredHours} hours to accept this proposal.`);
      }

      if (isMutual && provBalance < mutualHours) {
        throw new Error(`The applicant does not have enough Skill Hours (${mutualHours}) to commit to this mutual exchange.`);
      }

      // 1. Deduct from Requester
      t.update(requesterRef, {
        skillHours: reqBalance - requiredHours
      });

      // 1b. Deduct from Provider (if mutual)
      if (isMutual) {
        t.update(providerRef, {
          skillHours: provBalance - mutualHours
        });
      }

      // 2. Create the Exchange
      const exchangeRef = db.collection("exchanges").doc();
      newExchangeId = exchangeRef.id;
      
      const now = new Date().toISOString();
      const exchange: Omit<Exchange, "id"> = {
        requestId: requestData.id,
        applicationId: appData.id,
        title: requestData.title,
        requesterId: userId,
        providerId: appData.applicantId,
        skillHours: requiredHours,
        status: "in_progress",
        escrowStatus: "reserved",
        deliverables: requestData.deliverables || [],
        deadline: appData.estimatedCompletionDate || "",
        progress: 0,
        createdAt: now,
        updatedAt: now,
        ...(isMutual && {
          isMutual: true,
          providerEscrowStatus: "reserved",
          requesterEscrowStatus: "reserved",
          providerDeliverables: requestData.offeredDeliverables || [], // The applicant delivers what the requester wanted
          requesterDeliverables: appData.offeredDeliverables || [], // The requester delivers what the applicant wanted
        })
      };
      t.set(exchangeRef, exchange);

      // 3. Create Ledger Transaction (Requester)
      const ledgerRefReq = db.collection("transactions").doc();
      t.set(ledgerRefReq, {
        userId: userId,
        date: now,
        type: "Reserved",
        description: `Escrow for: ${requestData.title}`,
        exchangeId: newExchangeId,
        amount: -requiredHours,
        balanceAfter: reqBalance - requiredHours,
        balanceBefore: reqBalance,
        status: "Active",
        linkedUserId: appData.applicantId,
        linkedUserName: providerData?.fullName || providerData?.username || "Unknown",
        linkedUserAvatar: providerData?.photoURL || null,
        notes: "Hours are locked in escrow until the exchange is completed."
      });

      // 3b. Create Ledger Transaction (Provider, if mutual)
      if (isMutual) {
        const ledgerRefProv = db.collection("transactions").doc();
        t.set(ledgerRefProv, {
          userId: appData.applicantId,
          date: now,
          type: "Reserved",
          description: `Mutual Escrow for: ${requestData.title}`,
          exchangeId: newExchangeId,
          amount: -mutualHours,
          balanceAfter: provBalance - mutualHours,
          balanceBefore: provBalance,
          status: "Active",
          linkedUserId: userId,
          linkedUserName: requesterData?.fullName || requesterData?.username || "Unknown",
          linkedUserAvatar: requesterData?.photoURL || null,
          notes: "Hours are locked in escrow until the exchange is completed."
        });
      }

      // 4. Update Application & Request Status
      t.update(appRef, { status: "accepted", updatedAt: now });
      t.update(requestRef, { status: "in_progress", updatedAt: now });

      // 5. Initial Workspace Activity Log
      const activityRef = exchangeRef.collection("activity").doc();
      t.set(activityRef, {
        type: "created",
        description: "Exchange created and Skill Hours escrowed.",
        timestamp: now,
      });

      // 6. Notification for Provider
      const notificationRef = providerRef.collection("notifications").doc();
      t.set(notificationRef, {
        type: "request_update",
        title: "Proposal Accepted!",
        message: `Your application for '${requestData.title}' was accepted. Your workspace is ready.`,
        isRead: false,
        link: `/exchanges/${newExchangeId}`,
        createdAt: now,
      });
    });

    return { success: true, exchangeId: newExchangeId };
  } catch (error: any) {
    console.error("Error creating exchange:", error);
    return { success: false, error: error.message || "Failed to create exchange" };
  }
}

export async function getExchange(exchangeId: string) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    if (!db) {
      return { success: false, error: "Database not initialized" };
    }

    const exchangeDoc = await db.collection("exchanges").doc(exchangeId).get();
    if (!exchangeDoc.exists) {
      return { success: false, error: "Exchange not found" };
    }

    const data = exchangeDoc.data() as Exchange;
    data.id = exchangeDoc.id;

    if (data.requesterId !== userId && data.providerId !== userId) {
      return { success: false, error: "Unauthorized access to exchange" };
    }

    // Fetch user details for display
    const requesterDoc = await db.collection("users").doc(data.requesterId).get();
    const providerDoc = await db.collection("users").doc(data.providerId).get();

    const requesterData = requesterDoc.data();
    const providerData = providerDoc.data();

    return {
      success: true,
      exchange: data,
      requester: {
        id: data.requesterId,
        name: requesterData?.fullName || requesterData?.username || "Unknown",
        avatar: requesterData?.photoURL || null,
        timezone: requesterData?.timeZone || "UTC",
      },
      provider: {
        id: data.providerId,
        name: providerData?.fullName || providerData?.username || "Unknown",
        avatar: providerData?.photoURL || null,
        timezone: providerData?.timeZone || "UTC",
      }
    };
  } catch (error: any) {
    console.error("Error fetching exchange:", error);
    return { success: false, error: error.message || "Failed to fetch exchange" };
  }
}

export async function requestRevision(exchangeId: string, message: string) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return { success: false, error: "Unauthorized" };
    if (!db) return { success: false, error: "Database not initialized" };

    const exchangeRef = db.collection("exchanges").doc(exchangeId);
    
    await db.runTransaction(async (t) => {
      const exchangeDoc = await t.get(exchangeRef);
      if (!exchangeDoc.exists) throw new Error("Exchange not found");
      
      const data = exchangeDoc.data() as Exchange;
      if (data.requesterId !== userId) {
        throw new Error("Only the requester can ask for revisions");
      }
      
      if (data.status !== "in_review") {
        throw new Error("Exchange must be in review to request revisions");
      }

      const now = new Date().toISOString();
      
      t.update(exchangeRef, {
        status: "revision_requested",
        updatedAt: now
      });

      const activityRef = exchangeRef.collection("activity").doc();
      t.set(activityRef, {
        type: "revision_requested",
        description: `Requester asked for revisions: "${message}"`,
        timestamp: now
      });

      const notifRef = db.collection("users").doc(data.providerId).collection("notifications").doc();
      t.set(notifRef, {
        type: "request_update",
        title: "Revisions Requested",
        message: `Revisions were requested for "${data.title}".`,
        isRead: false,
        link: `/exchanges/${exchangeId}`,
        createdAt: now
      });
    });

    return { success: true };
  } catch (error: any) {
    console.error("Error requesting revision:", error);
    return { success: false, error: error.message };
  }
}


export async function acceptDelivery(exchangeId: string) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return { success: false, error: "Unauthorized" };
    if (!db) return { success: false, error: "Database not initialized" };

    const exchangeRef = db.collection("exchanges").doc(exchangeId);
    
    await db.runTransaction(async (t) => {
      const exchangeDoc = await t.get(exchangeRef);
      if (!exchangeDoc.exists) throw new Error("Exchange not found");
      
      const data = exchangeDoc.data() as Exchange;
      const isMutual = !!data.isMutual;
      const isProvider = userId === data.providerId;
      const isRequester = userId === data.requesterId;

      if (!isProvider && !isRequester) {
        throw new Error("You are not part of this exchange");
      }

      if (!isMutual && !isRequester) {
        throw new Error("Only the requester can accept delivery in a standard exchange");
      }
      
      if (data.status !== "in_review" && data.status !== "in_progress") {
        throw new Error("Exchange cannot be completed in its current state");
      }

      const now = new Date().toISOString();
      const updates: any = { updatedAt: now };

      let providerAcceptedNow = isProvider;
      let requesterAcceptedNow = isRequester;

      if (isMutual) {
        if (isProvider) updates.providerAcceptedAt = now;
        if (isRequester) updates.requesterAcceptedAt = now;

        const bothAccepted = (data.providerAcceptedAt || isProvider) && (data.requesterAcceptedAt || isRequester);
        
        if (!bothAccepted) {
          // Just update acceptance flag, wait for the other party
          t.update(exchangeRef, updates);

          const activityRef = exchangeRef.collection("activity").doc();
          t.set(activityRef, {
            type: "proposal_accepted",
            description: `${isProvider ? 'Provider' : 'Requester'} accepted the delivery. Waiting for the other party to accept.`,
            timestamp: now
          });
          return;
        }
      }

      // If we reach here, either it's a standard exchange (requester accepted), 
      // or it's a mutual exchange and both have accepted.
      
      const providerRef = db.collection("users").doc(data.providerId);
      const requesterRef = db.collection("users").doc(data.requesterId);
      
      const providerDoc = await t.get(providerRef);
      const requesterDoc = await t.get(requesterRef);
      
      if (!providerDoc.exists || !requesterDoc.exists) throw new Error("User not found");

      const providerData = providerDoc.data() as User;
      const requesterData = requesterDoc.data() as User;
      
      const providerBalance = providerData.skillHours || 0;
      const requesterBalance = requesterData.skillHours || 0;
      
      const hoursToTransferFromRequester = data.skillHours;
      const hoursToTransferFromProvider = data.skillHours; // In a mutual exchange, they are equal. But wait, what if they aren't? The mutual hours was stored. Wait, we didn't store `mutualHours` in the exchange! 

      // Wait, we need to know how many hours the provider escrowed. 
      // In a mutual exchange, `data.skillHours` is the requester's escrow.
      // But actually, we enforced that mutual hours = requested hours or `offeredHours`. 
      // We should really look at the LedgerTransactions to see what was escrowed.
      // For now, let's look up the escrow transactions.
      
      const transactionsRef = db.collection("transactions");
      const escrowsQuery = await transactionsRef
        .where("exchangeId", "==", exchangeId)
        .where("type", "==", "Reserved")
        .where("status", "==", "Active")
        .get();

      let requesterEscrowTx: any = null;
      let providerEscrowTx: any = null;

      escrowsQuery.docs.forEach(doc => {
        const tx = doc.data();
        if (tx.userId === data.requesterId) requesterEscrowTx = { id: doc.id, ref: doc.ref, data: tx };
        if (tx.userId === data.providerId) providerEscrowTx = { id: doc.id, ref: doc.ref, data: tx };
      });

      if (!requesterEscrowTx) throw new Error("Requester escrow not found");
      if (isMutual && !providerEscrowTx) throw new Error("Provider escrow not found");

      const reqEscrowAmount = Math.abs(requesterEscrowTx.data.amount);
      const provEscrowAmount = providerEscrowTx ? Math.abs(providerEscrowTx.data.amount) : 0;

      // 1. Update Balances & Stats
      // Requester escrow goes to Provider
      t.update(providerRef, {
        skillHours: providerBalance + reqEscrowAmount,
        "stats.skillHoursEarned": (providerData.stats?.skillHoursEarned || 0) + reqEscrowAmount,
        "stats.exchangesCompleted": (providerData.stats?.exchangesCompleted || 0) + 1
      });

      // Provider escrow goes to Requester (if mutual)
      t.update(requesterRef, {
        skillHours: requesterBalance + provEscrowAmount,
        "stats.skillHoursEarned": (requesterData.stats?.skillHoursEarned || 0) + provEscrowAmount,
        "stats.skillHoursSpent": (requesterData.stats?.skillHoursSpent || 0) + reqEscrowAmount,
        "stats.exchangesCompleted": (requesterData.stats?.exchangesCompleted || 0) + 1
      });

      // 2. Mark Escrows as Spent
      t.update(requesterEscrowTx.ref, {
        type: "Spent",
        status: "Completed",
        notes: "Escrow released to provider upon completion."
      });
      if (providerEscrowTx) {
        t.update(providerEscrowTx.ref, {
          type: "Spent",
          status: "Completed",
          notes: "Mutual escrow released to requester upon completion."
        });
      }

      // 3. Create Earned Transactions
      const providerTxRef = transactionsRef.doc();
      t.set(providerTxRef, {
        userId: data.providerId,
        date: now,
        type: "Earned",
        description: `Payment for: ${data.title}`,
        exchangeId: exchangeId,
        amount: reqEscrowAmount,
        balanceBefore: providerBalance,
        balanceAfter: providerBalance + reqEscrowAmount,
        status: "Completed",
        linkedUserId: data.requesterId,
        linkedUserName: requesterData?.fullName || requesterData?.username || "Unknown",
        linkedUserAvatar: requesterData?.photoURL || null,
        notes: "Skill hours released from escrow."
      });

      if (isMutual && provEscrowAmount > 0) {
        const requesterTxRef = transactionsRef.doc();
        t.set(requesterTxRef, {
          userId: data.requesterId,
          date: now,
          type: "Earned",
          description: `Mutual Payment for: ${data.title}`,
          exchangeId: exchangeId,
          amount: provEscrowAmount,
          balanceBefore: requesterBalance,
          balanceAfter: requesterBalance + provEscrowAmount,
          status: "Completed",
          linkedUserId: data.providerId,
          linkedUserName: providerData?.fullName || providerData?.username || "Unknown",
          linkedUserAvatar: providerData?.photoURL || null,
          notes: "Skill hours released from mutual escrow."
        });
      }

      // 4. Update Exchange Status
      updates.status = "completed";
      updates.escrowStatus = "released";
      if (isMutual) {
        updates.providerEscrowStatus = "released";
        updates.requesterEscrowStatus = "released";
      }
      updates.completedAt = now;
      t.update(exchangeRef, updates);

      // 5. Update Marketplace Request Status
      if (data.requestId) {
        t.update(db.collection("marketplace_requests").doc(data.requestId), {
          status: "completed",
          updatedAt: now
        });
      }

      // 6. Log Activity
      const activityRef = exchangeRef.collection("activity").doc();
      t.set(activityRef, {
        type: "completed",
        description: isMutual ? "Both parties accepted deliveries. Exchange completed." : "Requester accepted the delivery. Escrow has been released.",
        timestamp: now
      });

      // 7. Notify Provider & Requester
      t.set(providerRef.collection("notifications").doc(), {
        type: "system",
        title: "Exchange Completed!",
        message: `Your work for "${data.title}" was accepted. ${reqEscrowAmount} Skill Hours have been added to your ledger.`,
        isRead: false,
        link: `/exchanges/${exchangeId}`,
        createdAt: now
      });

      if (isMutual) {
        t.set(requesterRef.collection("notifications").doc(), {
          type: "system",
          title: "Exchange Completed!",
          message: `The mutual exchange "${data.title}" is complete. ${provEscrowAmount} Skill Hours have been added to your ledger.`,
          isRead: false,
          link: `/exchanges/${exchangeId}`,
          createdAt: now
        });
      }
    });

    return { success: true };
  } catch (error: any) {
    console.error("Error accepting delivery:", error);
    return { success: false, error: error.message };
  }
}

