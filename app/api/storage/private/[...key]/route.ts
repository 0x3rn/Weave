import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getCurrentUserId } from "@/app/actions/user";
import { sql } from "@/lib/neon";
import { neonStorage, privateBucket } from "@/lib/neon-storage";

type ReadPermission = { allowed: boolean; preview: boolean; filename: string };

async function getReadPermission(key: string, userId: string, wantsPreview: boolean): Promise<ReadPermission> {
  const messageMatch = /^messages\/([A-Za-z0-9_-]{1,128})\/[A-Za-z0-9_-]+\/[A-Za-z0-9._-]+$/.exec(key);
  if (messageMatch) {
    const [attachment] = await sql.query(
      `select a.original_name from message_attachments a
       join conversation_participants p on p.conversation_id=a.conversation_id
       where a.object_key=$1 and a.conversation_id=$2 and p.user_id=$3 limit 1`,
      [key, messageMatch[1], userId],
    );
    return attachment
      ? { allowed: true, preview: wantsPreview, filename: String(attachment.original_name || "file") }
      : { allowed: false, preview: false, filename: "file" };
  }
  const ownerMatch = /^private\/([^/]+)\/(?:deliverables|misc)\/[A-Za-z0-9._-]+$/.exec(key);
  if (ownerMatch) return { allowed: ownerMatch[1] === userId, preview: false, filename: key.split("/").at(-1) || "file" };

  const exchangeMatch = /^exchanges\/([^/]+)\/[^/]+\/[A-Za-z0-9._-]+$/.exec(key);
  if (!exchangeMatch) return { allowed: false, preview: false, filename: "file" };
  const storedUrl = `/api/storage/private/${key.split("/").map(encodeURIComponent).join("/")}`;
  const [record] = await sql.query(
    `select e.status,e.reveal_at,e.files_released_at,e.requester_id,e.provider_id,d.submitted_by,
       exists(select 1 from users u where u.id=$2 and (u.role='Admin' or coalesce((u.payload->>'isAdmin')::boolean,false))) as is_admin,
       coalesce(file.value->>'name','file') as filename
     from exchanges e join exchange_deliveries d on d.exchange_id=e.id
     cross join lateral jsonb_array_elements(d.files) file(value)
     where e.id=$1 and file.value->>'url'=$3 and (d.is_current or d.submitted_by=$2)
       and ($2 in(e.requester_id,e.provider_id) or exists(select 1 from users u where u.id=$2 and (u.role='Admin' or coalesce((u.payload->>'isAdmin')::boolean,false)))
     limit 1`,
    [exchangeMatch[1], userId, storedUrl],
  );
  if (!record) return { allowed: false, preview: false, filename: "file" };
  const isOwner = String(record.submitted_by) === userId;
  const isAdmin = record.is_admin === true;
  const released = Boolean(record.files_released_at) || record.status === "completed";
  const reviewOpen = record.status === "in_review" && Boolean(record.reveal_at);
  const allowed = isOwner || isAdmin || (wantsPreview ? reviewOpen : released);
  return { allowed, preview: wantsPreview && !released && !isOwner, filename: String(record.filename || "file") };
}

export async function GET(request: Request, ctx: { params: Promise<{ key: string[] }> }) {
  const userId = await getCurrentUserId();
  const { key: segments } = await ctx.params;
  const key = segments.join("/");
  const wantsPreview = new URL(request.url).searchParams.get("mode") === "preview";
  if (!userId) return new Response("Not found", { status: 404 });
  const permission = await getReadPermission(key, userId, wantsPreview);
  if (!permission.allowed) return new Response("Not found", { status: 404 });

  try {
    const object = await neonStorage().send(new GetObjectCommand({ Bucket: privateBucket(), Key: key }));
    if (!object.Body) return new Response("Not found", { status: 404 });
    const contentType = object.ContentType || "application/octet-stream";
    const previewable = contentType.startsWith("image/") || contentType === "application/pdf" || contentType.startsWith("text/") || contentType === "application/json";
    if (wantsPreview && !previewable) return new Response("Preview is unavailable for this file type", { status: 415 });
    const safeType = contentType.startsWith("text/") || contentType === "application/json" ? "text/plain; charset=utf-8" : contentType;
    const filename = permission.filename.replace(/[\r\n"\\]/g, "_");
    const headers = new Headers({
      "Content-Type": safeType,
      "Cache-Control": "private, no-store",
      "Content-Disposition": `${wantsPreview ? "inline" : "attachment"}; filename="${filename}"`,
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "sandbox; default-src 'none'; img-src 'self' data: blob:; style-src 'unsafe-inline'",
      "Referrer-Policy": "no-referrer",
    });
    if (object.ContentLength !== undefined) headers.set("Content-Length", String(object.ContentLength));
    return new Response(object.Body.transformToWebStream(), { headers });
  } catch (error) {
    if (
      error && typeof error === "object" && "$metadata" in error &&
      (error as { $metadata?: { httpStatusCode?: number } }).$metadata?.httpStatusCode === 404
    ) return new Response("Not found", { status: 404 });
    console.error("Unable to read private storage object", error);
    return new Response("Storage unavailable", { status: 503 });
  }
}
