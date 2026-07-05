"use server";

import { db } from "@/lib/firebase-admin";
import { User, PortfolioItem, Exchange, Review } from "@/types";

/**
 * Fetch a user profile by their unique username
 */
export async function getUserByUsername(username: string): Promise<User | null> {
  if (!db) throw new Error("Firestore not initialized");

  const usersRef = db.collection("users");
  
  // First try by username
  let snapshot = await usersRef.where("username", "==", username).limit(1).get();

  if (snapshot.empty) {
    return null;
  }

  const userDoc = snapshot.docs[0];
  const data = userDoc.data();
  
  let finalData = data;

  // Auto-award mock achievements if the user has none (for testing)
  if (!data.achievements || (Array.isArray(data.achievements) && data.achievements.length === 0) || Object.keys(data.achievements || {}).length === 0) {
    const mockAchievements = {
      welcome_aboard: true,
      profile_complete: true,
      first_match: true,
      collaborator: true,
      trusted_member: true,
      verified: true,
    };
    
    await userDoc.ref.update({
      achievements: mockAchievements
    });
    
    finalData.achievements = mockAchievements;
  }
  
  // Return the user object
  return {
    ...finalData,
    uid: userDoc.id,
  } as User;
}

/**
 * Fetch a user's portfolio items
 */
export async function getUserPortfolio(userId: string): Promise<PortfolioItem[]> {
  if (!db) throw new Error("Firestore not initialized");

  try {
    const portfolioRef = db.collection("users").doc(userId).collection("portfolio");
    // Sort by createdAt descending
    const snapshot = await portfolioRef.orderBy("createdAt", "desc").get();

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as PortfolioItem[];
  } catch (error) {
    console.warn(`[getUserPortfolio] Index might be building. Returning empty array for ${userId}.`, error);
    return [];
  }
}

/**
 * Fetch public completed exchanges for a user
 */
export async function getUserExchanges(userId: string): Promise<Exchange[]> {
  if (!db) throw new Error("Firestore not initialized");

  try {
    const exchangesRef = db.collection("exchanges");
    
    // We need exchanges where the user is either the provider or the receiver
    // and status is 'completed'.
    // Assuming the schema has a `participants` array to make querying easier:
    const snapshot = await exchangesRef
      .where("participants", "array-contains", userId)
      .where("status", "==", "completed")
      .orderBy("completedAt", "desc")
      .limit(10)
      .get();

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Exchange[];
  } catch (error) {
    console.warn(`[getUserExchanges] Index might be building. Returning empty array for ${userId}.`, error);
    return [];
  }
}

/**
 * Fetch reviews targeting a specific user
 */
export async function getUserReviews(userId: string): Promise<Review[]> {
  if (!db) throw new Error("Firestore not initialized");

  try {
    const reviewsRef = db.collection("reviews");
    const snapshot = await reviewsRef
      .where("targetUserId", "==", userId)
      .orderBy("createdAt", "desc")
      .limit(10)
      .get();

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Review[];
  } catch (error) {
    console.warn(`[getUserReviews] Index might be building. Returning empty array for ${userId}.`, error);
    return [];
  }
}
