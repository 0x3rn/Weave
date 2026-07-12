import { getCurrentUserId } from "@/app/actions/user";
import { db } from "@/lib/firebase-admin";
import { User } from "@/types";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import SetUsernameClient from "./set-username-client";
import EditProfileModal from "@/components/profile/edit-profile-modal";

// Profile Components
import { getUserPortfolio, getUserExchanges, getUserReviews } from "@/app/actions/profile";
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

export const metadata = {
  title: "Profile | Weave",
  description: "Manage your private Weave workspace profile.",
};

export default async function ProfilePage() {
  const userId = await getCurrentUserId();
  
  if (!userId) {
    redirect("/api/auth/logout");
  }

  if (!db) {
    throw new Error("Firestore not initialized");
  }

  const userDoc = await db.collection("users").doc(userId).get();
  
  if (!userDoc.exists) {
    notFound();
  }

  const userData = userDoc.data();

  // If they don't have a username, render a client component to set one
  if (!userData || !userData.username) {
    return (
      <div className="min-h-full bg-background flex items-center justify-center p-4">
        <SetUsernameClient />
      </div>
    );
  }

  const user = { uid: userDoc.id, ...userData } as User;
  const isOwner = true; // By definition on this route

  // Fetch Related Data in Parallel
  const [portfolio, exchanges, reviews] = await Promise.all([
    getUserPortfolio(user.uid),
    getUserExchanges(user.uid),
    getUserReviews(user.uid),
  ]);

  return (
    <div className="min-h-full bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl py-8 md:py-12">
        
        {/* Top Action Bar */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-heading">Your Profile</h1>
            <p className="text-body text-sm mt-2">This is how your profile appears to others. Click Edit to make changes.</p>
          </div>
          
          <div className="flex items-center gap-3">
            <EditProfileModal user={user} />
            <Link 
              href={`/u/${user.username}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 text-sm font-semibold text-muted bg-surface-secondary border border-border px-4 py-2 rounded-[var(--radius-button)] hover:text-heading hover:bg-border transition-colors whitespace-nowrap shrink-0"
            >
              View Public
              <ExternalLink className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Responsive Grid: Sidebar (Left) + Main Content (Right) */}
        <div className="flex flex-col gap-8 lg:grid lg:grid-cols-12 lg:gap-12 lg:items-start">
          
          {/* LEFT SIDEBAR (Hero + Stats + Trust Score + Calendar) */}
          <div className="contents lg:block lg:col-span-4 lg:space-y-6">
            <div className="order-1 relative">
              <HeroSection user={user} isOwner={isOwner} currentUserId={userId} />
            </div>
            <div className="order-2">
              <ProfileCompletion user={user} portfolio={portfolio} />
            </div>
            <div className="order-3">
              <TrustScoreCard user={user} portfolio={portfolio} />
            </div>
            <div className="order-6">
              <AvailabilityCalendar user={user} currentUserId={userId} />
            </div>
            <div className="order-9">
              <AchievementsGrid user={user} portfolio={portfolio} />
            </div>
          </div>

          {/* MAIN CONTENT (About + Skills + Portfolio + Reviews) */}
          <div className="contents lg:block lg:col-span-8 lg:space-y-12">
            <div className="order-4">
              <AboutSection user={user} isOwner={isOwner} />
            </div>
            <div className="order-5">
              <SkillsSection user={user} isOwner={isOwner} />
            </div>
            <div className="order-7">
              <PortfolioGrid portfolio={portfolio} isOwner={isOwner} />
            </div>
            <div className="order-10">
              <RecentExchanges exchanges={exchanges} isOwner={isOwner} />
            </div>
            <div className="order-8">
              <ReviewsSection reviews={reviews} isOwner={isOwner} />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
