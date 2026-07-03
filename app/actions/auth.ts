"use server";

import { db } from "@/lib/firebase-admin";
import { auth } from "@/lib/firebase-admin-auth";

export async function getInviteDetails(code: string) {
  if (!db) return null;

  try {
    const querySnapshot = await db.collection("invites").where("code", "==", code).get();
    if (querySnapshot.empty) return null;
    
    const data = querySnapshot.docs[0].data();
    return {
      email: data.email,
      status: data.status,
      expiresAt: data.expiresAt
    };
  } catch (e) {
    return null;
  }
}

export async function registerWithInvite(code: string, email: string, password: string) {
  if (!db || !auth) return { error: "Database not initialized" };

  try {
    // 1. Validate Invite Code
    const querySnapshot = await db.collection("invites").where("code", "==", code).get();
    
    if (querySnapshot.empty) {
      return { error: "Invalid invite code" };
    }

    const inviteDoc = querySnapshot.docs[0];
    const inviteData = inviteDoc.data();

    if (inviteData.status === "used") {
      return { error: "This invitation has already been used" };
    }

    if (inviteData.status === "revoked") {
      return { error: "This invitation is no longer valid" };
    }

    if (inviteData.expiresAt && new Date() > new Date(inviteData.expiresAt)) {
      return { error: "This invitation has expired" };
    }

    if (inviteData.email.toLowerCase() !== email.toLowerCase()) {
      return { error: "This invitation was issued for another email address" };
    }

    // 2. Check if user already exists in Firebase Auth
    let userRecord;
    try {
      userRecord = await auth.getUserByEmail(email);
      if (userRecord) {
        return { error: "An account with this email already exists" };
      }
    } catch (e: any) {
      if (e.code !== 'auth/user-not-found') {
        return { error: "Error checking user existence" };
      }
    }

    // 3. Create the Auth User
    userRecord = await auth.createUser({
      email: email.toLowerCase(),
      password: password,
      emailVerified: true // They proved ownership via the invite flow
    });

    const uid = userRecord.uid;

    // Fetch original application data if available to prefill the profile
    let startingHours = 5;
    let isVerified = false;
    let profileData = {};

    if (inviteData.inviteApplicationId) {
      const appDoc = await db.collection("invite_applications").doc(inviteData.inviteApplicationId).get();
      if (appDoc.exists) {
        const appData = appDoc.data()!;
        profileData = {
          fullName: appData.fullName,
          country: appData.country,
          timeZone: appData.timeZone,
          profession: appData.profession,
          experience: appData.experience,
          portfolio: appData.portfolio || "",
          linkedIn: appData.linkedIn || "",
          github: appData.github || "",
          skillsOffered: appData.skillsOffered || [],
          skillsLookingFor: appData.skillsLookingFor || [],
        };
        
        if (appData.approvedSettings) {
          startingHours = appData.approvedSettings.startingHours || 5;
          isVerified = appData.approvedSettings.badge || false;
        }
      }
    }

    // 3. Create User Profile
    await db.collection("users").doc(uid).set({
      email: email.toLowerCase(),
      createdAt: new Date().toISOString(),
      skillHours: startingHours,
      isVerified,
      source: "invite_code",
      ...profileData
    });

    // 4. Mark invite as used
    await inviteDoc.ref.update({
      status: "used",
      usedAt: new Date().toISOString(),
      userId: uid
    });

    return { success: true };
  } catch (error: any) {
    console.error("Error during registration:", error);
    return { error: error.message };
  }
}
