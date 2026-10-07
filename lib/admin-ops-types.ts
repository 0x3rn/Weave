export const ADMIN_AREAS = [
  "verification",
  "marketplace",
  "exchanges",
  "escrow",
  "skill-ledger",
  "disputes",
  "reports",
  "subscriptions",
  "cms",
  "blog",
  "analytics",
  "support",
  "settings",
  "audit-logs",
] as const;
export type AdminArea = (typeof ADMIN_AREAS)[number];
export type AdminRow = {
  id: string;
  title: string;
  status: string;
  date: string;
  cells: Record<string, string>;
  href?: string;
};
export type AdminSummary = {
  label: string;
  value: string | number;
  detail?: string;
};
export type AdminList = {
  area: AdminArea;
  rows: AdminRow[];
  total: number;
  page: number;
  pageSize: number;
  summary: AdminSummary[];
  canWrite: boolean;
  timeZone: string;
  permissions: string[];
};
export type AdminDetail = {
  id: string;
  area: AdminArea;
  title: string;
  status: string;
  version?: number;
  sections: {
    title: string;
    fields?: { label: string; value: string }[];
    rows?: Record<string, string>[];
    text?: string;
  }[];
  history: {
    id: string;
    action: string;
    message: string;
    actor: string;
    date: string;
    internal: boolean;
    attachments?: { name: string; href: string }[];
  }[];
  editor?: Record<string, unknown>;
  actions: string[];
  settlement?: {
    requester: string;
    provider: string;
    requesterHeld: number;
    providerHeld: number;
    requesterId: string;
    providerId: string;
    cashDeposits: boolean;
  };
  related?: { label: string; href: string }[];
};
export const ROLE_NAMES = [
  "Super Admin",
  "Operations Admin",
  "Support Admin",
  "Finance Admin",
  "Content Admin",
  "Analyst",
] as const;
export const AREA_META: Record<
  AdminArea,
  {
    title: string;
    subtitle: string;
    columns: string[];
    statuses: string[];
    permission: string;
    write: string;
  }
