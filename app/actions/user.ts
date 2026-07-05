"use server";

import { db, storage } from "@/lib/firebase-admin";
import { auth } from "@/lib/firebase-admin-auth";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

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

/**
 * Handles the profile edit form submission, including uploading a new profile picture.
 */
export async function saveProfileSettings(formData: FormData) {
  try {
    const claims = await requireAuth();
    const userId = claims.uid;

    if (!db) throw new Error("Firebase Admin not initialized");

    const fullName = formData.get("fullName") as string;
    const headline = formData.get("headline") as string;
    const bio = formData.get("bio") as string;
    const availability = formData.get("availability") as string;
    
    // Skills
    const skillsOfferedRaw = formData.get("skillsOffered") as string;
    const skillsLookingForRaw = formData.get("skillsLookingFor") as string;
    
    const skillsOffered = skillsOfferedRaw ? skillsOfferedRaw.split(",").map(s => s.trim()).filter(s => s.length > 0) : [];
    const skillsLookingFor = skillsLookingForRaw ? skillsLookingForRaw.split(",").map(s => s.trim()).filter(s => s.length > 0) : [];

    // Image Upload
    const imageFile = formData.get("photo") as File | null;
    let photoURL: string | undefined = undefined;

    if (imageFile && imageFile.size > 0 && storage) {
      const bucket = storage.bucket();
      const extension = imageFile.name.split('.').pop() || 'jpg';
      const filename = `avatars/${userId}/${Date.now()}.${extension}`;
      const fileRef = bucket.file(filename);
      
      const buffer = Buffer.from(await imageFile.arrayBuffer());
      
      await fileRef.save(buffer, {
        metadata: {
          contentType: imageFile.type,
        },
      });

      photoURL = `https://storage.googleapis.com/${bucket.name}/${filename}`;
    }

    const updates: any = {
      fullName,
      headline,
      bio,
      availability,
      skillsOffered, // Overwrites UserSkill objects with strings based on MVP decision
      skillsLookingFor
    };

    if (photoURL) {
      updates.photoURL = photoURL;
    }

    // Update Firestore
    await db.collection("users").doc(userId).update(updates);

    // Get username to revalidate path
    const userDoc = await db.collection("users").doc(userId).get();
    const username = userDoc.data()?.username;

    if (username) {
      revalidatePath(`/u/${username}`);
    }

    return { success: true };
  } catch (error: any) {
    console.error("Error saving profile settings:", error);
    return { success: false, error: error.message };
  }
}

export async function updateUserSchedule(uid: string, schedule: any) {
  try {
    if (!db) throw new Error("Database not initialized");
    const userRef = db.collection("users").doc(uid);
    await userRef.update({
      schedule
    });
    return { success: true };
  } catch (error: any) {
    console.error("Error updating user schedule:", error);
    return { success: false, error: error.message };
  }
}
