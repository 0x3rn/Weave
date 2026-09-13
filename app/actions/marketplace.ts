"use server";

import { getDemoMarketplaceData, getDemoMarketplaceRequest, USE_DEMO_MARKETPLACE } from "@/lib/demo-marketplace-data";
import { calculateTrustScore } from "@/lib/user-metrics";
import { iso, payload, sql } from "@/lib/neon";
import { scheduleNotificationEmails } from "@/lib/notification-email";
import { getUserById, userFromRow } from "@/lib/users";
import { MarketplaceFilters, MarketplaceRequest } from "@/types";
import { getCurrentUserId } from "./user";

function requestFromRow(row: Record<string, unknown>): MarketplaceRequest {
  return {
    ...payload<Record<string, unknown>>(row.payload),
    id: String(row.id), requesterId: String(row.requester_id ?? ""), title: String(row.title ?? ""), description: String(row.description ?? ""),
    category: String(row.category ?? "Other"), skillsRequired: Array.isArray(row.skills_required) ? row.skills_required as string[] : [],
    deliverables: Array.isArray(row.deliverables) ? row.deliverables : [], attachments: Array.isArray(row.attachments) ? row.attachments : [],
    estimatedHours: String(row.estimated_hours ?? "TBD"), exchangeType: String(row.exchange_type ?? "One-time"), timeline: String(row.timeline ?? "Flexible"),
    status: String(row.status ?? "open") as MarketplaceRequest["status"], isMutual: row.is_mutual === true, applicantsCount: Number(row.applicants_count ?? 0),
    createdAt: iso(row.created_at), updatedAt: iso(row.updated_at),
  } as MarketplaceRequest;
}

function cleanString(value: unknown, fallback: string, max: number) {
  const result = typeof value === "string" ? value.trim() : fallback;
  if (result.length > max) throw new Error("Marketplace field is too long");
  return result;
}

function cleanStringArray(value: unknown) {
  if (value === undefined) return undefined;
  if (!Array.isArray(value) || value.length > 50 || value.some(item => typeof item !== "string" || item.length > 500)) throw new Error("Invalid marketplace list");
  return value.map(item => item.trim()).filter(Boolean);
}

async function attachRequester(request: MarketplaceRequest) {
  const requester = await getUserById(request.requesterId);
  if (!requester) return request;
  request.requesterName = requester.fullName || requester.username || request.requesterName;
  request.requesterAvatar = requester.photoURL || request.requesterAvatar || undefined;
  request.requesterTrustScore = requester.trustScore ?? calculateTrustScore(requester);
  request.requesterVerification = requester.isVerified || false;
  return request;
}

export async function getMarketplaceData(filters: Partial<MarketplaceFilters> = {}, searchQuery = "") {
  if (USE_DEMO_MARKETPLACE) return getDemoMarketplaceData(filters, searchQuery);
  try {
    const query = searchQuery.trim().slice(0, 200);
    const requestRows = query
      ? await sql.query("select * from marketplace_requests where to_tsvector('simple',coalesce(title,'') || ' ' || coalesce(description,'')) @@ plainto_tsquery('simple',$1) order by created_at desc limit 100", [query])
      : await sql.query("select * from marketplace_requests order by created_at desc limit 100");
    let requests = await Promise.all(requestRows.map(row => attachRequester(requestFromRow(row))));
    if (filters.category?.length) requests = requests.filter(request => filters.category?.includes(request.category));
    if (filters.verifiedOnly) requests = requests.filter(request => request.requesterVerification === true);
    if (filters.minTrustScore) requests = requests.filter(request => request.requesterTrustScore >= Number(filters.minTrustScore));

    const userRows = await sql.query("select * from users where coalesce(account_status,payload->>'status','active')='active' limit 100");
    let professionals = userRows.map(row => {
      const user = userFromRow(row);
      const stats = user.stats || { rating: 0, exchangesCompleted: 0 };
      return {
        id: user.uid, name: user.fullName || user.username || "Unknown", username: user.username || user.uid, avatar: user.photoURL || null,
        headline: user.headline || user.profession || "", isVerified: user.isVerified || false, trustScore: user.trustScore ?? calculateTrustScore(user),
        rating: stats.rating || 0, completedExchanges: stats.exchangesCompleted || 0,
        topSkills: (user.skillsOffered || []).map(skill => typeof skill === "string" ? skill : skill.name).slice(0, 3), availability: user.availability || "Not specified",
      };
    });
    if (filters.minTrustScore) professionals = professionals.filter(person => person.trustScore >= Number(filters.minTrustScore));
    if (filters.minRating && !["Any", ""].includes(filters.minRating)) professionals = professionals.filter(person => person.rating >= Number.parseFloat(filters.minRating || "0"));
    return { success: true, requests, professionals, stats: { openRequests: requests.length, professionalsAvailable: professionals.length, newToday: requests.filter(request => new Date(request.createdAt).getTime() > Date.now() - 86_400_000).length, recommendedMatches: Math.min(12, requests.length) } };
  } catch (error) {
    console.error("Error fetching marketplace data", error);
    return { success: false, error: error instanceof Error ? error.message : "Unable to load marketplace" };
  }
}

