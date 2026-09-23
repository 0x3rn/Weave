"use server";

import { iso, payload, sql } from "@/lib/neon";
import { scheduleNotificationEmails } from "@/lib/notification-email";
import type { Exchange, ExchangeActivity, ExchangeMilestone } from "@/types";
import { revalidatePath } from "next/cache";
import { getCurrentUserId } from "./user";
import { getOrCreateExchangeConversation } from "./messages";

const mutableStatuses = ["in_progress", "revision_requested"];

function exchangeFromRow(row: Record<string, unknown>): Exchange {
  return {
    ...payload<Record<string, unknown>>(row.payload),
    id: String(row.id),
    requestId: row.marketplace_request_id ? String(row.marketplace_request_id) : undefined,
    applicationId: row.marketplace_application_id ? String(row.marketplace_application_id) : undefined,
    requesterId: String(row.requester_id ?? ""),
    providerId: String(row.provider_id ?? ""),
    title: String(row.title ?? ""),
    skillHours: Number(row.skill_hours ?? 0),
    requesterEscrowHours: Number(row.requester_escrow_hours ?? 0),
    providerEscrowHours: Number(row.provider_escrow_hours ?? 0),
    status: String(row.status) as Exchange["status"],
    isMutual: row.is_mutual === true,
    deadline: iso(row.deadline_at),
    progress: Number(row.progress ?? 0),
    reviewRound: Number(row.review_round ?? 1),
    revealAt: iso(row.reveal_at) || null,
    filesReleasedAt: iso(row.files_released_at) || null,
    createdAt: iso(row.created_at),
    completedAt: iso(row.completed_at) || null,
    updatedAt: iso(row.updated_at),
  } as Exchange;
}

function milestoneFromRow(row: Record<string, unknown>): ExchangeMilestone {
  return {
    id: String(row.id),
    title: String(row.title ?? ""),
    description: String(row.description ?? "") || undefined,
    dueDate: iso(row.due_at) || undefined,
    status: String(row.status ?? "pending") as ExchangeMilestone["status"],
  };
}

async function updateProgress(exchangeId: string) {
  await sql.query(
    `update exchanges e set progress=coalesce((select round(100.0*count(*) filter(where m.status='completed')/nullif(count(*),0))::int from exchange_milestones m where m.exchange_id=e.id),0),updated_at=now()
     where e.id=$1`,
    [exchangeId],
  );
}

export async function getMyExchanges() {
  const userId = await getCurrentUserId();
  if (!userId) return { success: false, error: "Unauthorized", exchanges: [] };
  const rows = await sql.query(
    `select e.*,u.username as partner_username,u.full_name as partner_name,u.photo_url as partner_avatar
     from exchanges e
     join users u on u.id=case when e.requester_id=$1 then e.provider_id else e.requester_id end
     where e.requester_id=$1 or e.provider_id=$1
     order by case when e.status in ('pending_proposal','in_progress','in_review','revision_requested','disputed') then 0 else 1 end,e.updated_at desc`,
    [userId],
  );
  return {
    success: true,
    exchanges: rows.map(row => ({
      ...exchangeFromRow(row),
      role: row.requester_id === userId ? "requester" as const : "provider" as const,
      partner: {
        username: String(row.partner_username ?? ""),
        name: String(row.partner_name ?? row.partner_username ?? "Unknown member"),
        avatar: row.partner_avatar ? String(row.partner_avatar) : null,
      },
    })),
  };
}

export async function getExchangeMilestones(exchangeId: string) {
  const userId = await getCurrentUserId();
  if (!userId) return { success: false, error: "Unauthorized", milestones: [] };
  const rows = await sql.query(
    `select m.* from exchange_milestones m join exchanges e on e.id=m.exchange_id
     where m.exchange_id=$1 and (e.requester_id=$2 or e.provider_id=$2)
     order by m.position,m.created_at`,
    [exchangeId, userId],
  );
  return { success: true, milestones: rows.map(milestoneFromRow) };
}

