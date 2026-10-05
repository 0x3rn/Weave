import { notFound } from "next/navigation";
import {
  getUserByUsername,
  getUserPortfolio,
  getUserExchanges,
  getUserReviews,
  getSimilarProfessionals,
} from "@/app/actions/profile";
import { getCurrentUserId } from "@/app/actions/user";
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
import { MemberActions } from "@/components/profile/member-actions";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const resolvedParams = await params;
  const user = await getUserByUsername(resolvedParams.username);

  if (!user) {
    return { title: "User Not Found | Weave" };
  }

  const firstName = user.fullName.split(" ")[0];
  const ogTitle = `View ${firstName}'s profile on Weave`;
  const description =
    user.headline ||
    user.bio ||
    `Check out ${firstName}'s skills and portfolio on Weave.`;

  return {
    title: `${user.fullName} (@${user.username}) | Weave`,
    description: description,
    robots: {
      index: user.publicPrivacy?.appearInSearch !== false,
      follow: user.publicPrivacy?.allowProfileSharing !== false,
    },
    openGraph: {
      title: ogTitle,
      description: description,
      type: "profile",
      url: `https://weave.network/u/${user.username}`,
      images: user.photoURL
        ? [
            {
              url: user.photoURL || (user as any).photoUrl,
              width: 400,
              height: 400,
              alt: `${user.fullName}'s profile picture`,
            },
          ]
        : [],
    },
    twitter: {
      card: "summary",
      title: ogTitle,
      description: description,
      images:
        user.photoURL || (user as any).photoUrl
          ? [user.photoURL || (user as any).photoUrl]
          : [],
    },
  };
}

export default async function UserProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
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
  const [portfolio, exchanges, reviews, similarUsers] = await Promise.all([
    getUserPortfolio(user.uid),
    getUserExchanges(user.uid),
    getUserReviews(user.uid),
    getSimilarProfessionals(user.uid, user.profession || ""),
  ]);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl py-8 md:py-12">
        {/* Responsive Grid: Sidebar (Left) + Main Content (Right) */}
        <div className="flex flex-col gap-8 lg:grid lg:grid-cols-12 lg:gap-12 lg:items-start">
          {/* LEFT SIDEBAR (Hero + Stats + Trust Score + Calendar) */}
          <div className="contents lg:block lg:col-span-4 lg:space-y-6">
            <div className="order-1">
              <HeroSection
                user={user}
                isOwner={isOwner}
                currentUserId={currentUserId}
              />
            </div>
            {isOwner && (
              <div className="order-2">
                <ProfileCompletion user={user} portfolio={portfolio} />
              </div>
            )}
            {(isOwner || user.publicPrivacy?.showTrustScore !== false) && (
              <div className="order-3">
                <TrustScoreCard user={user} portfolio={portfolio} />
              </div>
            )}
            {(isOwner || user.schedule) && (
              <div className="order-6">
                <AvailabilityCalendar
                  user={user}
                  currentUserId={currentUserId}
                />
              </div>
            )}
            {(isOwner || user.publicPrivacy?.showBadges !== false) && (
              <div className="order-9">
                <AchievementsGrid user={user} portfolio={portfolio} />
              </div>
            )}
          </div>

          {/* MAIN CONTENT (About + Skills + Portfolio + Reviews) */}
          <div className="contents lg:block lg:col-span-8 lg:space-y-12">
            <div className="order-4">
              <AboutSection user={user} isOwner={isOwner} />
            </div>
            <div className="order-5">
              <SkillsSection user={user} isOwner={isOwner} />
            </div>
            {(isOwner || user.publicPrivacy?.showPortfolio !== false) && (
              <div className="order-7">
                <PortfolioGrid portfolio={portfolio} isOwner={isOwner} />
              </div>
            )}
            {(isOwner ||
              user.publicPrivacy?.showCompletedExchanges !== false) && (
              <div className="order-10">
                <RecentExchanges exchanges={exchanges} isOwner={isOwner} />
              </div>
            )}
            {(isOwner || user.publicPrivacy?.showReviews !== false) && (
              <div className="order-8">
                <ReviewsSection reviews={reviews} isOwner={isOwner} />
              </div>
            )}
            {!isOwner && similarUsers.length > 0 && (
              <div className="order-11">
                <SimilarProfessionals similarUsers={similarUsers} />
              </div>
            )}
          </div>
        </div>

        {!isOwner && currentUserId && <MemberActions memberId={user.uid} />}
      </div>
    </div>
  );
}
