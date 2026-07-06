"use client";

import { 
  Plus, Search, UserPlus, Edit3, Shield, Wallet, LifeBuoy 
} from "lucide-react";
import Link from "next/link";

export default function QuickActions() {
  const actions = [
    { label: "Create Exchange", icon: <Plus className="w-4 h-4" />, href: "/marketplace/create", primary: true },
    { label: "Browse Marketplace", icon: <Search className="w-4 h-4" />, href: "/marketplace" },
    { label: "Invite Someone", icon: <UserPlus className="w-4 h-4" />, href: "/invites" },
    { label: "Edit Profile", icon: <Edit3 className="w-4 h-4" />, href: "/profile" },
    { label: "Become Verified", icon: <Shield className="w-4 h-4" />, href: "/verification" },
    { label: "View Ledger", icon: <Wallet className="w-4 h-4" />, href: "/wallet" },
    { label: "Support", icon: <LifeBuoy className="w-4 h-4" />, href: "/support" }
  ];

  return (
    <div className="bg-surface border border-border rounded-[var(--radius-card)] shadow-subtle p-6">
      <h3 className="font-semibold text-heading mb-4 text-sm tracking-tight">Quick Actions</h3>
      <div className="flex flex-col gap-2">
        {actions.map((action, i) => (
          <Link 
            key={i} 
            href={action.href}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-[var(--radius-button)] text-sm font-semibold transition-all ${
              action.primary 
                ? 'bg-primary text-background shadow-subtle hover:bg-primary-hover hover:shadow-[0_0_15px_rgba(46,125,50,0.3)] dark:hover:shadow-[0_0_15px_rgba(88,199,109,0.3)]' 
                : 'bg-background border border-border text-heading hover:border-primary hover:text-primary'
            }`}
          >
            {action.icon}
            {action.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
