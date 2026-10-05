import type {
  Notification,
  NotificationCategory,
  NotificationPriority,
} from "@/types";

export const NOTIFICATION_CATEGORIES = [
  "Exchanges",
  "Marketplace",
  "Messages",
  "Ledger",
  "Reviews",
  "Trust Score",
  "Achievements",
  "Account",
  "Billing",
  "Community",
  "Security",
  "System",
] as const;
type Event = {
  label: string;
  category: NotificationCategory;
  priority: NotificationPriority;
  action?: string;
  why: string;
  requiresAction?: boolean;
  acknowledge?: boolean;
};
const event = (
  label: string,
  category: NotificationCategory,
  priority: NotificationPriority,
  why: string,
  action?: string,
  requiresAction = false,
  acknowledge = false,
): Event => ({
  label,
  category,
  priority,
  why,
  action,
  requiresAction,
  acknowledge,
});
export const NOTIFICATION_EVENTS = {
  exchange_request: event(
    "Exchange requests",
    "Exchanges",
    "High",
    "Accept or decline this request so your partner can plan their work.",
    "Review request",
    true,
  ),
  request_update: event(
    "Request decisions",
    "Exchanges",
    "Normal",
    "Your collaboration request has a new decision.",
    "View exchange",
  ),
  application_received: event(
    "Applications received",
    "Marketplace",
    "High",
    "Review this application to decide who to collaborate with.",
    "Review application",
    true,
  ),
  application_accepted: event(
    "Applications accepted",
    "Exchanges",
    "High",
    "Both members must approve the contract before work can begin.",
    "Review contract",
    true,
  ),
  proposal_updated: event(
    "Proposal changes",
    "Exchanges",
    "High",
    "Review the updated terms before confirming your collaboration.",
    "Review proposal",
    true,
  ),
  exchange_started: event(
    "Exchanges started",
    "Exchanges",
    "Normal",
    "Your contract is approved and the workspace is ready for work.",
    "Open workspace",
  ),
  milestone_completed: event(
    "Milestones completed",
    "Exchanges",
    "Normal",
    "This milestone moves your exchange closer to delivery.",
    "Review milestone",
  ),
  milestone_added: event(
    "Milestones added",
    "Exchanges",
    "Normal",
    "Check the milestone and its deadline to plan your next steps.",
    "View milestone",
  ),
  milestone_updated: event(
    "Milestone changes",
    "Exchanges",
    "Normal",
    "Your exchange plan has changed.",
    "View milestone",
  ),
  file_uploaded: event(
    "Deliverables uploaded",
    "Exchanges",
    "High",
    "When all submissions are ready, reviewing them moves the exchange toward completion.",
    "Review deliverables",
    true,
  ),
  revision_requested: event(
    "Revisions requested",
    "Exchanges",
    "High",
    "Submit the requested changes so your partner can review again.",
    "Submit revisions",
    true,
  ),
  review_waiting: event(
    "Review requests",
    "Exchanges",
    "High",
    "Your decision is needed before this exchange can proceed.",
    "Review now",
    true,
  ),
  exchange_completed: event(
    "Exchanges completed",
    "Exchanges",
    "Normal",
    "A review helps your partner build trust with future collaborators.",
    "Leave review",
    true,
  ),
  exchange_cancelled: event(
    "Exchanges cancelled",
    "Exchanges",
    "Normal",
    "Check the workspace and ledger for the final outcome.",
    "View exchange",
  ),
  dispute_opened: event(
    "Disputes opened",
    "Exchanges",
    "Critical",
    "Review the dispute and provide the information needed for a fair resolution.",
    "View dispute",
    true,
  ),
  dispute_resolved: event(
    "Dispute decisions",
    "Exchanges",
    "High",
    "The decision explains the outcome and any ledger adjustment.",
    "View resolution",
  ),
  message_received: event(
    "New messages",
    "Messages",
    "Normal",
    "Read your partner's message to keep your collaboration moving.",
    "Read message",
  ),
  new_match: event(
    "Recommended opportunities",
    "Marketplace",
    "Normal",
    "This opportunity matches skills on your profile.",
    "View opportunity",
  ),
  saved_request_updated: event(
    "Saved request changes",
    "Marketplace",
    "Normal",
    "Check the updated requirements before deciding to apply.",
    "Open request",
  ),
  request_expiring: event(
    "Requests expiring",
    "Marketplace",
    "High",
    "Extend the request if you still want to receive applications.",
    "Extend request",
    true,
  ),
  new_professional: event(
    "Relevant new professionals",
    "Marketplace",
    "Low",
    "A verified member in your region offers skills relevant to your profile.",
    "View profile",
  ),
  hours_earned: event(
    "Skill Hours earned",
    "Ledger",
    "Normal",
    "Your completed work has increased your available Skill Hours.",
    "View ledger",
  ),
  hours_reserved: event(
    "Skill Hours reserved",
    "Ledger",
    "Normal",
    "These hours are held for an active exchange.",
    "View ledger",
  ),
  hours_released: event(
    "Skill Hours released",
    "Ledger",
    "Normal",
    "Review the transaction to see how your balance changed.",
    "View transaction",
  ),
  admin_adjustment: event(
    "Balance adjustments",
    "Ledger",
    "Normal",
    "The ledger records the reason for this adjustment.",
    "View details",
  ),
  escrow_refunded: event(
    "Escrow refunds",
    "Billing",
    "Normal",
    "Reserved hours have been returned to your balance.",
    "View transaction",
  ),
  new_review: event(
    "Reviews received",
    "Reviews",
    "Normal",
    "Your partner's feedback contributes to your reputation.",
    "Read review",
  ),
  skill_endorsement: event(
    "Skill endorsements",
    "Reviews",
    "Normal",
    "Your collaborator has recognized skills you demonstrated.",
    "View profile",
  ),
  trust_score_increased: event(
    "Trust Score increases",
    "Trust Score",
    "Normal",
    "Your record of reliable collaboration has improved.",
    "See why",
  ),
  trust_score_decreased: event(
    "Trust Score decreases",
    "Trust Score",
    "High",
    "Review your recent feedback and account standing.",
    "See why",
  ),
  achievement_unlocked: event(
    "Achievements unlocked",
    "Achievements",
    "Normal",
    "This badge recognizes a meaningful collaboration milestone.",
    "View badge",
  ),
  weekly_streak: event(
    "Collaboration streaks",
    "Achievements",
    "Normal",
    "Your consistent collaboration is building a strong track record.",
    "View achievements",
  ),
  verification_approved: event(
    "Verification decisions",
    "Account",
    "Normal",
    "Your account is now recognized as a Verified Member.",
    "View profile",
  ),
  profile_incomplete: event(
    "Profile completion reminders",
    "Account",
    "Low",
    "A complete profile helps members understand your skills and discover your work.",
    "Complete profile",
    true,
  ),
  email_changed: event(
    "Email changes",
    "Security",
    "Critical",
    "If you did not make this change, secure your account immediately.",
    "Review security",
    true,
    true,
  ),
  password_updated: event(
    "Password changes",
    "Security",
    "High",
    "Your sign-in password has changed. Review security if this was unexpected.",
    "Review security",
    true,
    true,
  ),
  two_factor_enabled: event(
    "Two-factor enabled",
    "Security",
    "Normal",
    "Your authenticator adds protection to future sign-ins.",
    "View security",
  ),
  two_factor_disabled: event(
    "Two-factor disabled",
    "Security",
    "Critical",
    "Your account no longer has this additional sign-in protection.",
    "Review security",
    true,
    true,
  ),
  security_alert: event(
    "New sign-ins",
    "Security",
    "Critical",
    "Confirm this was you; sign out unfamiliar devices and secure your account.",
    "Review activity",
    true,
    true,
  ),
  failed_login_attempts: event(
    "Repeated failed sign-ins",
    "Security",
    "Critical",
    "Repeated unsuccessful attempts were verified by your sign-in provider.",
    "Secure account",
    true,
    true,
  ),
  subscription_renewed: event(
    "Subscription renewals",
    "Billing",
    "Normal",
    "Your subscription payment and receipt are available in Billing.",
    "View billing",
  ),
  subscription_started: event(
    "Subscription confirmations",
    "Billing",
    "Normal",
    "Your subscription is confirmed and the payment receipt is available.",
    "View billing",
  ),
  payment_failed: event(
    "Payment failures",
    "Billing",
    "Critical",
    "Update your payment method to keep your subscription active.",
    "Update payment method",
    true,
  ),
  subscription_renewal_reminder: event(
    "Upcoming renewals",
    "Billing",
    "High",
    "Review your subscription before the next renewal.",
    "Manage subscription",
    true,
  ),
  exchange_review_reminder: event(
    "Waiting review reminders",
    "Exchanges",
    "High",
    "Your partner is waiting for your review decision.",
    "Review now",
    true,
  ),
  exchange_approval_reminder: event(
    "Waiting contract reminders",
    "Exchanges",
    "High",
    "Your partner cannot begin until the contract is approved.",
    "Review contract",
    true,
  ),
  milestone_reminder: event(
    "Remaining milestone reminders",
    "Exchanges",
    "Normal",
    "Completing the remaining milestone will move your exchange toward delivery.",
    "View milestones",
    true,
  ),
  inactive_reminder: event(
    "Collaboration check-ins",
    "Account",
    "Low",
    "Check your messages and active exchanges to keep partners informed.",
    "Open dashboard",
  ),
  welcome_members: event(
    "New member summaries",
    "Community",
    "Low",
    "Explore the community's newest collaborators.",
    "Explore marketplace",
  ),
  community_update: event(
    "Community announcements",
    "Community",
    "Low",
    "Stay informed about opportunities to connect with other members.",
    "Read more",
  ),
  community_event: event(
    "Community events",
    "Community",
    "Low",
    "Join members for a scheduled community event.",
    "Register",
  ),
  newsletter: event(
    "Newsletters",
    "Community",
    "Low",
    "Catch up on news and opportunities across Weave.",
    "Read newsletter",
  ),
  platform_update: event(
    "Platform announcements",
    "System",
    "Low",
    "Learn about changes that affect how you use Weave.",
    "Read more",
  ),
  maintenance: event(
    "Scheduled maintenance",
    "System",
    "Normal",
    "Plan your work around this maintenance window.",
    "View details",
  ),
  feature_released: event(
    "New features",
    "System",
    "Low",
    "Explore the new tools available in Weave.",
    "Read more",
  ),
  bug_fix: event(
    "Bug fixes",
    "System",
    "Low",
    "This update improves the reliability of your workspace.",
    "Read more",
  ),
  performance_update: event(
    "Performance updates",
    "System",
    "Low",
    "This update improves how Weave runs.",
    "Read more",
  ),
  system: event(
    "Other system updates",
    "System",
    "Low",
    "Check the details for any effect on your account.",
    "Open resource",
  ),
} as const satisfies Record<string, Event>;
export type NotificationEventType = keyof typeof NOTIFICATION_EVENTS;
export function notificationEvent(type: string): Event {
  return (
    NOTIFICATION_EVENTS[type as NotificationEventType] ||
    NOTIFICATION_EVENTS.system
  );
}
export function safeNotificationLink(link?: string) {
  return link && /^\/(?![\/\\])[^\u0000-\u001f]*$/.test(link)
    ? link
    : undefined;
}

