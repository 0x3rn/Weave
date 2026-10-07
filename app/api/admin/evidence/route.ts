import { GetObjectCommand } from "@aws-sdk/client-s3";
import { sql } from "@/lib/neon";
import { neonStorage, privateBucket } from "@/lib/neon-storage";
import { adminSession, adminRequestContext } from "@/lib/admin-ops-access";
import { requireAdminEvidenceResource } from "@/lib/admin-evidence-scope";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  try {
    const p = new URL(request.url).searchParams,
      id = p.get("id"),
      area = p.get("area"),
      reason = p.get("reason") || "",
      index = Number(p.get("index"));
    if (
      !["verification", "exchanges", "disputes"].includes(area || "") ||
      !id ||
      id.length > 200 ||
      reason.trim().length < 3 ||
      reason.length > 1000 ||
      !Number.isInteger(index) ||
      index < 0 ||
      index > 100
    )
      return new Response("Invalid evidence request", { status: 400 });
    const session = await adminSession(
      area === "verification" ? "verification.sensitive" : "exchanges.messages",
    );
    await adminSession(
      area === "verification"
        ? "verification.read"
        : area === "disputes"
          ? "disputes.read"
          : "exchanges.read",
    );
    if (area !== "verification") {
      const [policy] = await sql.query(
        "select value->'messageInspection'as enabled from platform_settings where section='trust-safety'",
      );
      if (policy?.enabled !== true)
        return new Response("Inspection is disabled by platform policy", {
          status: 403,
        });
    }
    await requireAdminEvidenceResource(String(area), id);
    const [row] =
      area === "verification"
        ? await sql.query(
            "select user_id,documents from verification_requests where id=$1",
            [id],
          )
        : await sql.query(
            "select submitted_by as user_id,files as documents from exchange_deliveries where exchange_id=$1 and id=$2",
            [id, p.get("delivery")],
          );
    const doc = Array.isArray(row?.documents) ? row.documents[index] : null;
    if (!doc || typeof doc.url !== "string")
      return new Response("Not found", { status: 404 });
    const key = decodeURIComponent(
      doc.url.replace(/^\/api\/storage\/private\//, ""),
    );
    const escaped = (v: unknown) =>
      String(v).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const pattern =
      area === "verification"
        ? "^private/" + escaped(row.user_id) + "/misc/[A-Za-z0-9._-]+$"
        : "^exchanges/" +
          escaped(id) +
          "/" +
          escaped(row.user_id) +
          "/[A-Za-z0-9._-]+$";
    if (!new RegExp(pattern).test(key))
      return new Response("Not found", { status: 404 });
    await sql.query(
      "select admin_ops_audit($1,$7,$2,'document_download',null,jsonb_build_object('index',$3::integer),$4,$5,$6::jsonb)",
      [
        session.uid,
        id,
        index,
        reason.trim(),
        crypto.randomUUID(),
        JSON.stringify(await adminRequestContext()),
        area,
      ],
    );
    const object = await neonStorage().send(
      new GetObjectCommand({ Bucket: privateBucket(), Key: key }),
    );
    if (!object.Body) return new Response("Not found", { status: 404 });
    return new Response(object.Body.transformToWebStream(), {
      headers: {
        "content-type": "application/octet-stream",
        "content-disposition":
          'attachment; filename="' +
          String(doc.name || "document").replace(/[\r\n"\\]/g, "_") +
          '"',
        "cache-control": "private, no-store",
        "x-content-type-options": "nosniff",
        "content-security-policy": "sandbox; default-src 'none'",
      },
    });
  } catch {
    return new Response("Evidence unavailable or access denied", {
      status: 403,
    });
  }
}
