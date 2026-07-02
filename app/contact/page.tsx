import Header from "../../components/header";
import Footer from "../../components/footer";
import { 
  MessageSquare, 
  Wrench, 
  Handshake, 
  Newspaper,
  BookOpen,
  HelpCircle,
  Mail,
  MapPin,
  Clock,
  ShieldAlert,
  Lightbulb,
  ArrowRight,
  Send
} from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Contact Us | Weave",
  description: "Get in touch with the Weave team for support, partnerships, media inquiries, or general questions.",
};

export default function ContactPage() {
  const contactCards = [
    {
      icon: <MessageSquare className="w-6 h-6 text-primary" />,
      title: "General Questions",
      description: "Have a question about Weave, Skill Hours, memberships, or how the platform works?",
      note: "Within 1–2 business days."
    },
    {
      icon: <Wrench className="w-6 h-6 text-primary" />,
      title: "Technical Support",
      description: "Experiencing a bug, login issue, payment problem, or something that isn't working as expected?",
      note: "Include screenshots, browser info, and steps to reproduce."
    },
    {
      icon: <Handshake className="w-6 h-6 text-primary" />,
      title: "Partnerships",
      description: "Interested in collaborating? We're open to communities, accelerators, universities, and creators.",
      note: "Let's build something together."
    },
    {
      icon: <Newspaper className="w-6 h-6 text-primary" />,
      title: "Media & Press",
      description: "Journalists, bloggers, podcast hosts, or event organizers can reach out for interviews and info.",
      note: "Press kits available upon request."
    }
  ];

  const faqs = [
    {
      q: "How long does it take to receive a response?",
      a: "Most inquiries are answered within one to two business days."
    },
    {
      q: "Where can I report a bug?",
      a: 'Use the contact form and select "Report a Bug" as the category.'
    },
    {
      q: "Can I request an invitation through this form?",
      a: "The fastest way is to use the Request Invite page, but you're welcome to contact us with any questions."
    },
    {
      q: "Do you provide phone support?",
      a: "Currently, support is provided through email and the contact form to ensure every request is tracked and resolved efficiently."
    }
  ];

  return (
    <>
      <Header />
      
      <main className="bg-background">
        
        {/* HERO */}
        <section className="pt-8 pb-16 md:pt-12 md:pb-24 border-b border-border">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-3xl text-center">
            <span className="text-sm font-bold tracking-widest uppercase text-primary mb-6 block">Contact Us</span>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-heading mb-8">
              We'd Love to Hear From You
            </h1>
            <p className="text-xl text-body mb-6 leading-relaxed">
              Whether you have a question about Weave, need help with your account, want to report an issue, or are interested in partnering with us, we're here to help.
            </p>
            <p className="text-lg font-medium text-muted">
              Our team reviews every message and aims to respond as quickly as possible.
            </p>
          </div>
        </section>

        {/* CONTACT OPTIONS */}
        <section className="py-24 bg-surface-secondary border-b border-border">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
            <h2 className="text-2xl md:text-3xl font-bold text-heading text-center mb-12">Choose the Best Way to Reach Us</h2>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {contactCards.map((card, index) => (
                <div key={index} className="bg-surface border border-border p-6 rounded-[var(--radius-card)] flex flex-col h-full hover:border-primary/30 transition-colors">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-6">
                    {card.icon}
                  </div>
                  <h3 className="text-lg font-bold text-heading mb-3">{card.title}</h3>
                  <p className="text-body text-sm leading-relaxed mb-6 flex-grow">{card.description}</p>
                  <div className="pt-4 border-t border-border mt-auto">
                    <p className="text-xs font-semibold text-muted uppercase tracking-wider">{card.title === 'General Questions' ? 'Response Time' : 'Note'}</p>
                    <p className="text-sm text-heading font-medium mt-1">{card.note}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FORM & HELPFUL INFO */}
        <section className="py-24">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
            <div className="grid lg:grid-cols-3 gap-16">
              
              {/* Left Column: Form */}
              <div className="lg:col-span-2">
                <h2 className="text-3xl font-bold text-heading mb-2">Send Us a Message</h2>
                <p className="text-body mb-8">Fill out the form below and we'll get back to you as soon as possible.</p>
                
                <form className="bg-surface border border-border p-8 rounded-[var(--radius-card)] space-y-6 shadow-subtle">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label htmlFor="name" className="text-sm font-bold text-heading">Full Name</label>
                      <input 
                        type="text" 
                        id="name" 
                        className="w-full bg-background border border-border rounded-[var(--radius-input)] px-4 py-3 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors text-body"
                        placeholder="Jane Doe"
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="email" className="text-sm font-bold text-heading">Email Address</label>
                      <input 
                        type="email" 
                        id="email" 
                        className="w-full bg-background border border-border rounded-[var(--radius-input)] px-4 py-3 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors text-body"
                        placeholder="jane@example.com"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="subject" className="text-sm font-bold text-heading">Subject</label>
                    <input 
                      type="text" 
                      id="subject" 
                      className="w-full bg-background border border-border rounded-[var(--radius-input)] px-4 py-3 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors text-body"
                      placeholder="How can we help?"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="category" className="text-sm font-bold text-heading">Category</label>
                    <select 
                      id="category" 
                      className="w-full bg-background border border-border rounded-[var(--radius-input)] px-4 py-3 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors text-body appearance-none"
                    >
                      <option value="">Select a category...</option>
                      <option value="general">General Question</option>
                      <option value="support">Support</option>
                      <option value="billing">Billing</option>
                      <option value="verification">Verification</option>
                      <option value="partnership">Partnership</option>
                      <option value="press">Press</option>
                      <option value="feedback">Feedback</option>
                      <option value="bug">Report a Bug</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="message" className="text-sm font-bold text-heading">Message</label>
                    <textarea 
                      id="message" 
                      rows={6}
                      className="w-full bg-background border border-border rounded-[var(--radius-input)] px-4 py-3 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors text-body resize-none"
                      placeholder="Please provide as much detail as possible..."
                    ></textarea>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="attachment" className="text-sm font-bold text-heading">Attachment (optional)</label>
                    <div className="border-2 border-dashed border-border rounded-[var(--radius-input)] p-6 text-center hover:bg-surface-secondary transition-colors cursor-pointer">
                      <span className="text-sm text-muted">Click to upload screenshots or relevant files</span>
                    </div>
                  </div>

                  <div className="pt-4">
                    <button type="button" className="w-full md:w-auto px-8 py-3 text-base font-bold text-surface bg-primary rounded-[var(--radius-button)] hover:bg-primary-hover transition-colors flex items-center justify-center gap-2">
                      <Send className="w-4 h-4" /> Send Message
                    </button>
                    <p className="text-xs text-muted mt-4">
                      By submitting this form, you agree to our <Link href="/legal/privacy" className="underline hover:text-primary">Privacy Policy</Link> and <Link href="/legal/terms" className="underline hover:text-primary">Terms of Service</Link>.
                    </p>
                  </div>
                </form>
              </div>

              {/* Right Column: Support Info */}
              <div className="space-y-10">
                
                {/* Before You Contact Us */}
                <div className="bg-surface-secondary border border-border p-8 rounded-[var(--radius-card)]">
                  <h3 className="text-xl font-bold text-heading mb-4 flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-primary" /> Before You Contact Us
                  </h3>
                  <p className="text-sm text-body mb-6 leading-relaxed">
                    Many common questions are already answered in our Help Center and FAQ.
                  </p>
                  <ul className="text-sm text-heading font-medium space-y-3 mb-8">
                    <li>&bull; How Skill Hours work</li>
                    <li>&bull; Escrow process</li>
                    <li>&bull; Verification</li>
                    <li>&bull; Invite-only membership</li>
                    <li>&bull; Account management</li>
                  </ul>
                  <div className="space-y-3">
                    <Link href="/help" className="w-full block text-center px-4 py-2 text-sm font-bold text-primary bg-surface border border-border rounded-[var(--radius-button)] hover:bg-background transition-colors">
                      Visit Help Center
                    </Link>
                    <Link href="/#faq" className="w-full block text-center px-4 py-2 text-sm font-bold text-heading bg-transparent border border-transparent hover:underline transition-colors">
                      Read FAQs
                    </Link>
                  </div>
                </div>

                {/* What Happens Next */}
                <div>
                  <h3 className="text-xl font-bold text-heading mb-6">What Happens Next?</h3>
                  <div className="space-y-6">
                    <div className="flex gap-4">
                      <div className="flex-shrink-0 w-8 h-8 bg-surface border border-border rounded-full flex items-center justify-center text-sm font-bold text-primary">1</div>
                      <div>
                        <h4 className="font-bold text-heading text-sm mb-1">We'll confirm receipt.</h4>
                        <p className="text-xs text-body leading-relaxed">You'll receive a confirmation email letting you know your message was successfully submitted.</p>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <div className="flex-shrink-0 w-8 h-8 bg-surface border border-border rounded-full flex items-center justify-center text-sm font-bold text-primary">2</div>
                      <div>
                        <h4 className="font-bold text-heading text-sm mb-1">Our team reviews it.</h4>
                        <p className="text-xs text-body leading-relaxed">Messages are routed to the appropriate team based on the category you selected.</p>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <div className="flex-shrink-0 w-8 h-8 bg-surface border border-border rounded-full flex items-center justify-center text-sm font-bold text-primary">3</div>
                      <div>
                        <h4 className="font-bold text-heading text-sm mb-1">We'll get back to you.</h4>
                        <p className="text-xs text-body leading-relaxed">Most inquiries receive a response within 1–2 business days. Complex requests may take longer.</p>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </section>

        {/* BUSINESS INFO & COMMUNITY */}
        <section className="py-24 bg-surface-secondary border-y border-border">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
            <div className="grid md:grid-cols-2 gap-16">
              
              {/* Business Info */}
              <div>
                <h2 className="text-2xl font-bold text-heading mb-8">Company Information</h2>
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <Mail className="w-5 h-5 text-primary mt-1" />
                    <div>
                      <p className="text-sm font-bold text-muted uppercase tracking-wider mb-2">Email Directory</p>
                      <ul className="space-y-2 text-body">
                        <li>General: <a href="mailto:hello@weave.com" className="text-primary hover:underline font-medium">hello@weave.com</a></li>
                        <li>Support: <a href="mailto:support@weave.com" className="text-primary hover:underline font-medium">support@weave.com</a></li>
                        <li>Partnerships: <a href="mailto:partners@weave.com" className="text-primary hover:underline font-medium">partners@weave.com</a></li>
                        <li>Press: <a href="mailto:press@weave.com" className="text-primary hover:underline font-medium">press@weave.com</a></li>
                      </ul>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 pt-4 border-t border-border">
                    <MapPin className="w-5 h-5 text-primary mt-1" />
                    <div>
                      <p className="text-sm font-bold text-muted uppercase tracking-wider mb-1">Location</p>
                      <p className="text-body font-medium">Remote-first</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 pt-4 border-t border-border">
                    <Clock className="w-5 h-5 text-primary mt-1" />
                    <div>
                      <p className="text-sm font-bold text-muted uppercase tracking-wider mb-1">Operating Hours</p>
                      <p className="text-body font-medium">Monday – Friday</p>
                      <p className="text-body text-sm">9:00 AM – 5:00 PM (UTC)</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Community */}
              <div>
                <h2 className="text-2xl font-bold text-heading mb-8">Join the Conversation</h2>
                <p className="text-body mb-8">Stay updated with product announcements, feature releases, and community news.</p>
                <div className="flex flex-wrap gap-4">
                  <Link href="#" className="px-6 py-3 bg-surface border border-border rounded-[var(--radius-button)] text-sm font-bold text-heading hover:border-primary transition-colors">LinkedIn</Link>
                  <Link href="#" className="px-6 py-3 bg-surface border border-border rounded-[var(--radius-button)] text-sm font-bold text-heading hover:border-primary transition-colors">X (Twitter)</Link>
                  <Link href="#" className="px-6 py-3 bg-surface border border-border rounded-[var(--radius-button)] text-sm font-bold text-heading hover:border-primary transition-colors">GitHub</Link>
                  <Link href="#" className="px-6 py-3 bg-surface border border-border rounded-[var(--radius-button)] text-sm font-bold text-heading hover:border-primary transition-colors">Discord</Link>
                </div>
                <div className="mt-8 pt-8 border-t border-border">
                  <p className="text-sm font-bold text-muted uppercase tracking-wider mb-4">Newsletter</p>
                  <div className="flex gap-2">
                    <input type="email" placeholder="Email address" className="flex-grow bg-surface border border-border rounded-[var(--radius-input)] px-4 py-2 focus:outline-none focus:border-primary text-sm" />
                    <button className="px-4 py-2 bg-heading text-surface rounded-[var(--radius-button)] text-sm font-bold hover:bg-primary transition-colors">Subscribe</button>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* REPORT ABUSE & FEEDBACK */}
        <section className="py-24">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
            <div className="grid md:grid-cols-2 gap-8">
              
              {/* Report Abuse */}
              <div className="bg-surface border border-border rounded-[var(--radius-card)] p-8">
                <ShieldAlert className="w-8 h-8 text-error mb-6" />
                <h2 className="text-2xl font-bold text-heading mb-4">Report Misuse</h2>
                <p className="text-body font-medium mb-4">Your safety is important to us.</p>
                <p className="text-sm text-body leading-relaxed mb-6">If you've experienced harassment, fraud, abuse, or believe someone has violated our Community Guidelines, please let us know immediately.</p>
                <ul className="text-sm text-muted space-y-2 mb-8">
                  <li>&bull; Fraudulent exchanges or scams</li>
                  <li>&bull; Fake profiles or spam</li>
                  <li>&bull; Harassment</li>
                  <li>&bull; Abuse of the Skill Hour system</li>
                </ul>
                <button className="px-6 py-2 border border-error text-error hover:bg-error hover:text-surface font-bold rounded-[var(--radius-button)] transition-colors text-sm mb-4">
                  Report Abuse
                </button>
                <p className="text-xs text-muted">Urgent safety reports are prioritized by our moderation team.</p>
              </div>

              {/* Feedback */}
              <div className="bg-surface border border-border rounded-[var(--radius-card)] p-8">
                <Lightbulb className="w-8 h-8 text-warning mb-6" />
                <h2 className="text-2xl font-bold text-heading mb-4">Help Shape Weave</h2>
                <p className="text-body font-medium mb-4">We're building Weave together with our community.</p>
                <p className="text-sm text-body leading-relaxed mb-6">Your suggestions help us improve the platform and prioritize future features. Tell us about:</p>
                <ul className="text-sm text-muted space-y-2 mb-8">
                  <li>&bull; Features you'd like to see</li>
                  <li>&bull; Areas we can improve</li>
                  <li>&bull; Bugs you've encountered</li>
                  <li>&bull; Ideas for new tools</li>
                </ul>
                <button className="px-6 py-2 border border-border text-heading hover:bg-surface-secondary font-bold rounded-[var(--radius-button)] transition-colors text-sm">
                  Share Feedback
                </button>
              </div>

            </div>
          </div>
        </section>

        {/* FAQ PREVIEW */}
        <section className="py-24 bg-surface-secondary border-t border-border">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
            <h2 className="text-3xl font-bold text-heading text-center mb-16 flex items-center justify-center gap-3">
              <HelpCircle className="w-8 h-8 text-primary" /> Frequently Asked Questions
            </h2>
            
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

        {/* FINAL CTA */}
        <section className="py-24">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-3xl text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-heading mb-6">Still Need Help?</h2>
            <div className="text-lg text-body mb-10">
              <p>If you couldn't find the answer you were looking for, we're only one message away.</p>
              <p className="font-bold text-heading mt-2">We'd be happy to help.</p>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button className="w-full sm:w-auto px-8 py-3 text-base font-bold text-surface bg-primary rounded-[var(--radius-button)] hover:bg-primary-hover transition-colors shadow-subtle flex items-center justify-center gap-2">
                Contact Support <ArrowRight className="w-4 h-4" />
              </button>
              <Link href="/help" className="w-full sm:w-auto px-8 py-3 text-base font-bold text-heading bg-surface border border-border rounded-[var(--radius-button)] hover:bg-surface-secondary transition-colors inline-flex justify-center items-center">
                Browse Help Center
              </Link>
            </div>
          </div>
        </section>

      </main>

      <Footer />
    </>
  );
}
