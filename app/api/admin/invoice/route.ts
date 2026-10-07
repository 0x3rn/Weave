import { adminSession, adminRequestContext } from "@/lib/admin-ops-access";
import { sql } from "@/lib/neon";
export const dynamic = "force-dynamic";
const escape = (v: unknown) =>
  String(v ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
export async function GET(request: Request) {
  try {
    const s = await adminSession("subscriptions.read"),
      id = new URL(request.url).searchParams.get("id");
    if (!id || id.length > 200)
      return new Response("Invalid receipt", { status: 400 });
    const [row] = await sql.query(
      "select e.id,e.user_id,e.description,e.amount,e.currency,e.provider,e.event_type,e.occurred_at,u.full_name,u.email from billing_events e join users u on u.id=e.user_id where e.id=$1",
      [id],
    );
    if (!row) return new Response("Not found", { status: 404 });
    const [policy] = await sql.query(
      "select value->>'invoicePrefix' as prefix from platform_settings where section='billing'",
    );
    await sql.query(
      "select admin_ops_audit($1,'subscriptions',$2,'receipt_download',null,jsonb_build_object('payment',$3::text),'Download recorded payment receipt',$4,$5::jsonb)",
      [
        s.uid,
        row.user_id,
        id,
        crypto.randomUUID(),
        JSON.stringify(await adminRequestContext()),
      ],
    );
    const html =
      '<!doctype html><html lang="en"><meta charset="utf-8"><title>Payment receipt</title><body><h1>Weave payment receipt</h1><dl>' +
      Object.entries({
        Receipt: String(policy?.prefix || "WEAVE") + "-" + id,
        Member: row.full_name,
        Email: row.email,
        Description: row.description,
        Type: row.event_type,
        Amount:
          String(row.currency) + " " + (Number(row.amount) / 100).toFixed(2),
        Provider: row.provider,
        Date: row.occurred_at,
      })
        .map(
          ([key, v]) =>
            "<dt>" + escape(key) + "</dt><dd>" + escape(v) + "</dd>",
        )
        .join("") +
      "</dl></body></html>";
    return new Response(html, {
      headers: {
        "content-type": "text/html; charset=utf-8",
        "content-disposition": 'attachment; filename="weave-receipt.html"',
        "cache-control": "private, no-store",
        "x-content-type-options": "nosniff",
        "content-security-policy": "sandbox; default-src 'none'",
      },
    });
  } catch {
    return new Response("Receipt unavailable", { status: 403 });
  }
}
