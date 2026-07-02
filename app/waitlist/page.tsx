import Header from "../../components/header";
import Footer from "../../components/footer";
import { 
  Users, 
  Bell, 
  Rocket, 
  Star,
  CheckCircle2,
  ArrowRight
} from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Join the Waitlist | Weave",
  description: "Join the Weave waitlist to be among the first to access our invite-only skill exchange marketplace.",
};

export default function WaitlistPage() {
  const benefits = [
    {
      icon: <Rocket className="w-6 h-6 text-primary" />,
      title: "Early Access",
      description: "Receive an invitation before public registration opens."
    },
    {
      icon: <Bell className="w-6 h-6 text-primary" />,
      title: "Product Updates",
      description: "Stay informed about new features, improvements, and launch announcements."
    },
    {
      icon: <Users className="w-6 h-6 text-primary" />,
      title: "Community Growth",
      description: "Watch the marketplace grow and be among the first to participate."
    },
    {
      icon: <Star className="w-6 h-6 text-primary" />,
      title: "Founding Member Benefits",
      description: "Early members may receive exclusive badges, priority onboarding, or other launch perks."
    }
  ];

  const targetAudience = [
    "Freelancers", "Indie Hackers", "Startup Founders", "Designers", 
    "Developers", "Writers", "Creators", "Consultants", "Marketers", "Agencies"
  ];

  return (
    <>
      <Header />
      
      <main className="bg-background">
        
        {/* HERO */}
        <section className="pt-24 pb-16 border-b border-border text-center">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-3xl">
            <span className="text-sm font-bold tracking-widest uppercase text-primary mb-6 block">Join the Waitlist</span>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-heading mb-6">
              Be Among the First to Join Weave
            </h1>
            <p className="text-lg text-body mb-8 leading-relaxed">
              We're carefully growing the Weave community to ensure every member has access to meaningful opportunities and trusted collaborations.
              Join the waitlist today and we'll let you know as soon as new spots become available.
            </p>
            <button className="px-8 py-3 text-base font-bold text-surface bg-primary rounded-[var(--radius-button)] hover:bg-primary-hover transition-colors shadow-subtle mb-4">
              Join the Waitlist
            </button>
            <p className="text-sm text-muted">No spam. No commitment. Just early access updates.</p>
          </div>
        </section>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl py-24">
          <div className="grid lg:grid-cols-2 gap-16 lg:gap-24">
            
            {/* LEFT COLUMN: INFO */}
            <div className="space-y-16">
              
              {/* Why a waitlist? */}
              <section>
                <h2 className="text-2xl font-bold text-heading mb-6">Quality Over Quantity</h2>
                <div className="space-y-4 text-body leading-relaxed">
                  <p>We're intentionally onboarding members in stages.</p>
                  <p>Growing too quickly can reduce trust, overwhelm the marketplace, and make it harder for professionals to find meaningful collaborations.</p>
                  <p className="font-medium text-heading pt-2">A gradual rollout allows us to:</p>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-primary" /> Build a healthy marketplace.</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-primary" /> Verify members carefully.</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-primary" /> Improve the platform with community feedback.</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-primary" /> Maintain a high-quality experience.</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-primary" /> Create better opportunities for everyone.</li>
                  </ul>
                </div>
              </section>

              {/* What you'll get */}
              <section>
                <h2 className="text-2xl font-bold text-heading mb-6">Why Join Early?</h2>
                <div className="grid sm:grid-cols-2 gap-6">
                  {benefits.map((benefit, index) => (
                    <div key={index} className="bg-surface border border-border p-6 rounded-[var(--radius-card)]">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                        {benefit.icon}
                      </div>
                      <h3 className="font-bold text-heading mb-2">{benefit.title}</h3>
                      <p className="text-sm text-body">{benefit.description}</p>
                    </div>
                  ))}
                </div>
              </section>

              {/* What happens next */}
              <section className="bg-surface-secondary border border-border p-8 rounded-[var(--radius-card)]">
                <h2 className="text-2xl font-bold text-heading mb-6">Here's What to Expect</h2>
                <div className="space-y-6">
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-surface border border-border rounded-full flex items-center justify-center text-sm font-bold text-primary">1</div>
                    <p className="font-medium text-heading mt-1">You join the waitlist.</p>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-surface border border-border rounded-full flex items-center justify-center text-sm font-bold text-primary">2</div>
                    <p className="font-medium text-heading mt-1">We review upcoming capacity.</p>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-surface border border-border rounded-full flex items-center justify-center text-sm font-bold text-primary">3</div>
                    <p className="font-medium text-heading mt-1">When space becomes available, we'll send you an invitation.</p>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-surface border border-border rounded-full flex items-center justify-center text-sm font-bold text-primary">4</div>
                    <p className="font-medium text-heading mt-1">Create your account and start exchanging Skill Hours.</p>
                  </div>
                </div>
              </section>

            </div>

            {/* RIGHT COLUMN: FORM */}
            <div>
              <div className="sticky top-24">
                <h2 className="text-3xl font-bold text-heading mb-2">Reserve Your Spot</h2>
                <p className="text-body mb-8">Join thousands of professionals waiting for early access.</p>

                <form className="bg-surface border border-border p-8 rounded-[var(--radius-card)] space-y-6 shadow-subtle">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-heading">First Name</label>
                      <input type="text" className="w-full bg-background border border-border rounded-[var(--radius-input)] px-4 py-3 focus:outline-none focus:border-primary text-body" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-heading">Last Name</label>
                      <input type="text" className="w-full bg-background border border-border rounded-[var(--radius-input)] px-4 py-3 focus:outline-none focus:border-primary text-body" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-heading">Email Address</label>
                    <input type="email" className="w-full bg-background border border-border rounded-[var(--radius-input)] px-4 py-3 focus:outline-none focus:border-primary text-body" />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-heading">Primary Skill</label>
                    <select className="w-full bg-background border border-border rounded-[var(--radius-input)] px-4 py-3 focus:outline-none focus:border-primary text-body appearance-none">
                      <option>Select a skill...</option>
                      <option>Frontend Development</option>
                      <option>Backend Development</option>
                      <option>UI Design</option>
                      <option>UX Design</option>
                      <option>Graphic Design</option>
                      <option>Branding</option>
                      <option>Copywriting</option>
                      <option>Marketing</option>
                      <option>SEO</option>
                      <option>Video Editing</option>
                      <option>Motion Design</option>
                      <option>Product Management</option>
                      <option>No-Code</option>
                      <option>AI Automation</option>
                      <option>Other</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-heading">Years of Experience</label>
                    <select className="w-full bg-background border border-border rounded-[var(--radius-input)] px-4 py-3 focus:outline-none focus:border-primary text-body appearance-none">
                      <option>Select experience...</option>
                      <option>Less than 1 year</option>
                      <option>1–3 years</option>
                      <option>3–5 years</option>
                      <option>5–10 years</option>
                      <option>10+ years</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-heading">Portfolio Website (optional)</label>
                    <input type="url" placeholder="https://" className="w-full bg-background border border-border rounded-[var(--radius-input)] px-4 py-3 focus:outline-none focus:border-primary text-body" />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-heading">How did you hear about Weave?</label>
                    <select className="w-full bg-background border border-border rounded-[var(--radius-input)] px-4 py-3 focus:outline-none focus:border-primary text-body appearance-none">
                      <option>Select an option...</option>
                      <option>Twitter / X</option>
                      <option>LinkedIn</option>
                      <option>Friend or Colleague</option>
                      <option>Blog Post</option>
                      <option>Search Engine</option>
                      <option>Other</option>
                    </select>
                  </div>

                  <div className="pt-4">
                    <Link href="/waitlist/success" className="w-full px-8 py-3 text-base font-bold text-surface bg-primary rounded-[var(--radius-button)] hover:bg-primary-hover transition-colors flex items-center justify-center">
                      Join Waitlist
                    </Link>
                    <p className="text-xs text-muted mt-4 text-center">
                      We'll only contact you regarding Weave updates and your waitlist status.
                    </p>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>

        {/* WHO IS WEAVE FOR */}
        <section className="py-24 bg-surface-secondary border-y border-border">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl text-center">
            <h2 className="text-2xl font-bold text-heading mb-8">Who is Weave For?</h2>
            <div className="flex flex-wrap justify-center gap-3">
              {targetAudience.map((role, i) => (
                <span key={i} className="px-4 py-2 bg-surface border border-border text-body text-sm font-medium rounded-[var(--radius-badge)]">
                  {role}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-24">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-3xl">
            <h2 className="text-3xl font-bold text-heading text-center mb-12">Frequently Asked Questions</h2>
            <div className="space-y-6">
              <div className="bg-surface border border-border rounded-[var(--radius-card)] p-6">
                <h3 className="font-bold text-heading mb-2">How long is the wait?</h3>
                <p className="text-body text-sm leading-relaxed">It depends on your primary skill and current marketplace needs. We onboard members in cohorts to maintain a healthy balance of skills.</p>
              </div>
              <div className="bg-surface border border-border rounded-[var(--radius-card)] p-6">
                <h3 className="font-bold text-heading mb-2">Is joining free?</h3>
                <p className="text-body text-sm leading-relaxed">Yes, joining the waitlist is completely free.</p>
              </div>
              <div className="bg-surface border border-border rounded-[var(--radius-card)] p-6">
                <h3 className="font-bold text-heading mb-2">Can I invite friends?</h3>
                <p className="text-body text-sm leading-relaxed">Once you are accepted into the platform, you will receive limited invites to bring trusted professionals into the network.</p>
              </div>
              <div className="bg-surface border border-border rounded-[var(--radius-card)] p-6">
                <h3 className="font-bold text-heading mb-2">Will I lose my spot?</h3>
                <p className="text-body text-sm leading-relaxed">No. We process the waitlist chronologically based on skill demand.</p>
              </div>
            </div>
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="py-24 bg-surface-secondary border-t border-border text-center">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-2xl">
            <h2 className="text-3xl md:text-4xl font-bold text-heading mb-6">Your Skills Already Have Value.</h2>
            <p className="text-xl text-body mb-8">Soon, they'll help you build even bigger ideas.</p>
            <button className="px-8 py-3 text-base font-bold text-surface bg-primary rounded-[var(--radius-button)] hover:bg-primary-hover transition-colors shadow-subtle inline-flex items-center gap-2">
              Join the Waitlist <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </section>

      </main>

      <Footer />
    </>
  );
}
