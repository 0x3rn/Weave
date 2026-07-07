"use client";

import { User } from "@/types";
import { Users } from "lucide-react";
import Link from "next/link";

interface SimilarProfessionalsProps {
  similarUsers: any[];
}

export default function SimilarProfessionals({ similarUsers }: SimilarProfessionalsProps) {

  return (
    <section>
      <div className="flex items-center gap-2 mb-6 border-b border-border pb-2">
        <Users className="w-5 h-5 text-primary" />
        <h2 className="text-xl font-bold text-heading">Similar Professionals</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {similarUsers.map((similar) => (
          <Link key={similar.id} href={`/u/${similar.username}`} className="bg-background border border-border p-4 rounded-[var(--radius-card)] shadow-subtle flex items-center gap-3 group hover:border-primary/50 transition-colors">
            <div className="w-12 h-12 rounded-full bg-surface-secondary border border-border flex items-center justify-center shrink-0 overflow-hidden">
              {similar.photoURL ? (
                <img src={similar.photoURL} alt={similar.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-muted text-sm font-bold group-hover:text-primary transition-colors">{similar.name.charAt(0)}</span>
              )}
            </div>
            <div className="min-w-0">
              <h4 className="font-bold text-heading text-sm truncate">{similar.name}</h4>
              <p className="text-xs text-muted truncate">{similar.role}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
