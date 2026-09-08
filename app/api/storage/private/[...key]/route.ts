import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getCurrentUserId } from "@/app/actions/user";
import { sql } from "@/lib/neon";
import { neonStorage, privateBucket } from "@/lib/neon-storage";

async function canRead(key: string, userId: string) {
  const ownerMatch = /^private\/([^/]+)\/(?:deliverables|misc)\/[A-Za-z0-9._-]+$/.exec(key);
  if (ownerMatch) return ownerMatch[1] === userId;

  const exchangeMatch = /^exchanges\/([^/]+)\/[^/]+\/[A-Za-z0-9._-]+$/.exec(key);
  if (!exchangeMatch) return false;
  const [exchange] = await sql.query(
    "select id from exchanges where id=$1 and (requester_id=$2 or provider_id=$2)",
    [exchangeMatch[1], userId],
  );
  return Boolean(exchange);
}

export async function GET(_: Request, ctx: { params: Promise<{ key: string[] }> }) {
  const userId = await getCurrentUserId();
  const { key: segments } = await ctx.params;
  const key = segments.join("/");
  if (!userId || !(await canRead(key, userId))) return new Response("Not found", { status: 404 });

  try {
    const object = await neonStorage().send(new GetObjectCommand({ Bucket: privateBucket(), Key: key }));
    if (!object.Body) return new Response("Not found", { status: 404 });
    const headers = new Headers({
      "Content-Type": object.ContentType || "application/octet-stream",
      "Cache-Control": "private, no-store",
      "Content-Disposition": "attachment",
      "X-Content-Type-Options": "nosniff",
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
