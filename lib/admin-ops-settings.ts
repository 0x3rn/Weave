export const SETTINGS_SCHEMA: Record<
  string,
  Record<
    string,
    {
      label: string;
      type: "string" | "number" | "boolean" | "list" | "text";
      min?: number;
      max?: number;
      hint?: string;
    }
  >
> = {
  general: {
    platformName: { label: "Platform name", type: "string" },
    contactEmail: { label: "Contact email", type: "string" },
    supportEmail: { label: "Support email", type: "string" },
    timeZone: { label: "Default time zone", type: "string" },
    currency: { label: "Default currency", type: "string" },
    maintenance: {
      label: "Maintenance mode",
      type: "boolean",
      hint: "Blocks new member writes while administrators retain operations access.",
    },
  },
  verification: {
    requiredTypes: {
      label: "Verification requirements (one type per line)",
      type: "list",
    },
    validityDays: {
      label: "Verification validity (days)",
      type: "number",
      min: 1,
      max: 3650,
    },
    documentsRequired: { label: "Require identity documents", type: "boolean" },
  },
  marketplace: {
    approvalRequired: {
      label: "Review requests before publication",
      type: "boolean",
    },
    expirationDays: {
      label: "Request expiration (days)",
      type: "number",
      min: 1,
      max: 365,
    },
    applicationLimit: {
      label: "Applications per request",
      type: "number",
      min: 1,
      max: 1000,
    },
    featuredEnabled: { label: "Enable featured listings", type: "boolean" },
  },
  exchanges: {
    minHours: {
      label: "Minimum Skill Hours",
      type: "number",
      min: 1,
      max: 10000,
    },
    maxHours: {
      label: "Maximum Skill Hours",
      type: "number",
      min: 1,
      max: 10000,
    },
    maxDurationDays: {
      label: "Maximum exchange duration (days)",
      type: "number",
      min: 1,
      max: 365,
    },
    revisionLimit: {
      label: "Revisions included in new contracts",
      type: "number",
      min: 0,
      max: 20,
    },
    oneWayEnabled: { label: "Allow one-way exchanges", type: "boolean" },
    mutualEnabled: { label: "Allow mutual exchanges", type: "boolean" },
  },
  escrow: {
    feePercent: {
      label: "Recorded escrow fee (%)",
      type: "number",
      min: 0,
      max: 0,
      hint: "Current exchanges use Skill Hours. Cash fee charging requires a payment adapter.",
    },
    securityDepositEnabled: {
      label: "Cash security deposits",
      type: "boolean",
      hint: "Requires a funded deposit/payment adapter. Current contracts reserve Skill Hours.",
    },
    reviewDays: {
      label: "Review period (days)",
      type: "number",
      min: 1,
      max: 90,
    },
    disputeDays: {
      label: "Dispute window (days)",
      type: "number",
      min: 1,
      max: 90,
    },
    autoRelease: {
      label: "Release eligible, accepted reviews during maintenance",
      type: "boolean",
    },
  },
  "skill-hours": {
    manualAdjustmentsEnabled: {
      label: "Allow manual Skill Hour corrections",
      type: "boolean",
    },
    adjustmentLimit: {
      label: "Maximum correction per operation",
      type: "number",
      min: 1,
      max: 10000,
    },
  },
  "trust-safety": {
    flagThreshold: {
      label: "Reports required for automated flags",
      type: "number",
      min: 1,
      max: 100,
    },
    escalationDays: {
      label: "Escalate unresolved cases after (days)",
      type: "number",
      min: 1,
      max: 90,
    },
    messageInspection: {
      label: "Permit logged message inspection for investigations",
      type: "boolean",
      hint: "Only authorized operations staff can inspect messages and must give an access reason.",
    },
  },
  notifications: {
    reminderDays: {
      label: "Reminder interval (days)",
      type: "number",
      min: 1,
      max: 30,
    },
    digestHour: {
      label: "Default digest delivery hour",
      type: "number",
      min: 0,
      max: 23,
    },
    emailTemplate: {
      label: "Notification email text template",
      type: "text",
      hint: "Available placeholders: {{title}}, {{message}}, {{url}}.",
    },
  },
  billing: {
    invoicePrefix: { label: "Invoice prefix", type: "string" },
    refundWindowDays: {
      label: "Refund window (days)",
      type: "number",
      min: 1,
      max: 365,
    },
    failedPaymentGraceDays: {
      label: "Failed payment grace period (days)",
      type: "number",
      min: 0,
      max: 90,
    },
  },
  cms: {
    announcement: { label: "Site announcement", type: "text" },
    contactInformation: { label: "Contact information", type: "text" },
    socialLinks: {
      label: "Social links (one HTTPS URL per line)",
      type: "list",
    },
    legalLinks: {
      label: "Legal links (one internal path per line)",
      type: "list",
    },
  },
  security: {
    adminSessionHours: {
      label: "Maximum admin session age (hours)",
      type: "number",
      min: 1,
      max: 24,
    },
    requireAdminMfa: {
      label: "Require administrator MFA",
      type: "boolean",
      hint: "Enroll administrators in Firebase TOTP before enabling this policy.",
    },
  },
};
export function validatePlatformSettings(section: string, value: unknown) {
  const schema = SETTINGS_SCHEMA[section];
  if (!schema || !value || typeof value !== "object" || Array.isArray(value))
    throw new Error("Invalid settings");
  const input = value as Record<string, unknown>;
  if (Object.keys(input).some((key) => !schema[key]))
    throw new Error("Unknown settings field");
  const result: Record<string, unknown> = {};
  for (const [key, spec] of Object.entries(schema)) {
    const v = input[key];
    if (spec.type === "boolean") {
      if (typeof v !== "boolean") throw new Error("Invalid " + spec.label);
      result[key] = v;
    } else if (spec.type === "number") {
      if (
        typeof v !== "number" ||
        !Number.isInteger(v) ||
        v < (spec.min ?? 0) ||
        v > (spec.max ?? 10000)
      )
        throw new Error("Invalid " + spec.label);
      result[key] = v;
    } else if (spec.type === "list") {
      if (
        !Array.isArray(v) ||
        v.length > 30 ||
        v.some((x) => typeof x !== "string" || x.length > 500)
      )
        throw new Error("Invalid " + spec.label);
      result[key] = v;
    } else {
      if (
        typeof v !== "string" ||
        v.length > (spec.type === "text" ? 5000 : 200)
      )
        throw new Error("Invalid " + spec.label);
      result[key] = v.trim();
    }
  }
  if (section === "general") {
    try {
      new Intl.DateTimeFormat("en", { timeZone: String(result.timeZone) });
    } catch {
      throw new Error("Invalid time zone");
    }
    if (!/^[A-Z]{3}$/.test(String(result.currency)))
      throw new Error("Use a three-letter currency code");
    for (const key of ["contactEmail", "supportEmail"])
      if (result[key] && !/^\S+@\S+\.\S+$/.test(String(result[key])))
        throw new Error("Invalid email");
  }
  if (
    section === "exchanges" &&
    Number(result.minHours) > Number(result.maxHours)
  )
    throw new Error("Minimum hours must not exceed maximum hours");
  if (
    section === "verification" &&
    (!(result.requiredTypes as string[]).length ||
      (result.requiredTypes as string[]).some(
        (v) => !["identity", "professional", "trust"].includes(v),
      ))
  )
    throw new Error(
      "Verification requirements must include identity, professional, or trust",
    );
  if (section === "escrow" && result.securityDepositEnabled)
    throw new Error(
      "Cash deposits cannot be enabled until a funded payment adapter is configured",
    );
  if (section === "cms") {
    for (const link of result.socialLinks as string[]) {
      try {
        const u = new URL(link);
        if (u.protocol !== "https:" || u.username || u.password)
          throw new Error();
      } catch {
        throw new Error("Social links must be valid HTTPS URLs");
      }
    }
    if (
      (result.legalLinks as string[]).some(
        (url) => !/^\/(?!\/)[A-Za-z0-9_/-]+$/.test(url),
      )
    )
      throw new Error("Legal links must point to Weave pages");
  }
  return result;
}
