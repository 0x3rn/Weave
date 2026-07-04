"use client";

import { OnboardingData } from "../onboarding-wizard";
import { Camera, MapPin, Briefcase, Clock, Globe, Code, MessageSquare, ExternalLink, PencilLine } from "lucide-react";

interface StepProps {
  data: OnboardingData;
  onEditStep: (step: number) => void;
}

export default function Step6Review({ data, onEditStep }: StepProps) {
  
  // Calculate a fake "Completion Percentage" based on fields filled
  let filledFields = 0;
  const totalFields = 11;
  
  if (data.photoUrl) filledFields++;
  if (data.fullName) filledFields++;
  if (data.headline) filledFields++;
  if (data.bio) filledFields++;
  if (data.country) filledFields++;
  if (data.skillsOffered.length > 0) filledFields++;
  if (data.experienceLevel) filledFields++;
  if (data.availability) filledFields++;
  if (data.skillsLookingFor.length > 0) filledFields++;
  if (data.portfolioWebsite || data.github || data.linkedIn) filledFields++;
  if (data.portfolioFiles.length > 0) filledFields++;

  const completionPercentage = Math.round((filledFields / totalFields) * 100);

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="text-center mb-6">
        <h3 className="text-lg font-bold text-heading">Review your profile</h3>
        <p className="text-body mt-2">This is exactly how other members will see you.</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-6">
        
        {/* Left Col: Completion Insights */}
        <div className="sm:w-1/3 space-y-4">
          <div className="bg-background border border-border p-5 rounded-[var(--radius-card)]">
            <h4 className="text-sm font-bold text-heading mb-3">Profile Completion</h4>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-full bg-surface h-2 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-success transition-all"
                  style={{ width: `${completionPercentage}%` }}
                />
              </div>
              <span className="text-sm font-bold text-success">{completionPercentage}%</span>
            </div>
            
            {completionPercentage < 100 && (
              <div className="mt-4 space-y-2 text-xs">
                <p className="text-muted font-medium">To reach 100%:</p>
                {!data.photoUrl && <button onClick={() => onEditStep(1)} className="text-primary hover:underline block text-left">Add a profile photo</button>}
                {data.skillsOffered.length === 0 && <button onClick={() => onEditStep(2)} className="text-primary hover:underline block text-left">Add skills you offer</button>}
                {data.skillsLookingFor.length === 0 && <button onClick={() => onEditStep(3)} className="text-primary hover:underline block text-left">Add skills you need</button>}
                {!data.portfolioWebsite && !data.github && !data.linkedIn && <button onClick={() => onEditStep(4)} className="text-primary hover:underline block text-left">Add social links</button>}
                {data.portfolioFiles.length === 0 && <button onClick={() => onEditStep(4)} className="text-primary hover:underline block text-left">Upload portfolio samples</button>}
              </div>
            )}
          </div>
        </div>

        {/* Right Col: The actual card preview */}
        <div className="sm:w-2/3 bg-background border border-border rounded-[var(--radius-card)] overflow-hidden shadow-sm relative">
          
          <button onClick={() => onEditStep(1)} className="absolute top-4 right-4 text-muted hover:text-primary z-10 p-2 bg-surface rounded-full shadow-sm">
            <PencilLine className="w-4 h-4" />
          </button>

          <div className="p-6 border-b border-border">
            <div className="flex items-start gap-4">
              <div className="w-20 h-20 rounded-full overflow-hidden bg-surface border border-border flex-shrink-0">
                {data.photoUrl ? (
                  <img src={data.photoUrl} alt={data.fullName} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-surface-secondary">
                    <Camera className="w-6 h-6 text-muted" />
                  </div>
                )}
              </div>
              <div className="pt-2">
                <h2 className="text-xl font-bold text-heading">{data.fullName || "Your Name"}</h2>
                <p className="text-sm text-body font-medium mt-1">{data.headline || "Your Professional Headline"}</p>
                <div className="flex items-center gap-3 mt-2 text-xs text-muted">
                  {data.country && <span className="flex items-center"><MapPin className="w-3 h-3 mr-1" /> {data.country}</span>}
                  {data.experienceLevel && <span className="flex items-center"><Briefcase className="w-3 h-3 mr-1" /> {data.experienceLevel}</span>}
                  {data.availability && <span className="flex items-center"><Clock className="w-3 h-3 mr-1" /> {data.availability}</span>}
                </div>
              </div>
            </div>
            
            {data.bio && (
              <p className="mt-5 text-sm text-body leading-relaxed">{data.bio}</p>
            )}

            <div className="flex flex-wrap gap-2 mt-4">
              {data.portfolioWebsite && <a href={data.portfolioWebsite} target="_blank" rel="noreferrer" className="text-xs flex items-center bg-surface px-2 py-1 rounded-md border border-border text-heading hover:border-primary"><Globe className="w-3 h-3 mr-1" /> Website</a>}
              {data.linkedIn && <a href={data.linkedIn} target="_blank" rel="noreferrer" className="text-xs flex items-center bg-surface px-2 py-1 rounded-md border border-border text-heading hover:border-primary"><Briefcase className="w-3 h-3 mr-1" /> LinkedIn</a>}
              {data.github && <a href={data.github} target="_blank" rel="noreferrer" className="text-xs flex items-center bg-surface px-2 py-1 rounded-md border border-border text-heading hover:border-primary"><Code className="w-3 h-3 mr-1" /> GitHub</a>}
            </div>
          </div>

          <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6 relative">
            <button onClick={() => onEditStep(2)} className="absolute top-4 right-4 text-muted hover:text-primary z-10 opacity-0 group-hover:opacity-100">
              <PencilLine className="w-4 h-4" />
            </button>
            
            <div>
              <h4 className="text-xs font-bold text-heading uppercase tracking-wider mb-3">Skills Offered</h4>
              <div className="flex flex-wrap gap-2">
                {data.skillsOffered.length > 0 ? data.skillsOffered.map((skill) => (
                  <span key={skill} className="bg-primary/10 text-primary border border-primary/20 text-xs px-2.5 py-1 rounded-full font-medium">
                    {skill}
                  </span>
                )) : <span className="text-xs text-muted italic">None selected</span>}
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold text-heading uppercase tracking-wider mb-3">Skills Needed</h4>
              <div className="flex flex-wrap gap-2">
                {data.skillsLookingFor.length > 0 ? data.skillsLookingFor.map((skill) => (
                  <span key={skill} className="bg-surface text-body border border-border text-xs px-2.5 py-1 rounded-full font-medium">
                    {skill}
                  </span>
                )) : <span className="text-xs text-muted italic">None selected</span>}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
