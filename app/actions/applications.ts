"use server";

import { DEMO_APPLIED_REQUEST_IDS, USE_DEMO_MARKETPLACE } from "@/lib/demo-marketplace-data";
import { iso, payload, sql } from "@/lib/neon";
import { userFromRow } from "@/lib/users";
import { MarketplaceApplication } from "@/types";
import { createExchangeFromApplication } from "./exchanges";
import { getCurrentUserId } from "./user";

function applicationFromRow(row: Record<string, unknown>): MarketplaceApplication {
  return {
    ...payload<Record<string, unknown>>(row.payload), id: String(row.id), requestId: String(row.request_id ?? ""), applicantId: String(row.applicant_id ?? ""),
    coverMessage: String(row.cover_message ?? ""), portfolioLinks: Array.isArray(row.portfolio_links) ? row.portfolio_links as string[] : [], availability: String(row.availability ?? ""),
    estimatedHours: Number(row.estimated_hours ?? 0), status: String(row.status ?? "pending") as MarketplaceApplication["status"], isMutualProposal: row.is_mutual_proposal === true,
    offeredHours: row.offered_hours == null ? undefined : Number(row.offered_hours), createdAt: iso(row.created_at), updatedAt: iso(row.updated_at),
  } as MarketplaceApplication;
}

export async function submitApplication(requestId: string, data: { coverMessage: string; portfolioLinks: string[]; availability: string; estimatedHours: number; estimatedCompletionDate?: string; agreedToTerms: boolean; isMutualProposal?: boolean; offeredDeliverables?: string[]; offeredHours?: number }) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return { success: false, error: "Unauthorized" };
    if (!data || typeof data.coverMessage !== "string" || !data.coverMessage.trim() || data.coverMessage.length > 5000 || !Array.isArray(data.portfolioLinks) || data.portfolioLinks.length > 10 || data.portfolioLinks.some(link => typeof link !== "string" || link.length > 2048 || !/^https:\/\//.test(link)) || typeof data.availability !== "string" || data.availability.length > 200 || !Number.isInteger(data.estimatedHours) || data.estimatedHours < 1 || data.estimatedHours > 10_000 || !data.agreedToTerms || (data.isMutualProposal && (!Array.isArray(data.offeredDeliverables) || data.offeredDeliverables.length > 50 || data.offeredDeliverables.some(item => typeof item !== "string" || item.length > 500) || !Number.isInteger(data.offeredHours) || Number(data.offeredHours) < 1 || Number(data.offeredHours) > 10_000))) return { success: false, error: "Invalid application" };
    const id = `${requestId}_${userId}`;
    const now = new Date().toISOString();
    const notificationId = crypto.randomUUID();
    const application = { requestId, applicantId: userId, coverMessage: data.coverMessage.trim(), portfolioLinks: data.portfolioLinks, availability: data.availability.trim(), estimatedHours: data.estimatedHours, estimatedCompletionDate: data.estimatedCompletionDate, agreedToTerms: true, status: "pending", createdAt: now, updatedAt: now, isMutualProposal: data.isMutualProposal === true, offeredDeliverables: data.offeredDeliverables || [], offeredHours: data.offeredHours || data.estimatedHours };
    const rows = await sql.query(
      `with eligible as (select id,requester_id,title from marketplace_requests where id=$1 and status='open' and requester_id<>$2),
       inserted as (insert into marketplace_applications (id,request_id,applicant_id,cover_message,portfolio_links,availability,estimated_hours,status,is_mutual_proposal,offered_hours,estimated_completion_at,created_at,updated_at,payload)
         select $3,id,$2,$4,$5,$6,$7,'pending',$8,$9,$10,$11,$11,$12::jsonb from eligible on conflict (request_id,applicant_id) do nothing returning id,request_id),
       updated as (update marketplace_requests set applicants_count=applicants_count+1,payload=jsonb_set(payload,'{applicantsCount}',to_jsonb(applicants_count+1)),updated_at=$11 where id in(select request_id from inserted) returning requester_id,title),
       notified as (insert into notifications (id,source_path,user_id,notification_type,title,message,is_read,is_archived,link,related_id,created_at,payload)
         select $13,$14,requester_id,'request_update','New Application Received','Someone applied to your request: ' || title,false,false,$15,$1,$11,$16::jsonb from updated returning id)
       select id from inserted`,
      [requestId, userId, id, application.coverMessage, application.portfolioLinks, application.availability, application.estimatedHours, application.isMutualProposal, application.offeredHours, data.estimatedCompletionDate || null, now, JSON.stringify(application), notificationId, `notifications/${notificationId}`, `/dashboard/requests/${requestId}`, JSON.stringify({ type: "request_update", title: "New Application Received", message: "A new application was received.", isRead: false, link: `/dashboard/requests/${requestId}`, relatedId: requestId, createdAt: now })],
    );
    return rows.length ? { success: true, applicationId: id } : { success: false, error: "Request is unavailable or you have already applied" };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Failed to submit application" };
  }
}

export async function getApplicationsForRequest(requestId: string) {
  const userId = await getCurrentUserId();
  if (!userId) return { success: false, error: "Unauthorized" };
  const [request] = await sql.query("select * from marketplace_requests where id=$1 and requester_id=$2", [requestId, userId]);
  if (!request) return { success: false, error: "Request not found or unauthorized" };
  const rows = await sql.query("select a.*,u.id as user_row_id,u.email,u.username,u.full_name,u.photo_url,u.trust_score,u.payload as user_payload from marketplace_applications a left join users u on u.id=a.applicant_id where a.request_id=$1 order by a.created_at desc", [requestId]);
  const applications = rows.map(row => {
    const application = applicationFromRow(row);
    const applicant = row.user_row_id ? userFromRow({ id: row.user_row_id, email: row.email, username: row.username, full_name: row.full_name, photo_url: row.photo_url, trust_score: row.trust_score, payload: row.user_payload }) : null;
    return { ...application, applicant: applicant ? { name: applicant.fullName || applicant.username || "Unknown User", avatar: applicant.photoURL || null, trustScore: applicant.trustScore || 0, stats: applicant.stats || { rating: 0, exchangesCompleted: 0 } } : null };
  });
  return { success: true, applications, request: { ...payload<Record<string, unknown>>(request.payload), id: request.id, requesterId: request.requester_id, title: request.title, status: request.status } };
}

export async function updateApplicationStatus(applicationId: string, newStatus: string) {
  const userId = await getCurrentUserId();
  if (!userId) return { success: false, error: "Unauthorized" };
  if (newStatus === "accepted") return createExchangeFromApplication(applicationId);
  if (!(["shortlisted", "rejected"] as const).includes(newStatus as "shortlisted" | "rejected")) return { success: false, error: "Invalid application status" };
  const now = new Date().toISOString();
  const rows = await sql.query("update marketplace_applications a set status=$3,updated_at=$4,payload=a.payload || $5::jsonb from marketplace_requests r where a.id=$1 and a.request_id=r.id and r.requester_id=$2 and a.status in ('pending','shortlisted') returning a.id", [applicationId, userId, newStatus, now, JSON.stringify({ status: newStatus, updatedAt: now })]);
  return rows.length ? { success: true } : { success: false, error: "Application not found or cannot be updated" };
}

export async function getUserApplicationRequestIds() {
  if (USE_DEMO_MARKETPLACE) return DEMO_APPLIED_REQUEST_IDS;
  const userId = await getCurrentUserId();
  if (!userId) return [];
  const rows = await sql.query("select request_id from marketplace_applications where applicant_id=$1", [userId]);
  return rows.map(row => String(row.request_id));
}
