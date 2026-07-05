"use client";

import { User } from "@/types";
import { Bot } from "lucide-react";

interface AboutSectionProps {
  user: User;
  isOwner?: boolean;
}

export default function AboutSection({ user, isOwner }: AboutSectionProps) {
  const languages = user.languages || ["English"];
  const experience = user.experienceLevel || "Not specified";
  const availability = user.availability || "Not specified";

  return (
    <section>
      <h2 className="text-2xl font-bold text-heading mb-6 border-b border-border pb-2">About</h2>
      
      {/* AI Summary Placeholder */}
      <div className="bg-background border border-border p-4 rounded-[var(--radius-card)] mb-8 flex items-start gap-3 relative overflow-hidden">
        <Bot className="w-5 h-5 text-primary mt-0.5 flex-shrink-0 relative z-10" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-sm font-bold text-heading">AI Profile Summary</h3>
            <span className="text-[10px] uppercase font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded">Coming Soon</span>
          </div>
          <p className="text-xs text-muted leading-relaxed">
            {isOwner 
              ? `Our AI will automatically analyze your portfolio, reviews, and completed exchanges to generate a quick, trustworthy summary of your expertise.`
              : `Our AI will automatically analyze ${user.fullName.split(' ')[0]}'s portfolio, reviews, and completed exchanges to generate a quick, trustworthy summary of their expertise.`}
          </p>
        </div>
      </div>

      {user.bio ? (
        <p className="text-body leading-relaxed whitespace-pre-wrap mb-8">
          {user.bio}
        </p>
      ) : (
        <p className="text-muted italic mb-8">
          {isOwner ? "You haven't written a bio yet." : "This user hasn't written a bio yet."}
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div>
          <h3 className="text-sm font-bold text-heading uppercase tracking-wider mb-2">Languages</h3>
          <div className="flex flex-wrap gap-2">
            {languages.map(lang => (
              <span key={lang} className="text-sm text-body">{lang}</span>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-bold text-heading uppercase tracking-wider mb-2">Experience</h3>
          <p className="text-sm text-body">{experience}</p>
        </div>

        <div>
          <h3 className="text-sm font-bold text-heading uppercase tracking-wider mb-2">Availability</h3>
          <p className="text-sm text-body">{availability}</p>
        </div>
      </div>
    </section>
  );
}
