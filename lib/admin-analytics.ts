import "server-only";
import { sql } from "./neon";
import { adminSession } from "./admin-ops-access";
export async function getAdminAnalytics(from?: string, to?: string) {
  const session = await adminSession("analytics.read");
  const today = new Date();
  const end =
    to && /^\d{4}-\d{2}-\d{2}$/.test(to)
      ? to
      : today.toISOString().slice(0, 10);
  const start =
    from && /^\d{4}-\d{2}-\d{2}$/.test(from)
      ? from
      : new Date(today.getTime() - 29 * 86400000).toISOString().slice(0, 10);
  if (
    !Number.isFinite(Date.parse(start)) ||
    !Number.isFinite(Date.parse(end)) ||
    start > end ||
    Date.parse(end) - Date.parse(start) > 366 * 86400000
  )
    throw new Error("Choose a valid range of up to one year");
  const args = [start, end, session.timeZone];
  const [
    members,
    marketplace,
    exchanges,
    escrow,
    safety,
    revenue,
    series,
    skills,
    retention,
  ] = await Promise.all([
    sql.query(
      "select count(*) as total,count(*)filter(where is_verified)as verified,count(*)filter(where created_at>=($1::date::timestamp at time zone $3)and created_at<(($2::date+1)::timestamp at time zone $3))as new_members,count(*)filter(where last_active_at>=($1::date::timestamp at time zone $3)and last_active_at<(($2::date+1)::timestamp at time zone $3))as active,count(*)filter(where onboarded)as activated,count(*)filter(where account_status in('deactivated','deletion_pending','deleted'))as inactive from users",
      args,
    ),
    sql.query(
      "select count(*)as requests,(select count(*)from marketplace_applications where created_at>=($1::date::timestamp at time zone $3)and created_at<(($2::date+1)::timestamp at time zone $3))as applications,(select count(*)from marketplace_applications where status='accepted'and created_at>=($1::date::timestamp at time zone $3)and created_at<(($2::date+1)::timestamp at time zone $3))as accepted from marketplace_requests where created_at>=($1::date::timestamp at time zone $3)and created_at<(($2::date+1)::timestamp at time zone $3)",
      args,
    ),
    sql.query(
      "select count(*)as started,count(*)filter(where status='completed')as completed,count(*)filter(where status='cancelled')as cancelled,count(*)filter(where status='disputed')as disputed,count(*)filter(where status not in('completed','cancelled','pending_proposal','negotiating'))as active,count(*)filter(where is_mutual)as mutual,coalesce(avg(skill_hours),0)as average_hours,coalesce(avg(extract(epoch from completed_at-created_at)/86400)filter(where completed_at is not null),0)as average_days,coalesce(sum(requester_escrow_hours+provider_escrow_hours)filter(where status='completed'),0)as hours_exchanged from exchanges where created_at>=($1::date::timestamp at time zone $3)and created_at<(($2::date+1)::timestamp at time zone $3)",
      args,
    ),
    sql.query(
      "select count(*)as created,count(*)filter(where status='released')as released,count(*)filter(where status='disputed')as disputed,coalesce(avg(extract(epoch from updated_at-created_at)/86400)filter(where status in('released','refunded')),0)as duration from escrows where created_at>=($1::date::timestamp at time zone $3)and created_at<(($2::date+1)::timestamp at time zone $3)",
      args,
    ),
    sql.query(
      "select (select count(*)from platform_reports where created_at>=($1::date::timestamp at time zone $3)and created_at<(($2::date+1)::timestamp at time zone $3))as reports,(select count(*)from admin_dispute_cases where created_at>=($1::date::timestamp at time zone $3)and created_at<(($2::date+1)::timestamp at time zone $3))as disputes,(select count(*)from users where account_status='suspended')as suspended,(select count(*)from verification_requests where status='rejected')as rejected,(select count(*)from verification_requests where status='approved')as approved,(select count(*)from(select reported_user_id from platform_reports where status='resolved'and reported_user_id is not null group by reported_user_id having count(*)>1) repeat)as repeat_offenders",
      args,
    ),
    sql.query(
      "with events as(select currency,sum(amount)filter(where event_type='payment')/100.0 as payments,sum(abs(amount))filter(where event_type='refund')/100.0 as refunds from billing_events where occurred_at>=($1::date::timestamp at time zone $3)and occurred_at<(($2::date+1)::timestamp at time zone $3)group by currency), recurring as(select currency,sum(amount/100.0/(case billing_interval when 'annually'then 12 when 'biannually'then 6 when 'quarterly'then 3 else 1 end))filter(where subscription_status in('active','non-renewing')and billing_interval in('monthly','quarterly','biannually','annually'))as mrr,count(*)filter(where subscription_status in('cancelled','expired'))as cancelled,count(*)filter(where subscription_status='active')as active,count(*)filter(where billing_interval is null)as unknown_intervals from billing_accounts group by currency)select coalesce(e.currency,r.currency)as currency,coalesce(payments,0)as payments,coalesce(refunds,0)as refunds,coalesce(mrr,0)as mrr,coalesce(cancelled,0)as cancelled,coalesce(active,0)as active,coalesce(unknown_intervals,0)as unknown_intervals from events e full join recurring r on r.currency=e.currency",
      args,
    ),
    sql.query(
      "with days as(select generate_series($1::date,$2::date,interval '1 day')::date as day)select d.day::text,(select count(*)from users where(created_at at time zone $3)::date=d.day)as members,(select count(*)from exchanges where(created_at at time zone $3)::date=d.day)as exchanges,(select coalesce(sum(requester_escrow_hours+provider_escrow_hours),0)from exchanges where status='completed'and(completed_at at time zone $3)::date=d.day)as hours from days d order by day",
      args,
    ),
    sql.query(
      "select skill,count(*)as requests from marketplace_requests r cross join unnest(r.skills_required)skill where r.created_at>=($1::date::timestamp at time zone $3)and r.created_at<(($2::date+1)::timestamp at time zone $3)group by skill order by requests desc,skill limit 20",
      args,
    ),
    sql.query(
      "select date_trunc('month',created_at)::date::text as cohort,count(*)as members,count(*)filter(where last_active_at>=created_at+interval '30 days')as returned_after_30_days from users where created_at>=($1::date::timestamp at time zone $3)and created_at<(($2::date+1)::timestamp at time zone $3)group by cohort order by cohort",
      args,
    ),
  ]);
  return {
    start,
    end,
    timeZone: session.timeZone,
    members: members[0],
    marketplace: marketplace[0],
    exchanges: exchanges[0],
    escrow: escrow[0],
    safety: safety[0],
    revenue,
    series: series.map((r) => ({
      day: String(r.day),
      members: Number(r.members),
      exchanges: Number(r.exchanges),
      hours: Number(r.hours),
    })),
    skills,
    retention,
  };
}
