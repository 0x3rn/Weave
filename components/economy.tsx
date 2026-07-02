import { Check } from "lucide-react";

export default function Economy() {
  const benefits = [
    "No undercutting.",
    "No bidding wars.",
    "No race to the bottom.",
    "Transparent exchanges.",
    "Predictable marketplace.",
    "Built around collaboration instead of competition."
  ];

  return (
    <section className="py-24">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
        <div className="grid md:grid-cols-2 gap-12 lg:gap-20 items-center">
          <div>
            <h2 className="text-3xl md:text-5xl font-bold text-heading mb-6">One Hour = One Hour</h2>
            <div className="text-lg text-body space-y-6">
              <p>Weave intentionally removes pricing wars.</p>
              <p>Instead of charging wildly different rates based on geography or negotiation skills, <strong className="font-semibold text-heading">every completed hour earns one Skill Hour.</strong></p>
            </div>
            
            <div className="mt-8 p-4 bg-surface-secondary border border-border rounded-[var(--radius-card)] text-sm text-muted leading-relaxed">
              <strong>Note:</strong> Skill quality is maintained through verification, reputation, reviews, and invite-only membership—not hourly pricing.
            </div>
          </div>

          <div className="bg-surface border border-border rounded-[var(--radius-card)] p-8">
            <h3 className="text-xl font-bold text-heading mb-6">The Benefits</h3>
            <ul className="space-y-4">
              {benefits.map((benefit, index) => (
                <li key={index} className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                    <Check className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-body font-medium">{benefit}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
