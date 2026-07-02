export default function FAQ() {
  const faqs = [
    {
      q: "How does Skill Hours work?",
      a: "Every completed hour earns one Skill Hour that can later be spent requesting help from another freelancer."
    },
    {
      q: "Why is Weave invite only?",
      a: "Quality matters more than quantity. Keeping the network curated improves trust, professionalism, and collaboration."
    },
    {
      q: "Can I exchange different types of skills?",
      a: "Yes. Development can be exchanged for design, writing, marketing, legal work, accounting, and more."
    },
    {
      q: "How is quality maintained?",
      a: "Profiles, verification, reviews, reputation, completed exchanges, and invite-only membership all work together to build trust."
    },
    {
      q: "What happens if someone disappears?",
      a: "Escrow and reputation systems discourage bad behavior. Repeated abuse leads to account removal."
    },
    {
      q: "Do Skill Hours expire?",
      a: "No. Hours remain in your balance until used."
    },
    {
      q: "Can businesses join?",
      a: "Initially Weave is designed for freelancers and independent professionals. Business support may come later."
    }
  ];

  return (
    <section id="faq" className="py-24">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-3xl">
        <h2 className="text-3xl md:text-5xl font-bold text-heading text-center mb-16">FAQ</h2>
        
        <div className="space-y-6">
          {faqs.map((faq, index) => (
            <div key={index} className="bg-surface border border-border rounded-[var(--radius-card)] p-6">
              <h3 className="text-lg font-bold text-heading mb-3">{faq.q}</h3>
              <p className="text-body leading-relaxed">{faq.a}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
