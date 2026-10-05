"use server";

import { payload, sql, iso } from "@/lib/neon";
import { User, PortfolioItem, Exchange, Review } from "@/types";
import { profileAccess, discoverable } from "@/lib/member-privacy";
import { publicMember } from "@/lib/public-member";

type Row = Record<string, unknown> & { id: string; payload: unknown };

export async function getUserByUsername(
  username: string,
): Promise<User | null> {
  const [row] = await sql.query(
    "select id from users where lower(username) = lower($1) limit 1",
    [username],
  );
  const access = row ? await profileAccess(String(row.id)) : null;
  return access ? publicMember(access.row as Row) : null;
}

export async function getUserPortfolio(
  userId: string,
): Promise<PortfolioItem[]> {
  const access = await profileAccess(userId);
  if (!access || (!access.owner && !access.privacy.showPortfolio)) return [];
  const rows = await sql.query(
    "select * from portfolio_items where user_id = $1 order by created_at desc",
    [userId],
  );
  return rows.map((row) => {
    const data = payload<Record<string, unknown>>(row.payload);
    return {
      id: String(row.id),
      userId,
      title: String(row.title ?? ""),
      description: String(row.description ?? ""),
      imageURL: String(row.image_url ?? "") || undefined,
      link: String(row.link ?? "") || undefined,
      technologies: Array.isArray(row.technologies)
        ? row.technologies.filter(
            (item): item is string => typeof item === "string",
          )
        : [],
      createdAt: iso(row.created_at),
      ...data,
    } as PortfolioItem;
  });
}

export async function getUserExchanges(userId: string): Promise<Exchange[]> {
  const access = await profileAccess(userId);
  if (!access || (!access.owner && !access.privacy.showCompletedExchanges))
    return [];
  const rows = await sql.query(
    "select * from exchanges where status = 'completed' and (requester_id = $1 or provider_id = $1) order by completed_at desc nulls last limit 10",
    [userId],
  );
  return rows.map(
    (row) =>
      ({
        id: String(row.id),
        title: String(row.title || "Exchange"),
        status: "completed",
        requesterId: "",
        providerId: "",
        skillHours: Number(row.skill_hours || 0),
        createdAt: iso(row.created_at),
        completedAt: iso(row.completed_at) || null,
      }) as Exchange,
  );
}

export async function getUserReviews(userId: string): Promise<Review[]> {
  const access = await profileAccess(userId);
  if (!access || (!access.owner && !access.privacy.showReviews)) return [];
  const rows = await sql.query(
    "select * from reviews where target_user_id = $1 order by created_at desc limit 10",
    [userId],
  );
  return rows.map((row) => {
    const data = payload<Record<string, unknown>>(row.payload);
    return {
      id: String(row.id),
      exchangeId: String(row.exchange_id ?? ""),
      reviewerId: String(row.reviewer_id ?? ""),
      targetUserId: userId,
      rating: Number(row.rating ?? 0),
      comment: String(row.comment ?? ""),
      isPositive: row.is_positive === true,
      communication: Number(data.communication ?? 0) || undefined,
      quality: Number(data.quality ?? 0) || undefined,
      timeliness: Number(data.timeliness ?? 0) || undefined,
      professionalism: Number(data.professionalism ?? 0) || undefined,
      wouldCollaborateAgain:
        typeof data.wouldCollaborateAgain === "boolean"
          ? data.wouldCollaborateAgain
          : undefined,
      skillEndorsements: Array.isArray(data.skillEndorsements)
        ? data.skillEndorsements.filter(
            (skill): skill is string => typeof skill === "string",
          )
        : [],
      createdAt: iso(row.created_at),
    };
  });
}

export async function getSimilarProfessionals(
  userId: string,
  profession: string,
  limitCount = 3,
) {
  const rows = await sql.query(
    "select * from users where id <> $1 order by (profession = $2) desc, trust_score desc limit $3",
    [userId, profession || "", limitCount],
  );
  const visible = await Promise.all(
    rows
      .filter((row) => discoverable(row, false))
      .map(async (row) => ((await profileAccess(String(row.id))) ? row : null)),
  );
  return visible
    .filter((row): row is NonNullable<typeof row> => !!row)
    .map((row) => {
      const user = publicMember(row as Row);
      return {
        id: row.id,
        username: user.username,
        name: user.fullName,
        role: user.profession || "Professional",
        photoURL: user.photoURL,
      };
    });
}
