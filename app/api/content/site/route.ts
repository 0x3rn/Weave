import { publicSiteContent } from "@/lib/public-cms";
export const dynamic = "force-dynamic";
export async function GET() {
  try {
    return Response.json(await publicSiteContent(), {
      headers: { "cache-control": "public, max-age=30" },
    });
  } catch {
    return Response.json(
      { documents: [], settings: {} },
      { status: 503, headers: { "cache-control": "no-store" } },
    );
  }
}
