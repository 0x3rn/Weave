"use client";

import { User, PortfolioItem } from "@/types";
import { Shield, Info, CheckCircle2 } from "lucide-react";

interface TrustScoreCardProps {
  user: User;
  portfolio: PortfolioItem[];
}

export default function TrustScoreCard({ user, portfolio }: TrustScoreCardProps) {
  // Calculate Profile Completion Dynamically
  const calculateProfileCompletion = () => {
    let complete = 0;
    if (user.photoURL || (user as any).photoUrl) complete += 15;
    if (user.headline) complete += 10;
    if (user.bio && user.bio.length > 10) complete += 20;
    if (user.country && user.timeZone) complete += 10;
    if (user.skillsOffered && user.skillsOffered.length > 0) complete += 15;
    if (user.skillsLookingFor && user.skillsLookingFor.length > 0) complete += 10;
    if (portfolio && portfolio.length > 0) complete += 20;
    return complete;
  };
  const dynamicProfileCompletion = calculateProfileCompletion();

  // Calculate trust score dynamically
  const calculateTrustScore = () => {
    let score = 0;
    
    // 1. Identity & Verification (30 points)
    if (user.isVerified) score += 30;
    
    // 2. Profile Depth (based directly on the dynamic profile completion) (50 points max)
    // 100% profile completion = 50 trust points. 
    score += Math.floor(dynamicProfileCompletion / 2);
    
    // 3. Track Record (20 points)
    const stats = user.stats || { exchangesCompleted: 0, rating: 0, reviewsCount: 0 };
    
    // Positive Track Record
    if (stats.exchangesCompleted > 0) score += 10;
    if (stats.exchangesCompleted > 5) score += 5;
    if (stats.rating >= 4.5 && (stats.reviewsCount || 0) > 0) score += 5;
    
    // 4. Negative Community Standing (Deductions)
    let deductions = 0;
    
    // Bad ratings (only applies if they actually have reviews)
    if ((stats.reviewsCount || 0) > 0) {
      if (stats.rating < 3.0) deductions += 5;
      else if (stats.rating < 4.0) deductions += 1;
    }
    
    // Disputes lost (Resolved against user)
    if (stats.disputesLost && stats.disputesLost > 0) {
      deductions += (stats.disputesLost * 10);
    }
    
    // Reports against (Resolved/Valid reports against user)
    if (stats.reportsAgainst && stats.reportsAgainst > 0) {
      deductions += (stats.reportsAgainst * 10);
    }
    
    const finalScore = score - deductions;
    return Math.max(0, Math.min(100, finalScore));
  };

  const trustScore = calculateTrustScore();
  // Determine color based on score
  let scoreColor = "text-red-600 dark:text-red-500";
  let pillBgColor = "bg-red-600 dark:bg-red-500 text-white border-transparent";
  let scoreText = "Needs Work";
  
  if (trustScore >= 90) {
    scoreColor = "text-green-600 dark:text-green-500";
    pillBgColor = "bg-green-600 dark:bg-green-500 text-white border-transparent";
    scoreText = "Excellent";
  } else if (trustScore >= 75) {
    scoreColor = "text-blue-700 dark:text-blue-600";
    pillBgColor = "bg-blue-700 dark:bg-blue-600 text-white border-transparent";
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
          <span className="font-bold text-heading">
            {stats.exchangesCompleted > 0 ? `${stats.completionRate || 0}%` : "N/A"}
          </span>
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
          <span className="font-bold text-heading">
            {stats.exchangesCompleted > 0 ? (stats.repeatCollaborations || 0) : "N/A"}
          </span>
        </div>
        
        <div className="flex items-center justify-between text-sm">
          <span className="text-body flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-muted" />
            Profile Completion
          </span>
          <span className="font-bold text-heading">{dynamicProfileCompletion}%</span>
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-border flex items-start gap-2 text-xs text-muted relative z-10">
        <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          Trust Score is calculated dynamically based on identity verification, profile completeness, and community track record. Penalties apply for low ratings or validated reports.
        </p>
      </div>
    </div>
  );
}
