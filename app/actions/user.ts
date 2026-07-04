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

    await db!.collection("users").doc(claims.uid).update(safeData);
    
    return { success: true };
  } catch (error: any) {
    console.error("Error updating profile:", error);
    return { error: error.message };
  }
}
