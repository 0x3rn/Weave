"use server";

import { sql } from "@/lib/neon";
import { getCurrentUserId } from "./user";

export async function submitReview(exchangeId: string, targetUserId: string, rating: number, comment: string, isPositive: boolean) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return { success: false, error: "Unauthorized" };
    if (!Number.isInteger(rating) || rating < 1 || rating > 5 || typeof comment !== "string" || comment.length > 3000 || typeof isPositive !== "boolean") return { success: false, error: "Invalid review" };
    const reviewId = crypto.randomUUID();
    const notificationId = crypto.randomUUID();
    const now = new Date().toISOString();
    const scoreDelta = rating === 5 ? 5 : rating === 4 ? 2 : rating === 3 ? 0 : rating === 2 ? -5 : -10;
    const reviewPayload = JSON.stringify({ exchangeId, reviewerId: userId, targetUserId, rating, comment: comment.trim(), isPositive, createdAt: now });
    const notificationPayload = JSON.stringify({ type: "new_review", title: "New Review Received", message: `You received a ${rating}-star review for your recent exchange!`, isRead: false, link: `/u/${targetUserId}`, createdAt: now });
    const rows = await sql.query(
      `with eligible as (
         select id from exchanges where id=$1 and status='completed'
           and (($2=requester_id and $3=provider_id) or ($2=provider_id and $3=requester_id))
       ), inserted as (
         insert into reviews (id,exchange_id,reviewer_id,target_user_id,rating,comment,is_positive,created_at,payload)
         select $4,$1,$2,$3,$5,$6,$7,$8,$9::jsonb from eligible
         on conflict (exchange_id,reviewer_id) do nothing returning id
       ), updated as (
         update users set trust_score=greatest(0,least(100,trust_score+$10)),updated_at=$8,
           payload=payload || jsonb_build_object('trustScore',greatest(0,least(100,trust_score+$10)))
         where id=$3 and exists(select 1 from inserted) returning id
       ), notified as (
         insert into notifications (id,source_path,user_id,notification_type,title,message,is_read,is_archived,link,related_id,created_at,payload)
         select $11,$12,$3,'new_review','New Review Received',$13,false,false,$14,$1,$8,$15::jsonb from inserted returning id
       ) select id from inserted`,
      [exchangeId, userId, targetUserId, reviewId, rating, comment.trim(), isPositive, now, reviewPayload, scoreDelta, notificationId, `users/${targetUserId}/notifications/${notificationId}`, `You received a ${rating}-star review for your recent exchange!`, `/u/${targetUserId}`, notificationPayload],
    );
    return rows.length ? { success: true } : { success: false, error: "Exchange is not reviewable or you have already reviewed it" };
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
