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
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 mb-8">
      
      {/* Total Users */}
      <div className="bg-surface border border-border p-4 rounded-[var(--radius-card)] shadow-subtle flex flex-col justify-between h-[100px] col-span-2 md:col-span-1">
        <div className="flex items-center gap-2 text-muted">
          <Users className="w-4 h-4" />
          <span className="text-xs font-semibold uppercase tracking-wider">Total Users</span>
        </div>
        <div>
          <div className="text-2xl font-bold text-heading">{summary.totalUsers.toLocaleString()}</div>
          <div className="text-xs font-medium text-success mt-1">+{summary.thisWeekCount} this week</div>
        </div>
      </div>

      {/* Active Today */}
      <div className="bg-surface border border-border p-4 rounded-[var(--radius-card)] shadow-subtle flex flex-col justify-between h-[100px] col-span-2 md:col-span-1">
        <div className="flex items-center gap-2 text-muted">
          <TrendingUp className="w-4 h-4" />
          <span className="text-xs font-semibold uppercase tracking-wider">Active Today</span>
        </div>
        <div>
          <div className="text-2xl font-bold text-heading">{summary.activeTodayCount.toLocaleString()}</div>
          <div className="text-xs font-medium text-muted mt-1">{summary.activePercentage}%</div>
        </div>
      </div>

      {/* Verified Members */}
      <div className="bg-surface border border-border p-4 rounded-[var(--radius-card)] shadow-subtle flex flex-col justify-between h-[100px] col-span-2 md:col-span-1">
        <div className="flex items-center gap-2 text-muted">
          <UserCheck className="w-4 h-4" />
          <span className="text-xs font-semibold uppercase tracking-wider">Verified</span>
        </div>
        <div>
          <div className="text-2xl font-bold text-heading">{summary.verifiedCount.toLocaleString()}</div>
          <div className="text-xs font-medium text-muted mt-1">{summary.verifiedPercentage}%</div>
        </div>
      </div>

      {/* Pending Invites */}
      <div className="bg-surface border border-border p-4 rounded-[var(--radius-card)] shadow-subtle flex flex-col justify-between h-[100px] col-span-2 md:col-span-1">
        <div className="flex items-center gap-2 text-muted">
          <MailOpen className="w-4 h-4" />
          <span className="text-xs font-semibold uppercase tracking-wider">Pending Invites</span>
        </div>
        <div>
          <div className="text-2xl font-bold text-heading">{summary.pendingInvites.toLocaleString()}</div>
        </div>
      </div>

      {/* Pending Verification */}
      <div className="bg-surface border border-border p-4 rounded-[var(--radius-card)] shadow-subtle flex flex-col justify-between h-[100px] col-span-2 md:col-span-1">
        <div className="flex items-center gap-2 text-muted">
          <Clock className="w-4 h-4" />
          <span className="text-xs font-semibold uppercase tracking-wider">Pending Verification</span>
        </div>
        <div>
          <div className="text-2xl font-bold text-heading">{summary.pendingVerification.toLocaleString()}</div>
        </div>
      </div>

      {/* Suspended Accounts */}
      <div className="bg-surface border border-border p-4 rounded-[var(--radius-card)] shadow-subtle flex flex-col justify-between h-[100px] col-span-2 md:col-span-1">
        <div className="flex items-center gap-2 text-muted">
          <ShieldAlert className="w-4 h-4" />
          <span className="text-xs font-semibold uppercase tracking-wider">Suspended</span>
        </div>
        <div>
          <div className="text-2xl font-bold text-heading">{summary.suspendedCount.toLocaleString()}</div>
        </div>
      </div>

      {/* Reported Users */}
      <div className="bg-surface border border-border p-4 rounded-[var(--radius-card)] shadow-subtle flex flex-col justify-between h-[100px] col-span-2 md:col-span-1">
        <div className="flex items-center gap-2 text-muted">
          <AlertTriangle className="w-4 h-4" />
          <span className="text-xs font-semibold uppercase tracking-wider">Reported</span>
        </div>
        <div>
          <div className="text-2xl font-bold text-heading">{summary.reportedCount.toLocaleString()}</div>
        </div>
      </div>

      {/* New Users Today */}
      <div className="bg-surface border border-border p-4 rounded-[var(--radius-card)] shadow-subtle flex flex-col justify-between h-[100px] col-span-2 md:col-span-1">
        <div className="flex items-center gap-2 text-muted">
          <AlertCircle className="w-4 h-4" />
          <span className="text-xs font-semibold uppercase tracking-wider">New Today</span>
        </div>
        <div>
          <div className="text-2xl font-bold text-heading">{summary.newTodayCount.toLocaleString()}</div>
        </div>
      </div>

    </div>
  );
}
