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
      icon: <Users className="w-5 h-5 text-primary" />,
      color: "bg-primary/10 border-primary/20",
    },
    {
      title: "Active Today",
      value: summary.activeTodayCount.toLocaleString(),
      subtext: `${summary.activePercentage}% of users`,
      icon: <TrendingUp className="w-5 h-5 text-blue-500" />,
      color: "bg-blue-500/10 border-blue-500/20",
    },
    {
      title: "Verified",
      value: summary.verifiedCount.toLocaleString(),
      subtext: `${summary.verifiedPercentage}% verified`,
      icon: <UserCheck className="w-5 h-5 text-success" />,
      color: "bg-success/10 border-success/20",
    },
    {
      title: "New Today",
      value: summary.newTodayCount.toLocaleString(),
      subtext: "Joined last 24h",
      icon: <AlertCircle className="w-5 h-5 text-purple-500" />,
      color: "bg-purple-500/10 border-purple-500/20",
    },
    {
      title: "Pending Invites",
      value: summary.pendingInvites.toLocaleString(),
      subtext: "Awaiting approval",
      icon: <MailOpen className="w-5 h-5 text-amber-500" />,
      color: "bg-amber-500/10 border-amber-500/20",
    },
    {
      title: "Pending Verification",
      value: summary.pendingVerification.toLocaleString(),
      subtext: "Needs review",
      icon: <Clock className="w-5 h-5 text-amber-500" />,
      color: "bg-amber-500/10 border-amber-500/20",
    },
    {
      title: "Reported Users",
      value: summary.reportedCount.toLocaleString(),
      subtext: "Requires action",
      icon: <AlertTriangle className="w-5 h-5 text-error" />,
      color: "bg-error/10 border-error/20",
    },
    {
      title: "Suspended",
      value: summary.suspendedCount.toLocaleString(),
      subtext: "Account locked",
      icon: <ShieldAlert className="w-5 h-5 text-error" />,
      color: "bg-error/10 border-error/20",
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
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${card.color} group-hover:scale-105 transition-transform`}>
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
