import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyFirebaseSessionCookie } from "@/lib/firebase-auth-server";
import { sql } from "@/lib/neon";
import { RecoveryClient } from "@/components/settings/recovery-client";
export default async function Page() {
  const token = (await cookies()).get("session")?.value;
  if (!token) redirect("/login");
  const claims = await verifyFirebaseSessionCookie(token, true);
  const [row] = await sql.query(
    "select coalesce(u.account_status,'active') as status,d.delete_after from users u left join account_deletion_requests d on d.user_id=u.id where u.id=$1",
    [claims.uid],
  );
  if (row?.status === "active") redirect("/dashboard");
  return (
    <RecoveryClient
      status={String(row?.status || "deleted")}
      deleteAfter={
        row?.delete_after ? new Date(row.delete_after).toISOString() : undefined
      }
    />
  );
}
