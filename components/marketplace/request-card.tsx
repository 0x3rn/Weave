"use client";

import { useState } from "react";
import { MarketplaceRequest } from "@/types";
import { BadgeCheck, Clock, Users, Bookmark, BookmarkMinus, ExternalLink } from "lucide-react";
import Link from "next/link";
import { toast } from "react-hot-toast";
import { SkillIcon } from "@/components/profile/skill-icon";
import { toggleSavedItem } from "@/app/actions/saved";

interface RequestCardProps {
  request: MarketplaceRequest;
  isSavedInitial?: boolean;
  isApplied?: boolean;
  onToggleSave?: (id: string, isSaved: boolean) => void;
}

export function RequestCard({ request, isSavedInitial = false, isApplied = false, onToggleSave }: RequestCardProps) {
  const [isSaved, setIsSaved] = useState(isSavedInitial);

  return (
    <div className="bg-background border border-border rounded-[var(--radius-card)] p-6 shadow-subtle hover:shadow-md transition-all group flex flex-col h-full">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <Link href={`/marketplace/${request.id}`} className="hover:underline">
            <div className="flex flex-col gap-1">
              <h3 className="font-bold text-heading text-lg leading-tight line-clamp-2">{request.title}</h3>
              {request.isMutual ? (
                <span className="inline-flex w-fit items-center px-2 py-0.5 rounded text-[10px] font-bold bg-primary/10 text-primary uppercase tracking-wider">
                  Mutual Exchange
                </span>
              ) : (
                <span className="inline-flex w-fit items-center px-2 py-0.5 rounded text-[10px] font-bold bg-surface-secondary border border-border text-muted uppercase tracking-wider">
                  Standard Exchange
                </span>
              )}
            </div>
          </Link>
          <div className="flex items-center gap-2 mt-3">
            <div className="w-8 h-8 rounded-full bg-surface-secondary border border-border flex items-center justify-center shrink-0 overflow-hidden">
              {request.requesterAvatar ? (
                <img src={request.requesterAvatar} alt={request.requesterName} className="w-full h-full object-cover" />
              ) : (
                <span className="font-bold text-xs text-heading">{request.requesterName.charAt(0)}</span>
              )}
            </div>
            <div>
              <div className="font-bold text-sm text-heading">
              {request.requesterName.split(" ").slice(0, -1).join(" ")}
              {request.requesterName.split(" ").length > 1 ? " " : ""}
              <span className="whitespace-nowrap">
                {request.requesterName.split(" ").slice(-1)[0]}
                {request.requesterVerification && <BadgeCheck className="inline-block w-4 h-4 text-primary fill-primary/10 ml-1 align-[-0.15em]" />}
              </span>
            </div>
              <span className="text-xs text-muted font-medium flex items-center gap-1">
                Trust Score: <span className="text-success font-bold">{request.requesterTrustScore}</span>
              </span>
            </div>
          </div>
        </div>
        <button 
          onClick={async (e) => {
            e.preventDefault();
            const newVal = !isSaved;
            setIsSaved(newVal); // Optimistic UI update
            if (onToggleSave) onToggleSave(request.id, newVal);
            
            if (newVal) {
              toast.success(`Request saved to your list`, { position: "bottom-right" });
            } else {
              toast(`Request removed from your list`, { 
                position: "bottom-right", 
                icon: <BookmarkMinus className="w-4 h-4 text-muted" /> 
              });
            }

            const result = await toggleSavedItem(request.id, "request");
            if (!result.success) {
              setIsSaved(!newVal); // Revert on failure
              if (onToggleSave) onToggleSave(request.id, !newVal);
              toast.error("Failed to update saved items", { position: "bottom-right" });
            }
          }}
          className={`transition-colors p-1 ${isSaved ? "text-primary" : "text-muted hover:text-primary"}`}
        >
          <Bookmark className={`w-5 h-5 ${isSaved ? "fill-primary text-primary" : ""}`} />
        </button>
      </div>

      <p className="text-body text-sm line-clamp-3 mb-6 flex-1">
        {request.description}
      </p>

      <div className="space-y-4 mt-auto">
        <div className="space-y-4">
          <div>
            <span className="block text-[10px] uppercase tracking-wider font-bold text-muted mb-2">I Need</span>
            <div className="flex flex-wrap gap-2">
              {request.skillsRequired.map((skill, idx) => (
                <span key={idx} className="px-2 py-1 bg-surface-secondary border border-border text-xs font-medium text-heading rounded-md flex items-center gap-1.5">
                  <SkillIcon skill={skill} className="w-3.5 h-3.5" />
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {request.isMutual && request.offeredSkills && (
            <div>
              <span className="block text-[10px] uppercase tracking-wider font-bold text-primary mb-2">I Can Offer</span>
              <div className="flex flex-wrap gap-2">
                {request.offeredSkills.map((skill, idx) => (
                  <span key={idx} className="px-2 py-1 bg-primary/5 border border-primary/20 text-xs font-medium text-heading rounded-md flex items-center gap-1.5">
                    <SkillIcon skill={skill} className="w-3.5 h-3.5 text-primary" />
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-2 gap-2 text-xs bg-background p-3 rounded-[var(--radius-card)] border border-border">
          <div className="flex items-center gap-1.5 text-heading font-medium">
            <Clock className="w-4 h-4 text-muted shrink-0" /> Est. {request.estimatedHours} Hrs
          </div>
          <div className="flex items-center gap-1.5 text-heading font-medium text-right justify-end">
            {request.timeline}
          </div>
        </div>

        <div className="flex items-center justify-between pt-5 mt-2 border-t border-border">
          <span className="text-xs font-bold text-muted uppercase tracking-wider flex items-center gap-1.5">
            <Users className="w-4 h-4" /> {request.applicantsCount} Interested
          </span>
          <div className="flex gap-2">
            <Link 
              href={`/marketplace/${request.id}`}
              className={`px-4 py-2 text-sm font-bold rounded-[var(--radius-button)] transition-colors ${
                isApplied 
                  ? "bg-surface-secondary border border-border text-heading hover:bg-border" 
                  : "bg-primary hover:bg-primary-hover text-background shadow-[0_0_15px_rgba(88,199,109,0.3)]"
              }`}
            >
              {isApplied ? "View Proposal" : "Apply"}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
