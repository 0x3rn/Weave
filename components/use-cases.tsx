export default function UseCases() {
  const cases = [
    {
      title: "Startup founders",
      description: "Build MVPs without burning cash."
    },
    {
      title: "Indie Hackers",
      description: "Trade your technical skills for branding, marketing, or design."
    },
    {
      title: "Freelancers",
      description: "Fill gaps in your workflow through fair exchanges."
    },
    {
      title: "Creators",
      description: "Collaborate with specialists without expensive invoices."
    },
    {
      title: "Agencies",
      description: "Exchange overflow work with trusted professionals."
    },
    {
      title: "Remote Teams",
      description: "Access additional expertise whenever needed."
    }
  ];

  return (
    <section className="py-24 bg-surface-secondary border-y border-border">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
        <h2 className="text-3xl md:text-4xl font-bold text-heading text-center mb-16">Perfect for</h2>
        
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {cases.map((useCase, index) => (
            <div key={index} className="bg-surface border border-border p-8 rounded-[var(--radius-card)]">
              <h3 className="text-xl font-bold text-heading mb-3">{useCase.title}</h3>
              <p className="text-body">{useCase.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
