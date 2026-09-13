"use server";

import { iso, payload, sql } from "@/lib/neon";
import { scheduleNotificationEmails } from "@/lib/notification-email";
import { revalidatePath } from "next/cache";
import { getCurrentUserId } from "./user";

export interface ReviewInput {
  rating: number;
  communication: number;
  quality: number;
  timeliness: number;
  professionalism: number;
  wouldCollaborateAgain: boolean;
  comment: string;
  skillEndorsements: string[];
  privateFeedback: string;
}

export async function submitReview(exchangeId: string, targetUserId: string, input: ReviewInput) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return { success: false, error: "Unauthorized" };
    const scores = [input?.rating, input?.communication, input?.quality, input?.timeliness, input?.professionalism];
    const comment = typeof input?.comment === "string" ? input.comment.trim() : "";
    const privateFeedback = typeof input?.privateFeedback === "string" ? input.privateFeedback.trim() : "";
    const skillEndorsements = Array.isArray(input?.skillEndorsements)
      ? [...new Set(input.skillEndorsements.map(skill => typeof skill === "string" ? skill.trim() : "").filter(Boolean))]
      : [];
    if (
      scores.some(score => !Number.isInteger(score) || score < 1 || score > 5) ||
      typeof input?.wouldCollaborateAgain !== "boolean" || !comment || comment.length > 3000 ||
      privateFeedback.length > 3000 || skillEndorsements.length > 5 || skillEndorsements.some(skill => skill.length > 80)
    ) return { success: false, error: "Invalid review" };

    const reviewId = crypto.randomUUID();
    const notificationId = crypto.randomUUID();
    const trustNotificationId = crypto.randomUUID();
    const endorsementNotificationId = crypto.randomUUID();
    const now = new Date().toISOString();
    const average = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const scoreDelta = average >= 4.75 ? 5 : average >= 4 ? 2 : average >= 3 ? 0 : average >= 2 ? -5 : -10;
    const isPositive = average >= 4;
    const reviewPayload = JSON.stringify({ exchangeId, reviewerId: userId, targetUserId, ...input, comment, privateFeedback, skillEndorsements, isPositive, createdAt: now });
    const message = `You received a ${input.rating}-star review for your recent exchange!`;
    const notificationPayload = JSON.stringify({ type: "new_review", title: "New Review Received", message, isRead: false, link: "/reviews", createdAt: now });
    const rows = await sql.query(
      `with eligible as (
         select id from exchanges where id=$1 and status='completed'
           and (($2=requester_id and $3=provider_id) or ($2=provider_id and $3=requester_id))
       ), inserted as (
         insert into reviews (id,exchange_id,reviewer_id,target_user_id,rating,comment,is_positive,created_at,payload)
         select $4,$1,$2,$3,$5,$6,$7,$8,$9::jsonb from eligible
         on conflict (exchange_id,reviewer_id) where exchange_id is not null and reviewer_id is not null do nothing returning id
       ), updated as (
         update users set trust_score=greatest(0,least(100,trust_score+$10)),updated_at=$8,
           payload=payload || jsonb_build_object('trustScore',greatest(0,least(100,trust_score+$10)))
         where id=$3 and exists(select 1 from inserted) returning id
       ), notified as (
         insert into notifications (id,source_path,user_id,notification_type,title,message,is_read,is_archived,link,related_id,created_at,payload)
         select $11,$12,$3,'new_review','New Review Received',$13,false,false,$14,$1,$8,$15::jsonb from inserted returning id
       ), trust_notified as (
         insert into notifications (id,source_path,user_id,notification_type,title,message,is_read,is_archived,link,related_id,created_at,payload)
         select $16,$17,$3,'trust_score_increased','Trust Score increased',$18,false,false,'/profile',$1,$8,$19::jsonb from updated where $10>0 returning id
       ), endorsement_notified as (
         insert into notifications (id,source_path,user_id,notification_type,title,message,is_read,is_archived,link,related_id,created_at,payload)
         select $20,$21,$3,'skill_endorsement','Skills endorsed',$22,false,false,'/profile',$1,$8,$23::jsonb from inserted where cardinality($24::text[])>0 returning id
       ) select id from inserted`,
      [exchangeId, userId, targetUserId, reviewId, input.rating, comment, isPositive, now, reviewPayload, scoreDelta, notificationId, `users/${targetUserId}/notifications/${notificationId}`, message, "/reviews", notificationPayload,
        trustNotificationId, `users/${targetUserId}/notifications/${trustNotificationId}`, `Your Trust Score increased by ${scoreDelta} points.`, JSON.stringify({ type: "trust_score_increased", title: "Trust Score increased", message: `Your Trust Score increased by ${scoreDelta} points.`, isRead: false, link: "/profile", relatedId: exchangeId, createdAt: now }),
        endorsementNotificationId, `users/${targetUserId}/notifications/${endorsementNotificationId}`, `${skillEndorsements.length} skill${skillEndorsements.length === 1 ? " was" : "s were"} endorsed.`, JSON.stringify({ type: "skill_endorsement", title: "Skills endorsed", message: `${skillEndorsements.length} skill${skillEndorsements.length === 1 ? " was" : "s were"} endorsed.`, isRead: false, link: "/profile", relatedId: exchangeId, createdAt: now }), skillEndorsements],
    );
    if (!rows.length) return { success: false, error: "Exchange is not reviewable or you have already reviewed it" };
    scheduleNotificationEmails([notificationId, trustNotificationId, endorsementNotificationId]);
    revalidatePath(`/exchanges/${exchangeId}`);
    revalidatePath("/reviews");
    return { success: true };
  } catch (error) {
    console.error("Error submitting review", error);
    return { success: false, error: error instanceof Error ? error.message : "Unable to submit review" };
  }
}

