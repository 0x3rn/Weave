import { ShieldCheck } from "lucide-react";

export default function Escrow() {
  const steps = [
    "Both members accept the exchange.",
    "Each deposits the escrow amount.",
    "Work begins.",
    "Both confirm completion.",
    "Escrow is refunded."
  ];

  const benefits = [
    "Reduces ghosting.",
    "Prevents scams.",
    "Encourages professionalism.",
    "Creates accountability."
  ];

  return (
    <section className="py-24 bg-surface-secondary border-y border-border">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="w-16 h-16 bg-surface border border-border rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-subtle">
            <ShieldCheck className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-heading mb-6">Protected exchanges with escrow</h2>
          <div className="text-lg text-body space-y-4">
            <p>Trust matters.</p>
            <p>Before work begins, both members deposit a small escrow amount. This ensures both sides are committed before anyone starts working.</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8 lg:gap-16">
          <div className="bg-surface border border-border rounded-[var(--radius-card)] p-8">
            <h3 className="text-xl font-bold text-heading mb-6 border-b border-border pb-4">How It Works</h3>
            <ol className="space-y-6">
              {steps.map((step, index) => (
                <li key={index} className="flex items-start gap-4">
                  <span className="flex-shrink-0 w-8 h-8 rounded-full bg-background border border-border flex items-center justify-center text-sm font-bold text-primary">
                    {index + 1}
                  </span>
                  <span className="text-body font-medium mt-1">{step}</span>
                </li>
              ))}
            </ol>
          </div>

          <div className="flex flex-col justify-center space-y-8">
            <p className="text-body leading-relaxed p-6 bg-background border border-border rounded-[var(--radius-card)]">
              If disputes occur, the escrow system discourages bad actors and helps keep the marketplace honest.
            </p>
            
            <div>
              <h3 className="text-lg font-bold text-heading mb-4 px-2">Benefits</h3>
              <div className="grid grid-cols-2 gap-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="bg-surface border border-border p-4 rounded-[var(--radius-card)] text-center text-sm font-medium text-body">
                    {benefit}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