export async function getMarketplaceRequest(id: string): Promise<{ success: boolean; request?: MarketplaceRequest; error?: string }> {
  if (USE_DEMO_MARKETPLACE) return getDemoMarketplaceRequest(id);
  const [row] = await sql.query("select * from marketplace_requests where id=$1", [id]);
  if (!row) return { success: false, error: "Request not found" };
  return { success: true, request: await attachRequester(requestFromRow(row)) };
}

export async function createMarketplaceRequest(data: Partial<MarketplaceRequest>) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return { success: false, error: "Unauthorized" };
    const user = await getUserById(userId);
    if (!user) return { success: false, error: "User not found" };
    const now = new Date().toISOString();
    const id = crypto.randomUUID();
    const title = cleanString(data.title, "Untitled Request", 200);
    const description = cleanString(data.description, "", 10_000);
    const category = cleanString(data.category, "Other", 100);
    const skillsRequired = cleanStringArray(data.skillsRequired) ?? [];
    const deliverables = Array.isArray(data.deliverables) && data.deliverables.length <= 50 ? data.deliverables : [];
    const attachments = Array.isArray(data.attachments) && data.attachments.length <= 20 ? data.attachments : [];
    const isMutual = data.isMutual === true;
    const offeredHoursNumber = Number(String(data.offeredHours ?? "").trim());
    const offeredDeliverables = Array.isArray(data.offeredDeliverables) ? data.offeredDeliverables.map(item => String(item).trim()).filter(Boolean).slice(0, 50) : [];
    if (isMutual && (!Number.isInteger(offeredHoursNumber) || offeredHoursNumber < 1 || offeredHoursNumber > 10_000 || offeredDeliverables.length === 0)) throw new Error("Mutual exchanges require numeric offered hours and at least one deliverable");
    if (JSON.stringify({ deliverables, attachments }).length > 50_000) throw new Error("Request attachments or deliverables are too large");
    const request = {
      title, requesterId: userId, requesterName: user.fullName || user.username || "Unknown", requesterAvatar: user.photoURL || "", requesterTrustScore: user.trustScore || 50,
      requesterVerification: user.isVerified || false, description, deliverables, category, skillsRequired,
      estimatedHours: cleanString(data.estimatedHours, "TBD", 100), exchangeType: cleanString(data.exchangeType, "One-time", 100), timeline: cleanString(data.timeline, "Flexible", 200),
      preferredExperience: cleanString(data.preferredExperience, "Any", 100), preferredTimeZone: cleanString(data.preferredTimeZone, user.timeZone || "", 100), attachments,
      status: "open", applicantsCount: 0, createdAt: now, updatedAt: now, isMutual,
      offeredSkills: cleanStringArray(data.offeredSkills) ?? [], offeredDeliverables, offeredHours: isMutual ? String(offeredHoursNumber) : "",
    };
    const matches = skillsRequired.length
      ? await sql.query("select id from users where id<>$1 and coalesce(account_status,payload->>'status','active')='active' and payload->'skillsLookingFor' ?| $2::text[] limit 100", [userId, skillsRequired])
      : [];
    const matchNotifications = matches.map(match => ({ recipientId: String(match.id), notificationId: crypto.randomUUID() }));
    await sql.transaction([
      sql.query("insert into marketplace_requests (id,requester_id,title,description,category,skills_required,deliverables,attachments,estimated_hours,exchange_type,timeline,status,is_mutual,applicants_count,created_at,updated_at,payload) values ($1,$2,$3,$4,$5,$6,$7::jsonb,$8::jsonb,$9,$10,$11,'open',$12,0,$13,$13,$14::jsonb)", [id, userId, title, description, category, skillsRequired, JSON.stringify(deliverables), JSON.stringify(attachments), request.estimatedHours, request.exchangeType, request.timeline, request.isMutual, now, JSON.stringify(request)]),
      ...matchNotifications.map(({ recipientId, notificationId }) => {
        return sql.query("insert into notifications (id,source_path,user_id,notification_type,title,message,is_read,is_archived,link,related_id,created_at,payload) values ($1,$2,$3,'new_match','New marketplace match',$4,false,false,$5,$6,$7,$8::jsonb)", [notificationId, `marketplace/${id}/match/${recipientId}`, recipientId, `A new request, ${title}, matches skills you want to use.`, `/marketplace/${id}`, id, now, JSON.stringify({ type: "new_match", title: "New marketplace match", message: `A new request, ${title}, matches skills you want to use.`, isRead: false, link: `/marketplace/${id}`, relatedId: id, createdAt: now })]);
      }),
    ]);
    scheduleNotificationEmails(matchNotifications.map(item => item.notificationId));
    return { success: true, id };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Unable to create request" };
  }
}

