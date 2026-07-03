import { Lock } from "lucide-react";
import Link from "next/link";

export default function ReadyCTA() {
  return (
    <section className="py-24 bg-surface-secondary border-t border-border">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl text-center">
        <h2 className="text-4xl md:text-6xl font-bold text-heading mb-8 tracking-tight">
          Stop waiting until you have the budget.<br />
          <span className="text-primary">Start building with the skills you already have.</span>
        </h2>
        
        <div className="text-xl text-body mb-12 space-y-4 max-w-2xl mx-auto">
          <p>Thousands of talented freelancers already possess everything needed to build incredible products.</p>
          <p>The missing piece isn't money.</p>
          <p className="font-semibold text-heading">It's trusted collaboration.</p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
          <Link href="/request-invite" className="w-full sm:w-auto px-8 py-4 text-lg font-bold text-surface bg-primary rounded-[var(--radius-button)] hover:bg-primary-hover transition-colors shadow-subtle">
            Request Your Invite
          </Link>
        </div>

        <div className="flex items-center justify-center gap-2 text-sm text-muted font-medium">
          <Lock className="w-4 h-4 text-primary" />
          <span>Invite-only &bull; Trusted professionals &bull; Skill Hours &bull; Protected exchanges</span>
        </div>
      </div>
    </section>
  );
}
