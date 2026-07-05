"use client";

import { User } from "@/types";
import { Medal, Trophy, Zap, Target, Gem, Flame } from "lucide-react";

interface AchievementsGridProps {
  user: User;
}

// Map string icon names to Lucide components
const iconMap: Record<string, React.ReactNode> = {
  medal: <Medal className="w-5 h-5" />,
  trophy: <Trophy className="w-5 h-5" />,
  zap: <Zap className="w-5 h-5" />,
  target: <Target className="w-5 h-5" />,
  gem: <Gem className="w-5 h-5" />,
  flame: <Flame className="w-5 h-5" />
};

export default function AchievementsGrid({ user }: AchievementsGridProps) {
  const achievements = user.achievements || [];

  if (achievements.length === 0) {
    return null;
  }

  return (
    <div className="bg-surface border border-border p-6 rounded-[var(--radius-card)] shadow-subtle">
      <h3 className="text-sm font-bold text-heading uppercase tracking-wider mb-4">Achievements</h3>
      
      <div className="flex flex-wrap gap-3">
        {achievements.map((achievement) => (
          <div 
            key={achievement.id}
            className="flex items-center gap-2 bg-background border border-border px-3 py-1.5 rounded-full"
            title={`Earned on ${new Date(achievement.earnedAt).toLocaleDateString()}`}
          >
            <span className="text-primary">
              {iconMap[achievement.icon] || <Medal className="w-5 h-5" />}
            </span>
            <span className="text-sm font-medium text-heading">{achievement.title}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