export async function updateMarketplaceRequest(id: string, data: Partial<MarketplaceRequest>) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return { success: false, error: "Unauthorized" };
    const [row] = await sql.query("select * from marketplace_requests where id=$1 and requester_id=$2", [id, userId]);
    if (!row) return { success: false, error: "Request not found or unauthorized" };
    if (Number(row.applicants_count ?? 0) > 0) return { success: false, error: "Cannot edit a request that already has applicants" };
    const existing = requestFromRow(row);
    const now = new Date().toISOString();
    const updated = {
      ...existing,
      title: data.title === undefined ? existing.title : cleanString(data.title, existing.title, 200),
      description: data.description === undefined ? existing.description : cleanString(data.description, existing.description, 10_000),
      category: data.category === undefined ? existing.category : cleanString(data.category, existing.category, 100),
      skillsRequired: cleanStringArray(data.skillsRequired) ?? existing.skillsRequired,
      estimatedHours: data.estimatedHours === undefined ? existing.estimatedHours : cleanString(data.estimatedHours, existing.estimatedHours, 100),
      exchangeType: data.exchangeType === undefined ? existing.exchangeType : cleanString(data.exchangeType, existing.exchangeType, 100),
      timeline: data.timeline === undefined ? existing.timeline : cleanString(data.timeline, existing.timeline, 200),
      preferredExperience: data.preferredExperience === undefined ? existing.preferredExperience : cleanString(data.preferredExperience, existing.preferredExperience || "Any", 100),
      deliverables: data.deliverables === undefined ? existing.deliverables : Array.isArray(data.deliverables) ? data.deliverables.slice(0, 50) : existing.deliverables,
      isMutual: data.isMutual ?? existing.isMutual,
      offeredSkills: cleanStringArray(data.offeredSkills) ?? existing.offeredSkills,
      offeredDeliverables: data.offeredDeliverables === undefined ? existing.offeredDeliverables : Array.isArray(data.offeredDeliverables) ? data.offeredDeliverables.slice(0, 50) : existing.offeredDeliverables,
      offeredHours: data.offeredHours ?? existing.offeredHours,
      updatedAt: now,
    };
    const updatedOfferedHours = Number(String(updated.offeredHours ?? "").trim());
    if (updated.isMutual && (!Number.isInteger(updatedOfferedHours) || updatedOfferedHours < 1 || updatedOfferedHours > 10_000 || !updated.offeredDeliverables?.length)) throw new Error("Mutual exchanges require numeric offered hours and at least one deliverable");
    updated.offeredHours = updated.isMutual ? String(updatedOfferedHours) : "";
    if (JSON.stringify(updated).length > 100_000) throw new Error("Request is too large");
    const savedBy = await sql.query("select user_id from saved_items where target_id=$1 and user_id<>$2 limit 100", [id, userId]);
    const updateNotifications = savedBy.map(saved => ({ recipientId: String(saved.user_id), notificationId: crypto.randomUUID() }));
    await sql.transaction([
      sql.query("update marketplace_requests set title=$3,description=$4,category=$5,skills_required=$6,deliverables=$7::jsonb,estimated_hours=$8,exchange_type=$9,timeline=$10,is_mutual=$11,updated_at=$12,payload=$13::jsonb where id=$1 and requester_id=$2", [id, userId, updated.title, updated.description, updated.category, updated.skillsRequired, JSON.stringify(updated.deliverables), updated.estimatedHours, updated.exchangeType, updated.timeline, updated.isMutual, now, JSON.stringify(updated)]),
      ...updateNotifications.map(({ recipientId, notificationId }) => {
        return sql.query("insert into notifications (id,source_path,user_id,notification_type,title,message,is_read,is_archived,link,related_id,created_at,payload) values ($1,$2,$3,'saved_request_updated','Saved request updated',$4,false,false,$5,$6,$7,$8::jsonb)", [notificationId, `marketplace/${id}/updated/${now}/${recipientId}`, recipientId, `${updated.title} was updated.`, `/marketplace/${id}`, id, now, JSON.stringify({ type: "saved_request_updated", title: "Saved request updated", message: `${updated.title} was updated.`, isRead: false, link: `/marketplace/${id}`, relatedId: id, createdAt: now })]);
      }),
    ]);
    scheduleNotificationEmails(updateNotifications.map(item => item.notificationId));
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Unable to update request" };
  }
}
