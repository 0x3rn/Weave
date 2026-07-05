"use client";

import { BookOpen, ExternalLink } from "lucide-react";
import Link from "next/link";

export default function LearningCenter() {
  const articles = [
    { title: "Getting Started", href: "/help/getting-started" },
    { title: "How Escrow Works", href: "/legal/escrow" },
    { title: "Building Trust", href: "/help/building-trust" },
    { title: "Marketplace Tips", href: "/help/marketplace" },
  ];

  return (
    <div className="bg-surface border border-border rounded-[var(--radius-card)] shadow-subtle p-6">
      <h3 className="font-bold text-heading flex items-center gap-2 text-sm uppercase tracking-wider mb-4">
        <BookOpen className="w-4 h-4 text-primary" />
        Learning Center
      </h3>
      <ul className="space-y-3">
        {articles.map((article, i) => (
          <li key={i}>
            <Link 
              href={article.href} 
              className="text-sm font-medium text-muted hover:text-primary transition-colors flex items-center justify-between group"
            >
              {article.title}
              <ExternalLink className="w-3.h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
          </li>
        ))}
      </ul>
      <Link 
        href="/help"
        className="mt-6 block text-center text-xs font-bold text-primary hover:underline uppercase tracking-wider"
      >
        View Help Center
      </Link>
    </div>
  );
}
