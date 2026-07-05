import { notFound } from "next/navigation";
import { getUserByUsername, getUserPortfolio, getUserExchanges, getUserReviews } from "@/app/actions/profile";
import { getCurrentUserId } from "@/app/actions/user";
import { User, PortfolioItem, Exchange, Review } from "@/types";
import HeroSection from "@/components/profile/hero-section";
import TrustScoreCard from "@/components/profile/trust-score-card";
import AboutSection from "@/components/profile/about-section";
import SkillsSection from "@/components/profile/skills-section";
import PortfolioGrid from "@/components/profile/portfolio-grid";
import RecentExchanges from "@/components/profile/recent-exchanges";
import ReviewsSection from "@/components/profile/reviews-section";
import AchievementsGrid from "@/components/profile/achievements-grid";
import AvailabilityCalendar from "@/components/profile/availability-calendar";
import ProfileCompletion from "@/components/profile/profile-completion";
import SimilarProfessionals from "@/components/profile/similar-professionals";
import Link from "next/link";
import { Flag, ShieldOff } from "lucide-react";

export const revalidate = 60; // Cache for 60 seconds

export async function generateMetadata({ params }: { params: Promise<{ username: string }> }) {
  const resolvedParams = await params;
  const user = await getUserByUsername(resolvedParams.username);
  
  if (!user) {
    return { title: "User Not Found | Weave" };
  }

  return {
    title: `${user.fullName} (@${user.username}) | Weave`,
    description: user.headline || user.bio || `View ${user.fullName}'s profile on Weave.`,
  };
}

export default async function UserProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const resolvedParams = await params;
  const username = resolvedParams.username;
  
  // 1. Fetch User
  const user = await getUserByUsername(username);
  
  if (!user) {
    notFound();
  }

  // 2. Fetch Owner Status
  const currentUserId = await getCurrentUserId();
  const isOwner = currentUserId === user.uid;

  // 3. Fetch Related Data in Parallel
  const [portfolio, exchanges, reviews] = await Promise.all([
    getUserPortfolio(user.uid),
    getUserExchanges(user.uid),
    getUserReviews(user.uid),
  ]);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl py-8 md:py-12">
        
        {/* Responsive Grid: Sidebar (Left) + Main Content (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          
          {/* LEFT SIDEBAR (Hero + Stats + Trust Score + Calendar) */}
          <div className="lg:col-span-4 space-y-6">
            <HeroSection user={user} isOwner={isOwner} />
            {isOwner && <ProfileCompletion user={user} portfolio={portfolio} />}
            <TrustScoreCard user={user} />
            <AvailabilityCalendar user={user} />
            <AchievementsGrid user={user} />
          </div>

          {/* MAIN CONTENT (About + Skills + Portfolio + Reviews) */}
          <div className="lg:col-span-8 space-y-12">
            <AboutSection user={user} />
            <SkillsSection user={user} isOwner={isOwner} />
            <PortfolioGrid portfolio={portfolio} isOwner={isOwner} />
            <RecentExchanges exchanges={exchanges} isOwner={isOwner} />
            <ReviewsSection reviews={reviews} isOwner={isOwner} />
            <SimilarProfessionals user={user} />
            
            {/* Footer Actions (Report/Block) */}
            {!isOwner && (
              <div className="pt-12 border-t border-border flex items-center justify-center gap-6 text-sm">
                <button className="flex items-center gap-2 text-muted hover:text-error transition-colors">
                  <Flag className="w-4 h-4" />
                  Report User
                </button>
                <button className="flex items-center gap-2 text-muted hover:text-error transition-colors">
                  <ShieldOff className="w-4 h-4" />
                  Block User
                </button>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
