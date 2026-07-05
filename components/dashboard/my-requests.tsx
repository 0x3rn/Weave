"use client";

import { ExchangeRequest } from "@/types";
import { ArrowRight, Inbox, Clock, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

export default function MyRequests({ requests, currentUserId }: { requests: ExchangeRequest[], currentUserId: string }) {
  if (requests.length === 0) return null;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending": return <Clock className="w-4 h-4 text-amber-500" />;
      case "reviewing": return <AlertCircle className="w-4 h-4 text-blue-500" />;
      case "accepted": return <CheckCircle2 className="w-4 h-4 text-success" />;
      case "rejected": return <XCircle className="w-4 h-4 text-error" />;
      default: return <Clock className="w-4 h-4 text-muted" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-amber-500/10 text-amber-600 border-amber-500/20";
      case "reviewing": return "bg-blue-500/10 text-blue-600 border-blue-500/20";
      case "accepted": return "bg-success/10 text-success border-success/20";
      case "rejected": return "bg-error/10 text-error border-error/20";
      default: return "bg-surface text-muted border-border";
    }
  };

  return (
    <div className="bg-surface border border-border rounded-[var(--radius-card)] shadow-subtle overflow-hidden">
      <div className="p-6 border-b border-border flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-heading flex items-center gap-2">
            <Inbox className="w-5 h-5 text-primary" />
            Exchange Requests
          </h2>
          <p className="text-sm text-body mt-1">Requests you've sent or received</p>
        </div>
        <Link href="/requests" className="text-sm font-medium text-primary hover:underline flex items-center gap-1">
          View All <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs uppercase text-muted bg-background border-b border-border">
            <tr>
              <th className="px-6 py-4 font-semibold">Skill Needed</th>
              <th className="px-6 py-4 font-semibold">Direction</th>
              <th className="px-6 py-4 font-semibold">Hours</th>
              <th className="px-6 py-4 font-semibold">Status</th>
              <th className="px-6 py-4 font-semibold">Date</th>
              <th className="px-6 py-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {requests.slice(0, 5).map((request) => {
              const isSent = request.senderId === currentUserId;
              
              return (
                <tr key={request.id} className="hover:bg-background transition-colors">
                  <td className="px-6 py-4 font-medium text-heading">
                    {request.skillNeeded}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-1 rounded-md text-xs font-medium ${
                      isSent ? 'bg-background border border-border text-muted' : 'bg-primary/10 text-primary border border-primary/20'
                    }`}>
                      {isSent ? "Sent" : "Received"}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-mono">
                    {request.hoursNeeded || 1}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border capitalize ${getStatusColor(request.status)}`}>
                      {getStatusIcon(request.status)}
                      {request.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-muted">
                    {formatDistanceToNow(new Date(request.createdAt), { addSuffix: true })}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link 
                      href={`/requests/${request.id}`}
                      className="inline-flex items-center justify-center px-3 py-1.5 text-xs font-medium bg-background border border-border rounded-[var(--radius-button)] hover:border-primary hover:text-primary transition-all"
                    >
                      View
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
