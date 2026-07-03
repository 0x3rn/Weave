"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X, Sun, Moon } from "lucide-react";
import { useTheme } from "next-themes";

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { theme, setTheme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const currentTheme = theme === "system" ? systemTheme : theme;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex flex-1 items-center justify-start">
            <Link href="/" className="flex items-center gap-2" onClick={() => setIsMobileMenuOpen(false)}>
              <span className="font-heading text-xl font-bold tracking-tight text-primary">
                Weave
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex flex-1 justify-center gap-6 items-center">
            <Link href="/#how-it-works" className="text-sm font-medium text-muted hover:text-primary transition-colors">
              How It Works
            </Link>
            <Link href="/#marketplace" className="text-sm font-medium text-muted hover:text-primary transition-colors">
              Marketplace
            </Link>
            <Link href="/#pricing" className="text-sm font-medium text-muted hover:text-primary transition-colors">
              Pricing
            </Link>
          </nav>

          {/* Desktop Auth/CTAs & Theme Toggle */}
          <div className="hidden md:flex flex-1 items-center justify-end gap-3 lg:gap-4">
            {mounted && (
              <button
                onClick={() => setTheme(currentTheme === "dark" ? "light" : "dark")}
                className="p-2 text-muted hover:text-primary transition-colors rounded-full hover:bg-surface-secondary"
                aria-label="Toggle theme"
              >
                {currentTheme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
            )}
            
            <Link href="/login" className="text-sm font-medium text-heading hover:text-primary transition-colors ml-2">
              Sign In
            </Link>
            <Link href="/request-invite" className="text-sm font-medium text-surface bg-primary border border-transparent px-4 py-2 rounded-[var(--radius-button)] hover:bg-primary-hover transition-colors">
              Request Invite
            </Link>
          </div>

          {/* Mobile Menu Toggle & Theme */}
          <div className="md:hidden flex items-center gap-2">
            {mounted && (
              <button
                onClick={() => setTheme(currentTheme === "dark" ? "light" : "dark")}
                className="p-2 text-muted hover:text-primary transition-colors rounded-full"
                aria-label="Toggle theme"
              >
                {currentTheme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
            )}
            <button 
              className="p-2 text-muted hover:text-primary"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Dropdown */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-background">
          <div className="container mx-auto px-4 py-4 flex flex-col space-y-4">
            <Link href="/#how-it-works" onClick={() => setIsMobileMenuOpen(false)} className="text-sm font-medium text-body hover:text-primary transition-colors">
              How It Works
            </Link>
            <Link href="/#marketplace" onClick={() => setIsMobileMenuOpen(false)} className="text-sm font-medium text-body hover:text-primary transition-colors">
              Marketplace
            </Link>
            <Link href="/#pricing" onClick={() => setIsMobileMenuOpen(false)} className="text-sm font-medium text-body hover:text-primary transition-colors">
              Pricing
            </Link>
            
            <div className="pt-4 mt-2 border-t border-border flex flex-col gap-3">
              <Link href="/login" onClick={() => setIsMobileMenuOpen(false)} className="text-sm font-medium text-center text-heading bg-surface border border-border px-4 py-3 rounded-[var(--radius-button)] hover:bg-surface-secondary transition-colors">
                Sign In
              </Link>
              <Link href="/request-invite" onClick={() => setIsMobileMenuOpen(false)} className="text-sm font-medium text-center text-surface bg-primary border border-transparent px-4 py-3 rounded-[var(--radius-button)] hover:bg-primary-hover transition-colors">
                Request Invite
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
