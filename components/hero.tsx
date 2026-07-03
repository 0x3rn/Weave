import { Lock, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export default function Hero() {
  return (
    <section className="pt-8 pb-16 md:pt-12 md:pb-24 overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center max-w-4xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-[var(--radius-badge)] bg-surface-secondary border border-border text-sm font-medium text-body mb-8">
          <Lock className="w-4 h-4 text-primary" />
          <span>Invite Only &bull; Trust-Based Marketplace</span>
        </div>

        <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-heading mb-6">
          Trade Skills.<br />
          <span className="text-primary">Not Cash.</span>
        </h1>

        <p className="text-xl text-body mb-8 max-w-2xl mx-auto leading-relaxed">
          Weave is an invite-only barter network where freelancers exchange professional services using <strong className="font-semibold text-heading">Skill Hours</strong> instead of money. Developers, designers, writers, marketers, video editors, and other specialists help each other without chasing invoices or competing on low-budget marketplaces.
        </p>

        <div className="bg-surface border border-border rounded-[var(--radius-card)] p-6 mb-10 max-w-xl mx-auto text-left shadow-subtle">
          <div className="space-y-4">
            <p className="text-body font-medium">Need a designer but your budget is tight? <span className="text-primary">Trade development hours.</span></p>
            <p className="text-body font-medium">Need a website but you're a copywriter? <span className="text-primary">Trade writing hours.</span></p>
          </div>
          <div className="mt-6 pt-6 border-t border-border">
            <p className="text-muted text-sm leading-relaxed">Every hour has equal value inside Weave, creating a fair marketplace where talent, not cash flow, determines opportunity.</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
          <Link href="/request-invite" className="w-full sm:w-auto px-8 py-3 text-base font-medium text-surface bg-primary rounded-[var(--radius-button)] hover:bg-primary-hover transition-colors shadow-subtle">
            Request Your Invite
          </Link>
          <Link href="#how-it-works" className="w-full sm:w-auto px-8 py-3 text-base font-medium text-heading bg-surface border border-border rounded-[var(--radius-button)] hover:bg-surface-secondary transition-colors">
            See How It Works
          </Link>
        </div>

        <div className="inline-flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-center sm:justify-center gap-x-8 gap-y-4 text-sm font-medium text-muted text-left">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-primary" />
            <span>Invite-only community</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-primary" />
            <span>Equal-value Skill Hours</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-primary" />
            <span>Escrow protected exchanges</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-primary" />
            <span>Verified professionals</span>
          </div>
        </div>
      </div>
    </section>
  );
}
