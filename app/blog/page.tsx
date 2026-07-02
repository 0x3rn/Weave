import Header from "../../components/header";
import Footer from "../../components/footer";
import { 
  ArrowRight, 
  Calendar, 
  Clock, 
  ChevronRight,
  ChevronLeft,
  BookOpen,
  ArrowUpRight
} from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Blog | Weave",
  description: "Ideas, insights & stories for independent professionals. Explore practical advice on freelancing and collaboration.",
};

export default function BlogIndexPage() {
  const categories = [
    "All", "Product Updates", "Freelancing", "Collaboration", 
    "Productivity", "Business", "Design", "Development", 
    "Marketing", "Community", "Announcements"
  ];

  const latestArticles = [
    {
      title: "Introducing Weave: A New Way to Exchange Professional Skills",
      excerpt: "Learn why Weave was created, what Skill Hours are, and how we're building a trusted invite-only marketplace.",
      readTime: "5 min read",
      slug: "introducing-weave"
    },
    {
      title: "Why Invite-Only Communities Build Better Professional Networks",
      excerpt: "Discover how thoughtful growth helps create stronger relationships and better collaboration opportunities.",
      readTime: "6 min read",
      slug: "invite-only-communities"
    },
    {
      title: "The Hidden Cost of Competing on Price",
      excerpt: "Explore why underpricing hurts freelancers and how focusing on value leads to healthier careers.",
      readTime: "7 min read",
      slug: "hidden-cost-competing-price"
    },
    {
      title: "How Reputation Becomes Your Most Valuable Asset",
      excerpt: "Professional trust compounds over time. Learn how reputation creates more opportunities than portfolios alone.",
      readTime: "8 min read",
      slug: "reputation-most-valuable-asset"
    },
    {
      title: "Five Ways Freelancers Can Collaborate Without Hiring Employees",
      excerpt: "Practical examples of partnerships that help professionals grow without increasing overhead.",
      readTime: "6 min read",
      slug: "freelancers-collaborate-without-employees"
    },
    {
      title: "Building Better Creative Partnerships",
      excerpt: "Communication, trust, and accountability are the foundation of successful long-term collaborations.",
      readTime: "7 min read",
      slug: "building-better-creative-partnerships"
    }
  ];

  const productUpdates = [
    { version: "Version 0.1", desc: "Launching the waitlist and invite-only applications." },
    { version: "Version 0.2", desc: "Introducing Skill Hour balances and user profiles." },
    { version: "Version 0.3", desc: "Escrow-protected exchanges become available." },
    { version: "Version 0.4", desc: "Marketplace search and filtering improvements." }
  ];

  const communityStories = [
    { title: "How a Developer Traded Code for Brand Identity", desc: "A real-world example of how professionals can build together without exchanging cash." },
    { title: "Launching an MVP Through Skill Exchanges", desc: "See how independent creators combine expertise to bring ideas to life." },
    { title: "Building Long-Term Professional Relationships", desc: "Why successful collaborations often begin with a single project." }
  ];

  const topics = [
    { name: "Freelancing", desc: "Advice for building a sustainable independent career." },
    { name: "Collaboration", desc: "Working effectively with other professionals." },
    { name: "Productivity", desc: "Tools, workflows, and habits that help you do your best work." },
    { name: "Product Updates", desc: "Everything new inside Weave." },
    { name: "Business", desc: "Growing your freelance business with confidence." },
    { name: "Design", desc: "Thoughts for designers, creatives, and visual professionals." },
    { name: "Development", desc: "Engineering insights, workflows, and technical discussions." },
    { name: "Marketing", desc: "Strategies for attracting clients and growing your audience." }
  ];

  const popular = [
    "Why Skill Hours Matter",
    "Building Trust Online",
    "The Problem with Low-Bid Marketplaces",
    "Collaboration Over Competition",
    "Introducing Escrow Protection"
  ];

  return (
    <>
      <Header />
      
      <main className="bg-background">
        
        {/* HERO */}
        <section className="pt-12 pb-16 md:pt-20 md:pb-24 border-b border-border text-center">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
            <span className="text-sm font-bold tracking-widest uppercase text-primary mb-6 block">Weave Blog</span>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-heading mb-8 leading-tight">
              Ideas, Insights & Stories for Independent Professionals
            </h1>
            <div className="text-xl text-body space-y-6 leading-relaxed max-w-3xl mx-auto">
              <p>Explore practical advice, product updates, community stories, and thoughtful perspectives on freelancing, collaboration, productivity, and building better professional relationships.</p>
              <p>Whether you're a developer, designer, writer, marketer, founder, or creator, you'll find insights to help you grow your craft and work more effectively with others.</p>
            </div>
          </div>
        </section>

        {/* FEATURED ARTICLE */}
        <section className="py-24 border-b border-border bg-surface-secondary">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
            <Link href="/blog/skill-based-collaboration-future" className="block group">
              <div className="grid lg:grid-cols-2 gap-0 border border-border rounded-2xl overflow-hidden bg-surface shadow-subtle hover:border-primary/40 transition-colors">
                {/* Image Placeholder */}
                <div className="bg-border/50 h-64 lg:h-auto w-full relative">
                  <div className="absolute top-6 left-6 bg-primary text-surface text-xs font-bold px-3 py-1 rounded-[var(--radius-badge)] uppercase tracking-wider">
                    Featured Article
                  </div>
                </div>
                {/* Content */}
                <div className="p-8 md:p-12 flex flex-col justify-center">
                  <h2 className="text-3xl md:text-4xl font-bold text-heading mb-6 group-hover:text-primary transition-colors">
                    Why Skill-Based Collaboration Could Be the Future of Freelancing
                  </h2>
                  <p className="text-lg text-body mb-8 leading-relaxed">
                    Cash isn't always the biggest obstacle for independent professionals. Sometimes the real challenge is finding trusted collaborators. Here's why exchanging expertise instead of money creates opportunities traditional freelance marketplaces often can't.
                  </p>
                  <div className="flex flex-wrap items-center gap-6 text-sm text-muted font-medium mb-8">
                    <span className="flex items-center gap-2"><Clock className="w-4 h-4" /> 8 min read</span>
                    <span className="flex items-center gap-2"><Calendar className="w-4 h-4" /> July 2026</span>
                    <span className="flex items-center gap-2"><BookOpen className="w-4 h-4" /> Product Team</span>
                  </div>
                  <div>
                    <span className="inline-flex items-center gap-2 font-bold text-primary group-hover:underline">
                      Read Article <ArrowRight className="w-4 h-4" />
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </section>

        {/* LATEST ARTICLES */}
        <section className="py-24">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
              <h2 className="text-3xl font-bold text-heading">Latest Articles</h2>
              
              {/* CATEGORIES */}
              <div className="overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0 md:pb-0 scrollbar-hide">
                <div className="flex gap-2">
                  {categories.map((cat, i) => (
                    <button key={i} className={`whitespace-nowrap px-4 py-2 text-sm font-medium rounded-[var(--radius-button)] transition-colors ${i === 0 ? 'bg-primary text-surface' : 'bg-surface-secondary border border-border text-heading hover:border-primary/40'}`}>
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
              {latestArticles.map((article, i) => (
                <Link href={`/blog/${article.slug}`} key={i} className="group flex flex-col h-full bg-surface border border-border rounded-[var(--radius-card)] overflow-hidden hover:border-primary/30 transition-colors">
                  <div className="h-48 bg-surface-secondary border-b border-border w-full"></div>
                  <div className="p-6 flex flex-col flex-grow">
                    <h3 className="text-xl font-bold text-heading mb-3 group-hover:text-primary transition-colors line-clamp-2">
                      {article.title}
                    </h3>
                    <p className="text-body text-sm leading-relaxed mb-6 flex-grow line-clamp-3">
                      {article.excerpt}
                    </p>
                    <div className="flex items-center justify-between pt-4 border-t border-border mt-auto">
                      <span className="text-xs font-medium text-muted flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5" /> {article.readTime}
                      </span>
                      <ArrowUpRight className="w-4 h-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-center gap-2">
              <button className="p-2 border border-border text-muted rounded-md hover:bg-surface-secondary hover:text-heading transition-colors disabled:opacity-50"><ChevronLeft className="w-5 h-5" /></button>
              <button className="w-10 h-10 flex items-center justify-center border border-primary bg-primary text-surface rounded-md font-medium">1</button>
              <button className="w-10 h-10 flex items-center justify-center border border-border text-heading rounded-md hover:bg-surface-secondary transition-colors font-medium">2</button>
              <button className="w-10 h-10 flex items-center justify-center border border-border text-heading rounded-md hover:bg-surface-secondary transition-colors font-medium">3</button>
              <button className="p-2 border border-border text-muted rounded-md hover:bg-surface-secondary hover:text-heading transition-colors"><ChevronRight className="w-5 h-5" /></button>
            </div>
          </div>
        </section>

        {/* MIDDLE SECTION: UPDATES & STORIES & POPULAR */}
        <section className="py-24 bg-surface-secondary border-y border-border">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
            <div className="grid lg:grid-cols-3 gap-16">
              
              {/* Product Updates Timeline */}
              <div>
                <h2 className="text-2xl font-bold text-heading mb-8">What's New at Weave</h2>
                <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
                  {productUpdates.map((update, i) => (
                    <div key={i} className="relative flex items-start justify-between md:justify-normal md:odd:flex-row-reverse group is-active pb-6 border-l-2 border-primary/20 pl-6 ml-2">
                      <div className="absolute w-3 h-3 bg-primary rounded-full -left-[7px] top-1.5 border-2 border-surface-secondary"></div>
                      <div>
                        <h4 className="font-bold text-heading text-sm mb-1">{update.version}</h4>
                        <p className="text-sm text-body">{update.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <button className="mt-4 px-6 py-2 bg-surface border border-border rounded-[var(--radius-button)] text-sm font-bold text-heading hover:border-primary transition-colors w-full">
                  View Changelog
                </button>
              </div>

              {/* Community Stories */}
              <div>
                <h2 className="text-2xl font-bold text-heading mb-8">From the Community</h2>
                <div className="space-y-6">
                  {communityStories.map((story, i) => (
                    <div key={i} className="bg-surface border border-border p-6 rounded-[var(--radius-card)] group cursor-pointer hover:border-primary/40 transition-colors">
                      <h3 className="font-bold text-heading text-lg mb-2 group-hover:text-primary transition-colors">{story.title}</h3>
                      <p className="text-sm text-body leading-relaxed mb-4">{story.desc}</p>
                      <span className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1 group-hover:gap-2 transition-all">
                        Read Story <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Most Popular */}
              <div>
                <h2 className="text-2xl font-bold text-heading mb-8">Most Popular</h2>
                <div className="bg-surface border border-border rounded-[var(--radius-card)] overflow-hidden">
                  <ol className="divide-y divide-border">
                    {popular.map((pop, i) => (
                      <li key={i}>
                        <Link href={`/blog/popular-${i}`} className="flex items-start gap-4 p-4 hover:bg-surface-secondary transition-colors group">
                          <span className="font-bold text-primary opacity-50">{i + 1}.</span>
                          <span className="font-medium text-heading text-sm group-hover:text-primary transition-colors">{pop}</span>
                        </Link>
                      </li>
                    ))}
                  </ol>
                </div>

                {/* Newsletter Box inside Sidebar */}
                <div className="mt-8 bg-primary text-surface p-6 rounded-[var(--radius-card)]">
                  <h3 className="font-bold text-lg mb-2">Never Miss an Update</h3>
                  <p className="text-surface/80 text-sm mb-6">Stay informed about product launches, community stories, and freelancing insights.</p>
                  <form className="space-y-3">
                    <input type="email" placeholder="Email address" className="w-full bg-surface border-none rounded-[var(--radius-input)] px-4 py-2 focus:outline-none text-sm text-heading" />
                    <button className="w-full px-4 py-2 bg-heading text-surface rounded-[var(--radius-button)] text-sm font-bold hover:bg-black transition-colors">Subscribe</button>
                    <p className="text-xs text-center text-surface/60">No spam. Unsubscribe anytime.</p>
                  </form>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* EXPLORE BY TOPIC */}
        <section className="py-24">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
            <h2 className="text-3xl font-bold text-heading text-center mb-12">Explore by Topic</h2>
            <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
              {topics.map((topic, i) => (
                <Link href={`/blog/category/${topic.name.toLowerCase()}`} key={i} className="bg-surface-secondary border border-border p-6 rounded-[var(--radius-card)] hover:border-primary/40 transition-colors group flex flex-col justify-center text-center h-full">
                  <h3 className="font-bold text-heading mb-2 group-hover:text-primary transition-colors">{topic.name}</h3>
                  <p className="text-xs text-body">{topic.desc}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ABOUT THE BLOG */}
        <section className="py-24 bg-surface-secondary border-y border-border text-center">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-3xl">
            <h2 className="text-3xl font-bold text-heading mb-6">Why We Write</h2>
            <p className="text-lg text-body mb-8 leading-relaxed">
              The Weave Blog exists to share practical knowledge that helps professionals collaborate more effectively. Rather than chasing trends, we focus on timeless principles:
            </p>
            <div className="flex flex-wrap justify-center gap-3 mb-10">
              {["Trust", "Craftsmanship", "Professional growth", "Sustainable freelancing", "Better partnerships", "Building meaningful careers"].map((val, i) => (
                <span key={i} className="px-4 py-2 bg-surface border border-border text-heading text-sm font-medium rounded-[var(--radius-badge)]">
                  {val}
                </span>
              ))}
            </div>
            <p className="text-lg font-bold text-primary">Every article is written with independent professionals in mind.</p>
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="py-24">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-3xl text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-heading mb-6">Ready to Put These Ideas Into Practice?</h2>
            <p className="text-lg text-body mb-10 leading-relaxed">
              Reading is only the beginning. Join a growing community where professionals exchange expertise, build lasting relationships, and create more together.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/request-invite" className="w-full sm:w-auto px-8 py-3 text-base font-bold text-surface bg-primary rounded-[var(--radius-button)] hover:bg-primary-hover transition-colors shadow-subtle flex items-center justify-center">
                Request an Invite
              </Link>
              <Link href="/waitlist" className="w-full sm:w-auto px-8 py-3 text-base font-bold text-heading bg-surface border border-border rounded-[var(--radius-button)] hover:bg-surface-secondary transition-colors inline-flex justify-center items-center">
                Join the Waitlist
              </Link>
            </div>
          </div>
        </section>

      </main>

      <Footer />
    </>
  );
}
