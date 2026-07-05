"use client";

import { User } from "@/types";
import { ACHIEVEMENTS, AchievementTier } from "@/lib/constants/achievements";
import { 
  Sprout, Sparkles, Target, Handshake, Medal, Crown, Star, 
  Shield, Zap, Bird, Clock, Hourglass, Scale, Palette, Puzzle, 
  BadgeCheck, HeartHandshake, Megaphone, CalendarDays, Cake, Trophy, UserCheck
} from "lucide-react";

interface AchievementsGridProps {
  user: User;
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
  "cake": <Cake className="w-4 h-4" />
};

export default function AchievementsGrid({ user }: AchievementsGridProps) {
  // Parse user achievements
  // If it's the old array format, map to string ids. If it's Record, get the true keys.
  let earnedIds: string[] = [];
  
  if (Array.isArray(user.achievements)) {
    // Legacy support for when it was an array of objects
    if (user.achievements.length > 0 && typeof user.achievements[0] === 'object') {
      earnedIds = (user.achievements as any[]).map(a => a.id);
    } else {
      earnedIds = user.achievements as unknown as string[];
    }
  } else if (user.achievements && typeof user.achievements === 'object') {
    const achs = user.achievements as Record<string, boolean>;
    earnedIds = Object.keys(achs).filter(k => achs[k]);
  }

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
        className="grid grid-rows-2 grid-flow-col lg:flex lg:flex-wrap gap-2 overflow-x-auto lg:overflow-x-visible snap-x snap-mandatory lg:snap-none pb-2 lg:pb-0"
        style={{ gridAutoColumns: "calc(50% - 4px)" }}
      >
        {earnedBadges.map((badge) => (
          <div 
            key={badge.id}
            className="snap-start flex items-center gap-2 bg-background border border-border hover:border-primary/50 px-3 py-1.5 rounded-full transition-all cursor-help group relative min-w-0"
          >
            <span className={`flex-shrink-0 ${getTierColor(badge.tier)}`}>
              {iconMap[badge.iconName] || <Medal className="w-4 h-4" />}
            </span>
            <span className="text-xs font-bold text-heading truncate">{badge.title}</span>
            
            {/* Tooltip */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-[200px] opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
              <div className="bg-heading text-surface text-xs p-2 rounded-md shadow-lg text-center whitespace-normal">
                <p className="font-bold mb-0.5">{badge.title}</p>
                <p className="text-[10px] text-surface/80">{badge.description}</p>
                {badge.tier !== "none" && (
                  <p className={`text-[9px] uppercase tracking-wider mt-1 font-bold ${getTierColor(badge.tier)}`}>
                    {badge.tier} Tier
                  </p>
                )}
              </div>
              {/* Arrow */}
              <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-heading" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
