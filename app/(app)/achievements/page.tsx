import { getCurrentUserId } from "@/app/actions/user";
import { db } from "@/lib/firebase-admin";
import { User, PortfolioItem } from "@/types";
import { notFound, redirect } from "next/navigation";
import { ACHIEVEMENTS, AchievementTier } from "@/lib/constants/achievements";
import { calculateEarnedAchievements } from "@/lib/user-metrics";
import { getUserPortfolio } from "@/app/actions/profile";
import { 
  Sprout, Sparkles, Target, Handshake, Medal, Crown, Star, 
  Shield, Zap, Bird, Clock, Hourglass, Scale, Palette, Puzzle, 
  BadgeCheck, HeartHandshake, Megaphone, CalendarDays, Cake, Trophy, UserCheck, Lock, Rocket
} from "lucide-react";

export const metadata = {
  title: "Achievements | Weave",
  description: "View your earned and available achievements on Weave.",
};

const getTierColor = (tier: AchievementTier, isLocked: boolean) => {
  if (isLocked) return "text-muted bg-surface-secondary border-border opacity-60";
  
  switch (tier) {
    case "bronze": return "text-[#CD7F32] bg-[#CD7F32]/10 border-[#CD7F32]/20 shadow-[0_0_15px_rgba(205,127,50,0.15)]";
    case "silver": return "text-[#C0C0C0] bg-[#C0C0C0]/10 border-[#C0C0C0]/20 shadow-[0_0_15px_rgba(192,192,192,0.15)]";
    case "gold": return "text-[#FFD700] bg-[#FFD700]/10 border-[#FFD700]/20 shadow-[0_0_15px_rgba(255,215,0,0.15)]";
    case "platinum": return "text-[#E5E4E2] bg-[#E5E4E2]/10 border-[#E5E4E2]/20 shadow-[0_0_15px_rgba(229,228,226,0.15)]";
    default: return "text-primary bg-primary/10 border-primary/20 shadow-[0_0_15px_rgba(88,199,109,0.15)]";
  }
};

const getIcon = (name: string, className: string = "") => {
  const icons: Record<string, React.ReactNode> = {
    "sprout": <Sprout className={className} />,
    "user-check": <UserCheck className={className} />,
    "target": <Target className={className} />,
    "handshake": <Handshake className={className} />,
    "medal": <Medal className={className} />,
    "crown": <Crown className={className} />,
    "star": <Star className={className} />,
    "shield": <Shield className={className} />,
    "zap": <Zap className={className} />,
    "bird": <Bird className={className} />,
    "clock": <Clock className={className} />,
    "hourglass": <Hourglass className={className} />,
    "scale": <Scale className={className} />,
    "palette": <Palette className={className} />,
    "puzzle": <Puzzle className={className} />,
    "badge-check": <BadgeCheck className={className} />,
    "heart-handshake": <HeartHandshake className={className} />,
    "megaphone": <Megaphone className={className} />,
    "calendar-days": <CalendarDays className={className} />,
    "cake": <Cake className={className} />,
    "rocket": <Rocket className={className} />
  };
  return icons[name] || <Trophy className={className} />;
};

export default async function AchievementsPage() {
  const userId = await getCurrentUserId();
  
  if (!userId) {
    redirect("/login");
  }

  if (!db) {
    throw new Error("Firestore not initialized");
  }

  const userDoc = await db.collection("users").doc(userId).get();
  
  if (!userDoc.exists) {
    notFound();
  }

  const userData = userDoc.data();
  const user = { uid: userDoc.id, ...userData } as User;
  
  const portfolio = await getUserPortfolio(userId);
  const earnedIds = calculateEarnedAchievements(user, portfolio);

  // Group achievements by category
  const categories = ["Getting Started", "Collaboration", "Reputation", "Economy", "Expertise", "Community"];
  
  const achievementsList = Object.values(ACHIEVEMENTS);
  
  const earnedCount = earnedIds.length;
  const totalCount = achievementsList.length;

  return (
    <div className="min-h-full bg-background pb-16">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl py-8 md:py-12">
        
        <div className="mb-10 text-center max-w-2xl mx-auto">
          <div className="w-20 h-20 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(88,199,109,0.15)] relative">
            <Trophy className="w-10 h-10 text-primary" />
            <div className="absolute top-0 right-0 w-3 h-3 bg-warning rounded-full blur-[2px]" />
            <div className="absolute bottom-2 left-1 w-2 h-2 bg-success rounded-full blur-[1px]" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-heading">Your Achievements</h1>
          <p className="text-body mt-4 text-lg">
            You have unlocked <span className="text-heading font-bold">{earnedCount}</span> out of {totalCount} total achievements.
          </p>
        </div>

        <div className="space-y-16">
          {categories.map((category) => {
            const categoryAchievements = achievementsList.filter(a => a.category === category);
            if (categoryAchievements.length === 0) return null;

            return (
              <section key={category}>
                <div className="flex items-center gap-4 mb-6">
                  <h2 className="text-2xl font-bold text-heading">{category}</h2>
                  <div className="h-px bg-border flex-1"></div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {categoryAchievements.map(achievement => {
                    const isEarned = earnedIds.includes(achievement.id);
                    const colorClass = getTierColor(achievement.tier, !isEarned);
                    
                    return (
                      <div 
                        key={achievement.id}
                        className={`relative p-6 rounded-[var(--radius-card)] border bg-surface flex flex-col items-start gap-4 transition-all duration-300 ${
                          isEarned 
                            ? "border-border hover:border-primary/30 shadow-subtle hover:shadow-md" 
                            : "border-border/50 opacity-80"
                        }`}
                      >
                        {/* Status Icon Top Right */}
                        <div className="absolute top-4 right-4">
                          {isEarned ? (
                            <div className="w-6 h-6 rounded-full bg-success/20 flex items-center justify-center text-success">
                              <BadgeCheck className="w-4 h-4" />
                            </div>
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-surface-secondary border border-border flex items-center justify-center text-muted">
                              <Lock className="w-3.5 h-3.5" />
                            </div>
                          )}
                        </div>

                        {/* Icon Badge */}
                        <div className={`w-14 h-14 rounded-[var(--radius-button)] flex items-center justify-center border ${colorClass}`}>
                          {getIcon(achievement.iconName, "w-7 h-7")}
                        </div>

                        {/* Text Content */}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className={`font-bold ${isEarned ? "text-heading" : "text-muted"}`}>
                              {achievement.title}
                            </h3>
                            {achievement.tier !== "none" && isEarned && (
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${colorClass} bg-transparent border-none shadow-none`}>
                                {achievement.tier}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-muted leading-relaxed">
                            {achievement.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>

      </div>
    </div>
  );
}
