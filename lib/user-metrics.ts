import { User, PortfolioItem } from "@/types";

export function calculateProfileCompletion(user: User, portfolio?: PortfolioItem[]): number {
  let complete = 0;
  if (user.photoURL || (user as any).photoUrl) complete += 15;
  if (user.headline) complete += 10;
  if (user.bio && user.bio.length > 10) complete += 20;
  if (user.country && user.timeZone) complete += 10;
  if (user.skillsOffered && user.skillsOffered.length > 0) complete += 15;
  if (user.skillsLookingFor && user.skillsLookingFor.length > 0) complete += 10;
  
  const hasPortfolioItems = (portfolio && portfolio.length > 0) || (user as any).hasPortfolio;
  if (hasPortfolioItems) complete += 20;
  
  return complete;
}

export function calculateTrustScore(user: User, dynamicProfileCompletion?: number): number {
  let score = 0;
  
  // 1. Identity & Verification (30 points)
  if (user.isVerified) score += 30;
  
  // 2. Profile Depth (based directly on the dynamic profile completion) (50 points max)
  const completion = dynamicProfileCompletion !== undefined ? dynamicProfileCompletion : calculateProfileCompletion(user);
  score += Math.floor(completion / 2);
  
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
}

export function calculateEarnedAchievements(user: User, portfolio?: PortfolioItem[]): string[] {
  const earnedIds: string[] = [];
  const dynamicProfileCompletion = calculateProfileCompletion(user, portfolio);

  const stats = user.stats || {
    exchangesCompleted: 0,
    rating: 0,
    reviewsCount: 0,
    skillHoursEarned: 0,
    skillHoursSpent: 0,
    responseTimeHours: 0,
    repeatCollaborations: 0,
    disputesLost: 0,
    reportsAgainst: 0
  };

  // Getting Started
  earnedIds.push("welcome_aboard");
  if (dynamicProfileCompletion >= 100) earnedIds.push("profile_complete");
  if (stats.exchangesCompleted > 0) earnedIds.push("first_exchange");

  // Collaboration
  if (stats.exchangesCompleted >= 5) earnedIds.push("collaborator");
  if (stats.exchangesCompleted >= 25) earnedIds.push("power_collaborator");
  if (stats.exchangesCompleted >= 50) earnedIds.push("exchange_expert");
  if (stats.exchangesCompleted >= 100) earnedIds.push("exchange_master");

  // Reputation
  if (stats.rating >= 4.8 && stats.reviewsCount >= 20) earnedIds.push("top_rated");
  if (stats.responseTimeHours > 0 && stats.responseTimeHours <= 2) earnedIds.push("fast_responder");
  if (stats.exchangesCompleted >= 100 && (stats.disputesLost || 0) === 0) earnedIds.push("dispute_free");

  // Economy
  if (stats.skillHoursEarned >= 50) earnedIds.push("hour_earner");
  if (stats.skillHoursEarned >= 250) earnedIds.push("time_investor");
  if (stats.skillHoursEarned >= 100 && stats.skillHoursSpent >= 100) earnedIds.push("balanced_contributor");

  // Expertise
  const skillsOfferedCount = user.skillsOffered ? user.skillsOffered.length : 0;
  if (skillsOfferedCount >= 5) earnedIds.push("multi_talented");

  // Community
  if (user.isVerified) earnedIds.push("verified");

  // Time-based
  const userCreatedAt = new Date(user.createdAt);
  const now = new Date();
  const monthsDiff = (now.getFullYear() - userCreatedAt.getFullYear()) * 12 + (now.getMonth() - userCreatedAt.getMonth());
  if (monthsDiff >= 6) earnedIds.push("six_month_member");
  if (monthsDiff >= 12) earnedIds.push("one_year_member");

  // Early Bird (Beta Tester)
  const betaCutoffDate = new Date("2026-08-31T23:59:59Z");
  if (userCreatedAt <= betaCutoffDate) {
    earnedIds.push("early_bird");
  }

  return earnedIds;
}
