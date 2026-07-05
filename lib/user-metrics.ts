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