export async function hasUserReviewed(exchangeId: string) {
  const userId = await getCurrentUserId();
  if (!userId) return { success: false, hasReviewed: false };
  const [review] = await sql.query("select id from reviews where exchange_id=$1 and reviewer_id=$2 limit 1", [exchangeId, userId]);
  return { success: true, hasReviewed: Boolean(review) };
}

export async function getMyReviewHistory() {
  const userId = await getCurrentUserId();
  if (!userId) return { success: false, error: "Unauthorized", received: [], sent: [] };
  const rows = await sql.query(
    `select r.*,e.title as exchange_title,reviewer.username as reviewer_username,reviewer.full_name as reviewer_name,
       target.username as target_username,target.full_name as target_name
     from reviews r left join exchanges e on e.id=r.exchange_id left join users reviewer on reviewer.id=r.reviewer_id
     left join users target on target.id=r.target_user_id where r.reviewer_id=$1 or r.target_user_id=$1 order by r.created_at desc`,
    [userId],
  );
  const reviews = rows.map(row => {
    const data = payload<Record<string, unknown>>(row.payload);
    return {
      id: String(row.id), exchangeId: String(row.exchange_id ?? ""), exchangeTitle: String(row.exchange_title ?? "Exchange"),
      rating: Number(row.rating ?? 0), comment: String(row.comment ?? ""), createdAt: iso(row.created_at),
      skillEndorsements: Array.isArray(data.skillEndorsements) ? data.skillEndorsements.filter((skill): skill is string => typeof skill === "string") : [],
      reviewer: { name: String(row.reviewer_name ?? row.reviewer_username ?? "Weave member"), username: String(row.reviewer_username ?? "") },
      target: { name: String(row.target_name ?? row.target_username ?? "Weave member"), username: String(row.target_username ?? "") },
      reviewerId: String(row.reviewer_id ?? ""), targetUserId: String(row.target_user_id ?? ""),
    };
  });
  return { success: true, received: reviews.filter(review => review.targetUserId === userId), sent: reviews.filter(review => review.reviewerId === userId) };
}
