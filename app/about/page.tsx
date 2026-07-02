import Header from "../../components/header";
import Footer from "../../components/footer";
import { 
  ShieldCheck, 
  Scale, 
  Users, 
  Star, 
  Leaf, 
  Lock, 
  CheckCircle2, 
  ArrowRight,
  Target,
  Eye,
  Check
} from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "About Weave | Trade Skills, Not Cash",
  description: "Learn why Weave exists and how we're building a trusted network where freelancers exchange expertise through Skill Hours.",
};

export default function AboutPage() {
  const roles = [
    "Frontend Developers", "Backend Developers", "Mobile Developers",
    "UI Designers", "UX Designers", "Graphic Designers", "Brand Designers",
    "Illustrators", "Product Designers", "Copywriters", "Technical Writers",
    "SEO Specialists", "Digital Marketers", "Video Editors", "Motion Designers",
    "Photographers", "No-Code Builders", "AI Automation Specialists",
    "Virtual Assistants", "Business Consultants", "Accountants", "Lawyers",
    "Product Managers", "Founders", "Indie Hackers", "Creators"
  ];

  return (
    <>
      <Header />
      
      <main className="bg-background">
        {/* HERO */}
        <section className="pt-24 pb-20 md:pt-32 md:pb-32 border-b border-border">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl text-center">
            <span className="text-sm font-bold tracking-widest uppercase text-primary mb-6 block">About Weave</span>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-heading mb-8 leading-tight">
              Building a Better Way for Freelancers to Collaborate
            </h1>
            <div className="text-xl text-body space-y-6 max-w-3xl mx-auto leading-relaxed">
              <p>Weave exists because talented professionals shouldn't have to put great ideas on hold simply because cash flow is tight.</p>
              <p>Instead of competing in a race to the bottom, we're building a trusted network where developers, designers, writers, marketers, creators, and specialists exchange their expertise through <strong className="font-semibold text-heading">Skill Hours</strong>, not money.</p>
              <div className="pt-8 mt-8 border-t border-border">
                <p className="text-lg font-medium text-muted">Our mission is simple:</p>
                <p className="text-2xl font-bold text-primary mt-2">Help independent professionals build more, together.</p>
              </div>
            </div>
          </div>
        </section>

        {/* OUR STORY */}
        <section className="py-24">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-3xl">
            <h2 className="text-3xl font-bold text-heading mb-10 text-center">Why We Started Weave</h2>
            
            <div className="prose prose-lg text-body max-w-none space-y-6 leading-relaxed">
              <p className="text-xl font-medium text-heading">Every freelancer has experienced it.</p>
              
              <ul className="space-y-2 border-l-2 border-primary/20 pl-6 py-2 my-8 font-medium">
                <li>You need a designer for your product.</li>
                <li>A designer needs a developer.</li>
                <li>A developer needs a copywriter.</li>
                <li>A copywriter needs a marketer.</li>
                <li>A marketer needs a video editor.</li>
              </ul>
              
              <p>Everyone has valuable skills. Yet everyone reaches the same frustrating conclusion: <em className="text-heading font-serif text-xl">"I can't afford to hire someone right now."</em></p>
              
              <div className="bg-surface-secondary p-8 rounded-[var(--radius-card)] my-10 border border-border">
                <p className="text-lg font-bold text-heading mb-2">The problem isn't a lack of talent.</p>
                <p className="text-lg font-bold text-primary">The problem is liquidity.</p>
              </div>
              
              <p>Traditional freelance platforms assume every collaboration starts with a payment. But for independent professionals, startups, and creators, timing matters.</p>
              <p>Sometimes you have the expertise to offer, but not the cash to spend.</p>
              <p className="text-xl font-bold text-heading pt-4">Weave was created to solve exactly that.</p>
            </div>
          </div>
        </section>

        {/* MISSION & VISION */}
        <section className="py-24 bg-surface-secondary border-y border-border">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
            <div className="grid md:grid-cols-2 gap-16 lg:gap-24">
              {/* Mission */}
              <div>
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-6">
                  <Target className="w-6 h-6 text-primary" />
                </div>
                <h2 className="text-3xl font-bold text-heading mb-6">Our Mission</h2>
                <div className="space-y-4 text-lg text-body leading-relaxed">
                  <p className="font-bold text-heading text-xl">To make professional collaboration accessible regardless of short-term cash flow.</p>
                  <p>We believe expertise itself should be a valuable currency.</p>
                  <p>By enabling trusted skill exchanges, we hope to help freelancers launch businesses, build products, grow careers, and create opportunities that might never have existed otherwise.</p>
                </div>
              </div>

              {/* Vision */}
              <div>
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-6">
                  <Eye className="w-6 h-6 text-primary" />
                </div>
                <h2 className="text-3xl font-bold text-heading mb-6">Our Vision</h2>
                <div className="space-y-4 text-lg text-body leading-relaxed">
                  <p>Imagine a world where:</p>
                  <ul className="space-y-2 border-l-2 border-border pl-4">
                    <li>A frontend developer launches an app thanks to a designer.</li>
                    <li>The designer grows a portfolio thanks to a copywriter.</li>
                    <li>The copywriter builds a brand with help from a marketer.</li>
                    <li>The marketer launches campaigns with a video editor.</li>
                  </ul>
                  <p>Instead of isolated freelancers competing against each other, professionals become part of an ecosystem where everyone's expertise creates new opportunities.</p>
                  <p className="font-bold text-primary pt-2">That's the future we're building.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* MARKETPLACE COMPARISON */}
        <section className="py-24">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
            <h2 className="text-3xl font-bold text-heading text-center mb-16">A Different Kind of Marketplace</h2>
            
            <div className="grid md:grid-cols-2 gap-8">
              {/* Traditional */}
              <div className="border border-border rounded-[var(--radius-card)] p-8 md:p-10 bg-background">
                <h3 className="text-xl font-bold text-muted mb-8 pb-4 border-b border-border">Traditional Freelance Platforms</h3>
                <ul className="space-y-6">
                  <li className="flex items-start gap-4">
                    <span className="text-muted mt-1">&times;</span>
                    <span className="text-body font-medium">Lowest bid often wins.</span>
                  </li>
                  <li className="flex items-start gap-4">
                    <span className="text-muted mt-1">&times;</span>
                    <span className="text-body font-medium">Price competition drives quality down.</span>
                  </li>
                  <li className="flex items-start gap-4">
                    <span className="text-muted mt-1">&times;</span>
                    <span className="text-body font-medium">Projects are transactional.</span>
                  </li>
                  <li className="flex items-start gap-4">
                    <span className="text-muted mt-1">&times;</span>
                    <span className="text-body font-medium">Cash is required upfront.</span>
                  </li>
                  <li className="flex items-start gap-4">
                    <span className="text-muted mt-1">&times;</span>
                    <span className="text-body font-medium">Trust must be earned repeatedly.</span>
                  </li>
                </ul>
              </div>

              {/* Weave */}
              <div className="border border-primary rounded-[var(--radius-card)] p-8 md:p-10 bg-surface shadow-subtle relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-primary text-surface text-xs font-bold px-4 py-1 rounded-bl-lg tracking-wider uppercase">Weave</div>
                <h3 className="text-2xl font-bold text-primary mb-8 pb-4 border-b border-border">Weave</h3>
                <ul className="space-y-6">
                  <li className="flex items-start gap-4">
                    <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-heading font-medium">Skill Hours replace traditional pricing.</span>
                  </li>
                  <li className="flex items-start gap-4">
                    <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-heading font-medium">Collaboration replaces bidding.</span>
                  </li>
                  <li className="flex items-start gap-4">
                    <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-heading font-medium">Verified members build lasting relationships.</span>
                  </li>
                  <li className="flex items-start gap-4">
                    <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-heading font-medium">Escrow encourages accountability.</span>
                  </li>
                  <li className="flex items-start gap-4">
                    <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-heading font-medium">Reputation grows with every completed exchange.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* OUR VALUES */}
        <section className="py-24 bg-surface-secondary border-y border-border">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-heading mb-4">The Principles Behind Everything We Build</h2>
              <p className="text-lg text-body">Our core values guide the platform.</p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-surface border border-border p-8 rounded-[var(--radius-card)]">
                <ShieldCheck className="w-8 h-8 text-primary mb-6" />
                <h3 className="text-xl font-bold text-heading mb-4">Trust Comes First</h3>
                <p className="text-body mb-4 font-medium">Every exchange begins with confidence.</p>
                <p className="text-body text-sm leading-relaxed">Verification, transparent histories, reviews, and escrow help create a community where professionals feel comfortable collaborating.</p>
              </div>

              <div className="bg-surface border border-border p-8 rounded-[var(--radius-card)]">
                <Scale className="w-8 h-8 text-primary mb-6" />
                <h3 className="text-xl font-bold text-heading mb-4">Skills Have Equal Worth</h3>
                <p className="text-body mb-4 font-medium">Great work isn't defined by geography or negotiation.</p>
                <p className="text-body text-sm leading-relaxed">Inside Weave, one professional hour earns one Skill Hour. The focus shifts from pricing to contribution.</p>
              </div>

              <div className="bg-surface border border-border p-8 rounded-[var(--radius-card)]">
                <Users className="w-8 h-8 text-primary mb-6" />
                <h3 className="text-xl font-bold text-heading mb-4">Collaboration Over Competition</h3>
                <p className="text-body mb-4 font-medium">We don't believe freelancers should constantly compete for lower prices.</p>
                <p className="text-body text-sm leading-relaxed">We believe collaboration creates more value than undercutting.</p>
              </div>

              <div className="bg-surface border border-border p-8 rounded-[var(--radius-card)]">
                <Star className="w-8 h-8 text-primary mb-6" />
                <h3 className="text-xl font-bold text-heading mb-4">Reputation Matters</h3>
                <p className="text-body mb-4 font-medium">Trust isn't purchased. It's earned through consistency.</p>
                <p className="text-body text-sm leading-relaxed">Every completed exchange contributes to a professional reputation that follows members across the platform.</p>
              </div>

              <div className="bg-surface border border-border p-8 rounded-[var(--radius-card)]">
                <Leaf className="w-8 h-8 text-primary mb-6" />
                <h3 className="text-xl font-bold text-heading mb-4">Community Before Scale</h3>
                <p className="text-body mb-4 font-medium">Growing quickly means little if trust disappears.</p>
                <p className="text-body text-sm leading-relaxed">That's why Weave starts as an invite-only community focused on quality over quantity.</p>
              </div>
            </div>
          </div>
        </section>

        {/* HOW WE WORK */}
        <section className="py-24">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
            <h2 className="text-3xl font-bold text-heading text-center mb-16">How Weave Operates</h2>
            
            <div className="space-y-12">
              <div className="flex flex-col md:flex-row gap-6 md:gap-12 items-start">
                <div className="w-12 h-12 bg-surface-secondary border border-border rounded-full flex items-center justify-center flex-shrink-0">
                  <Lock className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-heading mb-2">Invite-Only Membership</h3>
                  <p className="text-body leading-relaxed">We carefully grow the community to maintain professionalism and trust.</p>
                </div>
              </div>
              
              <div className="flex flex-col md:flex-row gap-6 md:gap-12 items-start">
                <div className="w-12 h-12 bg-surface-secondary border border-border rounded-full flex items-center justify-center flex-shrink-0">
                  <Check className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-heading mb-2">Verification</h3>
                  <p className="text-body leading-relaxed">Members can verify their identity and professional credibility to increase confidence during exchanges.</p>
                </div>
              </div>

              <div className="flex flex-col md:flex-row gap-6 md:gap-12 items-start">
                <div className="w-12 h-12 bg-surface-secondary border border-border rounded-full flex items-center justify-center flex-shrink-0">
                  <Scale className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-heading mb-2">Skill Hours</h3>
                  <p className="text-body leading-relaxed">Instead of negotiating prices, completed work earns Skill Hours that can be spent requesting services from other members.</p>
                </div>
              </div>

              <div className="flex flex-col md:flex-row gap-6 md:gap-12 items-start">
                <div className="w-12 h-12 bg-surface-secondary border border-border rounded-full flex items-center justify-center flex-shrink-0">
                  <ShieldCheck className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-heading mb-2">Escrow Protection</h3>
                  <p className="text-body leading-relaxed">A lightweight escrow process encourages commitment from both parties before work begins.</p>
                </div>
              </div>

              <div className="flex flex-col md:flex-row gap-6 md:gap-12 items-start">
                <div className="w-12 h-12 bg-surface-secondary border border-border rounded-full flex items-center justify-center flex-shrink-0">
                  <Star className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-heading mb-2">Reputation</h3>
                  <p className="text-body leading-relaxed">Every exchange contributes to long-term trust through reviews and completed work history.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* WHO WE SERVE */}
        <section className="py-24 bg-surface border-y border-border">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-heading mb-6">Built for Independent Professionals</h2>
            <p className="text-lg text-body max-w-2xl mx-auto mb-16 leading-relaxed">
              Whether you're launching your first startup or running a successful freelance business, Weave is designed for people who create value through expertise.
            </p>
            
            <p className="text-sm font-bold tracking-widest uppercase text-muted mb-8">Perfect For</p>
            <div className="flex flex-wrap justify-center gap-3">
              {roles.map((role, index) => (
                <span 
                  key={index} 
                  className="px-4 py-2 bg-surface-secondary border border-border text-body text-sm font-medium rounded-[var(--radius-badge)] cursor-default hover:border-primary/40 transition-colors"
                >
                  {role}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* OUR PROMISE & THE FUTURE */}
        <section className="py-24">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
            <div className="grid md:grid-cols-2 gap-16 lg:gap-24">
              {/* Promise */}
              <div>
                <h2 className="text-2xl font-bold text-heading mb-8">What We Promise Every Member</h2>
                <p className="text-body mb-6">We promise to build a marketplace that prioritizes:</p>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center gap-3 text-heading font-medium"><CheckCircle2 className="w-5 h-5 text-primary" /> Fairness.</li>
                  <li className="flex items-center gap-3 text-heading font-medium"><CheckCircle2 className="w-5 h-5 text-primary" /> Transparency.</li>
                  <li className="flex items-center gap-3 text-heading font-medium"><CheckCircle2 className="w-5 h-5 text-primary" /> Professionalism.</li>
                  <li className="flex items-center gap-3 text-heading font-medium"><CheckCircle2 className="w-5 h-5 text-primary" /> Safety.</li>
                  <li className="flex items-center gap-3 text-heading font-medium"><CheckCircle2 className="w-5 h-5 text-primary" /> Respect.</li>
                  <li className="flex items-center gap-3 text-heading font-medium"><CheckCircle2 className="w-5 h-5 text-primary" /> Long-term collaboration.</li>
                </ul>
                <div className="bg-surface-secondary border border-border p-6 rounded-[var(--radius-card)]">
                  <p className="text-body mb-2">We won't optimize for vanity metrics.</p>
                  <p className="text-heading font-bold">We'll optimize for meaningful professional relationships.</p>
                </div>
              </div>

              {/* Future */}
              <div>
                <h2 className="text-2xl font-bold text-heading mb-8">Where We're Going</h2>
                <p className="text-body mb-6">We're just getting started. Future improvements may include:</p>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-6 text-sm text-body mb-8">
                  <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-primary/40"></div>Smarter skill matching.</li>
                  <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-primary/40"></div>Team collaborations.</li>
                  <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-primary/40"></div>Agency workspaces.</li>
                  <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-primary/40"></div>Project milestones.</li>
                  <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-primary/40"></div>Portfolio verification.</li>
                  <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-primary/40"></div>Advanced reputation scoring.</li>
                  <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-primary/40"></div>AI opportunity recommendations.</li>
                  <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-primary/40"></div>Global communities.</li>
                  <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-primary/40"></div>Better dispute resolution tools.</li>
                </ul>
                <div className="border-l-4 border-primary pl-6 py-2">
                  <p className="text-muted text-sm mb-2">Every feature will be designed around one question:</p>
                  <p className="text-heading font-bold italic">"Does this help professionals collaborate more effectively?"</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* COMMUNITY STATEMENT */}
        <section className="py-24 bg-primary text-surface text-center">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
            <h2 className="text-3xl md:text-5xl font-bold mb-8">More Than a Marketplace</h2>
            <div className="text-xl text-surface/90 space-y-6 leading-relaxed">
              <p>We don't want Weave to become another gig platform.</p>
              <p>We want it to become a professional network where people repeatedly choose to work together because they've built trust over time.</p>
              <div className="pt-8">
                <p className="text-2xl font-bold text-surface">The strongest communities aren't built through transactions.</p>
                <p className="text-2xl font-bold text-surface">They're built through relationships.</p>
              </div>
            </div>
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="py-24 bg-surface-secondary">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-3xl text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-heading mb-6">Ready to Join the Network?</h2>
            <div className="text-lg text-body space-y-2 mb-12">
              <p>Become part of a community where your expertise is your currency.</p>
              <p className="font-medium text-heading">Trade Skill Hours. Build meaningful partnerships. Launch bigger ideas. Create more opportunities.</p>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button className="w-full sm:w-auto px-8 py-3 text-base font-bold text-surface bg-primary rounded-[var(--radius-button)] hover:bg-primary-hover transition-colors shadow-subtle flex items-center justify-center gap-2">
                Request an Invite <ArrowRight className="w-4 h-4" />
              </button>
              <Link href="/#how-it-works" className="w-full sm:w-auto px-8 py-3 text-base font-bold text-heading bg-surface border border-border rounded-[var(--radius-button)] hover:bg-surface-secondary transition-colors inline-flex justify-center items-center">
                See How It Works
              </Link>
            </div>
          </div>
        </section>

      </main>

      <Footer />
    </>
  );
}
