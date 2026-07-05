"use client";

import { Exchange } from "@/types";
import { formatDistanceToNow } from "date-fns";
import { CheckCircle2, Search } from "lucide-react";
import Link from "next/link";

interface RecentExchangesProps {
  exchanges: Exchange[];
  isOwner: boolean;
}

export default function RecentExchanges({ exchanges, isOwner }: RecentExchangesProps) {
  return (
    <section>
      <div className="flex items-center justify-between mb-6 border-b border-border pb-2">
        <h2 className="text-2xl font-bold text-heading">Recent Exchanges</h2>
      </div>

      {exchanges.length > 0 ? (
        <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
          {exchanges.map((exchange, idx) => (
            <div key={exchange.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
              
              {/* Timeline dot */}
              <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-background bg-surface-secondary text-primary shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 relative z-10">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              
              {/* Card */}
              <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-background border border-border p-4 rounded-[var(--radius-card)] shadow-subtle flex flex-col">
                <div className="flex items-start justify-between mb-2 gap-4">
                  <h3 className="font-bold text-heading text-base truncate">{exchange.title}</h3>
                  <span className="shrink-0 font-bold text-sm text-primary whitespace-nowrap bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">
                    {exchange.skillHours} Hours
                  </span>
                </div>
                <p className="text-xs text-muted">
                  Completed {exchange.completedAt ? formatDistanceToNow(new Date(exchange.completedAt), { addSuffix: true }) : "recently"}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-background border border-border rounded-[var(--radius-card)] p-8 text-center flex flex-col items-center justify-center">
          <div className="w-12 h-12 bg-surface-secondary rounded-full flex items-center justify-center mb-4 border border-border">
            <Search className="w-5 h-5 text-muted" />
          </div>
          <h3 className="text-lg font-bold text-heading mb-2">No Exchanges</h3>
          <p className="text-body text-sm max-w-sm mx-auto mb-6">
            {isOwner 
              ? "You haven't completed any public exchanges yet." 
              : "This user hasn't completed any public exchanges yet."}
          </p>
          {isOwner && (
            <Link 
              href="/marketplace" 
              className="px-6 py-2.5 bg-primary text-surface font-bold text-sm rounded-[var(--radius-button)] hover:bg-primary-hover transition-colors shadow-subtle"
            >
              Browse Marketplace
            </Link>
          )}
        </div>
      )}
    </section>
  );
}
