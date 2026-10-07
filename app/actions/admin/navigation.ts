"use server";
import { sql, iso } from "@/lib/neon";
import { adminSession } from "@/lib/admin-ops-access";
import { hasPermission } from "@/lib/admin-ops-types";
const sources = [
  {
    p: "verification.read",
    area: "verification",
    table: "verification_requests",
    title: "coalesce(u.full_name,'Member')||' verification'",
    join: "left join users u on u.id=r.user_id",
    id: "r.id",
    date: "r.submitted_at",
    alert: "r.status in('pending','flagged','needs_information')",
  },
  {
    p: "marketplace.read",
    area: "marketplace",
    table: "marketplace_requests",
    title: "r.title",
    join: "",
    id: "r.id",
    date: "r.created_at",
    alert: "r.status='pending_review' or r.admin_flag is not null",
  },
  {
    p: "exchanges.read",
    area: "exchanges",
    table: "exchanges",
    title: "r.title",
    join: "",
    id: "r.id",
    date: "r.created_at",
    alert:
      "r.status not in('completed','cancelled')and(r.deadline_at<now()or r.admin_hold is not null)",
  },
  {
    p: "escrow.read",
    area: "escrow",
    table: "escrows",
    title: "'Escrow '||r.id",
    join: "",
    id: "r.id",
    date: "r.created_at",
    alert: "r.status='disputed' or r.admin_hold is not null",
  },
  {
    p: "ledger.read",
    area: "skill-ledger",
    table: "ledger_entries",
    title: "r.description",
    join: "",
    id: "r.id",
    date: "r.occurred_at",
    alert: "false",
  },
  {
    p: "disputes.read",
    area: "disputes",
    table: "admin_dispute_cases",
    title: "'Dispute '||r.exchange_id",
    join: "",
    id: "r.exchange_id",
    date: "r.created_at",
    alert: "r.status<>'resolved'",
  },
  {
    p: "reports.read",
    area: "reports",
    table: "platform_reports",
    title: "r.category||' report'",
    join: "",
    id: "r.id",
    date: "r.created_at",
    alert: "r.status in('open','escalated')",
  },
  {
    p: "support.read",
    area: "support",
    table: "support_tickets",
    title: "r.subject",
    join: "",
    id: "r.id",
    date: "r.created_at",
    alert: "r.status in('open','awaiting_admin','escalated')",
  },
  {
    p: "subscriptions.read",
    area: "subscriptions",
    table: "billing_accounts",
    title: "'Subscription: '||coalesce(u.full_name,u.email,'Member')",
    join: "join users u on u.id=r.user_id",
    id: "r.user_id",
    date: "r.updated_at",
    alert: "r.subscription_status in('attention','failed')",
  },
  {
    p: "cms.read",
    area: "cms",
    table: "cms_documents",
    title: "r.title",
    join: "",
    id: "r.id",
    date: "r.created_at",
    alert: "false",
  },
  {
    p: "blog.read",
    area: "blog",
    table: "cms_documents",
    title: "r.title",
    join: "",
    id: "r.id",
    date: "r.created_at",
    alert: "false",
  },
];
function union(permissions: string[], alerts: boolean) {
  return sources
    .filter((s) => hasPermission(permissions, s.p))
    .map(
      (s) =>
        `select '${s.area}' as area,${s.id} as id,${s.title} as title,${s.date} as date from ${s.table} r ${s.join} where ${alerts ? "(" + s.alert + ")" : "true"} ${s.area === "cms" ? "and r.kind<>'post'" : s.area === "blog" ? "and r.kind='post'" : ""}`,
    )
    .join(" union all ");
}
export async function searchAdmin(q: string) {
  const session = await adminSession();
  if (typeof q !== "string" || q.trim().length < 2) return [];
  const base = union(session.permissions, false);
  if (!base) return [];
  const rows = await sql.query(
    `with records as(${base}) select * from records where title ilike '%'||$1||'%' or id ilike '%'||$1||'%' order by date desc nulls last limit 25`,
    [q.trim().slice(0, 200)],
  );
  const result = rows.map((r) => ({
    id: String(r.id),
    title: String(r.title),
    area: String(r.area),
    href:
      "/admin/" + String(r.area) + "?id=" + encodeURIComponent(String(r.id)),
  }));
  if (
    ["verification.read", "support.read", "legacy.manage"].some((p) =>
      hasPermission(session.permissions, p),
    )
  ) {
    const members = await sql.query(
      "select id,coalesce(full_name,username,email,'Member')as name from users where coalesce(full_name,'')ilike '%'||$1||'%'or coalesce(email,'')ilike '%'||$1||'%'or id=$1 limit 10",
      [q.slice(0, 200)],
    );
    result.push(
      ...members.map((r) => ({
        id: String(r.id),
        title: String(r.name),
        area: "Members",
        href: "/admin/members/" + encodeURIComponent(String(r.id)),
      })),
    );
  }
  return result;
}
export async function adminAlerts() {
  const session = await adminSession();
  const base = union(session.permissions, true);
  if (!base) return [];
  const rows = await sql.query(
    `with records as(${base}) select r.*,a.read_at from records r left join admin_alert_reads a on a.user_id=$1 and a.alert_id=r.area||'/'||r.id order by a.read_at nulls first,r.date desc nulls last limit 50`,
    [session.uid],
  );
  return rows.map((r) => ({
    id: String(r.area) + "/" + String(r.id),
    title: String(r.title),
    href:
      "/admin/" + String(r.area) + "?id=" + encodeURIComponent(String(r.id)),
    read: !!r.read_at,
    date: iso(r.date),
  }));
}
export async function markAdminAlertRead(id: string) {
  const session = await adminSession();
  const visible = await adminAlerts();
  if (!visible.some((row) => row.id === id))
    throw new Error("Alert unavailable");
  await sql.query(
    "insert into admin_alert_reads(user_id,alert_id)values($1,$2)on conflict do nothing",
    [session.uid, id],
  );
}
