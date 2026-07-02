export default function Problem() {
  const painPoints = [
    "You're paying cash before you've been paid.",
    "Clients delay invoices.",
    "Quality freelancers are expensive.",
    "Low-budget marketplaces encourage underpricing.",
    "Finding trustworthy collaborators is difficult.",
    "One bad experience wastes weeks."
  ];

  return (
    <section className="py-20 bg-surface-secondary border-y border-border">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
        <div className="grid md:grid-cols-2 gap-12 lg:gap-20">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-heading mb-6 leading-tight">
              Freelancers already have valuable skills.<br />
              <span className="text-muted">They just don't always have spare cash.</span>
            </h2>
            <div className="space-y-4 text-lg text-body leading-relaxed">
              <p>Modern freelancers constantly need help from other professionals.</p>
              <ul className="space-y-2 border-l-2 border-primary/20 pl-4 py-2 font-medium">
                <li>Developers need UI designers.</li>
                <li>Designers need copywriters.</li>
                <li>Copywriters need developers.</li>
                <li>Marketers need video editors.</li>
                <li>Video editors need motion designers.</li>
              </ul>
              <p>But when income is inconsistent, hiring another freelancer becomes difficult.</p>
              <p className="font-semibold text-heading pt-4">Traditional freelance platforms aren't designed to solve this problem.</p>
            </div>
          </div>

          <div className="flex flex-col justify-center">
            <div className="bg-surface border border-border rounded-[var(--radius-card)] p-8">
              <h3 className="text-xl font-bold text-heading mb-6">The painful reality of hiring help</h3>
              <ul className="space-y-4 mb-8">
                {painPoints.map((point, index) => (
                  <li key={index} className="flex items-start gap-3 text-body">
                    <span className="text-error font-bold block mt-0.5">&times;</span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
              
              <div className="bg-background border border-border rounded-[var(--radius-card)] p-4 text-center">
                <p className="text-body font-medium">
                  <span className="text-muted">The result?</span><br />
                  Talented professionals stop building ideas because they can't afford the help they need.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
