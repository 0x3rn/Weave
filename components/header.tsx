import Link from "next/link";
import { Menu } from "lucide-react";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2">
              <span className="font-heading text-xl font-bold tracking-tight text-primary">
                Weave
              </span>
            </Link>
          </div>

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
            <Link href="/#faq" className="text-sm font-medium text-muted hover:text-primary transition-colors">
              FAQ
            </Link>
          </nav>

          <div className="hidden md:flex items-center gap-4">
            <Link href="/waitlist" className="text-sm font-medium text-primary bg-surface border border-primary px-4 py-2 rounded-[var(--radius-button)] hover:bg-surface-secondary transition-colors">
              Request Invite
            </Link>
            <Link href="/waitlist" className="text-sm font-medium text-surface bg-primary border border-transparent px-4 py-2 rounded-[var(--radius-button)] hover:bg-primary-hover transition-colors">
              Join Waitlist
            </Link>
          </div>

          <div className="md:hidden">
            <button className="p-2 text-muted hover:text-primary">
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
