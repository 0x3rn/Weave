"use server";

import { verifyFirebaseSessionCookie } from "@/lib/firebase-auth-server";
import { sql } from "@/lib/neon";
import { storeUpload } from "@/lib/neon-storage";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { validateSettingsPatch } from "@/lib/settings";
import { createHash } from "node:crypto";

export async function requireAuth() {
  const sessionCookie = (await cookies()).get("session")?.value;
  if (!sessionCookie) throw new Error("Not authenticated");
  const claims = await verifyFirebaseSessionCookie(sessionCookie, true);
  const [user] = await sql.query(
    "select coalesce(account_status,payload->>'status','active') as status from users where id=$1",
    [claims.uid],
  );
  if (!user || user.status !== "active")
    throw new Error("Account is unavailable. Sign in to restore your account.");
  const deviceId = (await cookies()).get("deviceId")?.value;
  if (!deviceId) throw new Error("Sign in again to register this session");
  const [device] = await sql.query(
    "select payload->>'sessionHash' as session_hash from user_devices where id=$1 and user_id=$2",
    [deviceId, claims.uid],
  );
  if (
    device?.session_hash !==
    createHash("sha256").update(sessionCookie).digest("hex")
  )
    throw new Error("This session has been signed out");
  return claims;
}

export async function getCurrentUserId(): Promise<string | null> {
  try {
    return (await requireAuth()).uid;
  } catch {
    return null;
  }
}

const allowedFields = new Set([
  "username",
  "displayName",
  "fullName",
  "photoURL",
  "photoUrl",
  "phone",
  "country",
  "timeZone",
  "language",
  "profession",
  "headline",
  "bio",
  "languages",
  "experienceLevel",
  "yearsOfExperience",
  "availability",
  "skillsOffered",
  "skillsLookingFor",
  "preferredCollaboration",
  "portfolioWebsite",
  "github",
  "linkedIn",
  "behance",
  "dribbble",
  "youtube",
  "twitter",
  "otherLink",
  "portfolioFiles",
  "visibility",
  "notifications",
  "communication",
  "privacy",
  "preferences",
  "onboarded",
]);

function validateProfileInput(data: unknown) {
  if (!data || typeof data !== "object" || Array.isArray(data))
    throw new Error("Invalid profile data");
  const safeData: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    if (!allowedFields.has(key)) continue;
    if (key === "privacy" || key === "preferences") {
      safeData[key] = validateSettingsPatch(key, value);
    } else if (typeof value === "string") {
      if (value.length > 5000) throw new Error("Profile field is too long");
      safeData[key] = value.trim();
    } else if (typeof value === "boolean") {
      safeData[key] = value;
    } else if (
      Array.isArray(value) &&
      value.length <= 50 &&
      value.every((item) => typeof item === "string" && item.length <= 500)
    ) {
      safeData[key] = value.map((item) => item.trim());
    } else if (
      [
        "privacy",
        "preferences",
        "notificationPreferences",
        "notifications",
        "communication",
        "visibility",
      ].includes(key)
    ) {
      if (
        !value ||
        typeof value !== "object" ||
        Array.isArray(value) ||
        JSON.stringify(value).length > 20_000
      )
        throw new Error("Invalid preference data");
      safeData[key] =
        key === "privacy" || key === "preferences"
          ? validateSettingsPatch(key, value)
          : value;
    } else {
      throw new Error("Invalid profile data");
    }
  }
  if (Object.keys(safeData).length === 0)
    throw new Error("No editable profile fields provided");
  for (const key of ["displayName", "fullName"])
    if (
      key in safeData &&
      (typeof safeData[key] !== "string" ||
        !safeData[key] ||
        String(safeData[key]).length > 100)
    )
      throw new Error("Name must contain 1 to 100 characters");
  if (
    safeData.language !== undefined &&
    !["en", "fr", "es", "pt", "ar"].includes(String(safeData.language))
  )
    throw new Error("Invalid account language");
  if (safeData.phone && !/^[+0-9() .-]{5,30}$/.test(String(safeData.phone)))
    throw new Error("Invalid phone number");
  if (safeData.timeZone)
    new Intl.DateTimeFormat("en", {
      timeZone: String(safeData.timeZone),
    }).format();
  return safeData;
}

