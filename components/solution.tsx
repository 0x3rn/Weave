import { Repeat, Coins, ArrowRightLeft } from "lucide-react";

export default function Solution() {
  const cards = [
    {
      icon: <ArrowRightLeft className="w-8 h-8 text-primary" />,
      title: "Offer Your Skills",
      description: "Create a profile showcasing what you can do, your experience, portfolio, availability, and preferred projects."
    },
    {
      icon: <Coins className="w-8 h-8 text-primary" />,
      title: "Earn Skill Hours",
      description: "Complete work for another verified member and receive Skill Hours directly into your account."
    },
    {
      icon: <Repeat className="w-8 h-8 text-primary" />,
      title: "Spend Skill Hours",
      description: "Use your earned hours to request services from other freelancers whenever you need help."
    }
  ];

  return (
    <section className="py-24">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-5xl font-bold text-heading mb-6">
            What if every professional hour had <span className="text-primary">equal value?</span>
          </h2>
          <div className="text-lg text-body space-y-4 leading-relaxed">
            <p>Inside Weave, <strong className="text-heading font-semibold">one hour of professional work equals one Skill Hour.</strong></p>
            <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm font-medium text-muted my-6 bg-surface-secondary border border-border rounded-full py-2 px-6 inline-flex mx-auto">
              <span>1hr Dev = 1hr Design</span>
              <span className="hidden sm:inline">&bull;</span>
              <span>1hr Writing = 1hr Marketing</span>
              <span className="hidden md:inline">&bull;</span>
              <span className="hidden md:inline">1hr Video = 1hr UX</span>
            </div>
            <p>Instead of negotiating prices, members exchange expertise directly. Skill Hours become the currency. Your expertise becomes your purchasing power.</p>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
          {cards.map((card, index) => (
            <div key={index} className="bg-surface border border-border rounded-[var(--radius-card)] p-8 hover:border-primary/30 transition-colors">
              <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mb-6">
                {card.icon}
              </div>
              <h3 className="text-xl font-bold text-heading mb-3">{card.title}</h3>
              <p className="text-body leading-relaxed">{card.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
