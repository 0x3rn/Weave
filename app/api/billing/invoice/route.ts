import { requireAuth } from "@/app/actions/user";
import { sql } from "@/lib/neon";
const escape = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
export async function GET(request: Request) {
  try {
    const { uid } = await requireAuth(),
      id = new URL(request.url).searchParams.get("id");
    const [row] = await sql.query(
      "select e.id,e.description,e.amount,e.currency,e.occurred_at,u.full_name,u.email from billing_events e join users u on u.id=e.user_id where e.id=$1 and e.user_id=$2",
      [id || "", uid],
    );
    if (!row)
      return Response.json({ error: "Invoice not found" }, { status: 404 });
    const amount = new Intl.NumberFormat("en", {
      style: "currency",
      currency: String(row.currency),
    }).format(Number(row.amount) / 100);
    const html = `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Weave payment invoice</title><style>body{font:16px system-ui;margin:40px auto;max-width:700px;padding:24px;color:#17211b}table{width:100%;border-collapse:collapse}td,th{text-align:left;padding:16px 0;border-bottom:1px solid #ddd}footer{margin-top:32px;color:#666}</style><h1>Weave payment invoice</h1><p>Reference: ${escape(String(row.id))}</p><p>Date: ${escape(new Date(row.occurred_at).toLocaleDateString("en-GB"))}</p><p>Billed to: ${escape(String(row.full_name || "Member"))}<br>${escape(String(row.email || ""))}</p><table><thead><tr><th>Description</th><th>Paid</th></tr></thead><tbody><tr><td>${escape(String(row.description))}</td><td>${escape(amount)}</td></tr></tbody></table><footer>Payment processed by Paystack. Keep this record for your account history.</footer></html>`;
    return new Response(html, {
      headers: {
        "content-type": "text/html; charset=utf-8",
        "content-disposition": 'attachment; filename="weave-invoice.html"',
        "cache-control": "private, no-store",
        "content-security-policy":
          "default-src 'none'; style-src 'unsafe-inline'",
        "x-content-type-options": "nosniff",
      },
    });
  } catch {
    return Response.json(
      { error: "Sign in to download this invoice" },
      { status: 401 },
    );
  }
}
