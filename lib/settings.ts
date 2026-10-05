import { NOTIFICATION_EVENTS, notificationEvent } from "./notification-catalog";
export type SettingValue = string | number | boolean;
export type SettingsGroup =
  "privacy" | "preferences" | "profileSync" | "dataRetention";
export type SettingField = {
  key: string;
  label: string;
  description?: string;
  type: "toggle" | "select" | "number";
  default: SettingValue;
  options?: readonly string[];
  min?: number;
  max?: number;
};
export type SettingSection = {
  title: string;
  description?: string;
  fields: SettingField[];
};
const toggle = (
  key: string,
  label: string,
  value = true,
  description?: string,
): SettingField => ({
  key,
  label,
  type: "toggle",
  default: value,
  description,
});
const select = (
  key: string,
  label: string,
  options: string[],
  value = options[0],
): SettingField => ({ key, label, type: "select", options, default: value });

export const APPEARANCE: SettingSection = {
  title: "Appearance",
  fields: [
    select("theme", "Theme", ["light", "dark", "system"], "system"),
    select("accentColor", "Accent color", [
      "default",
      "blue",
      "violet",
      "amber",
    ]),
    toggle(
      "compactMode",
      "Compact mode",
      false,
      "Fit more content into your workspace.",
    ),
    select("roundedCorners", "Rounded corners", ["standard", "compact"]),
    select("fontSize", "Font size", ["small", "medium", "large"], "medium"),
    toggle(
      "reduceMotion",
      "Reduce motion",
      false,
      "Minimize animation and smooth scrolling.",
    ),
  ],
};
export const ACCESSIBILITY: SettingSection = {
  title: "Accessibility",
  description: "Font size and motion preferences are shared with Appearance.",
  fields: [
    APPEARANCE.fields[4],
    APPEARANCE.fields[5],
    toggle("highContrast", "High contrast", false),
    toggle("keyboardNavigation", "Enhanced keyboard focus", true),
    toggle(
      "screenReaderOptimizations",
      "Screen reader optimizations",
      true,
      "Announce save results and navigation changes.",
    ),
    toggle(
      "colorBlindLabels",
      "Color friendly status labels",
      true,
      "Keep status text alongside visual indicators.",
    ),
  ],
};
export const SETTINGS_SECTIONS: Record<SettingsGroup, SettingSection[]> = {
  profileSync: [
    {
      title: "Public profile sync",
      description:
        "Your account details are private. These controls choose which details appear on your public profile.",
      fields: [
        toggle("syncPhoto", "Sync profile photo"),
        toggle("syncName", "Sync display name"),
        toggle("showVerification", "Show verification badge publicly"),
        toggle("showOnlineStatus", "Show online status"),
        toggle("showAvailability", "Show availability automatically"),
      ],
    },
  ],
  privacy: [
    {
      title: "Profile visibility",
      fields: [
        select("profileVisibility", "Who can see your profile?", [
          "public",
          "members",
          "hidden",
        ]),
      ],
    },
    {
      title: "Search visibility",
      fields: [
        toggle("appearInMarketplace", "Appear in Marketplace"),
        toggle("appearInSearch", "Appear in search"),
        toggle("allowProfileSharing", "Allow profile sharing"),
      ],
    },
    {
      title: "Contact preferences",
      fields: [
        select("contactPreferences", "Allow messages from", [
          "everyone",
          "verified",
          "collaborators",
          "nobody",
        ]),
      ],
    },
    {
      title: "Activity visibility",
      fields: [
        toggle("showLastActive", "Last active"),
        toggle("showCompletedExchanges", "Completed exchanges"),
        toggle("showTrustScore", "Trust score"),
        toggle("showReviews", "Reviews"),
        toggle("showSkillHourBalance", "Skill Hour balance", false),
        toggle("showPortfolio", "Portfolio"),
        toggle("showBadges", "Badges"),
      ],
    },
  ],
  preferences: [
    APPEARANCE,
    ACCESSIBILITY,
    {
      title: "Workspace preferences",
      fields: [
        select("dashboardLandingPage", "Landing page after sign-in", [
          "overview",
          "marketplace",
          "exchanges",
          "messages",
        ]),
        select("defaultMarketplaceView", "Default marketplace view", [
          "requests",
          "professionals",
        ]),
        select("exchangeView", "Default exchange view", [
          "chat_first",
          "milestones_first",
          "activity_first",
        ]),
        select(
          "weekStartsOn",
          "Calendar week starts on",
          ["sunday", "monday"],
          "monday",
        ),
        toggle("autoSaveDrafts", "Auto-save message and request drafts"),
        toggle("compressImages", "Automatically compress image uploads"),
      ],
    },
    {
      title: "Exchange preferences",
      description:
        "Used to rank marketplace recommendations and decide which new exchange requests you accept.",
      fields: [
        select("preferredHours", "Preferred collaboration hours", [
          "flexible",
          "weekdays",
          "weekends",
          "evenings",
        ]),
        {
          key: "maxConcurrentExchanges",
          label: "Maximum concurrent exchanges",
          type: "number",
          default: 3,
          min: 1,
          max: 20,
        },
        select("preferredDuration", "Preferred project duration", [
          "flexible",
          "under_week",
          "one_four_weeks",
          "over_month",
        ]),
        toggle(
          "openToReciprocalOnly",
          "Require reciprocal exchanges",
          false,
          "Accept skill swaps only. Existing exchanges are unaffected.",
        ),
      ],
    },
  ],
  dataRetention: [
    {
      title: "Archived conversation access",
      description:
        "Choose how long archived conversations remain accessible. This hides expired archives; platform records and backups follow the platform retention policy.",
      fields: [
        select(
          "archiveDays",
          "Access window",
          ["30", "90", "365", "forever"],
          "forever",
        ),
      ],
    },
  ],
};
export function object(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}
export function settingsFor(
  group: SettingsGroup,
  value: unknown,
): Record<string, SettingValue> {
  const stored = object(value);
  return Object.fromEntries(
    SETTINGS_SECTIONS[group]
      .flatMap((section) => section.fields)
      .map((field) => {
        const value = stored[field.key];
        const valid =
          field.type === "toggle"
            ? typeof value === "boolean"
            : field.type === "select"
              ? typeof value === "string" && field.options?.includes(value)
              : typeof value === "number" &&
                Number.isInteger(value) &&
                value >= (field.min ?? 0) &&
                value <= (field.max ?? 100);
        return [field.key, valid ? (value as SettingValue) : field.default];
      }),
  );
}
export function validateSettingsPatch(
  group: SettingsGroup,
  input: unknown,
): Record<string, SettingValue> {
  if (!Object.hasOwn(SETTINGS_SECTIONS, group))
    throw new Error("Unknown settings group");
  const data = object(input);
  if (!Object.keys(data).length || Object.keys(data).length > 40)
    throw new Error("Invalid settings");
  const fields = SETTINGS_SECTIONS[group].flatMap((section) => section.fields);
  for (const [key, value] of Object.entries(data)) {
    const field = fields.find((item) => item.key === key);
    if (
      !field ||
      (field.type === "toggle" && typeof value !== "boolean") ||
      (field.type === "select" &&
        (typeof value !== "string" || !field.options?.includes(value))) ||
      (field.type === "number" &&
        (typeof value !== "number" ||
          !Number.isInteger(value) ||
          value < (field.min ?? 0) ||
          value > (field.max ?? 100)))
    )
      throw new Error(`Invalid value for ${field?.label ?? key}`);
  }
  return data as Record<string, SettingValue>;
}
export function label(value: string) {
  return (
    (
      {
        chat_first: "Chat first",
        milestones_first: "Milestones first",
        activity_first: "Activity first",
        members: "Members only",
        verified: "Verified members",
        collaborators: "Existing collaborators",
        default: "Weave green",
        under_week: "Under a week",
        one_four_weeks: "1–4 weeks",
        over_month: "Over a month",
        forever: "No personal limit",
      } as Record<string, string>
    )[value] ??
    value.replaceAll("_", " ").replace(/^./, (letter) => letter.toUpperCase())
  );
}

