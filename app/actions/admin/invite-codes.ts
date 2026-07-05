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

import { sendEmail } from "@/lib/email";

export async function resendInviteEmail(id: string) {
  if (!db) return { error: "Database not initialized" };

  try {
    const doc = await db.collection("invites").doc(id).get();
    if (!doc.exists) return { error: "Invite not found" };

    const data = doc.data()!;
    if (data.status === "used" || data.status === "revoked") {
      return { error: "Cannot resend email for a used or revoked invite" };
    }

    let fullName = "there";
    let startingHours = 0;

    // Try to fetch the original application to get their name and starting hours
    if (data.inviteApplicationId) {
      const appDoc = await db.collection("invite_applications").doc(data.inviteApplicationId).get();
      if (appDoc.exists) {
        const appData = appDoc.data()!;
        fullName = appData.fullName?.split(' ')[0] || "there";
        startingHours = appData.approvedSettings?.startingHours || 0;
      }
    }

    const signupUrl = `https://weavenetwork.vercel.app/signup?invite=${data.code}`;
    
    const emailHtml = `
      <div style="font-family: sans-serif; max-w: 600px; margin: 0 auto;">
        <h2>Welcome to Weave, ${fullName}!</h2>
        <p>This is a reminder that your invite to join Weave is still pending.</p>
        <p>You have been credited with <strong>${startingHours}</strong> starting Skill Hours to begin exchanging services.</p>
        
        <div style="background-color: #f5f5f5; padding: 16px; border-radius: 8px; margin: 24px 0; text-align: center;">
          <p style="margin-top: 0; color: #666; font-size: 14px;">Your unique invite code:</p>
          <div style="font-size: 24px; font-weight: bold; letter-spacing: 2px; color: #111;">${data.code}</div>
        </div>

        <p>Click the link below to set up your password and access the platform.</p>
        <a href="${signupUrl}" style="display: inline-block; padding: 12px 24px; background-color: #2E7D32; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 16px;">Create Your Account</a>
      </div>
    `;

    await sendEmail({
      to: data.email,
      subject: "Reminder: Your Weave invite is waiting!",
      html: emailHtml
    });

    return { success: true };
  } catch (error: any) {
    console.error("Error resending email:", error);
    return { error: error.message };
  }
}
