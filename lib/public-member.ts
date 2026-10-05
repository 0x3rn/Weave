import "server-only";
import { payload, iso } from "./neon";
import { object, settingsFor } from "./settings";
import type { User } from "@/types";
type Row = Record<string, unknown> & { id: string; payload: unknown };
export function publicMember(row: Row): User {
  const data = payload<Record<string, unknown>>(row.payload);
  const sync = settingsFor("profileSync", data.profileSync),
    privacy = settingsFor("privacy", data.privacy),
    snapshot = object(data.publicProfile);
  return {
    uid: row.id,
    username: String(row.username ?? data.username ?? row.id),
    fullName: String(
      sync.syncName
        ? (row.full_name ?? data.fullName ?? data.displayName ?? "Unknown")
        : (snapshot.fullName ?? row.full_name ?? "Member"),
    ),
    photoURL:
      String(
        sync.syncPhoto
          ? (row.photo_url ?? data.photoURL ?? data.photoUrl ?? "")
          : (snapshot.photoURL ?? ""),
      ) || null,
    profession: String(row.profession ?? data.profession ?? ""),
    headline: String(row.headline ?? data.headline ?? "") || undefined,
    country: String(row.country ?? data.country ?? ""),
    timeZone: String(row.time_zone ?? data.timeZone ?? ""),
    bio: String(row.bio ?? data.bio ?? "") || undefined,
    languages: Array.isArray(data.languages)
      ? data.languages.filter(
          (item): item is string => typeof item === "string",
        )
      : undefined,
    experienceLevel: String(data.experienceLevel ?? "") || undefined,
    availability: sync.showAvailability
      ? String(data.availability ?? "") || undefined
      : undefined,
    schedule: sync.showAvailability
      ? (data.schedule as User["schedule"])
      : undefined,
    skillsOffered: Array.isArray(data.skillsOffered)
      ? (data.skillsOffered as User["skillsOffered"])
      : [],
    skillsLookingFor: Array.isArray(data.skillsLookingFor)
      ? data.skillsLookingFor.filter(
          (item): item is string => typeof item === "string",
        )
      : [],
    stats: {
      rating: privacy.showReviews ? Number(object(data.stats).rating || 0) : 0,
      reviewsCount: privacy.showReviews
        ? Number(object(data.stats).reviewsCount || 0)
        : 0,
      exchangesCompleted: privacy.showCompletedExchanges
        ? Number(object(data.stats).exchangesCompleted || 0)
        : 0,
      skillHoursEarned: privacy.showCompletedExchanges
        ? Number(object(data.stats).skillHoursEarned || 0)
        : 0,
      completionRate: privacy.showCompletedExchanges
        ? Number(object(data.stats).completionRate || 0)
        : 0,
      skillHoursSpent: 0,
      responseTimeHours: 0,
      repeatCollaborations: 0,
    },
    trustScore: privacy.showTrustScore
      ? Number(row.trust_score ?? data.trustScore ?? 0)
      : 0,
    achievements: privacy.showBadges
      ? (data.achievements as User["achievements"])
      : undefined,
    isVerified: sync.showVerification === true && row.is_verified === true,
    hasPortfolio: privacy.showPortfolio === true && data.hasPortfolio === true,
    publicPrivacy: privacy,
    skillHours: privacy.showSkillHourBalance
      ? Number(row.skill_hours ?? 0)
      : undefined,
    profileCompletion: Number(
      row.profile_completion ?? data.profileCompletion ?? 0,
    ),
    createdAt: iso(row.created_at),
    lastActive:
      privacy.showLastActive && sync.showOnlineStatus
        ? iso(row.last_active_at)
        : "",
    email: "",
  };
}
