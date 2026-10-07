"use server";
import { sql } from "@/lib/neon";
import { adminSession, adminRequestContext } from "@/lib/admin-ops-access";
import { requireAdminEvidenceResource } from "@/lib/admin-evidence-scope";
export async function inspectAdminEvidence(
  area: string,
  id: string,
  reason: string,
) {
  if (
    !["verification", "exchanges", "disputes", "reports"].includes(area) ||
    typeof id !== "string" ||
    id.length > 200 ||
    typeof reason !== "string" ||
    reason.trim().length < 3 ||
    reason.length > 1000
  )
    throw new Error("A resource and inspection reason are required");
  const session = await adminSession(
    area === "verification" ? "verification.sensitive" : "exchanges.messages",
  );
  await adminSession(
    area === "verification"
      ? "verification.read"
      : area === "disputes"
        ? "disputes.read"
        : area === "reports"
          ? "reports.read"
          : "exchanges.read",
  );
  if (area !== "verification") {
    const [policy] = await sql.query(
      "select value->'messageInspection' as enabled from platform_settings where section='trust-safety'",
    );
    if (policy?.enabled !== true)
      throw new Error("Message inspection is disabled by platform policy");
  }
  await requireAdminEvidenceResource(area, id);
  await sql.query(
    "select admin_ops_audit($1,$2,$3,'evidence_access',null,null,$4,$5,$6::jsonb)",
    [
      session.uid,
      area,
      id,
      reason.trim(),
      crypto.randomUUID(),
      JSON.stringify(await adminRequestContext()),
    ],
  );
  if (area === "verification") {
    const [row] = await sql.query(
      "select documents from verification_requests where id=$1",
      [id],
    );
    if (!row) throw new Error("Verification request not found");
    return {
      documents: (Array.isArray(row.documents) ? row.documents : []).map(
        (doc: Record<string, unknown>, index: number) => ({
          name: String(doc.name || "Document"),
          href:
            "/api/admin/evidence?area=verification&id=" +
            encodeURIComponent(id) +
            "&index=" +
            index +
            "&reason=" +
            encodeURIComponent(reason.trim()),
        }),
      ),
      messages: [],
    };
  }
  let messages: Record<string, unknown>[] = [];
  if (area === "reports")
    messages = await sql.query(
      "select m.id,m.sender_id,m.content,m.created_at from platform_reports r join messages reported on r.resource_type='message'and reported.id=r.resource_id join messages m on m.conversation_id=reported.conversation_id where r.id=$1 and m.created_at between reported.created_at-interval '10 minutes'and reported.created_at+interval '10 minutes' order by m.created_at limit 100",
      [id],
    );
  else
    messages = await sql.query(
      "select m.id,m.sender_id,m.content,m.created_at from messages m join conversations c on c.id=m.conversation_id join exchanges e on e.id=$1 where c.conversation_type='exchange' and c.context_id=e.id order by m.created_at desc limit 100",
      [id],
    );
  const files =
    area === "exchanges" || area === "disputes"
      ? await sql.query(
          "select d.id,d.submitted_by,file.value as document,file.ordinality-1 as index from exchange_deliveries d cross join lateral jsonb_array_elements(d.files)with ordinality file(value,ordinality)where d.exchange_id=$1 order by d.submitted_at desc limit 100",
          [id],
        )
      : [];
  return {
    documents: files.map((row) => ({
      name: String(row.document?.name || "Deliverable"),
      href:
        "/api/admin/evidence?area=" +
        area +
        "&id=" +
        encodeURIComponent(id) +
        "&delivery=" +
        encodeURIComponent(String(row.id)) +
        "&index=" +
        row.index +
        "&reason=" +
        encodeURIComponent(reason.trim()),
    })),
    messages: messages.map((row) => ({
      id: String(row.id),
      sender: String(row.sender_id || "Member"),
      content: String(row.content || ""),
      date: String(row.created_at || ""),
    })),
  };
}
