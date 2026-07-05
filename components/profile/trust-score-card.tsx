"use client";

import { User } from "@/types";
import { Shield, Info, CheckCircle2 } from "lucide-react";

interface TrustScoreCardProps {
  user: User;
}

export default function TrustScoreCard({ user }: TrustScoreCardProps) {
  const trustScore = user.trustScore || 0;
  
  // Determine color based on score
  let scoreColor = "text-red-600 dark:text-red-500";
  let pillBgColor = "bg-red-600 dark:bg-red-500 text-white border-transparent";
  let scoreText = "Needs Work";
  
  if (trustScore >= 90) {
    scoreColor = "text-green-600 dark:text-green-500";
    pillBgColor = "bg-green-600 dark:bg-green-500 text-white border-transparent";
    scoreText = "Excellent";
  } else if (trustScore >= 75) {
    scoreColor = "text-blue-600 dark:text-blue-500";
    pillBgColor = "bg-blue-600 dark:bg-blue-500 text-white border-transparent";
    scoreText = "Good";
  } else if (trustScore >= 50) {
    scoreColor = "text-amber-600 dark:text-amber-500";
    pillBgColor = "bg-amber-600 dark:bg-amber-500 text-white border-transparent";
    scoreText = "Average";
  }

  const stats = user.stats || {
    completionRate: 0,
    responseTimeHours: 0,
    repeatCollaborations: 0,
  };

  return (
    <div className="bg-background border border-border p-6 rounded-[var(--radius-card)] shadow-subtle relative overflow-hidden">

      <div className="flex items-center gap-2 mb-6 relative z-10">
        <Shield className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-bold text-heading">Trust Score</h2>
      </div>

      <div className="flex items-end gap-3 mb-8 relative z-10">
        <div className={`text-5xl font-black ${scoreColor} leading-none tracking-tighter`}>
          {trustScore}
        </div>
        <div className="text-muted text-lg font-medium mb-1">/ 100</div>
        <div className={`ml-auto px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${pillBgColor}`}>
          {scoreText}
        </div>
      </div>

      <div className="space-y-4 relative z-10">
        <div className="flex items-center justify-between text-sm">
          <span className="text-body flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-muted" />
            Completion Rate
          </span>
          <span className="font-bold text-heading">{stats.completionRate}%</span>
        </div>
        
        <div className="flex items-center justify-between text-sm">
          <span className="text-body flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-muted" />
            Response Time
          </span>
          <span className="font-bold text-heading">
            {stats.responseTimeHours > 0 ? `< ${stats.responseTimeHours} hours` : "N/A"}
          </span>
        </div>
        
        <div className="flex items-center justify-between text-sm">
          <span className="text-body flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-muted" />
            Repeat Collaborations
          </span>
          <span className="font-bold text-heading">{stats.repeatCollaborations}</span>
        </div>
        
        <div className="flex items-center justify-between text-sm">
          <span className="text-body flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-muted" />
            Profile Completion
          </span>
          <span className="font-bold text-heading">{user.profileCompletion || 0}%</span>
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-border flex items-start gap-2 text-xs text-muted relative z-10">
        <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          Trust Score is calculated using profile completeness, completed exchanges, responsiveness, and review quality.
        </p>
      </div>
    </div>
  );
}
