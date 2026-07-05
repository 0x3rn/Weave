"use client";

import { User, PortfolioItem } from "@/types";
import { CheckCircle2, Circle, Trophy } from "lucide-react";
import Link from "next/link";

interface ProfileCompletionProps {
  user: User;
  portfolio: PortfolioItem[];
}

export default function ProfileCompletion({ user, portfolio }: ProfileCompletionProps) {
  // Define completion steps
  const steps = [
    {
      id: "photo",
      label: "Upload a profile photo",
      completed: !!(user.photoURL || (user as any).photoUrl),
      weight: 15,
      href: "/profile/edit",
    },
    {
      id: "headline",
      label: "Add a professional headline",
      completed: !!user.headline,
      weight: 10,
      href: "/profile/edit",
    },
    {
      id: "bio",
      label: "Write a short bio",
      completed: !!user.bio && user.bio.length > 10,
      weight: 20,
      href: "/profile/edit",
    },
    {
      id: "location",
      label: "Set your location & timezone",
      completed: !!(user.country && user.timeZone),
      weight: 10,
      href: "/profile/edit",
    },
    {
      id: "skills_offered",
      label: "Add skills you can offer",
      completed: user.skillsOffered && user.skillsOffered.length > 0,
      weight: 15,
      href: "/profile/edit",
    },
    {
      id: "skills_wanted",
      label: "Add skills you are looking for",
      completed: user.skillsLookingFor && user.skillsLookingFor.length > 0,
      weight: 10,
      href: "/profile/edit",
    },
    {
      id: "portfolio",
      label: "Upload your first portfolio project",
      completed: portfolio && portfolio.length > 0,
      weight: 20,
      href: "/portfolio/new",
    },
  ];

  // Calculate total completion percentage
  const completionPercentage = steps.reduce((total, step) => {
    return total + (step.completed ? step.weight : 0);
  }, 0);

  // If 100% complete, don't show the card
  if (completionPercentage >= 100) {
    return null;
  }

  // Find next step
  const nextStep = steps.find(s => !s.completed);

  return (
    <div className="bg-background border border-border rounded-[var(--radius-card)] p-4 shadow-subtle">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-bold text-heading text-sm">Profile Completion</h3>
        <span className="font-bold text-primary text-sm">{completionPercentage}%</span>
      </div>
      
      <div className="w-full h-1.5 bg-surface-secondary rounded-full overflow-hidden mb-3">
        <div 
          className="h-full bg-primary transition-all duration-1000 ease-out"
          style={{ width: `${completionPercentage}%` }}
        />
      </div>
      
      {nextStep && (
        <div className="flex flex-col gap-2">
          <p className="text-xs text-muted">
            Next: <span className="font-semibold text-heading">{nextStep.label}</span>
          </p>
          <Link 
            href={nextStep.href}
            className="w-full py-1.5 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold rounded-[var(--radius-button)] transition-colors text-center border border-primary/20"
          >
            Complete Now (+{nextStep.weight}%)
          </Link>
        </div>
      )}
    </div>
  );
}
