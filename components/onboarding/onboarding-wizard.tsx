"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { updateUserProfile } from "@/app/actions/user";

import Step1About from "./steps/step-1-about";
import Step2SkillsOffer from "./steps/step-2-skills-offer";
import Step3SkillsNeed from "./steps/step-3-skills-need";
import Step4Portfolio from "./steps/step-4-portfolio";
import Step5Preferences from "./steps/step-5-preferences";
import Step6Review from "./steps/step-6-review";
import Step7Success from "./steps/step-7-success";
import { Hand } from "lucide-react";

export type OnboardingData = {
  photoUrl: string;
  fullName: string;
  headline: string;
  bio: string;
  country: string;
  timeZone: string;
  skillsOffered: string[];
  experienceLevel: string;
  yearsOfExperience: string;
  availability: string;
  skillsLookingFor: string[];
  preferredCollaboration: string[];
  portfolioWebsite: string;
  github: string;
  linkedIn: string;
  behance: string;
  dribbble: string;
  youtube: string;
  twitter: string;
  otherLink: string;
  portfolioFiles: string[];
  visibility: string;
  notifications: string[];
  communication: string;
};

interface WizardProps {
  initialData: any;
  userId: string;
}

export default function OnboardingWizard({ initialData, userId }: WizardProps) {
  const router = useRouter();
  const [step, setStep] = useState(0); // 0 is Welcome Screen, 1-6 are steps, 7 is Success
  const [isSaving, setIsSaving] = useState(false);

  // Parse preferred collaboration out of the single string from invite (if applicable)
  // Just initialize with sensible defaults
  const [data, setData] = useState<OnboardingData>({
    photoUrl: initialData.photoUrl || "",
    fullName: initialData.fullName || "",
    headline: initialData.profession || "",
    bio: initialData.bio || "",
    country: initialData.country || "",
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || "",
    skillsOffered: initialData.skillsOffered || [],
    experienceLevel: initialData.experience || "",
    yearsOfExperience: "",
    availability: "",
    skillsLookingFor: initialData.skillsLookingFor || [],
    preferredCollaboration: [],
    portfolioWebsite: initialData.portfolio || "",
    github: initialData.github || "",
    linkedIn: initialData.linkedIn || "",
    behance: "",
    dribbble: "",
    youtube: "",
    twitter: "",
    otherLink: "",
    portfolioFiles: [],
    visibility: "everyone",
    notifications: ["messages", "requests"],
    communication: "platform",
  });

  const updateData = (fields: Partial<OnboardingData>) => {
    setData(prev => ({ ...prev, ...fields }));
  };

  const handleNext = async () => {
    if (step >= 1 && step <= 6) {
      setIsSaving(true);
      // Auto-save on next
      const result = await updateUserProfile(data);
      if (result.error) {
        toast.error("Failed to save progress");
        setIsSaving(false);
        return;
      }
      setIsSaving(false);
    }
    setStep(prev => prev + 1);
  };

  const handleBack = () => {
    setStep(prev => Math.max(0, prev - 1));
  };

  const handleComplete = async () => {
    setIsSaving(true);
    const result = await updateUserProfile({ ...data, onboarded: true });
    setIsSaving(false);

    if (result.error) {
      toast.error("Failed to complete setup");
    } else {
      setStep(7); // Success Screen
    }
  };

  const calculateProgress = () => {
    if (step === 0 || step === 7) return 0;
    return Math.round(((step - 1) / 6) * 100);
  };

  // Welcome Screen
  if (step === 0) {
    return (
      <div className="text-center max-w-3xl mx-auto mt-6 sm:mt-10 animate-in fade-in slide-in-from-bottom-8 duration-1000">
        <div className="w-16 h-16 bg-surface-secondary rounded-2xl flex items-center justify-center mx-auto mb-8 border border-border shadow-sm">
          <Hand className="w-8 h-8 text-primary rotate-[15deg]" />
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-heading mb-6 tracking-tight">Welcome to Weave</h1>
        <p className="text-muted text-xl mb-12 max-w-2xl mx-auto leading-relaxed">
          Let's spend a few minutes setting up your profile so you can start exchanging Skill Hours with other professionals.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-left max-w-2xl mx-auto mb-16 px-4">
          <div className="flex items-center gap-4">
            <span className="text-success text-xl">✓</span> 
            <p className="text-sm font-medium text-heading">Build trust with a complete profile</p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-success text-xl">✓</span> 
            <p className="text-sm font-medium text-heading">Get better exchange recommendations</p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-success text-xl">✓</span> 
            <p className="text-sm font-medium text-heading">Start earning Skill Hours faster</p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-success text-xl">✓</span> 
            <p className="text-sm font-medium text-heading">Join a trusted professional network</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button 
            onClick={() => setStep(1)}
            className="w-full sm:w-auto bg-heading text-background px-10 py-4 rounded-full font-bold shadow-lg hover:scale-105 transition-all"
          >
            Let's Get Started
          </button>
          <button 
            onClick={() => router.push("/dashboard")}
            className="w-full sm:w-auto bg-transparent border border-border text-body px-8 py-3 rounded-[var(--radius-button)] font-bold hover:bg-background transition-colors"
          >
            Finish Later
          </button>
        </div>
      </div>
    );
  }

  // Success Screen
  if (step === 7) {
    return <Step7Success />;
  }

  return (
    <div className="max-w-3xl mx-auto animate-in fade-in duration-700">
      
      {/* Header & Progress */}
      <div className="mb-12">
        <div className="flex justify-between items-end mb-4">
          <div>
            <p className="text-xs font-bold text-primary uppercase tracking-wider mb-1">Step {step} of 6</p>
            <h2 className="text-xl font-bold text-heading">
              {step === 1 && "About You"}
              {step === 2 && "Skills You Offer"}
              {step === 3 && "Skills You Need"}
              {step === 4 && "Portfolio & Socials"}
              {step === 5 && "Preferences"}
              {step === 6 && "Review"}
            </h2>
          </div>
          <div className="text-sm font-medium text-muted">
            {calculateProgress()}% Complete
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full bg-surface h-1.5 rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary transition-all duration-700 ease-out"
            style={{ width: `${calculateProgress()}%` }}
          />
        </div>
      </div>

      {/* Step Content */}
      <div className="min-h-[400px]">
        {step === 1 && <Step1About data={data} updateData={updateData} />}
        {step === 2 && <Step2SkillsOffer data={data} updateData={updateData} />}
        {step === 3 && <Step3SkillsNeed data={data} updateData={updateData} />}
        {step === 4 && <Step4Portfolio data={data} updateData={updateData} />}
        {step === 5 && <Step5Preferences data={data} updateData={updateData} />}
        {step === 6 && <Step6Review data={data} onEditStep={setStep} />}
      </div>

      {/* Navigation Footer */}
      <div className="mt-16 pt-6 flex items-center justify-between border-t border-border/50">
        <button 
          onClick={handleBack}
          className="text-body font-medium hover:text-heading transition-colors"
        >
          Back
        </button>
        
        {step < 6 ? (
          <button 
            onClick={handleNext}
            disabled={isSaving}
            className="bg-primary text-surface px-6 py-2 rounded-[var(--radius-button)] font-bold shadow-sm hover:bg-primary-hover transition-colors disabled:opacity-50"
          >
            {isSaving ? "Saving..." : "Continue"}
          </button>
        ) : (
          <button 
            onClick={handleComplete}
            disabled={isSaving}
            className="bg-primary text-surface px-8 py-2 rounded-[var(--radius-button)] font-bold shadow-sm hover:bg-primary-hover transition-colors disabled:opacity-50"
          >
            {isSaving ? "Completing..." : "Complete Setup"}
          </button>
        )}
      </div>

    </div>
  );
}
