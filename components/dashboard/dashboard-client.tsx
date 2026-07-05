"use client";

import { User, Exchange, ExchangeRequest, SkillLedgerEntry, Notification } from "@/types";
import WelcomeHeader from "./welcome-header";
import QuickStats from "./quick-stats";
import ActiveExchanges from "./active-exchanges";
import MarketplaceMatches from "./marketplace-matches";
import MyRequests from "./my-requests";
import QuickActions from "./quick-actions";
import TasksReminders from "./tasks-reminders";
import LedgerSnapshot from "./ledger-snapshot";
import PerformanceInsights from "./performance-insights";
import CommunityFeed from "./community-feed";
import LearningCenter from "./learning-center";
import RecentMessages from "./recent-messages";
import EmptyDashboard from "./empty-dashboard";

export interface DashboardData {
  user: User;
  activeExchanges: Exchange[];
  myRequests: ExchangeRequest[];
  pendingRequestsCount: number;
  ledgerSnapshot: SkillLedgerEntry[];
  notifications: Notification[];
  matches: User[];
  tasks: any[];
}

export default function DashboardClient({ initialData }: { initialData: DashboardData }) {
  const { user, activeExchanges, myRequests, pendingRequestsCount, ledgerSnapshot, matches, tasks } = initialData;

  // Check for empty dashboard state (brand new user)
  const isBrandNew = 
    activeExchanges.length === 0 && 
    myRequests.length === 0 && 
    ledgerSnapshot.length === 0 &&
    user.stats.exchangesCompleted === 0;

  if (isBrandNew) {
    return <EmptyDashboard user={user} />;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-500">
        
        {/* Welcome Section */}
        <WelcomeHeader 
          user={user} 
          activeExchangesCount={activeExchanges.length} 
          matchesCount={matches.length} 
        />

        <div className="mt-8 flex flex-col xl:grid xl:grid-cols-12 gap-8 items-start">
          
          {/* Main Content Area (Left) */}
          <div className="xl:col-span-8 flex flex-col gap-8 w-full">
            <QuickStats user={user} pendingRequestsCount={pendingRequestsCount} activeExchangesCount={activeExchanges.length} />
            <ActiveExchanges exchanges={activeExchanges} currentUserId={user.uid} />
            <MarketplaceMatches matches={matches} />
            <MyRequests requests={myRequests} currentUserId={user.uid} />
          </div>

          {/* Sidebar Area (Right) */}
          <div className="xl:col-span-4 flex flex-col gap-8 w-full">
            <QuickActions />
            <TasksReminders tasks={tasks} />
            <LedgerSnapshot ledger={ledgerSnapshot} />
            <PerformanceInsights stats={user.stats} />
            <RecentMessages />
            <CommunityFeed />
            <LearningCenter />
          </div>

        </div>
      </div>
    </div>
  );
}
