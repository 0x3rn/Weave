"use client";

import { calculateEarnedAchievements } from "@/lib/user-metrics";
import { User, PortfolioItem } from "@/types";
import { ACHIEVEMENTS, AchievementTier } from "@/lib/constants/achievements";
import { 
  Sprout, Sparkles, Target, Handshake, Medal, Crown, Star, 
  Shield, Zap, Bird, Clock, Hourglass, Scale, Palette, Puzzle, 
  BadgeCheck, HeartHandshake, Megaphone, CalendarDays, Cake, Trophy, UserCheck, Rocket
} from "lucide-react";

interface AchievementsGridProps {
  user: User;
  portfolio?: PortfolioItem[];
}

const getTierColor = (tier: AchievementTier) => {
  switch (tier) {
    case "bronze": return "text-[#CD7F32]";
    case "silver": return "text-[#C0C0C0]";
    case "gold": return "text-[#FFD700]";
    case "platinum": return "text-[#E5E4E2]";
    default: return "text-primary";
  }
};

const iconMap: Record<string, React.ReactNode> = {
  "sprout": <Sprout className="w-4 h-4" />,
  "sparkles": <Sparkles className="w-4 h-4" />,
  "user-check": <UserCheck className="w-4 h-4" />,
  "target": <Target className="w-4 h-4" />,
  "handshake": <Handshake className="w-4 h-4" />,
  "medal": <Medal className="w-4 h-4" />,
  "crown": <Crown className="w-4 h-4" />,
  "star": <Star className="w-4 h-4" />,
  "shield": <Shield className="w-4 h-4" />,
  "zap": <Zap className="w-4 h-4" />,
  "bird": <Bird className="w-4 h-4" />,
  "clock": <Clock className="w-4 h-4" />,
  "hourglass": <Hourglass className="w-4 h-4" />,
  "scale": <Scale className="w-4 h-4" />,
  "palette": <Palette className="w-4 h-4" />,
  "puzzle": <Puzzle className="w-4 h-4" />,
  "badge-check": <BadgeCheck className="w-4 h-4" />,
  "heart-handshake": <HeartHandshake className="w-4 h-4" />,
  "megaphone": <Megaphone className="w-4 h-4" />,
  "calendar-days": <CalendarDays className="w-4 h-4" />,
  "cake": <Cake className="w-4 h-4" />,
  "rocket": <Rocket className="w-4 h-4" />
};

export default function AchievementsGrid({ user, portfolio = [] }: AchievementsGridProps) {
  const earnedIds = calculateEarnedAchievements(user, portfolio);

  // Map earned IDs to full definitions and filter out invalid ones
  const earnedBadges = earnedIds
    .map(id => ACHIEVEMENTS[id])
    .filter(Boolean);

  if (earnedBadges.length === 0) {
    return null;
  }

  return (
    <div className="bg-background border border-border p-6 rounded-[var(--radius-card)] shadow-subtle">
      <h3 className="text-sm font-bold text-heading uppercase tracking-wider mb-4 flex items-center gap-2">
        <Trophy className="w-4 h-4 text-primary" />
        Achievements
      </h3>
      
      <div 
        className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent snap-x"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {earnedBadges.map((badge) => (
          <div 
            key={badge.id}
            className="flex-shrink-0 snap-start flex flex-col items-center gap-2 w-24 p-3 rounded-[var(--radius-button)] bg-surface border border-border hover:border-primary/30 transition-colors group cursor-help relative"
            title={`${badge.title} - ${badge.description}`}
          >
            <div className={`w-12 h-12 rounded-full flex items-center justify-center bg-background border border-border group-hover:border-primary/50 group-hover:shadow-[0_0_10px_rgba(88,199,109,0.2)] transition-all ${getTierColor(badge.tier)}`}>
              {iconMap[badge.iconName] || <Trophy className="w-4 h-4" />}
            </div>
            <span className="text-[10px] font-bold text-center text-heading leading-tight break-words w-full">
              {badge.title}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
