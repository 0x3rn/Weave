import "server-only";
import { iso, payload } from "./neon";
import { sendEmail } from "./email";
import type { AdminInviteApplication } from "./admin-types";
export function applicationForAdmin(
  row: Record<string, unknown>,
): AdminInviteApplication {
  const data = payload<Record<string, unknown>>(row.payload);
  const textFields = [
    "internalNotes",
    "country",
    "timeZone",
    "profession",
    "experience",
    "portfolio",
    "linkedIn",
    "github",
    "whyJoin",
    "heardAboutUs",
  ];
  const text = Object.fromEntries(
    textFields.map((key) => [
      key,
      typeof data[key] === "string" ? data[key] : "",
    ]),
  );
  for (const key of ["portfolio", "linkedIn", "github"]) {
    try {
      const url = new URL(text[key]);
      text[key] = ["https:", "http:"].includes(url.protocol) ? url.href : "";
    } catch {
      text[key] = "";
    }
  }
  return {
    ...text,
    id: String(row.id),
    email: String(row.email || ""),
    fullName: String(row.full_name || ""),
    status: String(row.status || "pending"),
    createdAt: iso(row.submitted_at),
    skillsOffered: Array.isArray(data.skillsOffered)
      ? data.skillsOffered.filter((skill) => typeof skill === "string")
      : [],
    skillsLookingFor: Array.isArray(data.skillsLookingFor)
      ? data.skillsLookingFor.filter((skill) => typeof skill === "string")
      : [],
  };
}
export function generateInviteCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const code = Array.from(
    crypto.getRandomValues(new Uint8Array(8)),
    (byte) => chars[byte % chars.length],
  ).join("");
  return `WV-${code.slice(0, 4)}-${code.slice(4)}`;
}
export function escapeHtml(value: unknown) {
  return String(value ?? "").replace(
    /[&<>'"]/g,
    (character) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[
        character
      ]!,
  );
}
export function inviteForAdmin(row: Record<string, unknown>) {
  const expiresAt = iso(row.expires_at) || null;
  const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return {
    id: String(row.id),
    code: String(row.code),
    email: String(row.email),
    status:
      row.status === "pending" &&
      expiresAt &&
      new Date(expiresAt).getTime() <= Date.now()
        ? "expired"
        : String(row.status),
    createdAt: iso(row.created_at),
    expiresAt,
    signupUrl: `${base.replace(/\/$/, "")}/signup?invite=${encodeURIComponent(String(row.code))}`,
  };
}
export async function deliverInvite(
  row: Record<string, unknown>,
  fullName: unknown,
  welcomeMessage = "",
  fallbackSettings: unknown = {},
) {
  const invite = inviteForAdmin(row);
  const settings = payload<Record<string, unknown>>(
    payload<Record<string, unknown>>(row.payload).approvedSettings ??
      fallbackSettings,
  );
  try {
    const result = await sendEmail({
      to: invite.email,
      subject: "Your Weave invitation",
      html: `<h2>Welcome to Weave, ${escapeHtml(String(fullName || "there").split(" ")[0])}!</h2><p>Your application has been approved.</p>${welcomeMessage ? `<p>${escapeHtml(welcomeMessage)}</p>` : ""}<p>Your account will start with ${Number(settings.startingHours ?? 5)} Skill Hours.</p><p>Invite code: <strong>${escapeHtml(invite.code)}</strong></p><a href="${escapeHtml(invite.signupUrl)}">Create your account</a>`,
    });
    if (!result.success)
      return "The invite was saved, but its email could not be delivered. Retry from Issued Codes.";
  } catch {
    return "The invite was saved, but its email could not be delivered. Retry from Issued Codes.";
  }
}
