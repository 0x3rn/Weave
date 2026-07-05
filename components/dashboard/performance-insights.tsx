"use client";

import { UserStats } from "@/types";
import { Activity, TrendingUp } from "lucide-react";

export default function PerformanceInsights({ stats }: { stats: UserStats }) {
  
  const insights = [
    { label: "Hours Earned", value: stats?.skillHoursEarned || 0 },
    { label: "Hours Spent", value: stats?.skillHoursSpent || 0 },
    { label: "Exchanges", value: stats?.exchangesCompleted || 0 },
    { label: "Acceptance Rate", value: `${stats?.completionRate || 0}%` },
    { label: "Average Rating", value: (stats?.rating || 0).toFixed(1) },
  ];

  return (
    <div className="bg-surface border border-border rounded-[var(--radius-card)] shadow-subtle p-6 relative overflow-hidden">
      <div className="absolute top-0 right-0 p-4 opacity-10">
        <Activity className="w-24 h-24 text-primary" />
      </div>
      
      <h3 className="font-bold text-heading mb-6 flex items-center gap-2 uppercase tracking-wider text-xs relative z-10">
        <TrendingUp className="w-4 h-4 text-primary" />
        Performance Insights
      </h3>

      <div className="space-y-4 relative z-10">
        {insights.map((item, i) => (
          <div key={i} className="flex items-center justify-between">
            <span className="text-sm text-muted">{item.label}</span>
            <span className="font-mono font-bold text-heading">{item.value}</span>
          </div>
        ))}
      </div>
      
      <div className="mt-6 pt-4 border-t border-border relative z-10">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted">Trust Score Trend</span>
          <span className="text-sm font-bold text-success flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> +3
          </span>
        </div>
      </div>
    </div>
  );
}
