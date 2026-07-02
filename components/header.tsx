"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2" onClick={() => setIsMobileMenuOpen(false)}>
              <span className="font-heading text-xl font-bold tracking-tight text-primary">
                Weave
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex gap-6 items-center">
            <Link href="/#how-it-works" className="text-sm font-medium text-muted hover:text-primary transition-colors">
              How It Works
            </Link>
            <Link href="/#marketplace" className="text-sm font-medium text-muted hover:text-primary transition-colors">
              Marketplace
            </Link>
            <Link href="/#trust-safety" className="text-sm font-medium text-muted hover:text-primary transition-colors">
              Trust & Safety
            </Link>
            <Link href="/#pricing" className="text-sm font-medium text-muted hover:text-primary transition-colors">
              Pricing
            </Link>
            <Link href="/help" className="text-sm font-medium text-muted hover:text-primary transition-colors">
              FAQ
            </Link>
          </nav>

          {/* Desktop Auth/CTAs */}
          <div className="hidden md:flex items-center gap-4">
            <Link href="/request-invite" className="text-sm font-medium text-primary bg-surface border border-primary px-4 py-2 rounded-[var(--radius-button)] hover:bg-surface-secondary transition-colors">
              Request Invite
            </Link>
            <Link href="/waitlist" className="text-sm font-medium text-surface bg-primary border border-transparent px-4 py-2 rounded-[var(--radius-button)] hover:bg-primary-hover transition-colors">
              Join Waitlist
            </Link>
          </div>

          {/* Mobile Menu Toggle */}
          <div className="md:hidden">
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
            <Link href="/#trust-safety" onClick={() => setIsMobileMenuOpen(false)} className="text-sm font-medium text-body hover:text-primary transition-colors">
              Trust & Safety
            </Link>
            <Link href="/#pricing" onClick={() => setIsMobileMenuOpen(false)} className="text-sm font-medium text-body hover:text-primary transition-colors">
              Pricing
            </Link>
            <Link href="/help" onClick={() => setIsMobileMenuOpen(false)} className="text-sm font-medium text-body hover:text-primary transition-colors">
              FAQ
            </Link>
            
            <div className="pt-4 mt-2 border-t border-border flex flex-col gap-3">
              <Link href="/request-invite" onClick={() => setIsMobileMenuOpen(false)} className="text-sm font-medium text-center text-primary bg-surface border border-primary px-4 py-3 rounded-[var(--radius-button)] hover:bg-surface-secondary transition-colors">
                Request Invite
              </Link>
              <Link href="/waitlist" onClick={() => setIsMobileMenuOpen(false)} className="text-sm font-medium text-center text-surface bg-primary border border-transparent px-4 py-3 rounded-[var(--radius-button)] hover:bg-primary-hover transition-colors">
                Join Waitlist
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
