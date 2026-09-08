import "server-only";

import { NotificationPreferences, User } from "@/types";
import { iso, payload, sql } from "./neon";

export type AppUser = User & Record<string, unknown> & {
  onboarded?: boolean;
  isAdmin?: boolean;
  notificationPreferences?: NotificationPreferences;
};

export function userFromRow(row: Record<string, unknown>): AppUser {
  const data = payload<Record<string, unknown>>(row.payload);
  return {
    ...data,
    uid: String(row.id),
    email: String(row.email ?? data.email ?? ""),
    username: String(row.username ?? data.username ?? ""),
    fullName: String(row.full_name ?? data.fullName ?? data.displayName ?? ""),
    photoURL: row.photo_url ? String(row.photo_url) : data.photoURL ? String(data.photoURL) : null,
    profession: String(row.profession ?? data.profession ?? ""),
    headline: String(row.headline ?? data.headline ?? ""),
    bio: String(row.bio ?? data.bio ?? ""),
    country: String(row.country ?? data.country ?? ""),
    timeZone: String(row.time_zone ?? data.timeZone ?? ""),
    skillHours: Number(row.skill_hours ?? data.skillHours ?? 0),
    trustScore: Number(row.trust_score ?? data.trustScore ?? 0),
    isVerified: row.is_verified === true,
    onboarded: row.onboarded === true,
    createdAt: iso(row.created_at ?? data.createdAt),
    lastActive: iso(row.last_active_at ?? data.lastActive),
  } as unknown as AppUser;
}

export async function getUserById(userId: string) {
  const [row] = await sql.query("select * from users where id=$1", [userId]);
  return row ? userFromRow(row) : null;
}
