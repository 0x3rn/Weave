import { GetObjectCommand } from "@aws-sdk/client-s3";
import { requireAuth } from "@/app/actions/user";
import { adminSession, adminRequestContext } from "@/lib/admin-ops-access";
import { sql } from "@/lib/neon";
import { neonStorage, privateBucket } from "@/lib/neon-storage";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  try {
    const actor = await requireAuth(),
      p = new URL(request.url).searchParams,
      id = p.get("id"),
      event = p.get("event"),
      index = Number(p.get("index")),
      reason = p.get("reason") || "Review support attachment";
    if (!id || !event || !Number.isInteger(index) || index < 0 || index > 10)
      return new Response("Invalid request", { status: 400 });
    const [row] = await sql.query(
      "select t.user_id,c.attachments,c.actor_id,c.is_internal from support_tickets t join admin_case_events c on c.resource_id=t.id and c.resource_type='support'where t.id=$1 and c.id=$2::bigint",
      [id, event],
    );
    if (!row) return new Response("Not found", { status: 404 });
    if (row.user_id !== actor.uid) {
      await adminSession("support.read");
      if (row.is_internal) await adminSession("support.write");
      await sql.query(
        "select admin_ops_audit($1,'support',$2,'attachment_access',null,jsonb_build_object('event',$3::text),$4,$5,$6::jsonb)",
        [
          actor.uid,
          id,
          event,
          reason.slice(0, 1000),
          crypto.randomUUID(),
          JSON.stringify(await adminRequestContext()),
        ],
      );
    } else if (row.is_internal)
      return new Response("Not found", { status: 404 });
    const doc = Array.isArray(row.attachments) ? row.attachments[index] : null;
    if (!doc || typeof doc.url !== "string")
      return new Response("Not found", { status: 404 });
    const key = decodeURIComponent(
      doc.url.replace(/^\/api\/storage\/private\//, ""),
    );
    const prefix = "private/" + String(row.actor_id) + "/misc/";
    if (
      !key.startsWith(prefix) ||
      !/^[A-Za-z0-9._-]+$/.test(key.slice(prefix.length))
    )
      return new Response("Not found", { status: 404 });
    const file = await neonStorage().send(
      new GetObjectCommand({ Bucket: privateBucket(), Key: key }),
    );
    if (!file.Body) return new Response("Not found", { status: 404 });
    return new Response(file.Body.transformToWebStream(), {
      headers: {
        "content-type": "application/octet-stream",
        "content-disposition":
          'attachment; filename="' +
          String(doc.name || "attachment").replace(/[\r\n"\\]/g, "_") +
          '"',
        "cache-control": "private, no-store",
        "x-content-type-options": "nosniff",
        "content-security-policy": "sandbox; default-src 'none'",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
