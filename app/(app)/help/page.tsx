import Header from "@/components/header";
import Footer from "@/components/footer";
import Link from "next/link";
import { 
  Search, 
  Rocket, 
  User, 
  Briefcase, 
  Lock, 
  ShieldCheck, 
  MessageSquare,
  ChevronRight,
  ArrowRight,
  Bug,
  Lightbulb
} from "lucide-react";

export const metadata = {
  title: "Help Center | Weave",
  description: "Find answers, learn how Weave works, and get the most out of your Skill Hour marketplace experience.",
};

export default function HelpCenterPage() {
  const quickLinks = [
    { icon: Rocket, title: "Getting Started", desc: "Everything you need before your first exchange." },
    { icon: User, title: "Account & Profile", desc: "Manage your account, profile, verification and settings." },
    { icon: Briefcase, title: "Skill Hour Marketplace", desc: "Learn how exchanges, Skill Hours and the marketplace work." },
    { icon: Lock, title: "Escrow & Payments", desc: "Understand deposits, subscriptions, refunds and billing." },
    { icon: ShieldCheck, title: "Trust & Safety", desc: "Reporting users, account security and community guidelines." },
    { icon: MessageSquare, title: "Contact Support", desc: "Can't find what you're looking for? Get in touch with our team." }
  ];

  const popularArticles = [
    "Getting Started with Weave",
    "Understanding Skill Hours",
    "How Escrow Works",
    "Creating a Great Profile",
    "Becoming a Verified Member",
    "Managing Your Skill Hour Balance",
    "Resolving Exchange Disputes",
    "Updating Your Account Settings",
    "Reporting Another Member",
    "Subscription & Billing FAQ",
    "Community Guidelines Explained",
    "Account Security Best Practices"
  ];

  const sections = [
    {
      id: "getting-started",
      title: "Getting Started",
      articles: [
        {
          title: "Welcome to Weave",
          content: "Weave is an invite-only marketplace where professionals exchange skills instead of money. Whether you're a developer looking for branding, a designer needing a landing page, or a copywriter searching for SEO help, Weave lets you trade expertise using Skill Hours."
        },
        {
          title: "How Weave Works",
          content: "The process is simple.\n1. Create your profile.\n2. List the skills you offer.\n3. List the skills you need.\n4. Browse the marketplace.\n5. Agree on an exchange.\n6. Complete the work.\n7. Earn or spend Skill Hours.\n8. Build your reputation."
        },
        {
          title: "Why Invite Only?",
          content: "Weave is intentionally invite-only. A smaller, curated community helps us maintain higher-quality collaborations, reduce spam, and create a trusted network of professionals. You can request an invitation or join our waitlist at any time."
        },
        {
          title: "What are Skill Hours?",
          content: "Skill Hours are the internal currency used throughout Weave. One hour of professional work is exchanged for one Skill Hour.\n\nExamples:\n• 2 hours of UI Design = 2 Skill Hours\n• 5 hours of React Development = 5 Skill Hours\n• 1 hour of Copywriting = 1 Skill Hour\n\nSkill Hours are not money and cannot be exchanged for cash."
        }
      ]
    },
    {
      id: "account-profile",
      title: "Account & Profile",
      articles: [
        {
          title: "Creating Your Profile",
          content: "Your profile is your professional identity. We recommend including a professional photo, short bio, skills offered, skills wanted, portfolio links, previous work, availability, and languages spoken. A complete profile increases trust and improves your chances of finding great collaborations."
        },
        {
          title: "Verification",
          content: "Verified members receive a verification badge after completing our review process. Verification helps build confidence within the marketplace but does not guarantee the quality of future work."
        },
        {
          title: "Editing Your Profile",
          content: "You can update your Name, Photo, Bio, Skills, Portfolio, Availability, Links, Notifications, and Privacy settings at any time from your account settings."
        }
      ]
    },
    {
      id: "marketplace",
      title: "Marketplace",
      articles: [
        {
          title: "Finding Work",
          content: "Browse opportunities by Skill, Category, Popularity, Recently Posted, Availability, and Experience Level. Use filters to quickly discover exchanges that match your expertise."
        },
        {
          title: "Posting a Request",
          content: "When requesting help, clearly describe Your project, Expected deliverables, Timeline, Number of Skill Hours, and Revision expectations. The clearer your request, the better your matches."
        },
        {
          title: "Accepting an Exchange",
          content: "Before accepting any exchange, ensure both parties agree on Scope, Deliverables, Timeline, Skill Hours, Communication, and Completion expectations. Clear expectations reduce misunderstandings."
        },
        {
          title: "Completing Work",
          content: "Once work is finished: Submit deliverables, Review the work, Confirm completion, Leave a review. Skill Hours are then transferred and Escrow is released where applicable."
        }
      ]
    },
    {
      id: "skill-hours",
      title: "Skill Hours",
      articles: [
        {
          title: "How Do I Earn Skill Hours?",
          content: "You earn Skill Hours by completing exchanges for other members."
        },
        {
          title: "How Do I Spend Skill Hours?",
          content: "Use your earned Skill Hours to request professional help from other members."
        },
        {
          title: "Why Isn't Everything Free?",
          content: "Skill Hours ensure that everyone contributes fairly to the community. The system rewards participation rather than financial spending."
        },
        {
          title: "Can I Buy Skill Hours?",
          content: "No. Skill Hours cannot currently be purchased, sold, traded outside Weave, or converted into money. They are earned by helping other members."
        },
        {
          title: "Why Did My Balance Change?",
          content: "Your balance may change because of Completed exchanges, Administrative corrections, Dispute outcomes, Ledger adjustments, or Reversed fraudulent activity. Every transaction appears in your Skill Hour Ledger."
        }
      ]
    },
    {
      id: "escrow",
      title: "Escrow",
      articles: [
        {
          title: "Why Does Weave Use Escrow?",
          content: "Escrow encourages accountability. Rather than paying for services, both members temporarily deposit a refundable amount before work begins. Once both confirm completion, deposits are released."
        },
        {
          title: "Is the Deposit a Payment?",
          content: "No. The escrow deposit is separate from Skill Hours. It is a refundable security measure designed to reduce fraud and abandoned projects."
        },
        {
          title: "What Happens During a Dispute?",
          content: "If members disagree about an exchange: The exchange may be paused, Evidence can be submitted, Our team reviews the available information, and A decision is made based on the Escrow Policy."
        },
        {
          title: "When Will My Deposit Be Returned?",
          content: "Eligible escrow deposits are generally released after both members confirm completion. Processing times depend on your payment provider."
        }
      ]
    },
    {
      id: "billing-subscription",
      title: "Billing & Subscription",
      articles: [
        {
          title: "What Does Verified Membership Include?",
          content: "Verified Membership may include a Verification badge, Priority marketplace visibility, Enhanced trust indicators, Early access to new features, and Additional profile customization. Features may change as Weave evolves."
        },
        {
          title: "How Do I Cancel My Subscription?",
          content: "You can manage or cancel your subscription from your Account Settings. Cancellation prevents future renewals."
        },
        {
          title: "Can I Receive a Refund?",
          content: "Refunds are handled according to our Terms of Service and applicable law."
        }
      ]
    },
    {
      id: "trust-safety",
      title: "Trust & Safety",
      articles: [
        {
          title: "Reporting a User",
          content: "If you believe another member has violated our rules, you can report their profile or the exchange directly through the Platform. Our moderation team reviews every report."
        },
        {
          title: "Staying Safe",
          content: "We recommend: Completing communication through Weave, Reviewing profiles carefully, Reading previous reviews, Clearly defining project scope, Using escrow when available, and Never sharing passwords or verification codes."
        },
        {
          title: "Community Standards",
          content: "We expect members to Be respectful, Be honest, Deliver quality work, Honor commitments, Respect intellectual property, and Communicate professionally."
        }
      ]
    },
    {
      id: "troubleshooting",
      title: "Troubleshooting",
      articles: [
        {
          title: "I Forgot My Password",
          content: "Use the Forgot Password option on the login page to receive a password reset email."
        },
        {
          title: "I Didn't Receive My Verification Email",
          content: "Check your Spam folder, Promotions folder, and Email spelling. If you still haven't received it after several minutes, contact support."
        },
        {
          title: "My Skill Hours Look Incorrect",
          content: "Visit your Ledger to review recent transactions. If something appears incorrect, contact support with the relevant exchange details."
        },
        {
          title: "My Exchange Is Stuck",
          content: "If an exchange cannot progress because one member is unresponsive, you may report the issue through the exchange page. Our team will review the situation."
        }
      ]
    }
  ];

  return (
    <>
      <Header />
      
      <main className="bg-background">
        
        {/* HERO SECTION */}
        <section className="pt-8 pb-20 md:pt-12 bg-surface border-b border-border text-center">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-3xl">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-heading mb-6">
              How can we help?
            </h1>
            <p className="text-xl text-body mb-10 leading-relaxed max-w-2xl mx-auto">
              Find answers, learn how Weave works, and get the most out of your Skill Hour marketplace experience.
            </p>
            
            <div className="relative max-w-2xl mx-auto group">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-muted group-focus-within:text-primary transition-colors" />
              </div>
              <input 
                type="text" 
                placeholder="Search articles..." 
                className="w-full pl-12 pr-4 py-4 bg-background border border-border rounded-[var(--radius-input)] text-lg text-heading focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-subtle transition-all"
              />
            </div>
            <p className="text-sm text-muted mt-4">
              Examples: escrow, Skill Hours, verification, invitations, subscriptions
            </p>
          </div>
        </section>

        {/* QUICK ACCESS CARDS */}
        <section className="py-20 -mt-10 relative z-10">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {quickLinks.map((link, i) => (
                <a href={`#${link.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`} key={i} className="bg-surface border border-border p-6 rounded-[var(--radius-card)] hover:border-primary/40 hover:shadow-subtle transition-all group flex flex-col items-start text-left h-full">
                  <div className="w-12 h-12 bg-surface-secondary border border-border rounded-xl flex items-center justify-center mb-6 group-hover:bg-primary/5 group-hover:border-primary/20 transition-colors">
                    <link.icon className="w-6 h-6 text-heading group-hover:text-primary transition-colors" />
                  </div>
                  <h3 className="text-lg font-bold text-heading mb-2 group-hover:text-primary transition-colors">
                    {link.title}
                  </h3>
                  <p className="text-body text-sm leading-relaxed mb-4 flex-grow">
                    {link.desc}
                  </p>
                  <span className="text-xs font-bold text-primary flex items-center mt-auto">
                    View Category <ChevronRight className="w-3 h-3 ml-1 group-hover:translate-x-1 transition-transform" />
                  </span>
                </a>
              ))}
            </div>
          </div>
        </section>

        {/* MAIN KNOWLEDGE BASE AREA */}
        <section className="py-16">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
            <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-start">
              
              {/* CONTENT ARTICLES */}
              <div className="lg:col-span-8 space-y-24">
                {sections.map((section, idx) => (
                  <div key={idx} id={section.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')} className="scroll-mt-24">
                    <h2 className="text-3xl font-bold text-heading mb-8 pb-4 border-b border-border flex items-center gap-3">
                      <span className="text-primary opacity-50">0{idx + 1}.</span> {section.title}
                    </h2>
                    
                    <div className="space-y-10">
                      {section.articles.map((article, aIdx) => (
                        <div key={aIdx} className="group">
                          <h3 className="text-xl font-bold text-heading mb-4 group-hover:text-primary transition-colors cursor-pointer">
                            {article.title}
                          </h3>
                          <div className="prose prose-p:text-body prose-p:leading-relaxed prose-li:text-body max-w-none text-sm md:text-base">
                            {article.content.split('\n').map((paragraph, pIdx) => (
                              <p key={pIdx} className="mb-4 last:mb-0">{paragraph}</p>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* SIDEBAR: POPULAR ARTICLES */}
              <aside className="lg:col-span-4 sticky top-24">
                <div className="bg-surface-secondary border border-border rounded-[var(--radius-card)] p-6 mb-8">
                  <h3 className="text-sm font-bold text-heading uppercase tracking-wider mb-6 flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-primary" /> Popular Articles
                  </h3>
                  <ul className="space-y-4">
                    {popularArticles.map((article, i) => (
                      <li key={i}>
                        <a href="#" className="text-sm text-body hover:text-primary font-medium transition-colors flex items-start gap-2">
                          <span className="text-primary mt-1 text-xs opacity-50">•</span> {article}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              </aside>

            </div>
          </div>
        </section>

        {/* STILL NEED HELP SECTION */}
        <section className="py-24 bg-surface-secondary border-t border-border">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
            <h2 className="text-3xl font-bold text-heading mb-12 text-center">Still Need Help?</h2>
            
            <div className="grid md:grid-cols-3 gap-6">
              
              {/* Contact Support */}
              <div className="bg-surface border border-border p-8 rounded-[var(--radius-card)]">
                <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center mb-6">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-heading mb-3">Contact Our Team</h3>
                <p className="text-body text-sm mb-6 leading-relaxed">
                  If you couldn't find the answer you're looking for, we're here to help. Average response time: within 24 hours.
                </p>
                <a href="mailto:support@weave.com" className="inline-block text-sm font-bold text-primary hover:underline">
                  support@weave.com
                </a>
              </div>

              {/* Report Problem */}
              <div className="bg-surface border border-border p-8 rounded-[var(--radius-card)]">
                <div className="w-12 h-12 bg-surface-secondary border border-border text-heading rounded-xl flex items-center justify-center mb-6">
                  <Bug className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-heading mb-3">Report a Problem</h3>
                <p className="text-body text-sm mb-6 leading-relaxed">
                  Found a bug or technical issue? Send us a description, screenshots, and steps to reproduce.
                </p>
                <Link href="/contact" className="inline-block text-sm font-bold text-primary hover:underline">
                  Report an issue
                </Link>
              </div>

              {/* Feature Request */}
              <div className="bg-surface border border-border p-8 rounded-[var(--radius-card)]">
                <div className="w-12 h-12 bg-surface-secondary border border-border text-heading rounded-xl flex items-center justify-center mb-6">
                  <Rocket className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-heading mb-3">Feature Requests</h3>
                <p className="text-body text-sm mb-6 leading-relaxed">
                  We're always improving Weave. Share your ideas and suggestions to help shape the future of the platform.
                </p>
                <Link href="/contact" className="inline-block text-sm font-bold text-primary hover:underline">
                  Share an idea
                </Link>
              </div>

            </div>
          </div>
        </section>

        {/* FOOTER CTA */}
        <section className="py-24 border-t border-border bg-surface text-center">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-2xl">
            <h2 className="text-3xl font-bold mb-6 text-heading">Still have questions?</h2>
            <p className="text-lg text-body mb-10">
              Our support team is happy to help.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/contact" className="px-8 py-3 text-sm font-bold text-surface bg-heading rounded-[var(--radius-button)] hover:bg-black transition-colors shadow-subtle flex items-center">
                Contact Support <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
              <Link href="#" className="px-8 py-3 text-sm font-bold text-heading bg-surface border border-border rounded-[var(--radius-button)] hover:bg-surface-secondary transition-colors flex items-center">
                Browse All Articles <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </div>
          </div>
        </section>

      </main>

      <Footer />
    </>
  );
}
