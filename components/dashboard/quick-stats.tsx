"use client";

import { User } from "@/types";
import { Clock, RefreshCcw, Handshake, ShieldCheck, Target, CheckCircle2 } from "lucide-react";
import Link from "next/link";

interface QuickStatsProps {
  user: User;
  pendingRequestsCount: number;
  activeExchangesCount: number;
}

export default function QuickStats({ user, pendingRequestsCount, activeExchangesCount }: QuickStatsProps) {
  
  const stats = [
    {
      title: "Skill Hour Balance",
      value: `${user.skillHours || 0}`,
      subtext: `+${user.stats?.skillHoursEarned || 0} earned`,
      icon: <Clock className="w-5 h-5 text-primary" />,
      color: "bg-primary/10 border-primary/20",
      href: "/wallet"
    },
    {
      title: "Active Exchanges",
      value: activeExchangesCount.toString(),
      subtext: `${user.stats?.exchangesCompleted || 0} completed`,
      icon: <RefreshCcw className="w-5 h-5 text-blue-500" />,
      color: "bg-blue-500/10 border-blue-500/20",
      href: "/exchanges"
    },
    {
      title: "Pending Requests",
      value: pendingRequestsCount.toString(),
      subtext: "Action required",
      icon: <Handshake className="w-5 h-5 text-amber-500" />,
      color: "bg-amber-500/10 border-amber-500/20",
      href: "/requests"
    },
    {
      title: "Trust Score",
      value: `${user.trustScore}`,
      subtext: user.trustScore >= 90 ? "Excellent standing" : "Good standing",
      icon: <ShieldCheck className={`w-5 h-5 ${user.trustScore >= 70 ? 'text-success' : 'text-warning'}`} />,
      color: `bg-${user.trustScore >= 70 ? 'success' : 'warning'}/10 border-${user.trustScore >= 70 ? 'success' : 'warning'}/20`,
      href: "/profile"
    },
    {
      title: "Completion Rate",
      value: `${user.stats?.completionRate || 0}%`,
      subtext: "Successful matching",
      icon: <Target className="w-5 h-5 text-purple-500" />,
      color: "bg-purple-500/10 border-purple-500/20",
      href: "/profile"
    },
    {
      title: "Profile Completion",
      value: `${user.profileCompletion}%`,
      subtext: user.profileCompletion < 100 ? "Needs updating" : "Fully complete",
      icon: <CheckCircle2 className={`w-5 h-5 ${user.profileCompletion === 100 ? 'text-success' : 'text-primary'}`} />,
      color: user.profileCompletion === 100 ? "bg-success/10 border-success/20" : "bg-primary/10 border-primary/20",
      href: "/profile/edit"
    }
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
      {stats.map((stat, i) => (
        <Link 
          key={i} 
          href={stat.href}
          className="bg-surface border border-border rounded-[var(--radius-card)] p-5 flex flex-col justify-between group hover:border-primary/50 transition-all duration-300 shadow-subtle hover:shadow-[0_0_15px_rgba(46,125,50,0.1)] dark:hover:shadow-[0_0_15px_rgba(88,199,109,0.1)]"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-muted">{stat.title}</h3>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${stat.color} group-hover:scale-105 transition-transform`}>
              {stat.icon}
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-heading tracking-tight">{stat.value}</div>
            <div className="text-xs text-muted mt-1 font-medium group-hover:text-heading transition-colors">
              {stat.subtext}
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
