import { adminSession } from "@/lib/admin-ops-access";
import { hasPermission } from "@/lib/admin-ops-types";
import { sql } from "@/lib/neon";
import { notFound } from "next/navigation";
import Link from "next/link";
export const dynamic = "force-dynamic";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const s = await adminSession();
  if (
    !["verification.read", "support.read", "legacy.manage"].some((p) =>
      hasPermission(s.permissions, p),
    )
  )
    throw new Error("Forbidden");
  const { id } = await params;
  const [u] = await sql.query(
    "select id,full_name,username,email,account_status,is_verified,trust_score,skill_hours,created_at from users where id=$1",
    [id],
  );
  if (!u) notFound();
  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold">Member context</h1>
      <dl className="grid gap-4 md:grid-cols-2">
        {Object.entries(u).map(([key, value]) => (
          <div key={key} className="rounded-lg border border-border p-3">
            <dt className="text-sm text-muted">{key.replaceAll("_", " ")}</dt>
            <dd>{String(value ?? "—")}</dd>
          </div>
        ))}
      </dl>
      <div className="flex gap-4">
        {hasPermission(s.permissions, "verification.read") && (
          <Link
            href={
              "/admin/verification?q=" + encodeURIComponent(String(u.email))
            }
            className="text-primary"
          >
            Verification records
          </Link>
        )}
        {hasPermission(s.permissions, "support.read") && (
          <Link
            href={
              "/admin/support?q=" +
              encodeURIComponent(String(u.full_name || ""))
            }
            className="text-primary"
          >
            Support tickets
          </Link>
        )}
      </div>
    </div>
  );
}
