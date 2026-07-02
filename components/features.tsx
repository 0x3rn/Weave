import { Check } from "lucide-react";

export default function Features() {
  const features = [
    "Keep building even when cash flow is tight.",
    "Exchange expertise without negotiating prices.",
    "Work with verified professionals.",
    "Build long-term relationships instead of one-off gigs.",
    "Grow your reputation with every completed exchange.",
    "Spend less time searching and more time creating."
  ];

  return (
    <section className="py-24">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
        <h2 className="text-3xl md:text-5xl font-bold text-heading text-center mb-16">Why freelancers choose Weave</h2>
        
        <div className="grid md:grid-cols-2 gap-x-12 gap-y-8">
          {features.map((feature, index) => (
            <div key={index} className="flex items-start gap-4 p-4 rounded-[var(--radius-card)] hover:bg-surface-secondary transition-colors">
              <div className="flex-shrink-0 mt-1">
                <Check className="w-6 h-6 text-primary" />
              </div>
              <p className="text-lg font-medium text-body leading-relaxed">{feature}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
