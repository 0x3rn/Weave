"use server";

import { db } from "@/lib/firebase-admin";
import { sendEmail } from "@/lib/email";
import { createInviteCode } from "./invite-codes";

export async function getInviteApplications() {
  if (!db) {
    return { error: "Database not initialized" };
  }

  try {
    const snapshot = await db.collection("invite_applications")
      .orderBy("createdAt", "desc")
      .get();
      
    const applications = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return { applications };
  } catch (error: any) {
    console.error("Error fetching invite applications:", error);
    return { error: error.message };
  }
}

export async function saveInternalNotes(id: string, notes: string) {
  if (!db) return { error: "Database not initialized" };

  try {
    await db.collection("invite_applications").doc(id).update({
      internalNotes: notes,
      updatedAt: new Date().toISOString()
    });
    return { success: true };
  } catch (error: any) {
    console.error("Error saving notes:", error);
    return { error: error.message };
  }
}

export async function approveInvite(id: string, data: { startingHours: number, welcomeMessage: string, badge: boolean, expiresInDays: number | null }) {
  if (!db) return { error: "Database not initialized" };

  try {
    const inviteRef = db.collection("invite_applications").doc(id);
    const doc = await inviteRef.get();
    
    if (!doc.exists) {
      return { error: "Application not found" };
    }

    const inviteData = doc.data()!;

    // 1. Generate Invite Code
    const inviteCodeResult = await createInviteCode(inviteData.email, data.expiresInDays, id);
    
    if (inviteCodeResult.error) {
      return { error: "Failed to generate invite code" };
    }

    // 2. Update the invite application status & save metadata needed for signup
    await inviteRef.update({
      status: "approved",
      approvedAt: new Date().toISOString(),
      approvedSettings: {
        startingHours: data.startingHours,
        badge: data.badge
      }
    });

    // 3. Send approval email with the unique signup link
    const signupUrl = `https://weavenetwork.vercel.app/signup?invite=${inviteCodeResult.code}`;
    
    const emailHtml = `
      <div style="font-family: sans-serif; max-w: 600px; margin: 0 auto;">
        <h2>Welcome to Weave, ${inviteData.fullName.split(' ')[0]}!</h2>
        <p>Your invite request has been officially approved.</p>
        ${data.welcomeMessage ? `<p><em>"${data.welcomeMessage}"</em></p>` : ''}
        <p>You have been credited with <strong>${data.startingHours}</strong> starting Skill Hours to begin exchanging services.</p>
        
        <div style="background-color: #f5f5f5; padding: 16px; border-radius: 8px; margin: 24px 0; text-align: center;">
          <p style="margin-top: 0; color: #666; font-size: 14px;">Your unique invite code:</p>
          <div style="font-size: 24px; font-weight: bold; letter-spacing: 2px; color: #111;">${inviteCodeResult.code}</div>
        </div>

        <p>Click the link below to set up your password and access the platform.</p>
        <a href="${signupUrl}" style="display: inline-block; padding: 12px 24px; background-color: #2E7D32; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 16px;">Create Your Account</a>
        
        ${data.expiresInDays ? `<p style="font-size: 12px; color: #666; margin-top: 24px;">Note: This invite expires in ${data.expiresInDays} days.</p>` : ''}
      </div>
    `;

    await sendEmail({
      to: inviteData.email,
      subject: "Welcome to Weave! Your invite is approved.",
      html: emailHtml
    });

    return { success: true };
  } catch (error: any) {
    console.error("Error approving invite:", error);
    return { error: error.message };
  }
}

export async function rejectInvite(id: string, data: { reason: string, feedback: string }) {
  if (!db) return { error: "Database not initialized" };

  try {
    const inviteRef = db.collection("invite_applications").doc(id);
    
    await inviteRef.update({
      status: "rejected",
      rejectionReason: data.reason,
      rejectionFeedback: data.feedback,
      rejectedAt: new Date().toISOString()
    });

    // 2. Send rejection email
    const docData = (await inviteRef.get()).data();
    if (docData && docData.email) {
      const emailHtml = `
        <div style="font-family: sans-serif; max-w: 600px; margin: 0 auto;">
          <h2>Hi ${docData.fullName.split(' ')[0]},</h2>
          <p>Thank you for your interest in joining Weave.</p>
          <p>After reviewing your application, we are currently unable to offer you an invite to the platform.</p>
          ${data.feedback ? `<p><strong>Feedback:</strong> ${data.feedback}</p>` : ''}
          <p>We wish you the best in your professional endeavors.</p>
          <p>- The Weave Team</p>
        </div>
      `;

      await sendEmail({
        to: docData.email,
        subject: "Update regarding your Weave invite request",
        html: emailHtml
      });
    }

    return { success: true };
  } catch (error: any) {
    console.error("Error rejecting invite:", error);
    return { error: error.message };
  }
}
