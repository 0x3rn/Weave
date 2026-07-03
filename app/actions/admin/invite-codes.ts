"use server";

import { db } from "@/lib/firebase-admin";
import crypto from "crypto";

// Helper to generate a secure random code (e.g. WV-8KX2-MP4Q)
function generateSecureCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Excluded I, O, 1, 0 for readability
  let result = "WV-";
  for (let i = 0; i < 8; i++) {
    if (i === 4) result += "-";
    const randomByte = crypto.randomBytes(1)[0];
    result += chars[randomByte % chars.length];
  }
  return result;
}

export async function createInviteCode(
  email: string, 
  expiresInDays: number | null, 
  applicationId?: string
) {
  if (!db) return { error: "Database not initialized" };

  try {
    const code = generateSecureCode();
    const now = new Date();
    
    let expiresAt = null;
    if (expiresInDays !== null) {
      const expirationDate = new Date(now.getTime() + expiresInDays * 24 * 60 * 60 * 1000);
      expiresAt = expirationDate.toISOString();
    }

    const inviteData = {
      code,
      email: email.toLowerCase(),
      status: "pending", // pending | used | expired | revoked
      createdAt: now.toISOString(),
      expiresAt,
      inviteApplicationId: applicationId || null,
      usedAt: null,
      userId: null // will be populated when used
    };

    const docRef = await db.collection("invites").add(inviteData);
    
    return { success: true, code, id: docRef.id };
  } catch (error: any) {
    console.error("Error creating invite code:", error);
    return { error: error.message };
  }
}

export async function getIssuedInvites() {
  if (!db) return { error: "Database not initialized" };

  try {
    const snapshot = await db.collection("invites")
      .orderBy("createdAt", "desc")
      .get();
      
    const invites = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return { invites };
  } catch (error: any) {
    console.error("Error fetching invites:", error);
    return { error: error.message };
  }
}

export async function revokeInviteCode(id: string) {
  if (!db) return { error: "Database not initialized" };

  try {
    await db.collection("invites").doc(id).update({
      status: "revoked",
      revokedAt: new Date().toISOString()
    });
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function extendInviteCode(id: string, additionalDays: number) {
  if (!db) return { error: "Database not initialized" };

  try {
    const doc = await db.collection("invites").doc(id).get();
    if (!doc.exists) return { error: "Invite not found" };

    const data = doc.data()!;
    if (data.status === "used" || data.status === "revoked") {
      return { error: "Cannot extend a used or revoked invite" };
    }

    const baseDate = data.expiresAt ? new Date(data.expiresAt) : new Date();
    const newExpiresAt = new Date(baseDate.getTime() + additionalDays * 24 * 60 * 60 * 1000).toISOString();

    await db.collection("invites").doc(id).update({
      expiresAt: newExpiresAt,
      status: "pending" // If it was expired, reactivate it
    });

    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}
