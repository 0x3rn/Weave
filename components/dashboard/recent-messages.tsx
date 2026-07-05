"use client";

import { MessageSquare, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function RecentMessages() {
  return (
    <div className="bg-surface border border-border rounded-[var(--radius-card)] shadow-subtle overflow-hidden">
      <div className="p-4 border-b border-border bg-background flex items-center justify-between">
        <h3 className="font-bold text-heading flex items-center gap-2 text-sm uppercase tracking-wider">
          <MessageSquare className="w-4 h-4 text-primary" />
          Recent Messages
        </h3>
      </div>
      <div className="p-8 text-center flex flex-col items-center justify-center text-muted">
        <MessageSquare className="w-8 h-8 opacity-50 mb-3" />
        <p className="text-sm">No recent messages.</p>
        <Link href="/messages" className="text-xs font-medium text-primary hover:underline mt-2">
          Open Inbox
        </Link>
      </div>
    </div>
  );
}
