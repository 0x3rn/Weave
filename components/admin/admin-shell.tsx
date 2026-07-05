"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Users, 
  UserPlus, 
  ShieldCheck, 
  ShoppingBag, 
  ArrowRightLeft, 
  Lock, 
  AlertTriangle, 
  CreditCard, 
  FileText, 
  BarChart3,
  Menu,
  X,
  LogOut,
  Mail,
  Flag,
  PenTool,
  LifeBuoy,
  Settings,
  History
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

const NAV_ITEMS = [
  { name: "Overview", href: "/admin", icon: LayoutDashboard },
  { name: "Invites", href: "/admin/invites", icon: UserPlus },
  { name: "Users", href: "/admin/users", icon: Users },
  { name: "Verification", href: "/admin/verification", icon: ShieldCheck },
  { name: "Marketplace", href: "/admin/marketplace", icon: ShoppingBag },
  { name: "Exchanges", href: "/admin/exchanges", icon: ArrowRightLeft },
  { name: "Escrow", href: "/admin/escrow", icon: Lock },
  { name: "Skill Hour Ledger", href: "/admin/skill-ledger", icon: History },
  { name: "Disputes", href: "/admin/disputes", icon: AlertTriangle },
  { name: "Reports", href: "/admin/reports", icon: Flag },
  { name: "Subscriptions", href: "/admin/subscriptions", icon: CreditCard },
  { name: "CMS", href: "/admin/cms", icon: FileText },
  { name: "Blog", href: "/admin/blog", icon: PenTool },
  { name: "Analytics", href: "/admin/analytics", icon: BarChart3 },
  { name: "Support", href: "/admin/support", icon: LifeBuoy },
  { name: "Settings", href: "/admin/settings", icon: Settings },
];

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      
      {/* MOBILE OVERLAY */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={closeMobileMenu}
        />
      )}

      {/* SIDEBAR */}
      <aside 
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-surface border-r border-border flex flex-col transition-transform duration-300 ease-in-out ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Sidebar Header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-border">
          <Link href="/admin" onClick={closeMobileMenu} className="font-heading font-bold text-xl tracking-tight flex items-center gap-2">
            <span className="text-primary">Weave</span>
            <span className="text-xs px-2 py-0.5 bg-surface-secondary border border-border rounded-md text-muted font-medium">Admin</span>
          </Link>
          <button className="lg:hidden text-muted hover:text-heading" onClick={closeMobileMenu}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sidebar Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1 scrollbar-thin">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            
            return (
              <Link 
                key={item.name} 
                href={item.href}
                onClick={closeMobileMenu}
                className={`flex items-center gap-3 px-3 py-2 rounded-[var(--radius-input)] text-sm font-medium transition-colors ${
                  isActive 
                    ? "bg-heading text-background" 
                    : "text-muted hover:bg-surface-secondary hover:text-heading"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-background" : "text-muted"}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-border">
          <Link href="/" className="flex items-center gap-3 px-3 py-2 rounded-[var(--radius-input)] text-sm font-medium text-muted hover:bg-surface-secondary hover:text-heading transition-colors">
            <LogOut className="w-4 h-4" />
            Exit Admin
          </Link>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* TOPBAR */}
        <header className="h-16 bg-surface border-b border-border flex items-center justify-between px-4 lg:px-8 z-10">
          <div className="flex items-center gap-4">
            <button 
              className="lg:hidden text-muted hover:text-heading"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-lg font-bold text-heading hidden sm:block">
              {NAV_ITEMS.find(item => item.href === pathname)?.name || "Dashboard"}
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <div className="w-8 h-8 rounded-full bg-heading flex items-center justify-center text-background font-bold text-sm">
              A
            </div>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8 bg-surface-secondary">
          {children}
        </main>
      </div>
      
    </div>
  );
}