async function writeProfile(
  userId: string,
  updates: Record<string, unknown>,
  publicEdit = false,
) {
  const photoUrl = updates.photoURL ?? updates.photoUrl;
  if (typeof photoUrl === "string" && photoUrl) {
    const encodedUserId = encodeURIComponent(userId);
    const isOwnedAvatar =
      photoUrl.startsWith(`/api/storage/public/avatars/${encodedUserId}/`) ||
      photoUrl.startsWith(`/api/storage/public/${encodedUserId}/avatars/`);
    if (!isOwnedAvatar) throw new Error("Invalid profile image URL");
  }

  const patch = { ...updates };
  if (typeof photoUrl === "string") {
    patch.photoURL = photoUrl;
    patch.photoUrl = photoUrl;
  }
  const [saved] = await sql.query(
    `update users set
    username=case when $2::jsonb ? 'username' then nullif($2::jsonb->>'username','') else username end,
    full_name=case when $3::boolean and coalesce(payload->'profileSync'->>'syncName','true')='false' then full_name when $2::jsonb ? 'fullName' then $2::jsonb->>'fullName' when $2::jsonb ? 'displayName' then $2::jsonb->>'displayName' else full_name end,
    photo_url=case when $3::boolean and coalesce(payload->'profileSync'->>'syncPhoto','true')='false' then photo_url when $2::jsonb ? 'photoURL' then nullif($2::jsonb->>'photoURL','') else photo_url end,
    profession=case when $2::jsonb ? 'profession' then $2::jsonb->>'profession' else profession end,
    headline=case when $2::jsonb ? 'headline' then $2::jsonb->>'headline' else headline end,
    bio=case when $2::jsonb ? 'bio' then $2::jsonb->>'bio' else bio end,
    country=case when $2::jsonb ? 'country' then $2::jsonb->>'country' else country end,
    time_zone=case when $2::jsonb ? 'timeZone' then $2::jsonb->>'timeZone' else time_zone end,
    onboarded=case when $2::jsonb ? 'onboarded' then ($2::jsonb->>'onboarded')::boolean else onboarded end,
    payload=payload||($2::jsonb
      -case when $3::boolean and coalesce(payload->'profileSync'->>'syncName','true')='false' then array['fullName'] else array[]::text[] end
      -case when $3::boolean and coalesce(payload->'profileSync'->>'syncPhoto','true')='false' then array['photoURL','photoUrl'] else array[]::text[] end)
      ||case when $3::boolean then jsonb_build_object('publicProfile',coalesce(payload->'publicProfile','{}')
        ||case when coalesce(payload->'profileSync'->>'syncName','true')='false' and $2::jsonb ? 'fullName' then jsonb_build_object('fullName',$2::jsonb->>'fullName') else '{}'::jsonb end
        ||case when coalesce(payload->'profileSync'->>'syncPhoto','true')='false' and $2::jsonb ? 'photoURL' then jsonb_build_object('photoURL',$2::jsonb->>'photoURL') else '{}'::jsonb end) else '{}'::jsonb end
      ||case when $2::jsonb ? 'privacy' then jsonb_build_object('privacy',coalesce(payload->'privacy','{}')||($2::jsonb->'privacy')) else '{}'::jsonb end
      ||case when $2::jsonb ? 'preferences' then jsonb_build_object('preferences',coalesce(payload->'preferences','{}')||($2::jsonb->'preferences')) else '{}'::jsonb end,
    updated_at=now() where id=$1 returning id`,
    [userId, JSON.stringify(patch), publicEdit],
  );
  if (!saved) throw new Error("User profile not found");
}

export async function updateUserProfile(data: unknown) {
  try {
    const { uid } = await requireAuth();
    const safeData = validateProfileInput(data);
    if (typeof safeData.username === "string") {
      if (!/^[a-z0-9_-]{3,32}$/.test(safeData.username))
        return {
          error:
            "Username can only contain letters (a-z), numbers (0-9), and symbols (- or _).",
        };
      const [taken] = await sql.query(
        "select id from users where lower(username)=lower($1) and id<>$2 limit 1",
        [safeData.username, uid],
      );
      if (taken)
        return {
          error: "This username is already taken. Please choose another one.",
        };
    }
    if (typeof safeData.displayName === "string")
      safeData.fullName = safeData.displayName;
    await writeProfile(uid, safeData);
    revalidatePath("/settings", "layout");
    revalidatePath("/profile");
    const [updated] = await sql.query(
      "select username from users where id=$1",
      [uid],
    );
    if (updated?.username) revalidatePath(`/u/${updated.username}`);
    return { success: true };
  } catch (error) {
    console.error("Error updating profile", error);
    return {
      error:
        error instanceof Error ? error.message : "Unable to update profile",
    };
  }
}

export async function checkUsernameAvailability(
  username: string,
): Promise<{ available: boolean; error?: string }> {
  try {
    const { uid } = await requireAuth();
    if (!/^[a-z0-9_-]{3,32}$/.test(username))
      return {
        available: false,
        error:
          "Only letters (a-z), numbers (0-9), and symbols (- or _) are allowed.",
      };
    const [taken] = await sql.query(
      "select id from users where lower(username)=lower($1) and id<>$2 limit 1",
      [username, uid],
    );
    return taken
      ? { available: false, error: "This username is already taken." }
      : { available: true };
  } catch (error) {
    return {
      available: false,
      error:
        error instanceof Error ? error.message : "Unable to check username",
    };
  }
}

export async function saveProfileSettings(formData: FormData) {
  try {
    const { uid } = await requireAuth();
    const fullName = String(formData.get("fullName") ?? "").trim();
    const headline = String(formData.get("headline") ?? "").trim();
    const bio = String(formData.get("bio") ?? "").trim();
    const availability = String(formData.get("availability") ?? "").trim();
    if (
      [fullName, headline, bio, availability].some(
        (value) => value.length > 5000,
      )
    )
      throw new Error("Profile field is too long");
    const splitSkills = (value: FormDataEntryValue | null) =>
      String(value ?? "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
        .slice(0, 50);
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
    await writeProfile(uid, validateProfileInput(updates), true);
    revalidatePath("/profile");
    revalidatePath("/settings", "layout");
    const [user] = await sql.query("select username from users where id=$1", [
      uid,
    ]);
    if (user?.username) revalidatePath(`/u/${user.username}`);
    return { success: true };
  } catch (error) {
    console.error("Error saving profile settings", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unable to save profile",
    };
  }
}

export async function updateUserSchedule(uid: string, schedule: unknown) {
  try {
    const userId = await getCurrentUserId();
    if (!userId || userId !== uid) throw new Error("Unauthorized");
    if (
      !schedule ||
      typeof schedule !== "object" ||
      Array.isArray(schedule) ||
      JSON.stringify(schedule).length > 50_000
    )
      throw new Error("Invalid schedule");
    await writeProfile(uid, { schedule });
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Unable to update schedule",
    };
  }
}
