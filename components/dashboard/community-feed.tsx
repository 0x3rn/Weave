"use client";

import { Users, PartyPopper, Star, ShieldCheck } from "lucide-react";

export default function CommunityFeed() {
  // Hardcoded UI as a placeholder since we don't have a feed collection yet.
  return (
    <div className="bg-surface border border-border rounded-[var(--radius-card)] shadow-subtle overflow-hidden">
      <div className="p-4 border-b border-border bg-background">
        <h3 className="font-bold text-heading flex items-center gap-2 text-sm uppercase tracking-wider">
          <Users className="w-4 h-4 text-primary" />
          Community Feed
        </h3>
      </div>
      <div className="divide-y divide-border">
        <div className="p-4 flex gap-3 text-sm">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <PartyPopper className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="text-heading"><span className="font-bold">Emma</span> completed 50 exchanges!</p>
            <p className="text-xs text-muted mt-1">2 hours ago</p>
          </div>
        </div>
        <div className="p-4 flex gap-3 text-sm">
          <div className="w-8 h-8 rounded-full bg-success/10 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-4 h-4 text-success" />
          </div>
          <div>
            <p className="text-heading"><span className="font-bold">Michael</span> became Verified.</p>
            <p className="text-xs text-muted mt-1">5 hours ago</p>
          </div>
        </div>
        <div className="p-4 flex gap-3 text-sm">
          <div className="w-8 h-8 rounded-full bg-info/10 flex items-center justify-center shrink-0">
            <Users className="w-4 h-4 text-info" />
          </div>
          <div>
            <p className="text-heading">12 new members joined this week.</p>
            <p className="text-xs text-muted mt-1">Yesterday</p>
          </div>
        </div>
      </div>
    </div>
  );
}
