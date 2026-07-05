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
    { label: "Edit Profile", icon: <Edit3 className="w-4 h-4" />, href: "/profile/edit" },
    { label: "Become Verified", icon: <Shield className="w-4 h-4" />, href: "/verification" },
    { label: "View Ledger", icon: <Wallet className="w-4 h-4" />, href: "/wallet" },
    { label: "Support", icon: <LifeBuoy className="w-4 h-4" />, href: "/support" }
  ];

  return (
    <div className="bg-surface border border-border rounded-[var(--radius-card)] shadow-subtle p-6">
      <h3 className="font-bold text-heading mb-4 uppercase text-xs tracking-wider">Quick Actions</h3>
      <div className="flex flex-col gap-2">
        {actions.map((action, i) => (
          <Link 
            key={i} 
            href={action.href}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-[var(--radius-button)] text-sm font-medium transition-all ${
              action.primary 
                ? 'bg-primary text-primary-foreground shadow-glow hover:bg-primary/90' 
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
