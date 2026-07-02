export default function Pricing() {
  return (
    <section id="pricing" className="py-24 bg-surface-secondary border-y border-border">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold text-heading">Simple pricing</h2>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-12">
          {/* Free Tier */}
          <div className="bg-surface border border-border rounded-[var(--radius-card)] p-8">
            <h3 className="text-2xl font-bold text-heading mb-2">Free</h3>
            <p className="text-muted text-sm mb-6">Perfect for exploring the network.</p>
            
            <div className="text-3xl font-bold text-heading mb-8">$0<span className="text-base font-normal text-muted">/month</span></div>
            
            <ul className="space-y-4 mb-8 text-body">
              <li className="flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                Browse the platform
              </li>
              <li className="flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                Create your profile
              </li>
              <li className="flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                Limited marketplace access
              </li>
              <li className="flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                Basic reputation
              </li>
              <li className="flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                Waitlist access
              </li>
            </ul>

            <button className="w-full py-3 px-4 text-heading font-medium bg-surface border border-border hover:bg-surface-secondary rounded-[var(--radius-button)] transition-colors">
              Get Started
            </button>
          </div>

          {/* Verified Tier */}
          <div className="bg-primary text-surface rounded-[var(--radius-card)] p-8 relative">
            <div className="absolute top-0 right-8 transform -translate-y-1/2">
              <span className="bg-warning text-heading text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">Recommended</span>
            </div>
            <h3 className="text-2xl font-bold text-surface mb-2">Verified Membership</h3>
            <p className="text-surface/80 text-sm mb-6">For serious professionals ready to collaborate.</p>
            
            <div className="text-3xl font-bold text-surface mb-8">$10<span className="text-base font-normal text-surface/80">/month</span></div>
            
            <ul className="space-y-4 mb-8 text-surface/90">
              <li className="flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-surface"></div>
                Everything in Free
              </li>
              <li className="flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-surface"></div>
                Verified badge
              </li>
              <li className="flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-surface"></div>
                Full marketplace access
              </li>
              <li className="flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-surface"></div>
                Priority visibility
              </li>
              <li className="flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-surface"></div>
                Unlimited exchanges
              </li>
              <li className="flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-surface"></div>
                Advanced reputation
              </li>
              <li className="flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-surface"></div>
                Exclusive invite network
              </li>
            </ul>

            <button className="w-full py-3 px-4 text-primary font-bold bg-surface hover:bg-surface-secondary rounded-[var(--radius-button)] transition-colors">
              Become Verified
            </button>
          </div>
        </div>

        {/* Escrow Fee */}
        <div className="bg-surface border border-border rounded-[var(--radius-card)] p-6 max-w-4xl mx-auto flex flex-col sm:flex-row items-center gap-6">
          <div className="flex-shrink-0 w-16 h-16 bg-surface-secondary rounded-xl border border-border flex flex-col items-center justify-center">
            <span className="text-xs text-muted font-bold uppercase">Fee</span>
            <span className="text-lg font-bold text-heading">$2</span>
          </div>
          <div>
            <h4 className="text-lg font-bold text-heading mb-1">Escrow Fee</h4>
            <p className="text-body text-sm leading-relaxed">
              Only charged when starting an escrow-protected exchange. Keeps both members accountable. 
              Returned according to platform rules upon successful completion where applicable.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
