"use client";

import { Users, UserCheck, MailOpen, ShieldAlert, AlertTriangle, AlertCircle, Clock, TrendingUp } from "lucide-react";

interface UsersSummaryCardsProps {
  summary: {
    totalUsers: number;
    thisWeekCount: number;
    activeTodayCount: number;
    activePercentage: number;
    verifiedCount: number;
    verifiedPercentage: number;
    pendingInvites: number;
    pendingVerification: number;
    suspendedCount: number;
    reportedCount: number;
    newTodayCount: number;
  };
}

export default function UsersSummaryCards({ summary }: UsersSummaryCardsProps) {
  const cards = [
    {
      title: "Total Users",
      value: summary.totalUsers.toLocaleString(),
      subtext: `+${summary.thisWeekCount} this week`,
      icon: <Users className="w-4 h-4 text-heading" />,
    },
    {
      title: "Active Today",
      value: summary.activeTodayCount.toLocaleString(),
      subtext: `${summary.activePercentage}% of users`,
      icon: <TrendingUp className="w-4 h-4 text-heading" />,
    },
    {
      title: "Verified",
      value: summary.verifiedCount.toLocaleString(),
      subtext: `${summary.verifiedPercentage}% verified`,
      icon: <UserCheck className="w-4 h-4 text-heading" />,
    },
    {
      title: "New Today",
      value: summary.newTodayCount.toLocaleString(),
      subtext: "Joined last 24h",
      icon: <AlertCircle className="w-4 h-4 text-heading" />,
    },
    {
      title: "Pending Invites",
      value: summary.pendingInvites.toLocaleString(),
      subtext: "Awaiting approval",
      icon: <MailOpen className="w-4 h-4 text-muted" />,
    },
    {
      title: "Pending Verification",
      value: summary.pendingVerification.toLocaleString(),
      subtext: "Needs review",
      icon: <Clock className="w-4 h-4 text-muted" />,
    },
    {
      title: "Reported Users",
      value: summary.reportedCount.toLocaleString(),
      subtext: "Requires action",
      icon: <AlertTriangle className="w-4 h-4 text-muted" />,
    },
    {
      title: "Suspended",
      value: summary.suspendedCount.toLocaleString(),
      subtext: "Account locked",
      icon: <ShieldAlert className="w-4 h-4 text-muted" />,
    }
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {cards.map((card, i) => (
        <div 
          key={i} 
          className="bg-surface border border-border rounded-[var(--radius-card)] p-5 flex flex-col justify-between group hover:border-heading/20 transition-all duration-300"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-muted">{card.title}</h3>
            <div className="w-8 h-8 rounded-full bg-background border border-border flex items-center justify-center group-hover:scale-105 transition-transform">
              {card.icon}
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-heading tracking-tight">{card.value}</div>
            <div className="text-xs text-muted mt-1 font-medium">
              {card.subtext}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