export type NotificationQuery = {
  page?: number;
  limit?: number;
  tab?: "all" | "actionable" | "archive";
  search?: string;
  status?: "All" | "Unread" | "Read";
  category?: string;
  priority?: string;
  date?: "All" | "Today" | "This Week" | "This Month" | "Custom";
  from?: string;
  to?: string;
  sort?: "Newest" | "Oldest" | "Unread First" | "Priority";
  group?: boolean;
};
export type NotificationSummary = {
  unread: number;
  today: number;
  week: number;
  actionable: number;
};
export type NotificationPage = {
  notifications: Notification[];
  total: number;
  page: number;
  hasMore: boolean;
  summary: NotificationSummary;
  timeZone: string;
};
export function normalizeNotificationQuery(
  input: NotificationQuery = {},
): Required<Omit<NotificationQuery, "from" | "to">> & {
  from: string;
  to: string;
} {
  const pick = <T extends string>(
    value: unknown,
    allowed: readonly T[],
    fallback: T,
  ) => (allowed.includes(value as T) ? (value as T) : fallback);
  const validDate = (value?: string) => {
    if (!value) return "";
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
      new Date(value + "T00:00:00Z").toISOString().slice(0, 10) !== value
    )
      throw new Error("Choose a valid date");
    return value;
  };
  const from = validDate(input.from),
    to = validDate(input.to);
  if (from && to && from > to)
    throw new Error("Start date must be before end date");
  return {
    page:
      Number.isInteger(input.page) && input.page! >= 0 && input.page! <= 100000
        ? input.page!
        : 0,
    limit: Number.isInteger(input.limit)
      ? Math.max(1, Math.min(input.limit!, 100))
      : 50,
    tab: pick(input.tab, ["all", "actionable", "archive"], "all"),
    search:
      typeof input.search === "string" ? input.search.trim().slice(0, 200) : "",
    status: pick(input.status, ["All", "Unread", "Read"], "All"),
    category: pick(input.category, ["All", ...NOTIFICATION_CATEGORIES], "All"),
    priority: pick(
      input.priority,
      ["All", "Critical", "High", "Normal", "Low"],
      "All",
    ),
    date: pick(
      input.date,
      ["All", "Today", "This Week", "This Month", "Custom"],
      "All",
    ),
    from,
    to,
    sort: pick(
      input.sort,
      ["Newest", "Oldest", "Unread First", "Priority"],
      "Newest",
    ),
    group: input.group !== false,
  };
}

export function groupNotifications(
  items: Notification[],
  enabled = true,
  timeZone = "UTC",
) {
  const groups: Notification[][] = [],
    latest = new Map<string, Notification[]>();
  const calendar = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  for (const item of items) {
    const created = new Date(item.createdAt),
      key = item.groupKey && item.groupKey + ":" + calendar.format(created),
      previous = key ? latest.get(key) : undefined;
    if (
      enabled &&
      previous &&
      Math.abs(new Date(previous[0].createdAt).getTime() - created.getTime()) <=
        3600000
    )
      previous.push(item);
    else {
      const group = [item];
      groups.push(group);
      if (key) latest.set(key, group);
    }
  }
  return groups;
}
