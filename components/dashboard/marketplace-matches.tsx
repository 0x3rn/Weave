"use client";

import { User } from "@/types";
import { ArrowRight, Sparkles, UserPlus } from "lucide-react";
import Link from "next/link";

export default function MarketplaceMatches({ matches }: { matches: User[] }) {
  if (matches.length === 0) return null;

  return (
    <div className="bg-surface border border-border rounded-[var(--radius-card)] shadow-subtle overflow-hidden">
      <div className="p-6 border-b border-border flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-heading flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-warning" />
            Recommended For You
          </h2>
          <p className="text-sm text-body mt-1">Based on the skills you are looking for.</p>
        </div>
        <Link href="/marketplace" className="text-sm font-medium text-primary hover:underline flex items-center gap-1">
          Browse All <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="divide-y divide-border">
        {matches.map((match) => (
          <div key={match.uid} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-background transition-colors group">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center overflow-hidden shrink-0">
                {match.photoURL || (match as any).photoUrl ? (
                  <img src={match.photoURL || (match as any).photoUrl} alt={match.username} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-primary font-bold text-lg">{match.username.charAt(0).toUpperCase()}</span>
                )}
              </div>
              <div>
                <h3 className="font-bold text-heading group-hover:text-primary transition-colors">
                  {match.fullName || match.username}
                </h3>
                <p className="text-sm text-muted">{match.headline || match.profession}</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {match.skillsOffered.slice(0, 3).map((skill: any, i) => (
                    <span key={i} className="px-2 py-0.5 rounded text-xs font-medium bg-background border border-border text-muted">
                      {typeof skill === 'string' ? skill : skill.name}
                    </span>
                  ))}
                  {match.skillsOffered.length > 3 && (
                    <span className="px-2 py-0.5 rounded text-xs font-medium bg-background border border-border text-muted">
                      +{match.skillsOffered.length - 3}
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3 shrink-0">
              <Link 
                href={`/u/${match.username}`}
                className="px-4 py-2 bg-background border border-border text-heading rounded-[var(--radius-button)] text-sm font-medium hover:border-primary transition-all"
              >
                View Profile
              </Link>
              <Link 
                href={`/u/${match.username}?request=true`}
                className="px-4 py-2 bg-primary/10 text-primary border border-primary/20 rounded-[var(--radius-button)] text-sm font-medium hover:bg-primary hover:text-primary-foreground transition-all flex items-center gap-2"
              >
                <UserPlus className="w-4 h-4" />
                Request
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
