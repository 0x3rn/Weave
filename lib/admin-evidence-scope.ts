import "server-only";
import { sql } from "./neon";

/** A caller's page permission never grants access to arbitrary conversations. */
export async function requireAdminEvidenceResource(area: string, id: string) {
  const [row] = await sql.query(
    area === "verification"
      ? "select id from verification_requests where id=$1"
      : area === "reports"
        ? "select id from platform_reports where id=$1"
        : area === "disputes"
          ? "select e.id from exchanges e join admin_dispute_cases d on d.exchange_id=e.id where e.id=$1"
          : "select id from exchanges where id=$1",
    [id],
  );
  if (!row) throw new Error("Evidence resource not found");
}