export async function createExchangeMilestone(exchangeId: string, input: { title: string; description?: string; dueDate?: string }) {
  const userId = await getCurrentUserId();
  if (!userId) return { success: false, error: "Unauthorized" };
  const title = typeof input?.title === "string" ? input.title.trim() : "";
  const description = typeof input?.description === "string" ? input.description.trim() : "";
  const dueDate = typeof input?.dueDate === "string" && input.dueDate ? new Date(input.dueDate) : null;
  if (!title || title.length > 160 || description.length > 3000 || (dueDate && Number.isNaN(dueDate.getTime()))) return { success: false, error: "Invalid milestone" };

  const milestoneId = crypto.randomUUID();
  const activityId = crypto.randomUUID();
  const notificationId = crypto.randomUUID();
  const messageId = crypto.randomUUID();
  const now = new Date().toISOString();
  const conversation = await getOrCreateExchangeConversation(exchangeId);
  if (!conversation.success) return { success: false, error: conversation.error };
  const rows = await sql.query(
    `with eligible as (select id,requester_id,provider_id,title from exchanges where id=$1 and (requester_id=$2 or provider_id=$2) and status=any($3::text[])),
     inserted as (insert into exchange_milestones (id,exchange_id,created_by,title,description,due_at,status,position,created_at,updated_at)
       select $4,id,$2,$5,$6,$7,'pending',coalesce((select max(position)+1 from exchange_milestones where exchange_id=$1),0),$8,$8 from eligible returning id),
     activity as (insert into exchange_activity (id,exchange_id,actor_id,event_type,description,occurred_at,payload)
       select $9,$1,$2,'milestone_created','Milestone added: '||$5,$8,jsonb_build_object('type','milestone_created','description','Milestone added: '||$5,'timestamp',$8) from inserted returning id),
     card as (insert into messages (id,conversation_id,sender_id,message_type,content,metadata,read_by,created_at,payload)
       select $11,$1,$2,'rich_card','Milestone added: '||$5,jsonb_build_object('kind','milestone','milestoneId',$4,'status','pending','title',$5),array[$2],$8,'{}'::jsonb from inserted returning content),
     conversation_update as (update conversations c set last_message=card.content,last_message_at=$8,updated_at=$8,
       unread_counts=jsonb_set(coalesce(c.unread_counts,'{}'::jsonb),array[case when e.requester_id=$2 then e.provider_id else e.requester_id end],
         to_jsonb(coalesce((c.unread_counts->>(case when e.requester_id=$2 then e.provider_id else e.requester_id end))::int,0)+1),true)
       from eligible e,card where c.id=e.id),
     notified as (insert into notifications (id,source_path,user_id,notification_type,title,message,is_read,is_archived,link,related_id,created_at,payload)
       select $10,'notifications/'||$10,case when requester_id=$2 then provider_id else requester_id end,'milestone_added','Milestone Added','A milestone was added to "'||title||'".',false,false,'/exchanges/'||id||'/milestones',id,$8,jsonb_build_object('type','milestone_added','title','Milestone Added','message','A milestone was added.','isRead',false,'link','/exchanges/'||id||'/milestones','createdAt',$8) from eligible where exists(select 1 from inserted) returning id)
     select id from inserted`,
    [exchangeId, userId, mutableStatuses, milestoneId, title, description || null, dueDate?.toISOString() ?? null, now, activityId, notificationId, messageId],
  );
  if (!rows.length) return { success: false, error: "Exchange cannot be updated" };
  scheduleNotificationEmails([notificationId]);
  await updateProgress(exchangeId);
  revalidatePath(`/exchanges/${exchangeId}`);
  revalidatePath(`/messages/${exchangeId}`);
  return { success: true, milestoneId };
}

export async function updateExchangeMilestone(exchangeId: string, milestoneId: string, status: ExchangeMilestone["status"]) {
  const userId = await getCurrentUserId();
  if (!userId) return { success: false, error: "Unauthorized" };
  if (!(["pending", "in_progress", "completed"] as const).includes(status)) return { success: false, error: "Invalid milestone status" };
  const now = new Date().toISOString();
  const activityId = crypto.randomUUID();
  const notificationId = crypto.randomUUID();
  const messageId = crypto.randomUUID();
  const conversation = await getOrCreateExchangeConversation(exchangeId);
  if (!conversation.success) return { success: false, error: conversation.error };
  const rows = await sql.query(
    `with eligible as (select id,requester_id,provider_id,title from exchanges where id=$1 and (requester_id=$2 or provider_id=$2) and status=any($3::text[])),
     updated as (update exchange_milestones set status=$5,updated_at=$6 where id=$4 and exchange_id in(select id from eligible) and status<>$5 returning title),
     activity as (insert into exchange_activity (id,exchange_id,actor_id,event_type,description,occurred_at,payload)
       select $7,$1,$2,case when $5='completed' then 'milestone_completed' else 'milestone_updated' end,'Milestone "'||title||'" marked '||replace($5,'_',' '),$6,jsonb_build_object('type',case when $5='completed' then 'milestone_completed' else 'milestone_updated' end,'description','Milestone "'||title||'" marked '||replace($5,'_',' '),'timestamp',$6) from updated returning id),
     card as (insert into messages (id,conversation_id,sender_id,message_type,content,metadata,read_by,created_at,payload)
       select $9,$1,$2,'rich_card','Milestone "'||title||'" marked '||replace($5,'_',' '),
         jsonb_build_object('kind','milestone','milestoneId',$4,'status',$5,'title',title),array[$2],$6,'{}'::jsonb from updated returning content),
     conversation_update as (update conversations c set last_message=card.content,last_message_at=$6,updated_at=$6,
       unread_counts=jsonb_set(coalesce(c.unread_counts,'{}'::jsonb),array[case when e.requester_id=$2 then e.provider_id else e.requester_id end],
         to_jsonb(coalesce((c.unread_counts->>(case when e.requester_id=$2 then e.provider_id else e.requester_id end))::int,0)+1),true)
       from eligible e,card where c.id=e.id),
     notified as (insert into notifications (id,source_path,user_id,notification_type,title,message,is_read,is_archived,link,related_id,created_at,payload)
       select $8,'notifications/'||$8,case when requester_id=$2 then provider_id else requester_id end,case when $5='completed' then 'milestone_completed' else 'milestone_updated' end,'Milestone Updated','A milestone in "'||title||'" is now '||replace($5,'_',' ')||'.',false,false,'/exchanges/'||id||'/milestones',id,$6,jsonb_build_object('type',case when $5='completed' then 'milestone_completed' else 'milestone_updated' end,'title','Milestone Updated','message','A milestone was updated.','isRead',false,'link','/exchanges/'||id||'/milestones','createdAt',$6) from eligible where exists(select 1 from updated) returning id)
     select title from updated`,
    [exchangeId, userId, mutableStatuses, milestoneId, status, now, activityId, notificationId, messageId],
  );
  if (!rows.length) return { success: false, error: "Milestone was not found or already has that status" };
  scheduleNotificationEmails([notificationId]);
  await updateProgress(exchangeId);
  revalidatePath(`/exchanges/${exchangeId}`);
  revalidatePath(`/messages/${exchangeId}`);
  return { success: true };
}

