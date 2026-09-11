"use server";

import { verifyFirebaseSessionCookie } from "@/lib/firebase-auth-server";
import { payload, sql } from "@/lib/neon";
import { storeUpload } from "@/lib/neon-storage";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

export async function requireAuth() {
  const sessionCookie = (await cookies()).get("session")?.value;
  if (!sessionCookie) throw new Error("Not authenticated");
  return verifyFirebaseSessionCookie(sessionCookie, true);
}

export async function getCurrentUserId(): Promise<string | null> {
  try {
    return (await requireAuth()).uid;
  } catch {
    return null;
  }
}

const allowedFields = new Set([
  "username", "displayName", "fullName", "photoURL", "photoUrl", "phone", "country", "timeZone", "language",
  "profession", "headline", "bio", "languages", "experienceLevel", "yearsOfExperience", "availability",
  "skillsOffered", "skillsLookingFor", "preferredCollaboration", "portfolioWebsite", "github", "linkedIn", "behance",
  "dribbble", "youtube", "twitter", "otherLink", "portfolioFiles", "visibility", "notifications", "communication",
  "privacy", "preferences", "notificationPreferences", "onboarded",
]);

function validateProfileInput(data: unknown) {
  if (!data || typeof data !== "object" || Array.isArray(data)) throw new Error("Invalid profile data");
  const safeData: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    if (!allowedFields.has(key)) continue;
    if (typeof value === "string") {
      if (value.length > 5000) throw new Error("Profile field is too long");
      safeData[key] = value.trim();
    } else if (typeof value === "boolean") {
      safeData[key] = value;
    } else if (Array.isArray(value) && value.length <= 50 && value.every(item => typeof item === "string" && item.length <= 500)) {
      safeData[key] = value.map(item => item.trim());
    } else if (["privacy", "preferences", "notificationPreferences", "notifications", "communication", "visibility"].includes(key)) {
      if (!value || typeof value !== "object" || Array.isArray(value) || JSON.stringify(value).length > 20_000) throw new Error("Invalid preference data");
      safeData[key] = value;
    } else {
      throw new Error("Invalid profile data");
    }
  }
  if (Object.keys(safeData).length === 0) throw new Error("No editable profile fields provided");
  return safeData;
}

async function writeProfile(userId: string, updates: Record<string, unknown>) {
  const photoUrl = updates.photoURL ?? updates.photoUrl;
  if (typeof photoUrl === "string" && photoUrl) {
    const encodedUserId = encodeURIComponent(userId);
    const isOwnedAvatar =
      photoUrl.startsWith(`/api/storage/public/avatars/${encodedUserId}/`) ||
      photoUrl.startsWith(`/api/storage/public/${encodedUserId}/avatars/`);
    if (!isOwnedAvatar) throw new Error("Invalid profile image URL");
  }

  const [row] = await sql.query("select payload from users where id=$1", [userId]);
  if (!row) throw new Error("User profile not found");
  const current = payload<Record<string, unknown>>(row.payload);
  const merged: Record<string, unknown> = { ...current, ...updates, updatedAt: new Date().toISOString() };
  const username = typeof merged.username === "string" && merged.username ? merged.username : null;
  const fullName = typeof merged.fullName === "string" ? merged.fullName : typeof merged.displayName === "string" ? merged.displayName : null;
  const storedPhoto = typeof merged.photoURL === "string" ? merged.photoURL : typeof merged.photoUrl === "string" ? merged.photoUrl : null;
  await sql.query(
    "update users set username=$2,full_name=$3,photo_url=$4,profession=$5,headline=$6,bio=$7,country=$8,time_zone=$9,onboarded=$10,updated_at=now(),payload=$11::jsonb where id=$1",
    [userId, username, fullName, storedPhoto, merged.profession ?? null, merged.headline ?? null, merged.bio ?? null, merged.country ?? null, merged.timeZone ?? null, merged.onboarded === true, JSON.stringify(merged)],
  );
}

export async function updateUserProfile(data: unknown) {
  try {
    const { uid } = await requireAuth();
    const safeData = validateProfileInput(data);
    if (typeof safeData.username === "string" && safeData.username) {
      if (!/^[a-z0-9_-]{3,32}$/.test(safeData.username)) return { error: "Username can only contain letters (a-z), numbers (0-9), and symbols (- or _)." };
      const [taken] = await sql.query("select id from users where lower(username)=lower($1) and id<>$2 limit 1", [safeData.username, uid]);
      if (taken) return { error: "This username is already taken. Please choose another one." };
    }
    await writeProfile(uid, safeData);
    return { success: true };
  } catch (error) {
    console.error("Error updating profile", error);
    return { error: error instanceof Error ? error.message : "Unable to update profile" };
  }
}

export async function checkUsernameAvailability(username: string): Promise<{ available: boolean; error?: string }> {
  try {
    const { uid } = await requireAuth();
    if (!/^[a-z0-9_-]{3,32}$/.test(username)) return { available: false, error: "Only letters (a-z), numbers (0-9), and symbols (- or _) are allowed." };
    const [taken] = await sql.query("select id from users where lower(username)=lower($1) and id<>$2 limit 1", [username, uid]);
    return taken ? { available: false, error: "This username is already taken." } : { available: true };
  } catch (error) {
    return { available: false, error: error instanceof Error ? error.message : "Unable to check username" };
  }
}

export async function saveProfileSettings(formData: FormData) {
  try {
    const { uid } = await requireAuth();
    const fullName = String(formData.get("fullName") ?? "").trim();
    const headline = String(formData.get("headline") ?? "").trim();
    const bio = String(formData.get("bio") ?? "").trim();
    const availability = String(formData.get("availability") ?? "").trim();
    if ([fullName, headline, bio, availability].some(value => value.length > 5000)) throw new Error("Profile field is too long");
    const splitSkills = (value: FormDataEntryValue | null) => String(value ?? "").split(",").map(item => item.trim()).filter(Boolean).slice(0, 50);
    const updates: Record<string, unknown> = {
      fullName,
      headline,
      bio,
      availability,
      skillsOffered: splitSkills(formData.get("skillsOffered")),
      skillsLookingFor: splitSkills(formData.get("skillsLookingFor")),
    };
    const image = formData.get("photo");
    if (image instanceof File && image.size > 0) {
      updates.photoURL = await storeUpload(uid, image, "avatars");
    }
    await writeProfile(uid, updates);
    const [user] = await sql.query("select username from users where id=$1", [uid]);
    if (user?.username) revalidatePath(`/u/${user.username}`);
    return { success: true };
  } catch (error) {
    console.error("Error saving profile settings", error);
    return { success: false, error: error instanceof Error ? error.message : "Unable to save profile" };
  }
}

export async function updateUserSchedule(uid: string, schedule: unknown) {
  try {
    const userId = await getCurrentUserId();
    if (!userId || userId !== uid) throw new Error("Unauthorized");
    if (!schedule || typeof schedule !== "object" || Array.isArray(schedule) || JSON.stringify(schedule).length > 50_000) throw new Error("Invalid schedule");
    await writeProfile(uid, { schedule });
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Unable to update schedule" };
  }
}
