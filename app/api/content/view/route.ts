import { cookies } from "next/headers";
import { sql } from "@/lib/neon";
import { publishedPredicate } from "@/lib/public-cms";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try {
    if (request.headers.get("origin") !== new URL(request.url).origin)
      return new Response("Invalid origin", { status: 403 });
    const input = (await request.json()) as { id?: unknown };
    if (typeof input.id !== "string" || input.id.length > 200)
      return new Response("Invalid document", { status: 400 });
    const cookieStore = await cookies();
    let visitor = cookieStore.get("weave-content-visitor")?.value;
    if (!visitor || !/^[a-f0-9-]{36}$/.test(visitor)) {
      visitor = crypto.randomUUID();
      cookieStore.set("weave-content-visitor", visitor, {
        httpOnly: true,
        secure: new URL(request.url).protocol === "https:",
        sameSite: "strict",
        path: "/",
        maxAge: 86400 * 30,
      });
    }
    await sql.query(
      `with added as(insert into cms_view_events(document_id,visitor_hash)select d.id,md5($2)from cms_documents d where d.id=$1 and ${publishedPredicate}on conflict do nothing returning document_id)update cms_documents d set views=views+1 from added a where d.id=a.document_id`,
      [input.id, visitor],
    );
    return new Response(null, { status: 204 });
  } catch {
    return new Response("View unavailable", { status: 503 });
  }
}
