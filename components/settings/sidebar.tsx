"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  User, RefreshCw, Bell, Shield, Lock, 
  Palette, Sliders, Plug, CreditCard, Monitor, 
  Download, Accessibility, Ban, AlertTriangle 
} from "lucide-react";

export const SETTINGS_PAGES = [
  { name: "Account", href: "/settings/account", icon: User },
  { name: "Profile Sync", href: "/settings/profile-sync", icon: RefreshCw },
  { name: "Notifications", href: "/settings/notifications", icon: Bell },
  { name: "Privacy", href: "/settings/privacy", icon: Shield },
  { name: "Security", href: "/settings/security", icon: Lock },
  { name: "Appearance", href: "/settings/appearance", icon: Palette },
  { name: "Preferences", href: "/settings/preferences", icon: Sliders },
  { name: "Integrations", href: "/settings/connections", icon: Plug },
  { name: "Billing", href: "/settings/billing", icon: CreditCard },
  { name: "Devices", href: "/settings/devices", icon: Monitor },
  { name: "Data & Export", href: "/settings/export", icon: Download },
  { name: "Accessibility", href: "/settings/accessibility", icon: Accessibility },
  { name: "Blocked Members", href: "/settings/blocked", icon: Ban },
  { name: "Danger Zone", href: "/settings/danger", icon: AlertTriangle, danger: true },
];

export function SettingsSidebar() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col space-y-1">
      {SETTINGS_PAGES.map((page) => {
        const isActive = pathname === page.href || pathname.startsWith(page.href + "/");
        const Icon = page.icon;
        
        return (
          <Link
            key={page.href}
            href={page.href}
            className={`
              flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
              ${isActive 
                ? "bg-primary/10 text-primary" 
                : page.danger 
                  ? "text-error hover:bg-error/10 hover:text-error" 
                  : "text-muted hover:bg-surface-secondary hover:text-heading"
              }
            `}
          >
            <Icon className={`w-4 h-4 ${isActive ? "text-primary" : page.danger ? "text-error" : "text-muted"}`} />
            {page.name}
          </Link>
        );
      })}
    </nav>
  );
}
