"use client";

import { User } from "@/types";

interface AboutSectionProps {
  user: User;
}

export default function AboutSection({ user }: AboutSectionProps) {
  const languages = user.languages || ["English"];
  const experience = user.experienceLevel || "Not specified";
  const availability = user.availability || "Not specified";

  return (
    <section>
      <h2 className="text-2xl font-bold text-heading mb-6 border-b border-border pb-2">About</h2>
      
      {user.bio ? (
        <p className="text-body leading-relaxed whitespace-pre-wrap mb-8">
          {user.bio}
        </p>
      ) : (
        <p className="text-muted italic mb-8">This user hasn't written a bio yet.</p>
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
