export default function Testimonials() {
  const quotes = [
    "I traded frontend development for branding and finally launched my SaaS.",
    "My copywriting paid for an entire product redesign.",
    "I stopped delaying projects because I couldn't afford help."
  ];

  return (
    <section className="py-24">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
        <h2 className="text-3xl md:text-5xl font-bold text-heading text-center mb-16">Built for collaboration</h2>
        
        <div className="grid md:grid-cols-3 gap-8">
          {quotes.map((quote, index) => (
            <div key={index} className="bg-surface border border-border p-8 rounded-[var(--radius-card)] relative">
              <span className="text-6xl text-primary/20 absolute top-4 left-6 font-serif">"</span>
              <p className="text-lg font-medium text-heading relative z-10 pt-4 leading-relaxed">
                {quote}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
