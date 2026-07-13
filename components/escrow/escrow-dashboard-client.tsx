"use client";

import { Escrow, Exchange } from "@/types";
import { Check, Clock, AlertCircle, ShieldCheck, ChevronRight } from "lucide-react";
import Link from "next/link";

interface Props {
  initialEscrows: Escrow[];
  exchangeMap: Record<string, Exchange>;
  currentUserId: string;
}

export default function EscrowDashboardClient({ initialEscrows, exchangeMap, currentUserId }: Props) {
  
  const activeEscrows = initialEscrows.filter(e => e.status !== "released" && e.status !== "cancelled" && e.status !== "refunded");
  
  // Calculate metrics
  let fundsHeld = 0;
  let hoursReserved = 0;
  let pendingReleases = 0;
  let activeCount = activeEscrows.length;
  let disputesCount = 0;
  let depositsMissing = 0;

  activeEscrows.forEach(escrow => {
    if (escrow.status === "disputed") disputesCount++;
    if (escrow.status === "revision_required") pendingReleases++; // Close to release
    
    // Add up funds and hours for the current user
    const myParticipant = escrow.participants[currentUserId];
    if (myParticipant) {
      if (myParticipant.depositStatus === "received") {
        fundsHeld += myParticipant.securityDepositAmount;
      } else {
        depositsMissing++;
      }
      if (myParticipant.depositStatus === "received") {
        hoursReserved += myParticipant.skillHoursReserved;
      }
    }
  });

  return (
    <div className="space-y-8">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-surface border border-border p-6 rounded-[var(--radius-card)] shadow-subtle">
          <span className="text-sm font-bold text-muted uppercase tracking-wider block mb-2">Active Escrows</span>
          <span className="text-3xl font-black text-heading">{activeCount}</span>
        </div>
        <div className="bg-surface border border-border p-6 rounded-[var(--radius-card)] shadow-subtle">
          <span className="text-sm font-bold text-muted uppercase tracking-wider block mb-2">Funds Held</span>
          <span className="text-3xl font-black text-heading">${fundsHeld}</span>
        </div>
        <div className="bg-surface border border-border p-6 rounded-[var(--radius-card)] shadow-subtle">
          <span className="text-sm font-bold text-muted uppercase tracking-wider block mb-2">Hours Reserved</span>
          <span className="text-3xl font-black text-heading">{hoursReserved} <span className="text-lg font-medium text-muted lowercase">hours</span></span>
        </div>
        <div className="bg-surface border border-border p-6 rounded-[var(--radius-card)] shadow-subtle">
          <span className="text-sm font-bold text-muted uppercase tracking-wider block mb-2">Pending Releases</span>
          <span className="text-3xl font-black text-primary">{pendingReleases}</span>
        </div>
      </div>

      {/* Escrow Health */}
      <div className="bg-primary/5 border border-primary/20 p-8 rounded-[var(--radius-card)]">
        <h2 className="text-xl font-bold text-primary mb-4 flex items-center gap-2">
          <ShieldCheck className="w-6 h-6" />
          Protected Exchanges
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${disputesCount === 0 ? "bg-primary text-surface" : "bg-error text-surface"}`}>
              {disputesCount === 0 ? <Check className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            </div>
            <div>
              <p className="font-bold text-heading">{disputesCount === 0 ? "No disputes" : `${disputesCount} Dispute(s)`}</p>
              <p className="text-sm text-muted">Active investigations</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${depositsMissing === 0 ? "bg-primary text-surface" : "bg-warning text-surface"}`}>
              {depositsMissing === 0 ? <Check className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
            </div>
            <div>
              <p className="font-bold text-heading">{depositsMissing === 0 ? "All deposits received" : `${depositsMissing} Deposit(s) pending`}</p>
              <p className="text-sm text-muted">Security requirements</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary text-surface flex items-center justify-center">
              <Check className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-heading">On schedule</p>
              <p className="text-sm text-muted">Delivery timelines</p>
            </div>
          </div>
        </div>
      </div>

      {/* Active Escrows Table */}
      <div className="bg-surface border border-border rounded-[var(--radius-card)] overflow-hidden">
        <div className="px-6 py-4 border-b border-border bg-surface-secondary">
          <h2 className="text-lg font-bold text-heading">Active Escrows</h2>
        </div>
        
        {activeEscrows.length === 0 ? (
          <div className="p-12 text-center text-muted">
            <ShieldCheck className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p>You have no active escrow contracts.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-surface text-xs font-bold uppercase tracking-wider text-muted">
                  <th className="p-4 pl-6">Exchange</th>
                  <th className="p-4">Deposit</th>
                  <th className="p-4">Skill Hours</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Created</th>
                  <th className="p-4 pr-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {activeEscrows.map(escrow => {
                  const exchange = exchangeMap[escrow.exchangeId];
                  const title = exchange?.title || "Unknown Exchange";
                  
                  const pArr = Object.values(escrow.participants);
                  const req = pArr.find(p => p.role === "requester")!;
                  const prov = pArr.find(p => p.role === "provider")!;
                  
                  // Format: 6 ↔ 6 for mutual, or 6 → 0 for single
                  const hoursStr = exchange?.isMutual ? 
                    `${req?.skillHoursReserved} ↔ ${prov?.skillHoursReserved}` : 
                    `${req?.skillHoursReserved} hrs`;

                  const depositStr = `$${req?.securityDepositAmount + prov?.securityDepositAmount}`;

                  return (
                    <tr key={escrow.id} className="hover:bg-surface-secondary/50 transition-colors">
                      <td className="p-4 pl-6 font-medium text-heading truncate max-w-[200px]">{title}</td>
                      <td className="p-4 text-body">{depositStr}</td>
                      <td className="p-4 text-body">{hoursStr}</td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded text-xs font-bold uppercase tracking-wide
                          ${escrow.status === "locked" ? "bg-primary/10 text-primary" : 
                            escrow.status === "pending_deposits" ? "bg-warning/10 text-warning" :
                            escrow.status === "disputed" ? "bg-error/10 text-error" : 
                            "bg-surface-secondary text-muted"}`}>
                          {escrow.status.replace("_", " ")}
                        </span>
                      </td>
                      <td className="p-4 text-muted text-sm">
                        {new Date(escrow.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </td>
                      <td className="p-4 pr-6 text-right">
                        <Link 
                          href={`/dashboard/escrow/${escrow.id}`}
                          className="inline-flex items-center justify-center p-2 rounded-[var(--radius-button)] text-primary hover:bg-primary/10 transition-colors"
                        >
                          <span className="sr-only">View</span>
                          <ChevronRight className="w-5 h-5" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