> = {
  verification: {
    title: "Verification",
    subtitle:
      "Review member verification requests, manage verification status, and resolve verification issues.",
    columns: ["Member", "Email", "Type", "Risk / Flag", "Reviewer", "Updated"],
    statuses: [
      "pending",
      "under_review",
      "needs_information",
      "approved",
      "rejected",
      "expired",
      "flagged",
      "suspended",
    ],
    permission: "verification.read",
    write: "verification.write",
  },
  marketplace: {
    title: "Marketplace",
    subtitle:
      "Monitor requests, applications, visibility, and moderation history.",
    columns: [
      "Requester",
      "Category",
      "Skills",
      "Skill Hours",
      "Applications",
      "Expires",
    ],
    statuses: [
      "pending_review",
      "open",
      "paused",
      "completed",
      "flagged",
      "hidden",
      "removed",
      "expired",
      "in_progress",
      "cancelled",
    ],
    permission: "marketplace.read",
    write: "marketplace.write",
  },
  exchanges: {
    title: "Exchanges",
    subtitle:
      "Inspect agreed terms, deliverables, exchange health, and the complete lifecycle.",
    columns: [
      "Member A",
      "Member B",
      "Type",
      "Skill Hours",
      "Escrow",
      "Deadline",
      "Health",
    ],
    statuses: [
      "pending_proposal",
      "negotiating",
      "in_progress",
      "in_review",
      "revision_requested",
      "completed",
      "disputed",
      "cancelled",
      "paused",
      "frozen",
    ],
    permission: "exchanges.read",
    write: "exchanges.write",
  },
  escrow: {
    title: "Escrow",
    subtitle:
      "Track reserved Skill Hours, release conditions, and carefully confirmed settlements.",
    columns: [
      "Exchange",
      "Participants",
      "Skill Hours Held",
      "Deposits",
      "Release Condition",
    ],
    statuses: [
      "locked",
      "pending_deposits",
      "awaiting_approval",
      "released",
      "refunded",
      "disputed",
      "cancelled",
      "failed",
      "paused",
      "frozen",
    ],
    permission: "escrow.read",
    write: "escrow.settle",
  },
  "skill-ledger": {
    title: "Skill Hour Ledger",
    subtitle:
      "An immutable record of earned, reserved, released, corrected, and reversed Skill Hours.",
    columns: [
      "Member",
      "Exchange",
      "Type",
      "Amount",
      "Before",
      "After",
      "Source",
    ],
    statuses: ["earned", "reserved", "released", "adjusted", "reversed"],
    permission: "ledger.read",
    write: "ledger.adjust",
  },
  disputes: {
    title: "Disputes",
    subtitle:
      "Review agreements and evidence, assign cases, and resolve held Skill Hours transparently.",
    columns: [
      "Exchange",
      "Reporter",
      "Respondent",
      "Reason",
      "Hours",
      "Priority",
      "Assigned To",
    ],
    statuses: [
      "new",
      "under_review",
      "awaiting_response",
      "escalated",
      "resolved",
    ],
    permission: "disputes.read",
    write: "disputes.write",
  },
  reports: {
    title: "Reports",
    subtitle:
      "Investigate member, request, message, exchange, review, and content reports.",
    columns: [
      "Reported Item",
      "Reporter",
      "Category",
      "Priority",
      "Assigned To",
    ],
    statuses: ["open", "under_review", "escalated", "resolved", "dismissed"],
    permission: "reports.read",
    write: "reports.write",
  },
  subscriptions: {
    title: "Subscriptions",
    subtitle:
      "Monitor memberships and verified provider billing records by currency.",
    columns: [
      "Member",
      "Plan",
      "Amount",
      "Renewal",
      "Payment Status",
      "Provider",
    ],
    statuses: [
      "active",
      "trial",
      "attention",
      "non-renewing",
      "cancelled",
      "expired",
      "failed",
      "free",
    ],
    permission: "subscriptions.read",
    write: "subscriptions.provider",
  },
  cms: {
    title: "CMS",
    subtitle:
      "Manage pages, navigation, reusable site content, and frequently asked questions.",
    columns: ["Type", "Author", "Placement", "Slug", "Updated"],
    statuses: ["draft", "published", "scheduled", "archived"],
    permission: "cms.read",
    write: "cms.write",
  },
  blog: {
    title: "Blog",
    subtitle:
      "Write, preview, publish, and schedule posts with categories, authors, and SEO.",
    columns: ["Author", "Category", "Slug", "Published", "Updated", "Views"],
    statuses: ["draft", "published", "scheduled", "archived"],
    permission: "blog.read",
    write: "blog.write",
  },
  analytics: {
    title: "Analytics",
    subtitle:
      "Platform intelligence from actual member, marketplace, exchange, and billing records.",
    columns: [],
    statuses: [],
    permission: "analytics.read",
    write: "none",
  },
  support: {
    title: "Support",
    subtitle:
      "An account-scoped helpdesk with conversations, context, ownership, and case history.",
    columns: ["Member", "Category", "Priority", "Assigned To", "Updated"],
    statuses: [
      "open",
      "assigned",
      "awaiting_user",
      "awaiting_admin",
      "escalated",
      "resolved",
      "closed",
    ],
    permission: "support.read",
    write: "support.write",
  },
  settings: {
    title: "Platform Settings",
    subtitle:
      "Configure Weave’s policies and explicitly scoped administrator roles.",
    columns: [],
    statuses: [],
    permission: "settings.read",
    write: "settings.write",
  },
  "audit-logs": {
    title: "Audit Logs",
    subtitle:
      "Who changed what, why, and when, with immutable before and after records.",
    columns: ["Admin", "Action", "Resource", "Reason"],
    statuses: [],
    permission: "audit.read",
    write: "none",
  },
};
export function isAdminArea(value: unknown): value is AdminArea {
  return (
    typeof value === "string" &&
    (ADMIN_AREAS as readonly string[]).includes(value)
  );
}
export function readable(value: string) {
  return value
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}
export function hasPermission(permissions: string[], permission: string) {
  return permissions.includes("*") || permissions.includes(permission);
}
