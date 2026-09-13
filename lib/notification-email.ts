import "server-only";

import { after } from "next/server";
import { sql } from "@/lib/neon";
import { sendEmail } from "@/lib/email";

function escapeHtml(value: string) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");
}

function preferenceKey(category: string) {
  if (category === "Exchange Activity") return "exchangeActivity";
  if (category === "Marketplace") return "marketplace";
  if (category === "Messages") return "messages";
  if (category === "Reviews & Trust Score") return "reviews";
  if (category === "Community") return "community";
  return null;
}

export function scheduleNotificationEmails(ids: string[]) {
  const uniqueIds = [...new Set(ids.filter(Boolean))].slice(0, 100);
  if (!uniqueIds.length) return;
  after(async () => {
    try {
      const rows = await sql.query(
        "select n.title,n.message,n.category,n.link,u.email,u.payload from notifications n join users u on u.id=n.user_id where n.id=any($1::text[])",
        [uniqueIds],
      );
      await Promise.allSettled(rows.map(async row => {
        const userPayload = row.payload && typeof row.payload === "object" ? row.payload as Record<string, unknown> : {};
        const preferences = userPayload.notificationPreferences && typeof userPayload.notificationPreferences === "object" ? userPayload.notificationPreferences as Record<string, unknown> : {};
        const delivery = preferences.deliveryMethod && typeof preferences.deliveryMethod === "object" ? preferences.deliveryMethod as Record<string, unknown> : {};
        const category = String(row.category || "");
        const key = preferenceKey(category);
        if (delivery.email !== true || (category !== "Security" && key && preferences[key] === false) || typeof row.email !== "string" || !row.email.includes("@")) return;
        const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://weave.corstack.dev").replace(/\/$/, "");
        const href = typeof row.link === "string" && row.link.startsWith("/") && !row.link.startsWith("//") ? `${appUrl}${row.link}` : appUrl;
        await sendEmail({
          to: row.email,
          subject: String(row.title || "Weave notification"),
          html: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto"><h2>${escapeHtml(String(row.title || "Weave notification"))}</h2><p>${escapeHtml(String(row.message || ""))}</p><p><a href="${escapeHtml(href)}" style="display:inline-block;padding:10px 16px;background:#238636;color:#fff;text-decoration:none;border-radius:8px">Open Weave</a></p></div>`,
        });
      }));
    } catch (error) {
      console.error("Unable to schedule notification email", error);
    }
  });
}
