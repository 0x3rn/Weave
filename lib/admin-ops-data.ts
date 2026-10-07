import "server-only";
import { sql, iso, payload } from "./neon";
import { adminSession } from "./admin-ops-access";
import {
  AREA_META,
  hasPermission,
  readable,
  type AdminArea,
  type AdminList,
  type AdminRow,
  type AdminDetail,
  type AdminSummary,
} from "./admin-ops-types";
const memberName = (alias: string) =>
  `coalesce(${alias}.full_name,${alias}.username,'Member')`;
const LISTS: Partial<Record<AdminArea, string>> = {
  verification: `select v.id,${memberName("u")} as title,case when v.status='approved' and v.expires_at<=now() then 'expired' else v.status end as status,v.submitted_at as date,jsonb_build_object('Member',${memberName("u")},'Email',u.email,'Type',v.verification_type,'Risk / Flag',v.risk_flag,'Reviewer',${memberName("r")},'Updated',v.updated_at) as cells from verification_requests v join users u on u.id=v.user_id left join users r on r.id=v.reviewer_id`,
  marketplace: `select r.id,r.title,case when r.admin_flag is not null then 'flagged' when r.status='open' and r.expires_at<=now() then 'expired' else coalesce(r.status,'unknown') end as status,r.created_at as date,jsonb_build_object('Requester',${memberName("u")},'Category',r.category,'Skills',array_to_string(r.skills_required,', '),'Skill Hours',r.estimated_hours,'Applications',(select count(*) from marketplace_applications a where a.request_id=r.id),'Expires',r.expires_at) as cells from marketplace_requests r left join users u on u.id=r.requester_id`,
  exchanges: `select e.id,e.title,coalesce(case e.admin_hold when 'pause' then 'paused' when 'freeze' then 'frozen' end,e.status) as status,e.created_at as date,jsonb_build_object('Member A',${memberName("a")},'Member B',${memberName("b")},'Type',case when e.is_mutual then 'Mutual' else 'One-way' end,'Skill Hours',e.requester_escrow_hours+e.provider_escrow_hours,'Escrow',s.status,'Deadline',e.deadline_at,'Health',case when e.status='disputed' then 'Disputed' when e.admin_hold is not null then 'Blocked' when e.status not in('completed','cancelled') and e.deadline_at<now() then 'Overdue' when e.status not in('completed','cancelled') and e.deadline_at<now()+interval '2 days' then 'At Risk' else 'On Track' end)as cells from exchanges e left join users a on a.id=e.requester_id left join users b on b.id=e.provider_id left join escrows s on s.exchange_id=e.id`,
  escrow: `select s.id,coalesce(e.title,s.id)as title,coalesce(case s.admin_hold when 'pause' then 'paused' when 'freeze' then 'frozen' end,s.status)as status,s.created_at as date,jsonb_build_object('Exchange',s.exchange_id,'Participants',${memberName("a")}||' / '||${memberName("b")},'Skill Hours Held',case when s.status in('released','refunded','cancelled')then 0 else coalesce((select sum((p.value->>'skillHoursReserved')::numeric) from jsonb_each(s.participants)p),0)end,'Deposits',coalesce((select sum((p.value->>'securityDepositAmount')::numeric)from jsonb_each(s.participants)p where p.value->>'depositStatus'='received'),0),'Release Condition',case when e.status='in_review' then 'Independent review acceptance' else replace(e.status,'_',' ')end)as cells from escrows s left join exchanges e on e.id=s.exchange_id left join users a on a.id=e.requester_id left join users b on b.id=e.provider_id`,
  "skill-ledger": `select l.id,coalesce(l.description,l.id)as title,coalesce((select x.requested_entry->>'entry_status' from ledger_entry_events x where x.ledger_entry_id=l.id order by x.id desc limit 1),l.entry_status,'unknown')as status,l.occurred_at as date,jsonb_build_object('Member',${memberName("u")},'Exchange',l.exchange_id,'Type',l.entry_type,'Amount',l.amount,'Before',l.balance_before,'After',l.balance_after,'Source',l.source_collection)as cells from ledger_entries l left join users u on u.id=l.user_id`,
  disputes: `select d.exchange_id as id,e.title,d.status,d.created_at as date,jsonb_build_object('Exchange',e.id,'Reporter',${memberName("a")},'Respondent',${memberName("b")},'Reason',coalesce(d.reason,s.dispute->>'reason'),'Hours',e.requester_escrow_hours+e.provider_escrow_hours,'Priority',d.priority,'Assigned To',${memberName("r")})as cells from admin_dispute_cases d join exchanges e on e.id=d.exchange_id left join escrows s on s.exchange_id=e.id left join users a on a.id=coalesce(s.dispute->>'openedBy',e.requester_id) left join users b on b.id=case when s.dispute->>'openedBy'=e.provider_id then e.requester_id else e.provider_id end left join users r on r.id=d.assigned_to`,
  reports: `select r.id,r.category||' report' as title,r.status,r.created_at as date,jsonb_build_object('Reported Item',r.resource_type||': '||r.resource_id,'Reporter',${memberName("u")},'Category',r.category,'Priority',r.priority,'Assigned To',${memberName("a")})as cells from platform_reports r left join users u on u.id=r.reporter_id left join users a on a.id=r.assigned_to`,
  subscriptions: `select b.user_id as id,${memberName("u")}as title,b.subscription_status as status,u.created_at as date,jsonb_build_object('Member',${memberName("u")},'Plan',coalesce(u.payload->>'subscriptionTier','free'),'Amount',coalesce(b.currency,'')||' '||coalesce((b.amount/100.0)::text,'0'),'Renewal',b.renewal_at,'Payment Status',b.subscription_status,'Provider',b.provider)as cells from billing_accounts b join users u on u.id=b.user_id`,
  cms: `select d.id,d.title,case when d.status='scheduled' and d.publish_at<=now() then 'published' else d.status end as status,d.created_at as date,jsonb_build_object('Type',d.kind,'Author',${memberName("u")},'Placement',d.placement,'Slug',d.slug,'Updated',d.updated_at)as cells from cms_documents d left join users u on u.id=d.author_id where d.kind<>'post'`,
  blog: `select d.id,d.title,case when d.status='scheduled' and d.publish_at<=now() then 'published' else d.status end as status,d.created_at as date,jsonb_build_object('Author',${memberName("u")},'Category',d.category,'Slug',d.slug,'Published',d.publish_at,'Updated',d.updated_at,'Views',d.views)as cells from cms_documents d left join users u on u.id=d.author_id where d.kind='post'`,
  support: `select t.id,t.subject as title,t.status,t.created_at as date,jsonb_build_object('Member',${memberName("u")},'Category',t.category,'Priority',t.priority,'Assigned To',${memberName("a")},'Updated',t.updated_at)as cells from support_tickets t join users u on u.id=t.user_id left join users a on a.id=t.assigned_to`,
  "audit-logs": `select e.id::text as id,e.description as title,e.event_type as status,e.occurred_at as date,jsonb_build_object('Admin',coalesce(u.full_name,'System / historical'),'Action',e.event_type,'Resource',coalesce(e.resource_type,'legacy')||': '||e.resource_id,'Reason',e.reason)as cells from admin_audit_events e left join users u on u.id=e.actor_id`,
};
export type AdminFilters = {
  q?: string;
  status?: string;
  page?: string;
  from?: string;
  to?: string;
  sort?: string;
  priority?: string;
  category?: string;
};
export async function getAdminList(
  area: AdminArea,
  filters: AdminFilters = {},
): Promise<AdminList> {
  const session = await adminSession(AREA_META[area].permission);
  const base = LISTS[area];
  if (!base) throw new Error("Use the dedicated dashboard for this section");
  const page = Math.max(
    1,
    Math.min(100000, Number.parseInt(filters.page || "1", 10) || 1),
  );
  const day = (v: string | undefined) =>
    v && /^\d{4}-\d{2}-\d{2}$/.test(v) && Number.isFinite(new Date(v).getTime())
      ? v
      : null;
  const status =
    filters.status && AREA_META[area].statuses.includes(filters.status)
      ? filters.status
      : null;
  const ledgerType =
    status && area === "skill-ledger"
      ? {
          earned: "Earned",
          reserved: "Reserved",
          released: "Released",
          adjusted: "Admin",
          reversed: "Reversal",
        }[status] || status
      : null;
  const params = [
    (filters.q || "").slice(0, 200),
    area === "skill-ledger" ? null : status,
    day(filters.from),
    day(filters.to),
    session.timeZone,
    ledgerType,
    (filters.priority || "").slice(0, 30),
    (filters.category || "").slice(0, 80),
  ];
  const filter = `($1::text='' or title ilike '%'||$1||'%' or id ilike '%'||$1||'%' or cells::text ilike '%'||$1||'%') and ($2::text is null or status=$2) and ($3::date is null or date>=($3::date::timestamp at time zone $5)) and ($4::date is null or date<(($4::date+1)::timestamp at time zone $5)) and ($6::text is null or cells->>'Type' ilike '%'||$6||'%') and ($7::text='' or cells->>'Priority'=$7) and ($8::text='' or cells->>'Category'=$8)`;
  const order = filters.sort === "oldest" ? "asc" : "desc";
  const [rows, count, groups] = await Promise.all([
    sql.query(
      `with records as(${base}) select * from records where ${filter} order by date ${order} nulls last,id ${order} limit 50 offset $9::integer`,
      [...params, (page - 1) * 50],
    ),
    sql.query(
      `with records as(${base})select count(*)::int as count from records where ${filter}`,
      params,
    ),
    sql.query(
      `with records as(${base})select status,count(*)::int as count from records group by status`,
    ),
  ]);
  const mapped: AdminRow[] = rows.map((row) => ({
    id: String(row.id),
    title: String(row.title || row.id),
    status: String(row.status || "unknown"),
    date: iso(row.date),
    cells: Object.fromEntries(
      Object.entries(payload<Record<string, unknown>>(row.cells)).map(
        ([key, value]) => [
          key,
          value === null || value === undefined ? "—" : String(value),
        ],
      ),
    ),
  }));
  const counters = new Map(
    groups.map((row) => [String(row.status), Number(row.count)]),
  );
  const labels: Partial<Record<AdminArea, string[]>> = {
    verification: [
      "pending",
      "approved",
      "rejected",
      "flagged",
      "needs_information",
    ],
    marketplace: ["open", "pending_review", "flagged", "completed", "hidden"],
    exchanges: [
      "in_progress",
      "pending_proposal",
      "revision_requested",
      "in_review",
      "completed",
      "disputed",
      "cancelled",
    ],
    escrow: ["locked", "awaiting_approval", "released", "disputed", "refunded"],
    disputes: [
      "new",
      "awaiting_response",
      "under_review",
      "escalated",
      "resolved",
    ],
    reports: ["open", "under_review", "escalated", "resolved"],
    subscriptions: ["active", "non-renewing", "attention", "failed"],
    support: [
      "open",
      "awaiting_user",
      "awaiting_admin",
      "resolved",
      "escalated",
    ],
    cms: ["published", "draft", "scheduled"],
    blog: ["published", "draft", "scheduled"],
  };
  const summary: AdminSummary[] = (labels[area] || []).map((key) => ({
    label: readable(key),
    value: counters.get(key) || 0,
  }));
  if (area === "skill-ledger" || area === "escrow") {
    const [totals] = await sql.query(
      "select (select coalesce(sum(skill_hours),0)from users where coalesce(account_status,'active')<>'deleted')as available,(select coalesce(sum((p.value->>'skillHoursReserved')::numeric),0)from escrows s cross join lateral jsonb_each(s.participants)p where s.status not in('released','refunded','cancelled'))as held,(select coalesce(sum(amount),0)from ledger_entries where entry_type='Earned')as earned,(select count(*)from ledger_entries where source_collection in('admin_operations','skill_ledger'))as adjustments",
    );
    summary.unshift({ label: "Skill Hours Held", value: Number(totals.held) });
    if (area === "skill-ledger")
      summary.push(
        { label: "Hours Available", value: Number(totals.available) },
        {
          label: "Total Skill Hours",
          value: Number(totals.available) + Number(totals.held),
        },
        { label: "Hours Earned", value: Number(totals.earned) },
        { label: "Manual Adjustments", value: Number(totals.adjustments) },
      );
  }
  if (area === "subscriptions") {
    const revenues = await sql.query(
      "select currency,sum(amount/100.0/(case billing_interval when 'annually' then 12 when 'biannually' then 6 when 'quarterly' then 3 else 1 end)) as mrr from billing_accounts where subscription_status in('active','non-renewing') and billing_interval in('monthly','quarterly','biannually','annually') group by currency",
    );
    for (const row of revenues)
      summary.push({
        label: `MRR (${row.currency || "unspecified"})`,
        value: Number(row.mrr).toFixed(2),
      });
  }
  return {
    area,
    rows: mapped,
    total: Number(count[0]?.count || 0),
    page,
    pageSize: 50,
    summary,
    canWrite: hasPermission(session.permissions, AREA_META[area].write),
    timeZone: session.timeZone,
    permissions: session.permissions,
  };
}
const fields = (row: Record<string, unknown>, keys: Record<string, string>) =>
  Object.entries(keys).map(([key, label]) => ({
    label,
    value:
      row[key] === null || row[key] === undefined
        ? "—"
        : typeof row[key] === "object"
          ? JSON.stringify(row[key], null, 2)
          : String(row[key]),
  }));
