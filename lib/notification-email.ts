import "server-only";
import { after } from "next/server";
import { sql } from "@/lib/neon";
import {
  notificationEvent,
  safeNotificationLink,
} from "./notification-catalog";
import { productivitySummary, summaryHtml } from "./notification-maintenance";
import { sendEmail } from "@/lib/email";
import { notificationSettings, inQuietHours } from "./settings";
function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
export async function deliverNotificationEmails() {
  const [templateRow] = await sql.query(
    "select value->>'emailTemplate' as template from platform_settings where section='notifications'",
  );
  const rows = await sql.query(
    `with due as(select q.notification_id from notification_email_queue q join users u on u.id=q.user_id where coalesce(u.account_status,'active')='active' and sent_at is null and due_at<=now() and attempts<8 and (claimed_at is null or claimed_at<now()-interval '10 minutes') order by due_at limit 100 for update of q skip locked), claimed as(update notification_email_queue q set claimed_at=now(),attempts=q.attempts+1 from due where q.notification_id=due.notification_id returning q.notification_id,q.user_id) select c.notification_id,c.user_id,n.why,n.title,n.message,n.link,n.notification_type,u.email,u.payload from claimed c join notifications n on n.id=c.notification_id join users u on u.id=c.user_id where coalesce(u.account_status,'active')='active'`,
  );
  const groups = new Map<string, typeof rows>();
  for (const row of rows) {
    const p = notificationSettings(
      (row.payload as Record<string, unknown>)?.notificationPreferences,
    );
    const frequency =
      row.notification_type === "message_received" &&
      p.messageFrequency !== "default"
        ? p.messageFrequency
        : p.digest;
    const key =
      String(row.user_id) +
      ":" +
      (notificationEvent(String(row.notification_type)).category === "Security"
        ? "security"
        : frequency);
    groups.set(key, [...(groups.get(key) || []), row]);
  }
  let sent = 0,
    failed = 0;
  for (const items of groups.values()) {
    const email = String(items[0].email);
    const allowed: typeof rows = [];
    for (const row of items) {
      const p = notificationSettings(
          (row.payload as Record<string, unknown>)?.notificationPreferences,
        ),
        security =
          notificationEvent(String(row.notification_type)).category ===
          "Security";
      const frequency =
        row.notification_type === "message_received" &&
        p.messageFrequency !== "default"
          ? p.messageFrequency
          : p.digest;
      if (
        (!p.events.email[String(row.notification_type)] && !security) ||
        (!security && frequency === "never")
      ) {
        await sql.query(
          "update notification_email_queue set sent_at=now(),claimed_at=null where notification_id=$1",
          [row.notification_id],
        );
        continue;
      }
      if (!security && inQuietHours(p)) {
        await sql.query(
          "update notification_email_queue set due_at=now()+interval '15 minutes',claimed_at=null,attempts=greatest(attempts-1,0) where notification_id=$1",
          [row.notification_id],
        );
        continue;
      }
      allowed.push(row);
    }
    if (!allowed.length) continue;
    const ids = allowed.map((row) => String(row.notification_id));
    try {
      if (!email.includes("@")) throw new Error("Missing recipient email");
      const origin = new URL(
        process.env.NEXT_PUBLIC_APP_URL || "https://weave.corstack.dev",
      ).origin;
      const content = allowed
        .map((row) => {
          const path =
            safeNotificationLink(
              typeof row.link === "string" ? row.link : undefined,
            ) || "/notifications";
          if (templateRow?.template) {
            const text = String(templateRow.template)
              .replaceAll("{{title}}", String(row.title))
              .replaceAll("{{message}}", String(row.message))
              .replaceAll("{{url}}", origin + path);
            return (
              "<section><p>" +
              escapeHtml(text).replaceAll("\n", "<br/>") +
              "</p></section>"
            );
          }
          return (
            "<section><h3>" +
            escapeHtml(String(row.title)) +
            "</h3><p>" +
            escapeHtml(String(row.message)) +
            "</p><p>" +
            escapeHtml(
              String(
                row.why || notificationEvent(String(row.notification_type)).why,
              ),
            ) +
            '</p><a href="' +
            escapeHtml(origin + path) +
            '">Open Weave</a></section>'
          );
        })
        .join("<hr/>");
      const preferences = notificationSettings(
        (allowed[0].payload as Record<string, unknown>)
          ?.notificationPreferences,
      );
      const digest =
        notificationEvent(String(allowed[0].notification_type)).category !==
          "Security" &&
        (allowed[0].notification_type === "message_received" &&
        preferences.messageFrequency !== "default"
          ? preferences.messageFrequency
          : preferences.digest) !== "instant";
      const overview = digest
        ? summaryHtml(await productivitySummary(String(allowed[0].user_id)))
        : "";
      const delivery = await sendEmail({
        to: email,
        subject:
          allowed.length === 1
            ? String(allowed[0].title)
            : "Your Weave activity digest",
        html:
          '<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto">' +
          overview +
          content +
          "</div>",
      });
      if (!delivery.success)
        throw new Error(delivery.error || "Email delivery failed");
      await sql.query(
        "update notification_email_queue set sent_at=now(),claimed_at=null where notification_id=any($1::text[])",
        [ids],
      );
      sent += allowed.length;
    } catch (error) {
      failed += allowed.length;
      console.error(
        "Notification email delivery failed",
        error instanceof Error ? error.message : "Unknown error",
      );
      await sql.query(
        "update notification_email_queue set due_at=now()+interval '15 minutes'*attempts,claimed_at=null where notification_id=any($1::text[])",
        [ids],
      );
    }
  }
  return { sent, failed };
}
export function scheduleNotificationEmails(ids: string[]) {
  if (!ids.length) return;
  after(async () => {
    try {
      await deliverNotificationEmails();
    } catch (error) {
      console.error("Unable to deliver queued notification email", error);
    }
  });
}
