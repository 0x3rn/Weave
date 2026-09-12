"use server";

import { payload, sql, iso } from "@/lib/neon";
import { User, PortfolioItem, Exchange, Review } from "@/types";

type Row = Record<string, unknown> & { id: string; payload: unknown };

function publicUser(row: Row): User {
  const data = payload<Record<string, unknown>>(row.payload);
  return {
    uid: row.id,
    username: String(row.username ?? data.username ?? row.id),
    fullName: String(row.full_name ?? data.fullName ?? data.displayName ?? "Unknown"),
    photoURL: String(row.photo_url ?? data.photoURL ?? data.photoUrl ?? "") || null,
    profession: String(row.profession ?? data.profession ?? ""),
    headline: String(row.headline ?? data.headline ?? "") || undefined,
    country: String(row.country ?? data.country ?? ""),
    timeZone: String(row.time_zone ?? data.timeZone ?? ""),
    bio: String(row.bio ?? data.bio ?? "") || undefined,
    languages: Array.isArray(data.languages) ? data.languages.filter((item): item is string => typeof item === "string") : undefined,
    experienceLevel: String(data.experienceLevel ?? "") || undefined,
    availability: String(data.availability ?? "") || undefined,
    schedule: data.schedule as User["schedule"],
    skillsOffered: Array.isArray(data.skillsOffered) ? data.skillsOffered as User["skillsOffered"] : [],
    skillsLookingFor: Array.isArray(data.skillsLookingFor) ? data.skillsLookingFor.filter((item): item is string => typeof item === "string") : [],
    stats: payload<User["stats"]>(data.stats),
    trustScore: Number(row.trust_score ?? data.trustScore ?? 0),
    achievements: data.achievements as User["achievements"],
    isVerified: row.is_verified === true,
    hasPortfolio: data.hasPortfolio === true,
    profileCompletion: Number(row.profile_completion ?? data.profileCompletion ?? 0),
    createdAt: iso(row.created_at),
    lastActive: "",
    email: "",
  };
}

export async function getUserByUsername(username: string): Promise<User | null> {
  const [row] = await sql.query("select * from users where lower(username) = lower($1) limit 1", [username]);
  return row ? publicUser(row as Row) : null;
}

export async function getUserPortfolio(userId: string): Promise<PortfolioItem[]> {
  const rows = await sql.query("select * from portfolio_items where user_id = $1 order by created_at desc", [userId]);
  return rows.map(row => {
    const data = payload<Record<string, unknown>>(row.payload);
    return { id: String(row.id), userId, title: String(row.title ?? ""), description: String(row.description ?? ""), imageURL: String(row.image_url ?? "") || undefined, link: String(row.link ?? "") || undefined, technologies: Array.isArray(row.technologies) ? row.technologies.filter((item): item is string => typeof item === "string") : [], createdAt: iso(row.created_at), ...data } as PortfolioItem;
  });
}

export async function getUserExchanges(userId: string): Promise<Exchange[]> {
  const rows = await sql.query("select * from exchanges where status = 'completed' and (requester_id = $1 or provider_id = $1) order by completed_at desc nulls last limit 10", [userId]);
  return rows.map(row => ({ id: row.id, ...payload<Record<string, unknown>>(row.payload), createdAt: iso(row.created_at), completedAt: iso(row.completed_at) || null }) as Exchange);
}

export async function getUserReviews(userId: string): Promise<Review[]> {
  const rows = await sql.query("select * from reviews where target_user_id = $1 order by created_at desc limit 10", [userId]);
  return rows.map(row => {
    const data = payload<Record<string, unknown>>(row.payload);
    return {
      id: String(row.id), exchangeId: String(row.exchange_id ?? ""), reviewerId: String(row.reviewer_id ?? ""), targetUserId: userId,
      rating: Number(row.rating ?? 0), comment: String(row.comment ?? ""), isPositive: row.is_positive === true,
      communication: Number(data.communication ?? 0) || undefined, quality: Number(data.quality ?? 0) || undefined,
      timeliness: Number(data.timeliness ?? 0) || undefined, professionalism: Number(data.professionalism ?? 0) || undefined,
      wouldCollaborateAgain: typeof data.wouldCollaborateAgain === "boolean" ? data.wouldCollaborateAgain : undefined,
      skillEndorsements: Array.isArray(data.skillEndorsements) ? data.skillEndorsements.filter((skill): skill is string => typeof skill === "string") : [],
      createdAt: iso(row.created_at),
    };
  });
}

export async function getSimilarProfessionals(userId: string, profession: string, limitCount = 3) {
  const rows = await sql.query("select * from users where id <> $1 order by (profession = $2) desc, trust_score desc limit $3", [userId, profession || "", limitCount]);
  return rows.map(row => {
    const data = payload<Record<string, unknown>>(row.payload);
    return { id: row.id, username: String(row.username ?? data.username ?? row.id), name: String(row.full_name ?? data.fullName ?? data.displayName ?? row.username ?? "Unknown"), role: String(row.profession ?? data.profession ?? "Professional"), photoURL: String(row.photo_url ?? data.photoURL ?? data.photoUrl ?? "") || null };
  });
}
