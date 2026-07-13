"use server";

import { db } from "@/lib/firebase-admin";
import { getCurrentUserId } from "./user";
import { MarketplaceApplication, MarketplaceRequest } from "@/types";
import { createExchangeFromApplication } from "./exchanges";

export async function submitApplication(
  requestId: string,
  data: {
    coverMessage: string;
    portfolioLinks: string[];
    availability: string;
    estimatedHours: number;
    estimatedCompletionDate?: string;
    agreedToTerms: boolean;
    isMutualProposal?: boolean;
    offeredDeliverables?: string[];
    offeredHours?: number;
  }
) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    if (!db) {
      return { success: false, error: "Database not initialized" };
    }

    // 1. Verify the request exists and is open
    const requestRef = db.collection("marketplace_requests").doc(requestId);
    const requestDoc = await requestRef.get();
    
    if (!requestDoc.exists) {
      return { success: false, error: "Request not found" };
    }
    
    const requestData = requestDoc.data() as MarketplaceRequest;
    if (requestData.status !== "open") {
      return { success: false, error: "This request is no longer open for applications" };
    }

    if (requestData.requesterId === userId) {
      return { success: false, error: "You cannot apply to your own request" };
    }

    // 2. Check if user already applied
    const existingAppQuery = await db.collection("marketplace_applications")
      .where("requestId", "==", requestId)
      .where("applicantId", "==", userId)
      .limit(1)
      .get();
      
    if (!existingAppQuery.empty) {
      return { success: false, error: "You have already applied for this request" };
    }

    // 3. Create the application
    const now = new Date().toISOString();
    const application: Omit<MarketplaceApplication, "id"> = {
      requestId,
      applicantId: userId,
      coverMessage: data.coverMessage,
      portfolioLinks: data.portfolioLinks,
      availability: data.availability,
      estimatedHours: data.estimatedHours,
      estimatedCompletionDate: data.estimatedCompletionDate,
      agreedToTerms: data.agreedToTerms,
      status: "pending",
      createdAt: now,
      updatedAt: now,
      ...(data.isMutualProposal && {
        isMutualProposal: true,
        offeredDeliverables: data.offeredDeliverables || [],
        offeredHours: data.offeredHours || data.estimatedHours,
      })
    };

    const docRef = await db.collection("marketplace_applications").add(application);

    // 4. Update the request's applicantsCount
    await requestRef.update({
      applicantsCount: (requestData.applicantsCount || 0) + 1
    });

    // 5. Create a notification for the requester
    const notifRef = db.collection("notifications").doc();
    await notifRef.set({
      id: notifRef.id,
      userId: requestData.requesterId,
      type: "request_update",
      title: "New Application Received",
      message: `Someone applied to your request: ${requestData.title}`,
      isRead: false,
      link: `/dashboard/requests/${requestId}`,
      relatedId: requestId,
      createdAt: now,
    });

    return { success: true, applicationId: docRef.id };
  } catch (error: any) {
    console.error("Error submitting application:", error);
    return { success: false, error: error.message || "Failed to submit application" };
  }
}

export async function getApplicationsForRequest(requestId: string) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    if (!db) {
      return { success: false, error: "Database not initialized" };
    }

    // 1. Verify the requester owns this request
    const requestDoc = await db.collection("marketplace_requests").doc(requestId).get();
    if (!requestDoc.exists) {
      return { success: false, error: "Request not found" };
    }
    
    if (requestDoc.data()?.requesterId !== userId) {
      return { success: false, error: "You can only view applications for your own requests" };
    }

    // 2. Fetch applications
    const appsQuery = await db.collection("marketplace_applications")
      .where("requestId", "==", requestId)
      .orderBy("createdAt", "desc")
      .get();
      
    const applications = appsQuery.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as MarketplaceApplication[];

    // 3. Fetch applicant profiles
    if (applications.length === 0) {
      return { success: true, applications: [], request: { id: requestDoc.id, ...requestDoc.data() } };
    }

    const applicantIds = [...new Set(applications.map(a => a.applicantId))];
    const usersMap = new Map();
    
    for (let i = 0; i < applicantIds.length; i += 30) {
      const chunk = applicantIds.slice(i, i + 30);
      if (chunk.length > 0) {
        const userDocs = await db.collection("users").where("__name__", "in", chunk).get();
        userDocs.forEach(doc => {
          usersMap.set(doc.id, doc.data());
        });
      }
    }

    // 4. Combine data
    const enrichedApplications = applications.map(app => {
      const uData = usersMap.get(app.applicantId);
      return {
        ...app,
        applicant: uData ? {
          name: uData.fullName || uData.displayName || uData.username || "Unknown User",
          avatar: uData.photoURL || uData.photoUrl || null,
          trustScore: uData.trustScore || 0,
          stats: uData.stats || { rating: 0, exchangesCompleted: 0 }
        } : null
      };
    });

    return { success: true, applications: enrichedApplications, request: { id: requestDoc.id, ...requestDoc.data() } };
  } catch (error: any) {
    console.error("Error fetching applications:", error);
    return { success: false, error: error.message || "Failed to fetch applications" };
  }
}

export async function updateApplicationStatus(applicationId: string, newStatus: string) {
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
    const requestDoc = await db.collection("marketplace_requests").doc(appData.requestId).get();
    if (!requestDoc.exists || requestDoc.data()?.requesterId !== userId) {
      return { success: false, error: "Unauthorized" };
    }

    if (newStatus === "accepted") {
      // Delegate to the exchange creation logic which handles escrow, transactions, and status updates atomically
      return await createExchangeFromApplication(applicationId);
    }

    const updates: any = { status: newStatus, updatedAt: new Date().toISOString() };
    await appRef.update(updates);

    return { success: true };
  } catch (error: any) {
    console.error("Error updating application status:", error);
    return { success: false, error: error.message || "Failed to update status" };
  }
}
