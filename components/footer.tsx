import Link from "next/link";

export default function Footer() {
  const sections = [
    {
      title: "Product",
      links: [
        { label: "How It Works", href: "/#how-it-works" },
        { label: "Marketplace", href: "/#marketplace" },
        { label: "Trust & Safety", href: "/#trust-safety" },
        { label: "Pricing", href: "/#pricing" }
      ]
    },
    {
      title: "Company",
      links: [
        { label: "About", href: "/about" },
        { label: "Blog", href: "/blog" },
        { label: "Careers", href: "/careers" },
        { label: "Contact", href: "/contact" }
      ]
    },
    {
      title: "Resources",
      links: [
        { label: "Help Center", href: "/help" },
        { label: "Community Guidelines", href: "/legal/guidelines" }
      ]
    },
    {
      title: "Legal",
      links: [
        { label: "Terms of Service", href: "/legal/terms" },
        { label: "Privacy Policy", href: "/legal/privacy" },
        { label: "Escrow Policy", href: "/legal/escrow" },
        { label: "Acceptable Use", href: "/legal/acceptable-use" },
        { label: "Cookie Policy", href: "/legal/cookies" }
      ]
    },
    {
      title: "Social",
      links: [
        { label: "X", href: "#" },
        { label: "LinkedIn", href: "#" },
        { label: "GitHub", href: "#" },
        { label: "Discord", href: "#" }
      ]
    }
  ];

  return (
    <footer className="bg-background border-t border-border pt-16 pb-8">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8 mb-16">
          <div className="col-span-2 md:col-span-1 mb-4 md:mb-0">
            <Link href="/" className="font-heading text-2xl font-bold tracking-tight text-primary inline-block">Weave</Link>
          </div>
          {sections.map((section, index) => (
            <div key={index}>
              <h4 className="text-sm font-bold text-heading mb-4 uppercase tracking-wider">{section.title}</h4>
              <ul className="space-y-3">
                {section.links.map((link, i) => (
                  <li key={i}>
                    <Link href={link.href} className="text-sm text-muted hover:text-primary transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-border pt-8 flex justify-center">
          <p className="text-sm text-muted text-center">
            &copy; 2026 Weave. Trade skills. Build together.
          </p>
        </div>
      </div>
    </footer>
  );
}
