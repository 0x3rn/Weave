"use client";

import { SkillLedgerEntry } from "@/types";
import { ArrowRight, Wallet, ArrowUpRight, ArrowDownRight } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

export default function LedgerSnapshot({ ledger }: { ledger: SkillLedgerEntry[] }) {
  if (ledger.length === 0) return null;

  return (
    <div className="bg-surface border border-border rounded-[var(--radius-card)] shadow-subtle overflow-hidden">
      <div className="p-4 border-b border-border bg-background flex items-center justify-between">
        <h3 className="font-semibold text-heading flex items-center gap-2 text-sm tracking-tight">
          <Wallet className="w-5 h-5 text-primary" />
          Ledger Snapshot
        </h3>
        <Link href="/wallet" className="text-xs font-semibold text-primary hover:underline transition-colors">
          View All
        </Link>
      </div>
      <div className="divide-y divide-border">
        {ledger.map((entry) => {
          const isPositive = entry.amount > 0;
          return (
            <div key={entry.id} className="p-4 flex items-center justify-between hover:bg-background transition-colors">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center border shrink-0 ${
                  isPositive ? 'bg-success/10 border-success/20 text-success' : 'bg-error/10 border-error/20 text-error'
                }`}>
                  {isPositive ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                </div>
                <div>
                  <p className="text-sm font-medium text-heading line-clamp-1">{entry.reason}</p>
                  <p className="text-xs text-muted mt-0.5">
                    {formatDistanceToNow(new Date(entry.createdAt), { addSuffix: true })}
                  </p>
                </div>
              </div>
              <div className={`font-mono font-bold shrink-0 ${isPositive ? 'text-success' : 'text-error'}`}>
                {isPositive ? '+' : ''}{entry.amount}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
