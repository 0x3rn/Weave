"use server";

import { db } from "@/lib/firebase-admin";
import { getCurrentUserId } from "./user";
import { Review, User } from "@/types";

export async function submitReview(
  exchangeId: string,
  targetUserId: string,
  rating: number,
  comment: string,
  isPositive: boolean
) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return { success: false, error: "Unauthorized" };
    if (!db) return { success: false, error: "Database not initialized" };

    const exchangeRef = db!.collection("exchanges").doc(exchangeId);
    const exchangeDoc = await exchangeRef.get();

    if (!exchangeDoc.exists) {
      return { success: false, error: "Exchange not found" };
    }

    if (exchangeDoc.data()?.status !== "completed") {
      return { success: false, error: "Exchange must be completed to leave a review" };
    }

    // Check if review already exists
    const existingReviewQuery = await db!.collection("reviews")
      .where("exchangeId", "==", exchangeId)
      .where("reviewerId", "==", userId)
      .get();

    if (!existingReviewQuery.empty) {
      return { success: false, error: "You have already reviewed this exchange" };
    }

    const now = new Date().toISOString();

    await db.runTransaction(async (t) => {
      // 1. Create the Review
      const reviewRef = db!.collection("reviews").doc();
      const review: Omit<Review, "id"> = {
        exchangeId,
        reviewerId: userId,
        targetUserId,
        rating,
        comment,
        isPositive,
        createdAt: now
      };
      t.set(reviewRef, review);

      // 2. Update Target User's Trust Score
      const targetUserRef = db!.collection("users").doc(targetUserId);
      const targetUserDoc = await t.get(targetUserRef);
      
      if (targetUserDoc.exists) {
        const targetData = targetUserDoc.data() as User;
        
        // Simple Trust Score algorithm for MVP:
        // Adjust score based on rating (1-5). 4-5 increases, 3 neutral, 1-2 decreases.
        let scoreDelta = 0;
        if (rating === 5) scoreDelta = 5;
        else if (rating === 4) scoreDelta = 2;
        else if (rating === 3) scoreDelta = 0;
        else if (rating === 2) scoreDelta = -5;
        else if (rating === 1) scoreDelta = -10;

        let newTrustScore = Math.min(100, Math.max(0, (targetData.trustScore || 50) + scoreDelta));
        
        t.update(targetUserRef, {
          trustScore: newTrustScore,
        });
      }

      // 3. Notify Target User
      const notifRef = db!.collection("users").doc(targetUserId).collection("notifications").doc();
      t.set(notifRef, {
        type: "system",
        title: "New Review Received",
        message: `You received a ${rating}-star review for your recent exchange!`,
        isRead: false,
        link: `/profile/${targetUserId}`,
        createdAt: now
      });
    });

    return { success: true };
  } catch (error: any) {
    console.error("Error submitting review:", error);
    return { success: false, error: error.message };
  }
}

export async function hasUserReviewed(exchangeId: string) {
  try {
    const userId = await getCurrentUserId();
    if (!userId || !db) return { success: false, hasReviewed: false };

    const query = await db!.collection("reviews")
      .where("exchangeId", "==", exchangeId)
      .where("reviewerId", "==", userId)
      .limit(1)
      .get();

    return { success: true, hasReviewed: !query.empty };
  } catch (error) {
    return { success: false, hasReviewed: false };
  }
}
