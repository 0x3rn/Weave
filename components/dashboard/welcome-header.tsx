"use client";

import { User } from "@/types";
import Link from "next/link";
import { MessageSquarePlus, Store } from "lucide-react";

interface WelcomeHeaderProps {
  user: User;
  activeExchangesCount: number;
  matchesCount: number;
}

export default function WelcomeHeader({ user, activeExchangesCount, matchesCount }: WelcomeHeaderProps) {
  const firstName = user.fullName ? user.fullName.split(" ")[0] : user.username;
  
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  return (
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-border">
      <div className="space-y-2">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-heading">
          {getGreeting()}, {firstName}
        </h1>
        <p className="text-lg text-body">
          You currently have <strong className="text-heading">{user.skillHours || 0} Skill Hours</strong>, <strong className="text-heading">{activeExchangesCount} active exchanges</strong>, and <strong className="text-heading">{matchesCount} new collaboration matches</strong> waiting for you.
        </p>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <Link 
          href="/marketplace" 
          className="px-4 py-2 bg-surface border border-border text-heading rounded-[var(--radius-button)] text-sm font-semibold hover:border-primary hover:text-primary transition-all flex items-center gap-2 shadow-subtle"
        >
          <Store className="w-4 h-4 text-primary" />
          Browse Marketplace
        </Link>
        <Link 
          href="/marketplace/create" 
          className="px-4 py-2 bg-primary text-background rounded-[var(--radius-button)] text-sm font-semibold hover:bg-primary-hover transition-all flex items-center gap-2 shadow-subtle hover:shadow-[0_0_15px_rgba(46,125,50,0.3)] dark:hover:shadow-[0_0_15px_rgba(88,199,109,0.3)]"
        >
          <MessageSquarePlus className="w-4 h-4" />
          Request Help
        </Link>
      </div>
    </div>
  );
}
