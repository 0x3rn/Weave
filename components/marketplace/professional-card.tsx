"use client";

import { useState } from "react";
import { BadgeCheck, Bookmark, BookmarkMinus, Star, Users, MapPin } from "lucide-react";
import Link from "next/link";
import { toast } from "react-hot-toast";
import { SkillIcon } from "@/components/profile/skill-icon";
import { toggleSavedItem } from "@/app/actions/saved";

interface ProfessionalCardProps {
  professional: {
    id: string;
    username: string;
    name: string;
    avatar: string | null;
    headline: string;
    isVerified: boolean;
    trustScore: number;
    rating: number;
    completedExchanges: number;
    topSkills: string[];
    availability: string;
  };
  isSavedInitial?: boolean;
  onToggleSave?: (id: string, isSaved: boolean) => void;
}

export function ProfessionalCard({ professional, isSavedInitial = false, onToggleSave }: ProfessionalCardProps) {
  const [isSaved, setIsSaved] = useState(isSavedInitial);

  return (
    <div className="bg-surface border border-border rounded-[var(--radius-card)] p-6 shadow-subtle hover:shadow-md transition-all group flex flex-col h-full">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-center gap-4">
          <div className="relative shrink-0">
            <div className="w-14 h-14 rounded-full bg-surface-secondary border border-border flex items-center justify-center overflow-hidden">
              {professional.avatar ? (
                <img src={professional.avatar} alt={professional.name} className="w-full h-full object-cover" />
              ) : (
                <span className="font-bold text-lg text-heading">{professional.name.charAt(0)}</span>
              )}
            </div>
            <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-success rounded-full border-2 border-surface z-10"></div>
          </div>
          <div>
            <Link href={`/u/${professional.username}`} className="hover:underline">
              <h3 className="font-bold text-heading text-lg">
                {professional.name.split(" ").slice(0, -1).join(" ")}
                {professional.name.split(" ").length > 1 ? " " : ""}
                <span className="whitespace-nowrap">
                  {professional.name.split(" ").slice(-1)[0]}
                  {professional.isVerified && <BadgeCheck className="inline-block w-5 h-5 text-primary fill-primary/10 ml-1 align-[-0.15em]" />}
                </span>
              </h3>
            </Link>
            <p className="text-sm text-body line-clamp-1">{professional.headline}</p>
          </div>
        </div>
        <button 
          onClick={async (e) => {
            e.preventDefault();
            const newVal = !isSaved;
            setIsSaved(newVal); // Optimistic UI update
            if (onToggleSave) onToggleSave(professional.id, newVal);
            
            if (newVal) {
              toast.success(`${professional.name.split(" ")[0]} saved to your list`, { position: "bottom-right" });
            } else {
              toast(`${professional.name.split(" ")[0]} removed from your list`, { 
                position: "bottom-right", 
                icon: <BookmarkMinus className="w-4 h-4 text-muted" /> 
              });
            }

            const result = await toggleSavedItem(professional.id, "professional");
            if (!result.success) {
              setIsSaved(!newVal); // Revert on failure
              if (onToggleSave) onToggleSave(professional.id, !newVal);
              toast.error("Failed to update saved items", { position: "bottom-right" });
            }
          }}
          className={`transition-colors p-1 ${isSaved ? "text-primary" : "text-muted hover:text-primary"}`}
        >
          <Bookmark className={`w-5 h-5 ${isSaved ? "fill-primary text-primary" : ""}`} />
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-6 pt-4 border-t border-border">
        <div className="text-center">
          <span className="block text-[10px] uppercase tracking-wider font-bold text-muted mb-1">Trust Score</span>
          <span className="font-bold text-success text-sm">{professional.trustScore}</span>
        </div>
        <div className="text-center border-x border-border">
          <span className="block text-[10px] uppercase tracking-wider font-bold text-muted mb-1">Rating</span>
          <span className="font-bold text-heading text-sm flex items-center justify-center gap-1">
            <Star className="w-3.5 h-3.5 fill-warning text-warning" /> {professional.rating || "New"}
          </span>
        </div>
        <div className="text-center">
          <span className="block text-[10px] uppercase tracking-wider font-bold text-muted mb-1">Exchanges</span>
          <span className="font-bold text-heading text-sm">{professional.completedExchanges}</span>
        </div>
      </div>

      <div className="space-y-4 mt-auto">
        <div>
          <span className="block text-[10px] uppercase tracking-wider font-bold text-muted mb-2">Top Skills</span>
          <div className="flex flex-wrap gap-2">
            {professional.topSkills.length > 0 ? professional.topSkills.map((skill, idx) => (
              <span key={idx} className="px-2 py-1 bg-surface-secondary border border-border text-xs font-medium text-heading rounded-md flex items-center gap-1.5">
                <SkillIcon skill={skill} className="w-3.5 h-3.5" />
                {skill}
              </span>
            )) : <span className="text-xs text-muted">No skills listed</span>}
          </div>
        </div>
        
        <div className="flex items-center gap-2 text-xs bg-background p-3 rounded-[var(--radius-card)] border border-border font-medium text-heading">
          <div className="w-2 h-2 rounded-full bg-success animate-pulse"></div>
          {professional.availability}
        </div>

        <div className="flex gap-2 pt-4">
          <Link 
            href={`/u/${professional.username}`}
            className="flex-1 py-2 bg-surface hover:bg-surface-secondary border border-border text-heading text-sm font-bold text-center rounded-[var(--radius-button)] transition-colors shadow-subtle"
          >
            View Profile
          </Link>
          <button className="flex-1 py-2 bg-primary hover:bg-primary-hover text-background text-sm font-bold rounded-[var(--radius-button)] transition-colors shadow-[0_0_15px_rgba(88,199,109,0.3)]">
            Request
          </button>
        </div>
      </div>
    </div>
  );
}
