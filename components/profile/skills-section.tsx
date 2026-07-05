"use client";

import { User, UserSkill } from "@/types";
import { Star, ThumbsUp } from "lucide-react";
import { SkillIcon } from "./skill-icon";

interface SkillsSectionProps {
  user: User;
  isOwner?: boolean;
}

export default function SkillsSection({ user, isOwner }: SkillsSectionProps) {
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
              <div key={idx} className="bg-background border border-border p-3 rounded-[var(--radius-card)] flex flex-col justify-center shadow-subtle group hover:border-primary/50 transition-colors min-w-0 h-full">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-surface-secondary flex items-center justify-center flex-shrink-0">
                    <SkillIcon skill={skill.name} className="w-4 h-4" />
                  </div>
                  <span className="font-bold text-sm text-heading truncate flex-1 min-w-0 leading-tight pt-0.5">{skill.name}</span>
                </div>
                {(skill.rating || skill.yearsOfExperience) ? (
                  <div className="flex items-center justify-between text-xs text-muted mt-2">
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
                {/* Only show endorse option to visitors, not the owner */}
                {!isOwner && (
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
                    <button className="flex items-center gap-1.5 text-[11px] font-bold text-muted hover:text-primary transition-colors cursor-not-allowed opacity-60" title="Endorsements coming soon">
                      <ThumbsUp className="w-3 h-3" /> Endorse
                    </button>
                    <span className="text-[9px] uppercase font-bold text-muted bg-surface-secondary px-1.5 py-0.5 rounded">Soon</span>
                  </div>
                )}
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
