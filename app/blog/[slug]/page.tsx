import Header from "../../../components/header";
import Footer from "../../../components/footer";
import { 
  Calendar, 
  Clock, 
  Share2, 
  MessageSquare, 
  Globe, 
  Link as LinkIcon,
  CheckCircle2,
  ArrowRight
} from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Why Skill-Based Collaboration Could Be the Future of Freelancing | Weave Blog",
};

export default function BlogPostTemplate({ params }: { params: { slug: string } }) {
  // Mock data for the template
  const relatedArticles = [
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
    }
  ];

  return (
    <>
      <Header />
      
      <main className="bg-background">
        
        {/* ARTICLE HERO */}
        <section className="pt-8 pb-12 md:pt-12">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-3xl text-center">
            <Link href="/blog/category/collaboration" className="inline-block px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-[var(--radius-badge)] uppercase tracking-wider mb-6 hover:bg-primary hover:text-surface transition-colors">
              Collaboration
            </Link>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-heading mb-6 leading-tight">
              Why Skill-Based Collaboration Could Be the Future of Freelancing
            </h1>
            
            <p className="text-xl text-body mb-8 leading-relaxed max-w-2xl mx-auto">
              Cash isn't always the biggest obstacle for independent professionals. Sometimes the real challenge is finding trusted collaborators.
            </p>
            
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted font-medium mb-10">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-surface-secondary border border-border"></div>
                <span className="text-heading">Alex Rivera</span>
              </div>
              <span className="flex items-center gap-2"><Calendar className="w-4 h-4" /> July 12, 2026</span>
              <span className="flex items-center gap-2"><Clock className="w-4 h-4" /> 8 min read</span>
            </div>

            {/* Share Buttons */}
            <div className="flex items-center justify-center gap-2 border-t border-border pt-8">
              <span className="text-sm font-bold text-heading mr-2 flex items-center gap-2">
                <Share2 className="w-4 h-4" /> Share
              </span>
              <button className="p-2 bg-surface-secondary border border-border rounded-full hover:border-primary transition-colors text-muted hover:text-primary"><MessageSquare className="w-4 h-4" /></button>
              <button className="p-2 bg-surface-secondary border border-border rounded-full hover:border-primary transition-colors text-muted hover:text-primary"><Globe className="w-4 h-4" /></button>
              <button className="p-2 bg-surface-secondary border border-border rounded-full hover:border-primary transition-colors text-muted hover:text-primary"><LinkIcon className="w-4 h-4" /></button>
            </div>
          </div>
        </section>

        {/* COVER IMAGE */}
        <section className="pb-16">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
            <div className="w-full h-64 md:h-96 lg:h-[500px] bg-surface-secondary border border-border rounded-2xl"></div>
            <p className="text-center text-xs text-muted mt-3">Illustration depicting professional collaboration without money.</p>
          </div>
        </section>

        {/* CONTENT STRUCTURE */}
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl pb-24">
          <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-start">
            
            {/* LEFT SIDEBAR: TABLE OF CONTENTS */}
            <aside className="hidden lg:block lg:col-span-3 sticky top-24">
              <div className="p-6 bg-surface-secondary border border-border rounded-[var(--radius-card)]">
                <h3 className="font-bold text-heading text-sm uppercase tracking-wider mb-4">Table of Contents</h3>
                <nav className="space-y-3 text-sm">
                  <a href="#the-liquidity-trap" className="block text-body hover:text-primary transition-colors font-medium">The Liquidity Trap</a>
                  <a href="#trust-as-currency" className="block text-body hover:text-primary transition-colors font-medium">Trust as a Currency</a>
                  <a href="#beyond-cash" className="block text-body hover:text-primary transition-colors font-medium">Building Beyond Cash</a>
                  <a href="#future-of-freelance" className="block text-body hover:text-primary transition-colors font-medium">The Future of Freelance Networks</a>
                </nav>
              </div>
            </aside>

            {/* MAIN ARTICLE BODY */}
            <article className="lg:col-span-9 prose prose-lg prose-headings:text-heading prose-headings:font-bold prose-p:text-body prose-p:leading-relaxed prose-a:text-primary max-w-none">
              
              <p>
                Every freelancer knows the feeling. You have a great idea for a side project, or perhaps you want to elevate your current services. You need help—maybe a designer to polish your UI, or a developer to build your marketing site. But you look at your immediate cash flow and think, <em className="text-heading font-serif">"I can't afford to hire someone right now."</em>
              </p>

              <p>
                The irony is that somewhere else in the world, a designer is looking at their messy code thinking the exact same thing about needing a developer. Both professionals have valuable skills. Both have capacity. Yet neither can move forward because traditional freelance platforms require cash upfront.
              </p>

              <h2 id="the-liquidity-trap">The Liquidity Trap</h2>
              
              <p>
                Traditional marketplaces operate on a simple assumption: all value must be converted to cash before it can be exchanged. While this works well for corporate clients hiring agencies, it creates a massive friction point for independent creators and early-stage founders.
              </p>

              <blockquote className="border-l-4 border-primary pl-6 py-2 my-8 bg-surface-secondary rounded-r-[var(--radius-card)]">
                <p className="text-xl text-heading font-serif italic mb-0">"We are starving in a room full of food, simply because we're waiting for someone to invent money."</p>
              </blockquote>

              <p>
                When you remove the requirement for immediate cash liquidity, an entirely new economy emerges. One based on mutual value creation.
              </p>

              <h2 id="trust-as-currency">Trust as a Currency</h2>

              <p>
                If we aren't using money, what are we using? The answer is <strong>Trust</strong>. 
              </p>

              <p>
                In a skill-based exchange, you aren't just trading hours. You are building a relationship. When a copywriter helps a developer with their landing page, and that developer helps the copywriter build a custom CMS, they have established a professional bond that money often fails to create.
              </p>

              {/* Mock code block to show styles */}
              <div className="bg-[#1A1A1A] text-surface p-6 rounded-[var(--radius-card)] my-8 text-sm overflow-x-auto">
                <pre><code>{`// A traditional transaction
const transaction = new Contract({
  client: "Developer",
  vendor: "Designer",
  price: "$2,000",
  outcome: "Transactional relationship"
});

// A Weave skill exchange
const exchange = new Collaboration({
  peer1: "Developer",
  peer2: "Designer",
  investment: "20 Skill Hours",
  outcome: "Long-term partnership & mutual growth"
});`}</code></pre>
              </div>

              <h2 id="beyond-cash">Building Beyond Cash</h2>

              <p>
                Skill exchanges encourage a different mindset. When you're paying bottom dollar on a bidding site, you optimize for speed and acceptable quality. When you are trading your own hard-earned expertise for someone else's, you treat the engagement with mutual respect.
              </p>

              <p>
                We've seen frontend engineers launch entire SaaS products by trading development time for branding and marketing strategy. We've seen copywriters establish dominant SEO presences by trading content for technical site audits.
              </p>

              <h2 id="future-of-freelance">The Future of Freelance Networks</h2>

              <p>
                As independent work becomes the norm rather than the exception, the tools we use to collaborate must evolve. Marketplaces built solely around "who will do this the cheapest" are a race to the bottom. Networks built around "who can I build with" are a ladder to the top.
              </p>

              <p>
                Skill-based collaboration isn't a replacement for getting paid. It's an expansion of your purchasing power, allowing your expertise to become a liquid asset. And that changes everything.
              </p>

            </article>

          </div>
        </div>

        {/* KEY TAKEAWAYS */}
        <section className="py-16 border-t border-border">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
            <div className="bg-surface border border-border p-8 rounded-[var(--radius-card)]">
              <h3 className="text-xl font-bold text-heading mb-6 flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 text-primary" /> Key Takeaways
              </h3>
              <ul className="space-y-4 text-body font-medium">
                <li className="flex items-start gap-3">
                  <span className="text-primary mt-1">&bull;</span>
                  <span>Cash liquidity shouldn't be the bottleneck for professional collaboration when both parties have valuable skills.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-primary mt-1">&bull;</span>
                  <span>Skill exchanges foster long-term relationships and mutual respect, whereas cash transactions often remain strictly transactional.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-primary mt-1">&bull;</span>
                  <span>Treating your expertise as a liquid asset drastically increases your purchasing power as an independent professional.</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* AUTHOR BOX */}
        <section className="py-16 bg-surface-secondary border-y border-border">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-3xl">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
              <div className="w-24 h-24 bg-surface border border-border rounded-full flex-shrink-0"></div>
              <div className="text-center md:text-left">
                <h3 className="text-lg font-bold text-heading">Alex Rivera</h3>
                <p className="text-primary text-sm font-bold tracking-wider uppercase mb-3">Head of Product at Weave</p>
                <p className="text-body text-sm leading-relaxed max-w-xl">
                  Alex has spent the last decade building tools for independent professionals and creators. Passionate about decentralized collaboration, network economies, and helping freelancers build sustainable careers without burnout.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* RELATED ARTICLES */}
        <section className="py-24">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
            <h2 className="text-2xl font-bold text-heading mb-10 text-center">Related Articles</h2>
            <div className="grid md:grid-cols-3 gap-8">
              {relatedArticles.map((article, i) => (
                <Link href={`/blog/${article.slug}`} key={i} className="group flex flex-col h-full bg-surface border border-border rounded-[var(--radius-card)] overflow-hidden hover:border-primary/30 transition-colors">
                  <div className="h-40 bg-surface-secondary border-b border-border w-full"></div>
                  <div className="p-6 flex flex-col flex-grow">
                    <h3 className="text-lg font-bold text-heading mb-2 group-hover:text-primary transition-colors line-clamp-2">
                      {article.title}
                    </h3>
                    <p className="text-body text-sm leading-relaxed mb-4 flex-grow line-clamp-3">
                      {article.excerpt}
                    </p>
                    <span className="text-xs font-medium text-muted flex items-center gap-2 mt-auto">
                      <Clock className="w-3 h-3" /> {article.readTime}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* NEWSLETTER CTA */}
        <section className="py-24 bg-surface-secondary border-t border-border">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-3xl text-center">
            <h2 className="text-3xl font-bold text-heading mb-4">Enjoyed this article?</h2>
            <p className="text-body mb-8">Subscribe for future updates, community stories, and product announcements.</p>
            <form className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto mb-4">
              <input type="email" placeholder="Enter your email address" className="flex-grow bg-background border border-border rounded-[var(--radius-input)] px-4 py-3 focus:outline-none focus:border-primary text-body" />
              <button className="px-6 py-3 bg-heading text-surface font-bold rounded-[var(--radius-button)] hover:bg-black transition-colors whitespace-nowrap">
                Subscribe
              </button>
            </form>
            <p className="text-xs text-muted">No spam. Unsubscribe anytime.</p>
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="py-24 border-t border-border bg-primary text-surface text-center">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-2xl">
            <h2 className="text-3xl font-bold mb-6">Interested in joining Weave?</h2>
            <p className="text-lg text-surface/80 mb-10">
              Join a growing community where professionals exchange expertise and build lasting relationships.
            </p>
            <Link href="/request-invite" className="inline-block px-8 py-3 text-base font-bold text-primary bg-surface rounded-[var(--radius-button)] hover:bg-white transition-colors shadow-subtle">
              Request an Invite <ArrowRight className="w-4 h-4 inline ml-2" />
            </Link>
          </div>
        </section>

      </main>

      <Footer />
    </>
  );
}
