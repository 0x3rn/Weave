import "server-only";
import { sql } from "./neon";
import { userFromRow } from "./users";
import { publicMember } from "./public-member";
import { calculateEarnedAchievements } from "./user-metrics";
import { ACHIEVEMENTS } from "./constants/achievements";
import { discoveryPredicate } from "./member-privacy";
import { notificationSettings, object, inQuietHours } from "./settings";
import { sendEmail } from "./email";

export async function generateNotificationActivity() {
  await sql.query(
    "update marketplace_requests set status='expired',payload=payload||'{\"status\":\"expired\"}'::jsonb where status='open' and expires_at<=now()",
  );
  const [reminder] = await sql.query(
    "select generate_notification_reminders() as count",
  );
  const announcements = await sql.query(
    "with due as(select id from notification_announcements where publish_at<=now() and published_at is null for update skip locked),published as(update notification_announcements a set published_at=now() from due where a.id=due.id returning a.*),inserted as(insert into notifications(id,source_path,user_id,notification_type,title,message,link,created_at,payload) select 'announcement-'||md5(a.id||':'||u.id),'announcement/'||a.id||'/'||u.id,u.id,a.event_type,a.title,a.message,a.link,now(),'{}'::jsonb from published a cross join users u where coalesce(u.account_status,'active')='active' on conflict do nothing returning id) select count(*) as count from inserted",
  );
  const members = await sql.query(
    `with due as(select u.id from users u left join notification_member_checks c on c.user_id=u.id where coalesce(u.account_status,'active')='active' and u.onboarded and (c.checked_at is null or c.checked_at<now()-interval '1 day') order by c.checked_at nulls first,u.id limit 100 for update of u skip locked),claimed as(insert into notification_member_checks(user_id,checked_at) select id,now() from due on conflict(user_id) do update set checked_at=excluded.checked_at returning user_id) select u.* from users u join claimed c on c.user_id=u.id`,
  );
  let failed = 0;
  for (const row of members) {
    const uid = String(row.id);
    try {
      const [metrics] = await sql.query(
        `select (select count(*) from exchanges where status='completed' and $1 in(requester_id,provider_id)) as completed,(select coalesce(avg(rating),0) from reviews where target_user_id=$1) as rating,(select count(*) from reviews where target_user_id=$1) as reviews,(select coalesce(sum(amount),0) from ledger_entries where user_id=$1 and entry_type='Earned') as hours,exists(select 1 from portfolio_items where user_id=$1) as portfolio`,
        [uid],
      );
      const member = userFromRow(row);
      member.stats = {
        ...member.stats,
        exchangesCompleted: Number(metrics.completed),
        rating: Number(metrics.rating),
        reviewsCount: Number(metrics.reviews),
        skillHoursEarned: Number(metrics.hours),
      };
      member.hasPortfolio = metrics.portfolio;
      for (const id of calculateEarnedAchievements(member)) {
        const badge = ACHIEVEMENTS[id];
        if (!badge) continue;
        await sql.query(
          `with award as(insert into notification_achievement_awards(user_id,achievement_id) values($1,$2) on conflict do nothing returning user_id) select publish_member_notification('achievement:'||$2,user_id,'achievement_unlocked',$3,$4,'/achievements',null,jsonb_build_object('achievementId',$2::text)) from award`,
          [uid, id, "Achievement unlocked: " + badge.title, badge.description],
        );
      }
      const [streak] = await sql.query(
        `with weeks as(select distinct date_trunc('week',completed_at at time zone 'UTC') week from exchanges where status='completed' and $1 in(requester_id,provider_id)),current_week as(select date_trunc('week',now() at time zone 'UTC') week),run as(select count(*) total from generate_series(0,7) offset_week where exists(select 1 from weeks,current_week where weeks.week=current_week.week-offset_week*interval '7 days')) select total,date_trunc('week',now() at time zone 'UTC')::text as period from run`,
        [uid],
      );
      if (Number(streak.total) === 8)
        await sql.query(
          "select publish_member_notification($1,$2,'weekly_streak','Eight-week collaboration streak','You completed exchanges in eight consecutive weeks.','/achievements')",
          ["streak:" + streak.period, uid],
        );
      const data = object(row.payload),
        looking = Array.isArray(data.skillsLookingFor)
          ? data.skillsLookingFor.filter(
              (value): value is string => typeof value === "string",
            )
          : [];
      if (row.country && looking.length) {
        const professionals = await sql.query(
          `select u.* from users u where u.id<>$1 and u.is_verified and u.country=$2 and u.created_at>now()-interval '1 day' and ${discoveryPredicate("u", "$1", "false")} and exists(select 1 from jsonb_array_elements(case when jsonb_typeof(u.payload->'skillsOffered')='array' then u.payload->'skillsOffered' else '[]'::jsonb end) skill where lower(case when jsonb_typeof(skill)='string' then skill#>>'{}' else coalesce(skill->>'name',skill->>'skill','') end)=any($3::text[]))`,
          [uid, row.country, looking.map((value) => value.toLowerCase())],
        );
        for (const professional of professionals) {
          const visible = publicMember({
            ...professional,
            id: String(professional.id),
            payload: professional.payload,
          });
          await sql.query(
            "select publish_member_notification($1,$2,'new_professional',$3,$4,$5,$6,$7::jsonb)",
            [
              "professional:" + professional.id,
              uid,
              "A new professional matches your interests",
              `${visible.fullName} joined your region and offers skills you are looking for.`,
              `/u/${visible.username}`,
              professional.id,
              JSON.stringify({ actorId: professional.id }),
            ],
          );
        }
      }
      const [community] = await sql.query(
        "select count(*) as count from users u where u.created_at>now()-interval '1 day' and u.id<>$1 and " +
          discoveryPredicate("u", "$1", "false"),
        [uid],
      );
      if (Number(community.count) > 0)
        await sql.query(
          "select publish_member_notification($1,$2,'welcome_members','Welcome new members',$3,'/marketplace')",
          [
            "community-members:" + new Date().toISOString().slice(0, 10),
            uid,
            `${community.count} professionals joined the community in the last day.`,
          ],
        );
    } catch {
      failed++;
      await sql.query(
        "delete from notification_member_checks where user_id=$1",
        [uid],
      );
    }
  }
  await sql.query(
    "delete from sign_in_failure_windows where window_at<now()-interval '2 days'",
  );
  return {
    reminders: Number(reminder?.count || 0),
    announcements: Number(announcements[0]?.count || 0),
    members: members.length,
    failed,
  };
}