export async function deleteExchangeMilestone(exchangeId: string, milestoneId: string) {
  const userId = await getCurrentUserId();
  if (!userId) return { success: false, error: "Unauthorized" };
  const rows = await sql.query(
    `delete from exchange_milestones m using exchanges e where m.id=$1 and m.exchange_id=$2 and e.id=m.exchange_id
     and (e.requester_id=$3 or e.provider_id=$3) and e.status=any($4::text[]) returning m.id`,
    [milestoneId, exchangeId, userId, mutableStatuses],
  );
  if (!rows.length) return { success: false, error: "Milestone cannot be deleted" };
  await updateProgress(exchangeId);
  revalidatePath(`/exchanges/${exchangeId}`);
  return { success: true };
}

export async function getExchangeActivity(exchangeId: string) {
  const userId = await getCurrentUserId();
  if (!userId) return { success: false, error: "Unauthorized", activity: [] };
  const rows = await sql.query(
    `select a.* from exchange_activity a join exchanges e on e.id=a.exchange_id
     where a.exchange_id=$1 and (e.requester_id=$2 or e.provider_id=$2) order by a.occurred_at desc`,
    [exchangeId, userId],
  );
  const activity = rows.map(row => ({
    id: String(row.id),
    type: String(row.event_type ?? "created"),
    description: String(row.description ?? ""),
    timestamp: iso(row.occurred_at),
    actorId: row.actor_id ? String(row.actor_id) : undefined,
  })) as ExchangeActivity[];
  return { success: true, activity };
}

export async function getPrivateExchangeNote(exchangeId: string) {
  const userId = await getCurrentUserId();
  if (!userId) return { success: false, error: "Unauthorized", content: "" };
  const [row] = await sql.query(
    `select n.content,n.updated_at from exchange_notes n join exchanges e on e.id=n.exchange_id
     where n.exchange_id=$1 and n.user_id=$2 and (e.requester_id=$2 or e.provider_id=$2)`,
    [exchangeId, userId],
  );
  return { success: true, content: String(row?.content ?? ""), updatedAt: iso(row?.updated_at) || undefined };
}

export async function savePrivateExchangeNote(exchangeId: string, content: string) {
  const userId = await getCurrentUserId();
  if (!userId) return { success: false, error: "Unauthorized" };
  if (typeof content !== "string" || content.length > 20_000) return { success: false, error: "Note is too long" };
  const rows = await sql.query(
    `insert into exchange_notes (exchange_id,user_id,content,updated_at)
     select id,$2,$3,$4 from exchanges where id=$1 and (requester_id=$2 or provider_id=$2)
     on conflict (exchange_id,user_id) do update set content=excluded.content,updated_at=excluded.updated_at returning exchange_id`,
    [exchangeId, userId, content, new Date().toISOString()],
  );
  revalidatePath(`/exchanges/${exchangeId}/notes`);
  return rows.length ? { success: true } : { success: false, error: "Exchange not found" };
}

export async function cancelExchange(exchangeId: string, reason: string) {
  const userId = await getCurrentUserId();
  if (!userId) return { success: false, error: "Unauthorized" };
  const cleanReason = typeof reason === "string" ? reason.trim() : "";
  if (!cleanReason || cleanReason.length > 500) return { success: false, error: "Choose or enter a cancellation reason" };
  try {
    const ids = Array.from({ length: 5 }, () => crypto.randomUUID());
    await sql.query("select cancel_exchange_before_work($1,$2,$3,$4,$5,$6,$7,$8,$9)", [userId, exchangeId, ...ids, cleanReason, new Date().toISOString()]);
    scheduleNotificationEmails([ids[3], ids[4]]);
    revalidatePath(`/exchanges/${exchangeId}`);
    revalidatePath("/exchanges");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message.replace(/^.*error:\s*/i, "") : "Unable to cancel exchange" };
  }
}
