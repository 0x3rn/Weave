"use client";

import { Exchange } from "@/types";
import { ArrowRight, Clock, RefreshCcw, Handshake } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

export default function ActiveExchanges({ exchanges, currentUserId }: { exchanges: Exchange[], currentUserId: string }) {
  if (exchanges.length === 0) return null;

  return (
    <div className="bg-surface border border-border rounded-[var(--radius-card)] shadow-subtle overflow-hidden">
      <div className="p-6 border-b border-border flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-heading flex items-center gap-2">
            <RefreshCcw className="w-5 h-5 text-primary" />
            Active Exchanges
          </h2>
          <p className="text-sm text-body mt-1">Exchanges currently in progress</p>
        </div>
        <Link href="/exchanges" className="text-sm font-medium text-primary hover:underline flex items-center gap-1">
          View All <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs uppercase text-muted bg-background border-b border-border">
            <tr>
              <th className="px-6 py-4 font-semibold">Project</th>
              <th className="px-6 py-4 font-semibold">Role</th>
              <th className="px-6 py-4 font-semibold">Hours</th>
              <th className="px-6 py-4 font-semibold">Status</th>
              <th className="px-6 py-4 font-semibold">Started</th>
              <th className="px-6 py-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {exchanges.map((exchange) => {
              const isProvider = exchange.providerId === currentUserId;
              
              return (
                <tr key={exchange.id} className="hover:bg-background transition-colors">
                  <td className="px-6 py-4 font-medium text-heading">
                    {exchange.title}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-1 rounded-md text-xs font-medium ${
                      isProvider ? 'bg-primary/10 text-primary' : 'bg-blue-500/10 text-blue-500'
                    }`}>
                      {isProvider ? "Provider" : "Receiver"}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-mono font-semibold">
                    {exchange.skillHours}
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-600 dark:text-amber-500 border border-amber-500/20 capitalize">
                      <Clock className="w-3 h-3" />
                      {exchange.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-muted">
                    {formatDistanceToNow(new Date(exchange.createdAt), { addSuffix: true })}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link 
                      href={`/exchanges/${exchange.id}`}
                      className="inline-flex items-center justify-center px-3 py-1.5 text-xs font-medium bg-background border border-border rounded-[var(--radius-button)] hover:border-primary hover:text-primary transition-all"
                    >
                      Workspace
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
