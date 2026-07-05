"use server";

import { db } from "@/lib/firebase-admin";
import { auth } from "@/lib/firebase-admin-auth";
import { cookies } from "next/headers";

/**
 * Secures the current session and returns the decoded claims (including uid).
 * Throws an error if not authenticated.
 */
async function requireAuth() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("session")?.value;
  
  if (!sessionCookie || !auth || !db) {
    throw new Error("Not authenticated");
  }

  return await auth.verifySessionCookie(sessionCookie, true);
}

/**
 * Returns the current authenticated user's UID or null if not authenticated.
 */
export async function getCurrentUserId(): Promise<string | null> {
  try {
    const claims = await requireAuth();
    return claims.uid;
  } catch (e) {
    return null;
  }
}

/**
 * Updates the user's profile document.
 */
export async function updateUserProfile(data: any) {
  try {
    const claims = await requireAuth();
    
    // Safety check: ensure we don't accidentally overwrite protected fields
    const safeData = { ...data };
    delete safeData.isAdmin;
    delete safeData.skillHours;
    delete safeData.email; // Email should not be changed here
    delete safeData.createdAt;

    // Check username uniqueness if provided
    if (safeData.username) {
      const usernameCheck = await db!.collection("users")
        .where("username", "==", safeData.username)
        .limit(1)
        .get();
      
      if (!usernameCheck.empty && usernameCheck.docs[0].id !== claims.uid) {
        return { error: "This username is already taken. Please choose another one." };
      }
      
      // Ensure it only contains lowercase alphanumeric characters, underscores, and hyphens
      if (!/^[a-z0-9_-]+$/.test(safeData.username)) {
        return { error: "Username can only contain letters (a-z), numbers (0-9), and symbols (- or _)." };
      }
    }

    await db!.collection("users").doc(claims.uid).update(safeData);
    
    return { success: true };
  } catch (error: any) {
    console.error("Error updating profile:", error);
    return { error: error.message };
  }
}

/**
 * Checks if a username is available in real-time.
 */
export async function checkUsernameAvailability(username: string): Promise<{ available: boolean; error?: string }> {
  try {
    const claims = await requireAuth(); // ensure authenticated
    
    if (!username) return { available: false };
    
    // Validate format
    if (!/^[a-z0-9_-]+$/.test(username)) {
      return { available: false, error: "Only letters (a-z), numbers (0-9), and symbols (- or _) are allowed." };
    }

    const usernameCheck = await db!.collection("users")
      .where("username", "==", username)
      .limit(1)
      .get();

    if (!usernameCheck.empty && usernameCheck.docs[0].id !== claims.uid) {
      return { available: false, error: "This username is already taken." };
    }

    return { available: true };
  } catch (e: any) {
    return { available: false, error: e.message };
  }
}
