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

  return (
    <div className="bg-primary/5 border border-primary/20 rounded-[var(--radius-card)] overflow-hidden">
      <div className="p-4 border-b border-primary/10">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-bold text-heading flex items-center gap-2">
            <Trophy className="w-4 h-4 text-primary" />
            Profile Completion
          </h3>
          <span className="font-bold text-primary">{completionPercentage}%</span>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full h-2 bg-primary/10 rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary transition-all duration-1000 ease-out rounded-full"
            style={{ width: `${completionPercentage}%` }}
          />
        </div>
        
        <p className="text-xs text-muted mt-2">
          Profiles that are 100% complete receive 3x more exchange requests!
        </p>
      </div>

      <div className="p-2 space-y-1">
        {steps.map(step => (
          <Link 
            key={step.id} 
            href={step.href}
            className={`flex items-center justify-between p-2 rounded-md hover:bg-surface-secondary transition-colors ${step.completed ? "opacity-50" : ""}`}
          >
            <div className="flex items-center gap-2">
              {step.completed ? (
                <CheckCircle2 className="w-4 h-4 text-success" />
              ) : (
                <Circle className="w-4 h-4 text-muted" />
              )}
              <span className={`text-sm ${step.completed ? "text-muted line-through" : "text-heading font-medium"}`}>
                {step.label}
              </span>
            </div>
            {!step.completed && (
              <span className="text-[10px] uppercase font-bold text-primary">+{step.weight}%</span>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
