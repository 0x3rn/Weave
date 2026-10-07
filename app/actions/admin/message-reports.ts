"use server";

import { sql, iso } from "@/lib/neon";
import { adminSession } from "@/lib/admin-ops-access";
import { mutateAdminRecord } from "./operations";

export async function getMessageReports() {
  await adminSession("reports.read");
  const rows = await sql.query(
    `select r.id,r.reason,r.status,r.created_at,r.conversation_id,'Private evidence requires logged access' as content,m.created_at as message_created_at,
      coalesce(reporter.full_name,reporter.username,'Member') as reporter_name,
      coalesce(sender.full_name,sender.username,'Member') as sender_name
     from message_reports r join messages m on m.id=r.message_id
     left join users reporter on reporter.id=r.reporter_id left join users sender on sender.id=m.sender_id
     order by case r.status when 'open' then 0 else 1 end,r.created_at desc limit 200`,
  );
  return rows.map((row) => ({
    id: String(row.id),
    reason: String(row.reason),
    status: String(row.status),
    createdAt: iso(row.created_at),
    conversationId: String(row.conversation_id),
    content: String(row.content ?? ""),
    messageCreatedAt: iso(row.message_created_at),
    reporterName: String(row.reporter_name),
    senderName: String(row.sender_name),
  }));
}

export async function resolveMessageReport(id: string, reason = "") {
  await adminSession("reports.write");
  if (!/^[A-Za-z0-9-]{1,128}$/.test(id)) throw new Error("Invalid report");
  return mutateAdminRecord({
    area: "reports",
    id: "message-" + id,
    action: "resolve",
    data: {},
    reason,
    operationId: crypto.randomUUID(),
  });
}
