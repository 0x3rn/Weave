import Header from "../../components/header";
import Footer from "../../components/footer";
import { 
  ShieldCheck, 
  UserCheck, 
  Award, 
  HeartHandshake,
  CheckCircle2,
  Clock,
  ArrowRight
} from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Request an Invitation | Weave",
  description: "Apply for early access to join Weave, the trusted network for professional skill exchanges.",
};

export default function RequestInvitePage() {
  const qualities = [
    "Freelance full-time",
    "Work independently",
    "Build startups",
    "Create digital products",
    "Have a portfolio",
    "Value collaboration",
    "Want long-term professional relationships"
  ];

  const benefits = [
    {
      icon: <Clock className="w-6 h-6 text-primary" />,
      title: "Skill Hours",
      description: "Trade expertise instead of cash."
    },
    {
      icon: <UserCheck className="w-6 h-6 text-primary" />,
      title: "Verified Community",
      description: "Work with trusted professionals."
    },
    {
      icon: <ShieldCheck className="w-6 h-6 text-primary" />,
      title: "Escrow Protection",
      description: "More accountability for every exchange."
    },
    {
      icon: <Award className="w-6 h-6 text-primary" />,
      title: "Professional Reputation",
      description: "Build trust with every completed collaboration."
    },
    {
      icon: <HeartHandshake className="w-6 h-6 text-primary" />,
      title: "Long-Term Relationships",
      description: "Work with people you'd happily collaborate with again."
    }
  ];

  return (
    <>
      <Header />
      
      <main className="bg-background">
        
        {/* HERO */}
        <section className="pt-24 pb-16 border-b border-border text-center bg-surface-secondary">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-3xl">
            <span className="text-sm font-bold tracking-widest uppercase text-primary mb-6 block">Request an Invitation</span>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-heading mb-6">
              Join a Trusted Community of Professionals
            </h1>
            <p className="text-lg text-body mb-8 leading-relaxed">
              Weave is currently invite-only. Every application is reviewed to help maintain a collaborative, trustworthy marketplace where professionals can confidently exchange their expertise.
            </p>
            <p className="text-lg font-medium text-heading mb-8">
              If you're passionate about your craft and believe in collaboration over competition, we'd love to hear from you.
            </p>
            <button className="px-8 py-3 text-base font-bold text-surface bg-primary rounded-[var(--radius-button)] hover:bg-primary-hover transition-colors shadow-subtle mb-4">
              Request Invite
            </button>
            <p className="text-sm text-muted">Applications are reviewed individually.</p>
          </div>
        </section>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl py-24">
          <div className="grid lg:grid-cols-2 gap-16 lg:gap-24">
            
            {/* LEFT COLUMN: INFO */}
            <div className="space-y-16">
              
              {/* Why Invite Only? */}
              <section>
                <h2 className="text-2xl font-bold text-heading mb-6">Building Trust Starts With the Right Community</h2>
                <div className="space-y-4 text-body leading-relaxed">
                  <p>We don't believe bigger is always better.</p>
                  <p>By carefully reviewing applications, we're able to:</p>
                  <ul className="space-y-2 font-medium">
                    <li>&bull; Reduce spam.</li>
                    <li>&bull; Prevent fraudulent accounts.</li>
                    <li>&bull; Build stronger trust.</li>
                    <li>&bull; Maintain high-quality exchanges.</li>
                    <li>&bull; Encourage meaningful long-term relationships.</li>
                  </ul>
                  <p className="font-bold text-primary pt-2">Quality comes before scale.</p>
                </div>
              </section>

              {/* Who Should Apply */}
              <section>
                <h2 className="text-2xl font-bold text-heading mb-6">Who Should Apply?</h2>
                <p className="text-body mb-6">Professionals who:</p>
                <div className="grid sm:grid-cols-2 gap-4">
                  {qualities.map((quality, index) => (
                    <div key={index} className="bg-surface border border-border p-4 rounded-[var(--radius-card)] flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                      <span className="text-sm font-medium text-heading">{quality}</span>
                    </div>
                  ))}
                </div>
              </section>

              {/* Review Process & What We Look For */}
              <section className="grid sm:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-xl font-bold text-heading mb-4">How Applications Are Reviewed</h3>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-bold text-sm text-heading">1. Application received.</h4>
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-heading">2. Basic review.</h4>
                      <p className="text-xs text-body mt-1">We review your experience, profile, and interest in the platform.</p>
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-heading">3. Invitation decision.</h4>
                      <p className="text-xs text-body mt-1">Approved applicants receive an invitation by email.</p>
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-heading">4. Complete registration.</h4>
                      <p className="text-xs text-body mt-1">Verify your email and create your profile.</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-heading mb-4">Strong Community Members</h3>
                  <p className="text-sm text-body mb-4">We're not looking for perfect résumés. We're looking for professionals who:</p>
                  <ul className="text-sm text-heading font-medium space-y-2">
                    <li>&bull; Value collaboration.</li>
                    <li>&bull; Communicate respectfully.</li>
                    <li>&bull; Deliver quality work.</li>
                    <li>&bull; Honor commitments.</li>
                    <li>&bull; Treat others professionally.</li>
                    <li>&bull; Want to build lasting relationships.</li>
                  </ul>
                </div>
              </section>

            </div>

            {/* RIGHT COLUMN: FORM */}
            <div>
              <div className="sticky top-24">
                <h2 className="text-3xl font-bold text-heading mb-2">Tell Us About Yourself</h2>
                <p className="text-body mb-8">Please provide details so we can evaluate your request.</p>

                <form className="bg-surface border border-border p-8 rounded-[var(--radius-card)] space-y-6 shadow-subtle">
                  
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-heading">Full Name</label>
                    <input type="text" className="w-full bg-background border border-border rounded-[var(--radius-input)] px-4 py-3 focus:outline-none focus:border-primary text-body" />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-heading">Email Address</label>
                    <input type="email" className="w-full bg-background border border-border rounded-[var(--radius-input)] px-4 py-3 focus:outline-none focus:border-primary text-body" />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-heading">Profession</label>
                      <input type="text" placeholder="e.g. UI Designer" className="w-full bg-background border border-border rounded-[var(--radius-input)] px-4 py-3 focus:outline-none focus:border-primary text-body" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-heading">Years of Exp.</label>
                      <input type="text" placeholder="e.g. 5" className="w-full bg-background border border-border rounded-[var(--radius-input)] px-4 py-3 focus:outline-none focus:border-primary text-body" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-heading">Primary Skill</label>
                      <input type="text" className="w-full bg-background border border-border rounded-[var(--radius-input)] px-4 py-3 focus:outline-none focus:border-primary text-body" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-heading">Secondary Skill</label>
                      <input type="text" className="w-full bg-background border border-border rounded-[var(--radius-input)] px-4 py-3 focus:outline-none focus:border-primary text-body" />
                    </div>
                  </div>

                  <div className="space-y-4 pt-2">
                    <h4 className="text-sm font-bold text-muted uppercase tracking-wider">Links & Presence</h4>
                    <div className="space-y-2">
                      <input type="url" placeholder="LinkedIn Profile" className="w-full bg-background border border-border rounded-[var(--radius-input)] px-4 py-3 focus:outline-none focus:border-primary text-sm text-body" />
                    </div>
                    <div className="space-y-2">
                      <input type="url" placeholder="Portfolio Website" className="w-full bg-background border border-border rounded-[var(--radius-input)] px-4 py-3 focus:outline-none focus:border-primary text-sm text-body" />
                    </div>
                    <div className="space-y-2">
                      <input type="url" placeholder="Personal Website / GitHub (optional)" className="w-full bg-background border border-border rounded-[var(--radius-input)] px-4 py-3 focus:outline-none focus:border-primary text-sm text-body" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-heading">Location</label>
                    <input type="text" placeholder="City, Country" className="w-full bg-background border border-border rounded-[var(--radius-input)] px-4 py-3 focus:outline-none focus:border-primary text-body" />
                  </div>

                  <div className="space-y-4 pt-4 border-t border-border">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-heading">Short Bio</label>
                      <p className="text-xs text-muted mb-1">Tell us about your professional background.</p>
                      <textarea rows={3} className="w-full bg-background border border-border rounded-[var(--radius-input)] px-4 py-3 focus:outline-none focus:border-primary text-body resize-none"></textarea>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-bold text-heading">What do you hope to exchange on Weave?</label>
                      <p className="text-xs text-muted mb-1">Examples: Development for design. Marketing for copywriting.</p>
                      <textarea rows={2} className="w-full bg-background border border-border rounded-[var(--radius-input)] px-4 py-3 focus:outline-none focus:border-primary text-body resize-none"></textarea>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-bold text-heading">Why do you want to join Weave?</label>
                      <p className="text-xs text-muted mb-1">We want to understand what excites you about collaborative skill exchanges.</p>
                      <textarea rows={3} className="w-full bg-background border border-border rounded-[var(--radius-input)] px-4 py-3 focus:outline-none focus:border-primary text-body resize-none"></textarea>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 pt-4 border-t border-border">
                    <input type="checkbox" className="mt-1" />
                    <p className="text-sm text-body">
                      I agree to follow the <Link href="/legal/guidelines" className="text-primary hover:underline">Community Guidelines</Link> and Code of Conduct.
                    </p>
                  </div>

                  <div className="pt-2">
                    <Link href="/request-invite/success" className="w-full px-8 py-3 text-base font-bold text-surface bg-primary rounded-[var(--radius-button)] hover:bg-primary-hover transition-colors flex items-center justify-center">
                      Submit Application
                    </Link>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>

        {/* WHY MEMBERS LOVE WEAVE */}
        <section className="py-24 bg-surface-secondary border-y border-border">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
            <h2 className="text-3xl font-bold text-heading text-center mb-12">Why Members Love Weave</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-6">
              {benefits.map((benefit, i) => (
                <div key={i} className="bg-surface border border-border p-6 rounded-[var(--radius-card)] text-center">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    {benefit.icon}
                  </div>
                  <h3 className="text-sm font-bold text-heading mb-2">{benefit.title}</h3>
                  <p className="text-xs text-body">{benefit.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-24">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-3xl">
            <h2 className="text-3xl font-bold text-heading text-center mb-12">Frequently Asked Questions</h2>
            <div className="grid sm:grid-cols-2 gap-6">
              <div className="bg-surface border border-border p-6 rounded-[var(--radius-card)]">
                <h3 className="font-bold text-sm text-heading mb-2">Why invite only?</h3>
                <p className="text-xs text-body leading-relaxed">To ensure high quality exchanges and build a community based on trust.</p>
              </div>
              <div className="bg-surface border border-border p-6 rounded-[var(--radius-card)]">
                <h3 className="font-bold text-sm text-heading mb-2">Can beginners apply?</h3>
                <p className="text-xs text-body leading-relaxed">We primarily look for members with demonstrated expertise and a portfolio of work.</p>
              </div>
              <div className="bg-surface border border-border p-6 rounded-[var(--radius-card)]">
                <h3 className="font-bold text-sm text-heading mb-2">How long does review take?</h3>
                <p className="text-xs text-body leading-relaxed">Reviews typically take 3-5 business days depending on volume.</p>
              </div>
              <div className="bg-surface border border-border p-6 rounded-[var(--radius-card)]">
                <h3 className="font-bold text-sm text-heading mb-2">Is there an interview?</h3>
                <p className="text-xs text-body leading-relaxed">Not usually, but we may reach out for clarification on your portfolio.</p>
              </div>
            </div>
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="py-24 bg-surface-secondary border-t border-border text-center">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-2xl">
            <h2 className="text-3xl md:text-4xl font-bold text-heading mb-6">Great Communities Don't Happen by Accident.</h2>
            <p className="text-xl text-body mb-10">
              They're built one trusted member at a time. If that sounds like the kind of community you'd like to be part of, we'd love to review your application.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <button className="px-8 py-3 text-base font-bold text-surface bg-primary rounded-[var(--radius-button)] hover:bg-primary-hover transition-colors shadow-subtle">
                Request Invite
              </button>
              <Link href="/waitlist" className="px-8 py-3 text-base font-bold text-heading bg-surface border border-border rounded-[var(--radius-button)] hover:bg-surface-secondary transition-colors">
                Join Waitlist Instead
              </Link>
            </div>
          </div>
        </section>

      </main>

      <Footer />
    </>
  );
}
