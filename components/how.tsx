export default function How() {
  const skills = [
    "Frontend Development", "Backend Development", "UI Design", "Brand Identity",
    "Copywriting", "SEO", "Marketing", "Illustration",
    "Video Editing", "Animation", "Photography", "Legal", "Accounting"
  ];

  return (
    <section id="how-it-works" className="py-24 bg-surface-secondary border-y border-border">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-heading mb-4">Three simple steps</h2>
          <p className="text-lg text-body">How to start trading skills on Weave.</p>
        </div>

        <div className="space-y-12">
          {/* Step 1 */}
          <div className="bg-surface border border-border rounded-[var(--radius-card)] p-8 md:p-12">
            <div className="flex flex-col md:flex-row gap-8 items-start">
              <div className="flex-shrink-0 w-12 h-12 bg-primary text-surface rounded-full flex items-center justify-center text-xl font-bold">1</div>
              <div className="flex-grow">
                <h3 className="text-2xl font-bold text-heading mb-4">Create Your Professional Profile</h3>
                <p className="text-lg text-body mb-6">List your skills and build your portfolio so others know exactly how you can help them.</p>
                
                <div className="mt-4">
                  <p className="text-sm font-semibold text-heading mb-3 uppercase tracking-wider">Examples</p>
                  <div className="flex flex-wrap gap-2">
                    {skills.map((skill, i) => (
                      <span key={i} className="text-xs font-medium bg-background border border-border text-body px-3 py-1.5 rounded-[var(--radius-badge)]">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Step 2 */}
          <div className="bg-surface border border-border rounded-[var(--radius-card)] p-8 md:p-12">
            <div className="flex flex-col md:flex-row gap-8 items-start">
              <div className="flex-shrink-0 w-12 h-12 bg-primary text-surface rounded-full flex items-center justify-center text-xl font-bold">2</div>
              <div>
                <h3 className="text-2xl font-bold text-heading mb-4">Exchange Services</h3>
                <div className="grid sm:grid-cols-2 gap-4 text-body">
                  <div className="flex items-center gap-3 bg-background border border-border p-4 rounded-[var(--radius-card)]">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                    <span>Browse requests or publish your own.</span>
                  </div>
                  <div className="flex items-center gap-3 bg-background border border-border p-4 rounded-[var(--radius-card)]">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                    <span>Accept a project.</span>
                  </div>
                  <div className="flex items-center gap-3 bg-background border border-border p-4 rounded-[var(--radius-card)]">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                    <span>Agree on the number of Skill Hours.</span>
                  </div>
                  <div className="flex items-center gap-3 bg-background border border-border p-4 rounded-[var(--radius-card)]">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                    <span>Start working.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Step 3 */}
          <div className="bg-surface border border-border rounded-[var(--radius-card)] p-8 md:p-12">
            <div className="flex flex-col md:flex-row gap-8 items-start">
              <div className="flex-shrink-0 w-12 h-12 bg-primary text-surface rounded-full flex items-center justify-center text-xl font-bold">3</div>
              <div>
                <h3 className="text-2xl font-bold text-heading mb-4">Complete the Exchange</h3>
                <div className="flex flex-col sm:flex-row gap-6 mt-6">
                  <ul className="space-y-3 text-body">
                    <li className="flex items-center gap-2">&bull; Both members confirm delivery.</li>
                    <li className="flex items-center gap-2">&bull; Skill Hours transfer automatically.</li>
                  </ul>
                  <ul className="space-y-3 text-body">
                    <li className="flex items-center gap-2">&bull; Reputation increases.</li>
                    <li className="flex items-center gap-2">&bull; Escrow is released.</li>
                  </ul>
                </div>
                <p className="mt-6 text-xl font-bold text-primary">Everyone wins.</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