export const NOTIFICATION_CATEGORIES = [
  "applications",
  "messages",
  "reviews",
  "skillHours",
  "trustScore",
  "marketplace",
  "escrow",
  "announcements",
] as const;
export type NotificationCategory = (typeof NOTIFICATION_CATEGORIES)[number];
export type NotificationSettings = {
  events: { inApp: Record<string, boolean>; email: Record<string, boolean> };
  messageFrequency: "default" | "instant" | "daily" | "weekly" | "never";
  dailySummary: { enabled: boolean; time: string };
  channels: {
    inApp: Record<NotificationCategory, boolean>;
    email: Record<NotificationCategory, boolean>;
  };
  digest: "instant" | "daily" | "weekly" | "never";
  quietHours: {
    enabled: boolean;
    start: string;
    end: string;
    timeZone: string;
  };
};
export function notificationSettings(value: unknown): NotificationSettings {
  const old = object(value),
    delivery = object(old.deliveryMethod),
    channels = object(old.channels),
    quiet = object(old.quietHours);
  const oldKeys: Record<NotificationCategory, string> = {
    applications: "exchangeActivity",
    messages: "messages",
    reviews: "reviews",
    skillHours: "exchangeActivity",
    trustScore: "reviews",
    marketplace: "marketplace",
    escrow: "exchangeActivity",
    announcements: "community",
  };
  const channel = (name: "inApp" | "email") =>
    Object.fromEntries(
      NOTIFICATION_CATEGORIES.map((key) => [
        key,
        typeof object(channels[name])[key] === "boolean"
          ? object(channels[name])[key]
          : old[oldKeys[key]] !== false &&
            (name === "inApp"
              ? delivery.inApp !== false
              : delivery.email === true),
      ]),
    ) as Record<NotificationCategory, boolean>;
  let timeZone = typeof quiet.timeZone === "string" ? quiet.timeZone : "UTC";
  try {
    new Intl.DateTimeFormat("en", { timeZone }).format();
  } catch {
    timeZone = "UTC";
  }
  const validTime = (value: unknown, fallback: string) =>
    typeof value === "string" && /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value)
      ? value
      : fallback;
  const eventChannel = (name: "inApp" | "email") =>
    Object.fromEntries(
      Object.keys(NOTIFICATION_EVENTS).map((type) => [
        type,
        notificationEvent(type).category === "Security"
          ? true
          : typeof object(object(old.events)[name])[type] === "boolean"
            ? object(object(old.events)[name])[type]
            : channel(name)[notificationCategory(type)],
      ]),
    ) as Record<string, boolean>;
  return {
    events: { inApp: eventChannel("inApp"), email: eventChannel("email") },
    messageFrequency: [
      "default",
      "instant",
      "daily",
      "weekly",
      "never",
    ].includes(String(old.messageFrequency))
      ? (old.messageFrequency as NotificationSettings["messageFrequency"])
      : "default",
    dailySummary: {
      enabled: object(old.dailySummary).enabled === true,
      time: validTime(object(old.dailySummary).time, "08:00"),
    },
    channels: { inApp: channel("inApp"), email: channel("email") },
    digest: ["instant", "daily", "weekly", "never"].includes(String(old.digest))
      ? (old.digest as NotificationSettings["digest"])
      : "instant",
    quietHours: {
      enabled: quiet.enabled === true,
      start: validTime(quiet.start, "22:00"),
      end: validTime(quiet.end, "07:00"),
      timeZone,
    },
  };
}
export function notificationCategory(type: string): NotificationCategory {
  if (/application|exchange_request|request_update/.test(type))
    return "applications";
  if (/message/.test(type)) return "messages";
  if (/trust_score/.test(type)) return "trustScore";
  if (/review|endorsement|achievement/.test(type)) return "reviews";
  if (/hours|admin_adjustment/.test(type)) return "skillHours";
  if (/match|saved_request|request_expiring|professional/.test(type))
    return "marketplace";
  if (/exchange|milestone|file_uploaded|revision|dispute/.test(type))
    return "escrow";
  return "announcements";
}
export function inQuietHours(
  settings: NotificationSettings,
  date = new Date(),
) {
  if (!settings.quietHours.enabled) return false;
  const { start, end, timeZone } = settings.quietHours;
  const time = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(date);
  return (
    start === end ||
    (start < end ? time >= start && time < end : time >= start || time < end)
  );
}