export async function getAdminDetail(
  area: AdminArea,
  id: string,
): Promise<AdminDetail> {
  const session = await adminSession(AREA_META[area].permission);
  if (typeof id !== "string" || id.length > 200)
    throw new Error("Invalid resource");
  let row: Record<string, unknown> | undefined;
  const sections: AdminDetail["sections"] = [],
    related: AdminDetail["related"] = [];
  let actions: string[] = [];
  let settlement: AdminDetail["settlement"];
  let editor: AdminDetail["editor"];
  const writable = hasPermission(session.permissions, AREA_META[area].write);
  if (area === "verification") {
    [row] = await sql.query(
      "select v.id,v.user_id,v.verification_type,v.status,v.statement,v.risk_flag,v.reason,v.submitted_at,v.updated_at,v.expires_at,v.version,u.full_name,u.username,u.email,u.created_at,u.account_status,u.trust_score,u.skill_hours,(select count(*)from exchanges e where u.id in(e.requester_id,e.provider_id))as exchange_count,(select count(*)from jsonb_array_elements(v.documents))as document_count from verification_requests v join users u on u.id=v.user_id where v.id=$1",
      [id],
    );
    if (row) {
      sections.push(
        {
          title: "Member",
          fields: fields(row, {
            full_name: "Name",
            username: "Username",
            email: "Email",
            created_at: "Member since",
            account_status: "Account status",
            trust_score: "Trust Score",
            skill_hours: "Skill Hours",
            exchange_count: "Exchanges",
          }),
        },
        {
          title: "Verification information",
          fields: fields(row, {
            verification_type: "Type",
            status: "Status",
            submitted_at: "Submitted",
            expires_at: "Expires",
            risk_flag: "Risk / Flag",
            document_count: "Private documents",
          }),
          text: String(row.statement || ""),
        },
      );
      actions = [
        "review",
        "approve",
        "reject",
        "request_information",
        "flag",
        "suspend",
        "note",
      ];
    }
  } else if (area === "marketplace") {
    [row] = await sql.query(
      "select r.id,r.title,r.description,r.requester_id,r.category,r.skills_required,r.deliverables,r.estimated_hours,r.exchange_type,r.status,r.created_at,r.expires_at,r.timeline,r.is_featured,r.admin_flag,r.payload->'skillsOffered'as skills_offered,u.full_name from marketplace_requests r left join users u on u.id=r.requester_id where r.id=$1",
      [id],
    );
    if (row) {
      const [apps, counts] = await Promise.all([
        sql.query(
          "select coalesce(u.full_name,u.username,'Member')as Applicant,a.estimated_hours as Hours,a.payload->>'offeredSkill'as Skill,a.status as Status,a.created_at as Submitted,u.trust_score as Trust from marketplace_applications a left join users u on u.id=a.applicant_id where a.request_id=$1 order by a.created_at desc",
          [id],
        ),
        sql.query(
          "select(select count(*)from saved_items where target_id=$1)as saves,(select count(*)from platform_reports where resource_type='marketplace'and resource_id=$1)as reports,(select count(*)from exchanges where marketplace_request_id=$1)as exchanges",
          [id],
        ),
      ]);
      sections.push(
        {
          title: "Request overview",
          fields: fields(row, {
            full_name: "Requester",
            category: "Category",
            skills_required: "Skills required",
            skills_offered: "Skills offered",
            estimated_hours: "Skill Hours",
            exchange_type: "Exchange type",
            timeline: "Timeline",
            created_at: "Created",
            expires_at: "Expires",
            status: "Status",
            is_featured: "Featured",
            admin_flag: "Flag",
          }),
          text: String(row.description || ""),
        },
        {
          title: "Activity",
          fields: fields(counts[0], {
            saves: "Saves",
            reports: "Reports",
            exchanges: "Exchanges",
          }),
        },
        { title: "Applications", rows: apps.map(stringRecord) },
      );
      actions = [
        "approve",
        "hide",
        "pause",
        "remove",
        "restore",
        "feature",
        "flag",
        "clear_flag",
        "note",
      ];
    }
  } else if (["exchanges", "escrow", "disputes"].includes(area)) {
    [row] = await sql.query(
      "select e.id,e.title,e.status,e.requester_id,e.provider_id,e.is_mutual,e.skill_hours,e.requester_escrow_hours,e.provider_escrow_hours,e.created_at,e.deadline_at,e.admin_hold,e.review_round,s.id as escrow_id,s.status as escrow_status,s.admin_hold as escrow_hold,s.participants,s.dispute,a.full_name as requester_name,b.full_name as provider_name from exchanges e left join escrows s on s.exchange_id=e.id left join users a on a.id=e.requester_id left join users b on b.id=e.provider_id where " +
        (area === "escrow" ? "s.id" : "e.id") +
        "=$1",
      [id],
    );
    if (row) {
      const eid = String(row.id);
      const [contract, deliveries, reviews, milestones] = await Promise.all([
        sql.query(
          "select requester_deliverables,provider_deliverables,requester_pays_hours,provider_pays_hours,deadline_at,terms,contract_fingerprint,created_at from exchange_contracts where exchange_id=$1",
          [eid],
        ),
        sql.query(
          "select id,submitted_by,version,comments,submitted_at,is_current,review_round,jsonb_array_length(files) as file_count from exchange_deliveries where exchange_id=$1 order by submitted_at desc",
          [eid],
        ),
        sql.query(
          "select reviewer_id,decision,feedback,created_at,revealed_at from exchange_review_decisions where exchange_id=$1 order by created_at",
          [eid],
        ),
        sql.query(
          "select title,status from exchange_milestones where exchange_id=$1 order by created_at",
          [eid],
        ),
      ]);
      sections.push(
        {
          title: "Overview",
          fields: fields(row, {
            id: "Exchange ID",
            requester_name: "Member A",
            provider_name: "Member B",
            status: "Status",
            created_at: "Created",
            deadline_at: "Deadline",
            admin_hold: "Administrative hold",
            escrow_status: "Escrow status",
            escrow_hold: "Escrow hold",
          }),
        },
        {
          title: "Immutable agreed contract",
          fields: contract[0]
            ? fields(contract[0], {
                requester_deliverables: "Member A commitments",
                provider_deliverables: "Member B commitments",
                requester_pays_hours: "Member A pays Hours",
                provider_pays_hours: "Member B pays Hours",
                deadline_at: "Agreed deadline",
                terms: "Agreed terms",
                contract_fingerprint: "Contract fingerprint",
              })
            : [{ label: "Contract", value: "No immutable contract recorded" }],
        },
        { title: "Deliverables", rows: deliveries.map(stringRecord) },
        {
          title: "Reviews",
          rows: reviews.map((r) =>
            stringRecord({
              ...r,
              decision: r.revealed_at ? r.decision : "Sealed",
              feedback: r.revealed_at ? r.feedback : "Sealed",
            }),
          ),
        },
        { title: "Milestones", rows: milestones.map(stringRecord) },
      );
      const participants = payload<Record<string, Record<string, unknown>>>(
        row.participants,
      );
      const a = participants[String(row.requester_id)] || {},
        b = participants[String(row.provider_id)] || {};
      settlement = {
        requester: String(row.requester_name || "Member A"),
        provider: String(row.provider_name || "Member B"),
        requesterId: String(row.requester_id),
        providerId: String(row.provider_id),
        requesterHeld: Number(a.skillHoursReserved || 0),
        providerHeld: Number(b.skillHoursReserved || 0),
        cashDeposits: Object.values(participants).some(
          (p) =>
            Number(p.securityDepositAmount || 0) > 0 &&
            p.depositStatus === "received",
        ),
      };
      sections.push(
        {
          title: "Escrow participants",
          rows: Object.values(participants).map(stringRecord),
        },
        {
          title: "Release conditions",
          fields: [
            {
              label: "Both parties approved contract",
              value: contract.length ? "Contract recorded" : "Not recorded",
            },
            {
              label: "Deliverables submitted",
              value: String(deliveries.filter((d) => d.is_current).length),
            },
            {
              label: "Independent reviews accepted",
              value: String(
                reviews.filter((r) => r.decision === "accept" && r.revealed_at)
                  .length,
              ),
            },
            {
              label: "No active dispute",
              value: row.status === "disputed" ? "No" : "Yes",
            },
            {
              label: "Cash deposits",
              value: settlement.cashDeposits
                ? "Provider-confirmed settlement required"
                : "No cash deposit held",
            },
          ],
        },
      );
      if (area === "disputes") {
        const [c] = await sql.query(
          "select status,priority,assigned_to,created_at,updated_at from admin_dispute_cases where exchange_id=$1",
          [eid],
        );
        editor = c;
        row.status = c?.status || row.status;
        sections.push({
          title: "Case information",
          fields: fields(
            { ...payload<Record<string, unknown>>(row.dispute), ...c },
            {
              reason: "Reason",
              details: "Member statement",
              openedBy: "Reporter",
              openedAt: "Opened",
              resolutionNotes: "Resolution",
              priority: "Priority",
              assigned_to: "Assigned admin",
            },
          ),
        });
      }
      related.push({ label: "Exchange workspace", href: "/exchanges/" + eid });
      if (row.escrow_id)
        related.push({
          label: "Escrow",
          href: "/admin/escrow?id=" + encodeURIComponent(String(row.escrow_id)),
        });
      actions =
        area === "escrow"
          ? ["pause", "freeze", "resume", "release", "refund", "note"]
          : area === "disputes"
            ? ["triage", "resolve", "note"]
            : [
                "pause",
                "freeze",
                "resume",
                "extend",
                "cancel",
                "open_dispute",
                "note",
              ];
    }
  } else if (area === "skill-ledger") {
    [row] = await sql.query(
      "select l.id,l.user_id,l.exchange_id,l.entry_type,l.entry_status,l.amount,l.balance_before,l.balance_after,l.description,l.notes,l.source_collection,l.occurred_at,l.related_user_id,l.payload->>'reversalOf'as reversal_of,u.full_name from ledger_entries l left join users u on u.id=l.user_id where l.id=$1",
      [id],
    );
    if (row) {
      sections.push({
        title: "Transaction",
        fields: fields(row, {
          id: "Transaction ID",
          full_name: "Member",
          exchange_id: "Exchange",
          entry_type: "Type",
          amount: "Amount",
          balance_before: "Before balance",
          balance_after: "After balance",
          description: "Reason",
          notes: "Internal note",
          source_collection: "Source",
          occurred_at: "Timestamp",
          related_user_id: "Created by / related member",
          reversal_of: "Related transaction",
        }),
      });
      actions = ["reverse", "note"];
      if (row.exchange_id)
        related.push({
          label: "Exchange",
          href:
            "/admin/exchanges?id=" +
            encodeURIComponent(String(row.exchange_id)),
        });
    }
  } else if (area === "reports") {
    [row] = await sql.query(
      "select r.*,u.full_name as reporter_name from platform_reports r left join users u on u.id=r.reporter_id where r.id=$1",
      [id],
    );
    if (row) {
      editor = { priority: row.priority, assigned_to: row.assigned_to };
      sections.push({
        title: "Report",
        fields: fields(row, {
          reporter_name: "Reporter",
          resource_type: "Type",
          resource_id: "Reported item",
          reported_user_id: "Reported member",
          category: "Category",
          priority: "Priority",
          status: "Status",
          assigned_to: "Assigned admin",
          created_at: "Submitted",
          resolution: "Resolution",
        }),
        text: String(row.description || ""),
      });
      const type = String(row.resource_type);
      const routes: Record<string, string> = {
        marketplace: "marketplace",
        exchange: "exchanges",
        content: "cms",
      };
      if (routes[type])
        related.push({
          label: "Reported resource",
          href:
            "/admin/" +
            routes[type] +
            "?id=" +
            encodeURIComponent(String(row.resource_id)),
        });
      if (type === "message")
        sections.push({
          title: "Message evidence",
          text: "Message context is available through the logged evidence access control when platform policy permits.",
        });
      actions = [
        "triage",
        "dismiss",
        "resolve",
        "warn",
        "hide",
        "remove",
        "restrict",
        "suspend",
        "create_dispute",
        "note",
      ];
    }
  } else if (area === "support") {
    [row] = await sql.query(
      "select t.*,u.full_name,u.email,u.account_status,u.is_verified,u.trust_score,u.skill_hours,(select count(*)from exchanges e where u.id in(e.requester_id,e.provider_id)and e.status not in('completed','cancelled'))as active_exchanges,(select count(*)from admin_dispute_cases d join exchanges e on e.id=d.exchange_id where u.id in(e.requester_id,e.provider_id))as disputes,(select subscription_status from billing_accounts where user_id=u.id)as subscription,(select count(*)from support_tickets x where x.user_id=u.id)as ticket_count from support_tickets t join users u on u.id=t.user_id where t.id=$1",
      [id],
    );
    if (row) {
      sections.push(
        {
          title: "Member context",
          fields: fields(row, {
            full_name: "Name",
            email: "Email",
            account_status: "Account status",
            is_verified: "Verified",
            trust_score: "Trust Score",
            skill_hours: "Skill Hours",
            active_exchanges: "Active exchanges",
            disputes: "Previous disputes",
            subscription: "Subscription",
            ticket_count: "Previous tickets",
          }),
        },
        {
          title: "Ticket",
          fields: fields(row, {
            category: "Category",
            priority: "Priority",
            status: "Status",
            assigned_to: "Assigned admin",
            related_type: "Related record type",
            related_id: "Related record ID",
          }),
        },
      );
      actions = ["triage", "reply", "note"];
    }
  } else if (area === "subscriptions") {
    [row] = await sql.query(
      "select b.user_id as id,b.provider,b.subscription_status,b.renewal_at,b.amount,b.currency,b.updated_at,b.payment_method->>'brand'as brand,b.payment_method->>'last4'as last4,u.full_name,u.email,u.created_at from billing_accounts b join users u on u.id=b.user_id where b.user_id=$1",
      [id],
    );
    if (row) {
      const events = await sql.query(
        "select id,event_type,description,amount,currency,occurred_at from billing_events where user_id=$1 order by occurred_at desc",
        [id],
      );
      sections.push(
        {
          title: "Membership",
          fields: fields(row, {
            full_name: "Member",
            email: "Email",
            subscription_status: "Provider status",
            provider: "Provider",
            created_at: "Member since",
            renewal_at: "Renewal",
            amount: "Amount (minor units)",
            currency: "Currency",
            brand: "Card brand",
            last4: "Last 4 digits",
          }),
        },
        { title: "Billing history", rows: events.map(stringRecord) },
      );
      for (const event of events.slice(0, 20))
        related.push({
          label: "Download receipt " + String(event.id),
          href: "/api/admin/invoice?id=" + encodeURIComponent(String(event.id)),
        });
      actions = ["sync", "cancel", "reactivate", "refund", "note"];
    }
  } else if (area === "cms" || area === "blog") {
    [row] = await sql.query(
      "select * from cms_documents where id=$1 and " +
        (area === "blog" ? "kind='post'" : "kind<>'post'"),
      [id],
    );
    if (row) {
      editor = {
        ...row,
        publish_at: iso(row.publish_at),
        created_at: iso(row.created_at),
        updated_at: iso(row.updated_at),
      };
      sections.push({ title: "Content", text: String(row.content || "") });
      actions = ["save"];
    }
  } else if (area === "audit-logs") {
    [row] = await sql.query(
      "select id,description,event_type,resource_type,resource_id,before_state,after_state,reason,request_context,occurred_at,actor_id from admin_audit_events where id=$1::bigint",
      [id],
    );
    if (row)
      sections.push({
        title: "Audit record",
        fields: fields(row, {
          actor_id: "Administrator",
          event_type: "Action",
          resource_type: "Resource",
          resource_id: "Resource ID",
          reason: "Reason",
          before_state: "Before",
          after_state: "After",
          occurred_at: "Timestamp",
          request_context: "Request metadata",
        }),
      });
  }
  if (!row) throw new Error("Resource not found");
  if (area === "support" && row)
    editor = { priority: row.priority, assigned_to: row.assigned_to };
  const history = await getAdminHistory(area, id);
  return {
    id,
    area,
    title: String(row.title || row.subject || row.full_name || id),
    status: String(
      row.status || row.subscription_status || row.event_type || "record",
    ),
    sections,
    history,
    actions: writable ? actions : [],
    related,
    settlement,
    editor,
    version: Number(row.version) || undefined,
  };
}
function stringRecord(row: Record<string, unknown>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(row).map(([key, value]) => [
      readable(key),
      value === null || value === undefined
        ? "—"
        : typeof value === "object"
          ? JSON.stringify(value)
          : String(value),
    ]),
  );
}
export async function getAdminHistory(
  area: AdminArea,
  id: string,
  before?: { date: string; id: string },
) {
  const session = await adminSession(AREA_META[area].permission);
  const internal = hasPermission(session.permissions, AREA_META[area].write);
  const rows = await sql.query(
    "with events as(select 'case-'||c.id as id,c.event_type as action,c.message,c.actor_id,c.is_internal,c.attachments,c.created_at as date from admin_case_events c where c.resource_type=$1 and c.resource_id=$2 and(not c.is_internal or $3::boolean) union all select 'exchange-'||a.id,a.event_type,a.description,a.actor_id,false,'[]'::jsonb,a.occurred_at from exchange_activity a where $1 in('exchanges','disputes')and a.exchange_id=$2)select e.*,coalesce(u.full_name,'System / member')as actor from events e left join users u on u.id=e.actor_id where($4::timestamptz is null or(e.date,e.id)<($4::timestamptz,$5::text))order by e.date desc,e.id desc limit 50",
    [area, id, internal, before?.date || null, before?.id || null],
  );
  return rows.map((row) => ({
    id: String(row.id),
    action: String(row.action),
    message: String(row.message || ""),
    actor: String(row.actor),
    date: iso(row.date),
    internal: row.is_internal === true,
    attachments:
      area === "support" && Array.isArray(row.attachments)
        ? row.attachments.map(
            (doc: Record<string, unknown>, index: number) => ({
              name: String(doc.name || "Attachment"),
              href:
                "/api/cases/attachment?id=" +
                encodeURIComponent(id) +
                "&event=" +
                encodeURIComponent(String(row.id).replace("case-", "")) +
                "&index=" +
                index,
            }),
          )
        : [],
  }));
}
