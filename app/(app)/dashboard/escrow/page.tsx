import { getCurrentUserId } from "@/app/actions/user";
import { getActiveEscrows } from "@/app/actions/escrow";
import { redirect } from "next/navigation";
import EscrowDashboardClient from "@/components/escrow/escrow-dashboard-client";
import { payload, sql } from "@/lib/neon";
import { Exchange } from "@/types";

export const metadata = {
  title: "Escrow Dashboard | Weave"
};

export default async function EscrowDashboardPage() {
  const userId = await getCurrentUserId();
  if (!userId) redirect("/login");

  const result = await getActiveEscrows();
  const escrows = result.success ? (result.escrows || []) : [];

  // Fetch exchange details for each escrow
  const exchangeMap: Record<string, Exchange> = {};
  if (escrows.length > 0) {
    const exchangeIds = escrows.map(e => e.exchangeId);
    const rows = await sql.query("select * from exchanges where id=any($1::text[])", [exchangeIds]);
    rows.forEach(row => { exchangeMap[String(row.id)] = { ...payload<Record<string, unknown>>(row.payload), id: String(row.id), requesterId: String(row.requester_id ?? ""), providerId: String(row.provider_id ?? ""), title: String(row.title ?? ""), status: String(row.status ?? ""), skillHours: Number(row.skill_hours ?? 0) } as Exchange; });
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-heading mb-2">Escrow</h1>
        <p className="text-muted">Every active exchange is protected through Weave Escrow, ensuring fair collaboration and transparent resolution.</p>
      </div>

      <EscrowDashboardClient initialEscrows={escrows} exchangeMap={exchangeMap} currentUserId={userId} />
    </div>
  );
}
