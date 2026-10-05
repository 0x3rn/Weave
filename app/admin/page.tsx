import Link from "next/link";
import { requireAdminUser } from "@/app/actions/admin/auth";
import { getUserById } from "@/lib/users";
import { sql, iso } from "@/lib/neon";
import { adminDate, adminTimeZone } from "@/lib/admin-summary";
export const metadata = { title: "Overview Dashboard" };
export const dynamic = "force-dynamic";
export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ activity?: string; before?: string }>;
}) {
  const actor = await requireAdminUser();
  const admin = await getUserById(actor),
    params = await searchParams;
  const timeZone = adminTimeZone(admin?.timeZone || "UTC"),
    all = params.activity === "all";
  const cursor = /^\d{1,18}$/.test(params.before || "") ? params.before : null;
  const [counts, invites, events] = await Promise.all([
    sql.query(
      "select (select count(*)::int from users where coalesce(account_status,'active')<>'deleted') as members, (select count(*)::int from exchanges where lower(status) not in('completed','cancelled')) as exchanges, (select count(*)::int from marketplace_requests where status='open' and (expires_at is null or expires_at>now())) as requests, (select count(*)::int from escrows where status='disputed') as disputes",
    ),
    sql.query(
      "select count(*)::int as total,count(*) filter(where status='approved')::int as approved,count(*) filter(where coalesce(status,'pending')='pending')::int as pending from invite_applications",
    ),
    sql.query(
      "select e.*,coalesce(a.full_name,u.full_name) as resource_name from admin_audit_events e left join invite_applications a on a.id=e.resource_id left join users u on u.id=e.resource_id where ($1::bigint is null or (e.occurred_at,e.id)<(select occurred_at,id from admin_audit_events where id=$1::bigint)) order by e.occurred_at desc,e.id desc limit $2::integer",
      [cursor, all ? 51 : 6],
    ),
  ]);
  const metrics = counts[0],
    invite = invites[0],
    pageSize = all ? 50 : 5,
    visible = events.slice(0, pageSize);
  const cards = [
    ["Members", metrics.members],
    ["Active exchanges", metrics.exchanges],
    ["Open marketplace requests", metrics.requests],
    ["Disputed escrows", metrics.disputes],
    ["Invite applications", invite.total],
    ["Pending invites", invite.pending],
    ["Approved applications", invite.approved],
  ];
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-heading">Overview</h1>
        <p className="text-muted mt-2">
          Account, collaboration, and invite activity across Weave.
        </p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(([label, value]) => (
          <div
            key={String(label)}
            className="bg-surface border border-border rounded-[var(--radius-card)] p-5"
          >
            <h2 className="text-sm text-muted">{String(label)}</h2>
            <p className="text-3xl font-bold text-heading mt-3">
              {Number(value).toLocaleString()}
            </p>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-4">
        <Link href="/admin/invites" className="text-primary">
          Review invite requests
        </Link>
        <Link href="/admin/users" className="text-primary">
          Manage members
        </Link>
        <a href="/api/admin/export" className="text-primary">
          Export applications CSV
        </a>
      </div>
      <section className="bg-surface border border-border rounded-[var(--radius-card)] p-6">
        <h2 className="text-lg font-bold mb-4">
          {all ? "Activity history" : "Recent activity"}
        </h2>
        <p className="text-xs text-muted mb-4">
          Times shown in {timeZone}. Existing submission and approval records
          are included; other changes are recorded from this update onward.
        </p>
        {!visible.length && (
          <p className="text-muted">No activity recorded yet.</p>
        )}
        <ol className="space-y-4">
          {visible.map((event) => (
            <li key={String(event.id)} className="border-b border-border pb-4">
              <p>
                {String(event.description)}
                {event.resource_name ? " — " + String(event.resource_name) : ""}
              </p>
              <time
                className="text-xs text-muted"
                dateTime={iso(event.occurred_at)}
              >
                {adminDate(iso(event.occurred_at), timeZone)}{" "}
                {new Date(iso(event.occurred_at)).toLocaleTimeString("en-GB", {
                  timeZone,
                })}
              </time>
            </li>
          ))}
        </ol>
        {!all ? (
          <Link
            href="/admin?activity=all"
            className="inline-block mt-4 text-primary"
          >
            View all activity →
          </Link>
        ) : (
          <div className="flex gap-4 mt-4">
            <Link href="/admin" className="text-primary">
              Back to overview
            </Link>
            {cursor && (
              <Link href="/admin?activity=all" className="text-primary">
                Latest activity
              </Link>
            )}
            {events.length > pageSize && (
              <Link
                href={"/admin?activity=all&before=" + visible.at(-1)!.id}
                className="text-primary"
              >
                Older activity →
              </Link>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
