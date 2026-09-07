import { getPublicObject, isPublicObjectKey } from "@/lib/neon-storage";

export async function GET(_: Request, ctx: RouteContext<"/api/storage/public/[...key]">) {
  const { key: segments } = await ctx.params;
  const key = segments.join("/");
  if (!isPublicObjectKey(key)) return new Response("Not found", { status: 404 });

  try {
    const object = await getPublicObject(key);
    if (!object?.Body) return new Response("Not found", { status: 404 });
    const headers = new Headers({
      "Content-Type": object.ContentType || "application/octet-stream",
      "Cache-Control": object.CacheControl || "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    });
    if (object.ContentLength !== undefined) headers.set("Content-Length", String(object.ContentLength));
    return new Response(object.Body.transformToWebStream(), { headers });
  } catch (error) {
    if (error && typeof error === "object" && "$metadata" in error && (error as { $metadata?: { httpStatusCode?: number } }).$metadata?.httpStatusCode === 404) {
      return new Response("Not found", { status: 404 });
    }
    console.error("Unable to read public storage object", error);
    return new Response("Storage unavailable", { status: 503 });
  }
}
