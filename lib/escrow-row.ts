import { iso, payload } from "@/lib/neon";
import type { Escrow, EscrowEvent, EscrowParticipant } from "@/types";

export function escrowFromRow(row: Record<string, unknown>): Escrow {
  const participants = payload<Record<string, EscrowParticipant>>(row.participants);
  return {
    ...payload<Record<string, unknown>>(row.payload),
    id: String(row.id),
    exchangeId: String(row.exchange_id ?? ""),
    status: String(row.status ?? "locked") as Escrow["status"],
    participants,
    participantIds: Object.keys(participants),
    timeline: Array.isArray(row.timeline) ? row.timeline as EscrowEvent[] : [],
    dispute: row.dispute ?? undefined,
    createdAt: iso(row.created_at),
    updatedAt: iso(row.updated_at),
  } as Escrow;
}
