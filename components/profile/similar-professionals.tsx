"use client";

import { User } from "@/types";
import { Users } from "lucide-react";
import Link from "next/link";

interface SimilarProfessionalsProps {
  user: User;
}

export default function SimilarProfessionals({ user }: SimilarProfessionalsProps) {
  // Mock data for UI layout since we aren't fetching similar users yet
  const similarUsers = [
    { id: 1, name: "Alice Chen", role: "Frontend Developer", initials: "AC" },
    { id: 2, name: "Marcus Johnson", role: "UI/UX Designer", initials: "MJ" },
    { id: 3, name: "Sarah Smith", role: "Fullstack Engineer", initials: "SS" },
  ];

  return (
    <section>
      <div className="flex items-center gap-2 mb-6 border-b border-border pb-2">
        <Users className="w-5 h-5 text-primary" />
        <h2 className="text-xl font-bold text-heading">Similar Professionals</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {similarUsers.map((similar) => (
          <div key={similar.id} className="bg-surface border border-border p-4 rounded-[var(--radius-card)] shadow-subtle flex items-center gap-3 group">
            <div className="w-12 h-12 rounded-full bg-surface-secondary border border-border flex items-center justify-center shrink-0">
              <span className="text-muted text-sm font-bold group-hover:text-primary transition-colors">{similar.initials}</span>
            </div>
            <div className="min-w-0">
              <h4 className="font-bold text-heading text-sm truncate">{similar.name}</h4>
              <p className="text-xs text-muted truncate">{similar.role}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