export async function productivitySummary(uid: string) {
  const [row] = await sql.query(
    `select (select count(*) from exchanges e where $1 in(e.requester_id,e.provider_id) and e.status='in_review' and (e.is_mutual or e.requester_id=$1) and not exists(select 1 from exchange_review_decisions d where d.exchange_id=e.id and d.review_round=e.review_round and d.reviewer_id=$1)) as reviews,(select count(*) from messages m join conversation_participants p on p.conversation_id=m.conversation_id where p.user_id=$1 and m.sender_id<>$1 and not $1=any(m.read_by) and not exists(select 1 from conversation_archives a where a.conversation_id=m.conversation_id and a.user_id=$1)) as messages,(select count(*) from notifications n where n.user_id=$1 and n.notification_type='new_match' and not n.is_read and not n.is_archived and n.in_app_enabled and n.created_at>now()-interval '1 day') as matches,(select trust_score from users where id=$1) as trust,(select count(*) from notifications where user_id=$1 and notification_type in('trust_score_increased','trust_score_decreased') and created_at>now()-interval '1 day') as trust_changes`,
    [uid],
  );
  return {
    reviews: Number(row.reviews || 0),
    messages: Number(row.messages || 0),
    matches: Number(row.matches || 0),
    trust: Number(row.trust || 0),
    trustChanges: Number(row.trust_changes || 0),
  };
}
export function summaryHtml(
  summary: Awaited<ReturnType<typeof productivitySummary>>,
) {
  return `<h2>Good morning 👋</h2><p>Today you have:</p><ul><li>${summary.reviews} exchanges awaiting review</li><li>${summary.messages} unread messages</li><li>${summary.matches} new collaboration matches</li>${summary.trustChanges ? `<li>Your Trust Score is now ${summary.trust}</li>` : ""}</ul>`;
}
export async function deliverProductivityDigests() {
  const members = await sql.query(
    `select id,email,payload from users where coalesce(account_status,'active')='active' and payload->'notificationPreferences'->'dailySummary'->>'enabled'='true' and email is not null`,
  );
  let sent = 0,
    failed = 0;
  for (const row of members) {
    const preferences = notificationSettings(
      object(row.payload).notificationPreferences,
    );
    if (inQuietHours(preferences)) continue;
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: preferences.quietHours.timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).formatToParts(new Date());
    const part = (key: string) =>
      parts.find((value) => value.type === key)?.value || "";
    if (`${part("hour")}:${part("minute")}` < preferences.dailySummary.time)
      continue;
    const period = `${part("year")}-${part("month")}-${part("day")}`;
    const claimed = await sql.query(
      `insert into notification_digest_deliveries(user_id,period,claimed_at,attempts) values($1,$2,now(),1) on conflict(user_id,period) do update set claimed_at=now(),attempts=notification_digest_deliveries.attempts+1 where notification_digest_deliveries.sent_at is null and notification_digest_deliveries.attempts<8 and notification_digest_deliveries.claimed_at<now()-interval '15 minutes' returning user_id`,
      [row.id, period],
    );
    if (!claimed.length) continue;
    try {
      const summary = await productivitySummary(String(row.id)),
        origin = new URL(
          process.env.NEXT_PUBLIC_APP_URL || "https://weave.corstack.dev",
        ).origin;
      const result = await sendEmail({
        to: String(row.email),
        subject: "Your Weave morning overview",
        html:
          summaryHtml(summary) +
          `<p><a href="${origin.replaceAll('"', "&quot;")}/dashboard">Open dashboard</a></p>`,
      });
      if (!result.success) throw new Error("Digest delivery failed");
      await sql.query(
        "update notification_digest_deliveries set sent_at=now() where user_id=$1 and period=$2",
        [row.id, period],
      );
      sent++;
    } catch {
      failed++;
    }
  }
  return { sent, failed };
}
