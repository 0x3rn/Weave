import { getCurrentUserId } from "@/app/actions/user";
import { redirect } from "next/navigation";
import { payload, sql } from "@/lib/neon";
import { userFromRow } from "@/lib/users";
import { Escrow, Exchange, User } from "@/types";
import EscrowDetailsClient from "@/components/escrow/escrow-details-client";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Escrow Details | Weave"
};

export default async function EscrowDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const userId = await getCurrentUserId();
  if (!userId) redirect("/login");
  const { id } = await params;
  const [escrowRow] = await sql.query("select * from escrows where id=$1 and participants ? $2", [id, userId]);
  if (!escrowRow) redirect("/dashboard/escrow");
  const escrow = { ...payload<Record<string, unknown>>(escrowRow.payload), id: String(escrowRow.id), exchangeId: String(escrowRow.exchange_id), status: String(escrowRow.status), participants: escrowRow.participants, timeline: escrowRow.timeline } as Escrow;
  if (!escrow.participants[userId]) redirect("/dashboard/escrow");

  const [exchangeRow] = await sql.query("select * from exchanges where id=$1", [escrow.exchangeId]);
  if (!exchangeRow) redirect("/dashboard/escrow");
  const exchange = { ...payload<Record<string, unknown>>(exchangeRow.payload), id: String(exchangeRow.id), requesterId: String(exchangeRow.requester_id), providerId: String(exchangeRow.provider_id), title: String(exchangeRow.title), status: String(exchangeRow.status), skillHours: Number(exchangeRow.skill_hours ?? 0) } as Exchange;

  const usersMap: Record<string, User> = {};
  const userRows = await sql.query("select * from users where id=any($1::text[])", [[exchange.requesterId, exchange.providerId]]);
  userRows.forEach(row => { const user = userFromRow(row); usersMap[user.uid] = user; });

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <Link href="/dashboard/escrow" className="inline-flex items-center text-sm font-medium text-muted hover:text-primary transition-colors mb-6">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Escrows
      </Link>
      
      <EscrowDetailsClient 
        escrow={escrow} 
        exchange={exchange} 
        usersMap={usersMap} 
        currentUserId={userId} 
      />
    </div>
  );
}
