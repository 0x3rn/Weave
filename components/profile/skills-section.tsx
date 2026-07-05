"use client";

import { User, UserSkill } from "@/types";
import { Star } from "lucide-react";

interface SkillsSectionProps {
  user: User;
}

export default function SkillsSection({ user }: SkillsSectionProps) {
  // Normalize skillsOffered (could be strings or UserSkill objects)
  const skillsOffered: UserSkill[] = (user.skillsOffered || []).map(skill => {
    if (typeof skill === "string") {
      return { name: skill };
    }
    return skill;
  });

  const skillsLookingFor = user.skillsLookingFor || [];

  return (
    <section className="space-y-8">
      
      {/* Skills Offered */}
      <div>
        <h2 className="text-xl font-bold text-heading mb-4 border-b border-border pb-2">Skills Offered</h2>
        {skillsOffered.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {skillsOffered.map((skill, idx) => (
              <div key={idx} className="bg-surface border border-border p-3 rounded-[var(--radius-card)] flex flex-col justify-center shadow-subtle">
                <span className="font-bold text-sm text-heading mb-1 truncate">{skill.name}</span>
                {(skill.rating || skill.yearsOfExperience) ? (
                  <div className="flex items-center justify-between text-xs text-muted mt-auto">
                    {skill.rating && (
                      <div className="flex items-center text-warning gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={`w-3 h-3 ${i < skill.rating! ? "fill-current" : "text-border"}`} />
                        ))}
                      </div>
                    )}
                    {skill.yearsOfExperience && (
                      <span>{skill.yearsOfExperience} yrs</span>
                    )}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted text-sm italic">No skills listed yet.</p>
        )}
      </div>

      {/* Skills Looking For */}
      <div>
        <h2 className="text-xl font-bold text-heading mb-4 border-b border-border pb-2">Skills Looking For</h2>
        {skillsLookingFor.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {skillsLookingFor.map((skill, idx) => (
              <span key={idx} className="bg-surface-secondary border border-border text-body text-sm px-3 py-1.5 rounded-full">
                {skill}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-muted text-sm italic">Not looking for specific skills right now.</p>
        )}
      </div>

    </section>
  );
}
