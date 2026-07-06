"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Store, 
  ArrowRightLeft, 
  History, 
  MessageSquare, 
  Bell, 
  User, 
  Star, 
  Award, 
  LifeBuoy, 
  Settings,
  Menu,
  X,
  Search,
  Plus
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

const NAV_ITEMS = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Marketplace", href: "/marketplace", icon: Store },
  { name: "My Exchanges", href: "/exchanges", icon: ArrowRightLeft },
  { name: "Ledger", href: "/wallet", icon: History },
  { name: "Messages", href: "/messages", icon: MessageSquare },
  { name: "Notifications", href: "/notifications", icon: Bell },
  { name: "Profile", href: "/profile", icon: User },
  { name: "Reviews", href: "/reviews", icon: Star },
  { name: "Achievements", href: "/achievements", icon: Award },
  { name: "Help Center", href: "/help", icon: LifeBuoy },
  { name: "Settings", href: "/settings", icon: Settings },
];

export default function DashboardShell({ children, user }: { children: React.ReactNode, user?: any }) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  return (
    <div className="flex h-[100dvh] bg-background overflow-hidden">
      
      {/* MOBILE OVERLAY */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={closeMobileMenu}
        />
      )}

      {/* SIDEBAR */}
      <aside 
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-background border-r border-border flex flex-col transition-transform duration-300 ease-in-out ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Sidebar Header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-border shrink-0">
          <Link href="/dashboard" onClick={closeMobileMenu} className="font-heading font-bold text-xl tracking-tight flex items-center gap-2">
            <span className="text-primary">Weave</span>
          </Link>
          <button className="lg:hidden text-muted hover:text-heading" onClick={closeMobileMenu}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sidebar Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1 scrollbar-thin">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href || (pathname.startsWith(item.href) && item.href !== "/dashboard" && item.href !== "/profile");
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
        <div className="p-4 border-t border-border shrink-0">
          <div className="p-3 bg-surface-secondary rounded-[var(--radius-card)] border border-border">
            <p className="text-xs font-semibold text-heading mb-1">Skill Hours: {user?.skillHours ?? 0}</p>
            <Link href="/wallet" className="text-xs text-primary hover:underline font-medium">View Ledger →</Link>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* TOPBAR */}
        <header className="h-16 bg-background border-b border-border flex items-center justify-between px-4 lg:px-8 shrink-0 z-10">
          <div className="flex items-center gap-4">
            <button 
              className="lg:hidden text-muted hover:text-heading"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-lg font-bold text-heading hidden sm:block">
              {NAV_ITEMS.find(item => pathname === item.href || (pathname.startsWith(item.href) && item.href !== "/dashboard" && item.href !== "/profile"))?.name || "Dashboard"}
            </h1>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-4">
            <button className="p-2 text-muted hover:text-heading transition-colors hidden sm:block">
              <Search className="w-5 h-5" />
            </button>
            
            <Link href="/marketplace/create" className="p-2 text-muted hover:text-heading transition-colors hidden sm:block">
              <Plus className="w-5 h-5" />
            </Link>

            <div className="h-6 w-px bg-border hidden sm:block mx-1"></div>

            <Link href="/notifications" className="p-2 text-muted hover:text-heading transition-colors relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full"></span>
            </Link>

            <Link href="/messages" className="p-2 text-muted hover:text-heading transition-colors relative">
              <MessageSquare className="w-5 h-5" />
            </Link>

            <ThemeToggle />
            
            <Link href="/profile" className="w-8 h-8 rounded-full bg-heading flex items-center justify-center text-background font-bold text-sm ml-2 overflow-hidden border border-border shrink-0">
              {user?.photoURL || user?.photoUrl ? (
                <img src={user.photoURL || user.photoUrl} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                user?.fullName ? user.fullName.charAt(0) : "Me"
              )}
            </Link>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <main className="flex-1 overflow-y-auto bg-background">
          {children}
        </main>
      </div>
      
    </div>
  );
}
