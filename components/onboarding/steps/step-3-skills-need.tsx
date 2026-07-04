"use client";

import { OnboardingData } from "../onboarding-wizard";
import CreatableSelect from "react-select/creatable";

interface StepProps {
  data: OnboardingData;
  updateData: (fields: Partial<OnboardingData>) => void;
}

const COMMON_SKILLS = [
  // Engineering & Development
  { value: "React", label: "React" },
  { value: "Next.js", label: "Next.js" },
  { value: "Vue", label: "Vue" },
  { value: "Svelte", label: "Svelte" },
  { value: "Node.js", label: "Node.js" },
  { value: "TypeScript", label: "TypeScript" },
  { value: "Python", label: "Python" },
  { value: "Django", label: "Django" },
  { value: "Laravel", label: "Laravel" },
  { value: "Ruby on Rails", label: "Ruby on Rails" },
  { value: "Go", label: "Go" },
  { value: "Rust", label: "Rust" },
  { value: "Java", label: "Java" },
  { value: "C++", label: "C++" },
  { value: "Swift", label: "Swift" },
  { value: "Kotlin", label: "Kotlin" },
  { value: "Flutter", label: "Flutter" },
  { value: "React Native", label: "React Native" },
  { value: "AWS", label: "AWS" },
  { value: "Google Cloud", label: "Google Cloud" },
  { value: "Azure", label: "Azure" },
  { value: "Docker", label: "Docker" },
  { value: "Kubernetes", label: "Kubernetes" },
  { value: "Firebase", label: "Firebase" },
  { value: "Supabase", label: "Supabase" },
  { value: "PostgreSQL", label: "PostgreSQL" },
  { value: "MongoDB", label: "MongoDB" },
  { value: "WordPress", label: "WordPress" },
  { value: "Shopify", label: "Shopify" },
  { value: "Webflow", label: "Webflow" },
  
  // Design & Creative
  { value: "Figma", label: "Figma" },
  { value: "UI Design", label: "UI Design" },
  { value: "UX Design", label: "UX Design" },
  { value: "Product Design", label: "Product Design" },
  { value: "Graphic Design", label: "Graphic Design" },
  { value: "Brand Identity", label: "Brand Identity" },
  { value: "Logo Design", label: "Logo Design" },
  { value: "Illustration", label: "Illustration" },
  { value: "Adobe Illustrator", label: "Adobe Illustrator" },
  { value: "Adobe Photoshop", label: "Adobe Photoshop" },
  { value: "Motion Design", label: "Motion Design" },
  { value: "After Effects", label: "After Effects" },
  { value: "3D Modeling", label: "3D Modeling" },
  { value: "Blender", label: "Blender" },
  { value: "Video Editing", label: "Video Editing" },
  { value: "Premiere Pro", label: "Premiere Pro" },
  { value: "Photography", label: "Photography" },
  
  // Marketing, Content & Business
  { value: "SEO", label: "SEO" },
  { value: "Content Marketing", label: "Content Marketing" },
  { value: "Copywriting", label: "Copywriting" },
  { value: "Social Media Management", label: "Social Media Management" },
  { value: "Email Marketing", label: "Email Marketing" },
  { value: "Paid Advertising (PPC)", label: "Paid Advertising (PPC)" },
  { value: "Growth Hacking", label: "Growth Hacking" },
  { value: "Product Management", label: "Product Management" },
  { value: "Project Management", label: "Project Management" },
  { value: "Scrum / Agile", label: "Scrum / Agile" },
  { value: "Business Strategy", label: "Business Strategy" },
  { value: "Financial Modeling", label: "Financial Modeling" },
  { value: "Data Analysis", label: "Data Analysis" },
  { value: "Machine Learning", label: "Machine Learning" },
  { value: "Generative AI", label: "Generative AI" },
];

export default function Step3SkillsNeed({ data, updateData }: StepProps) {
  
  const handleSkillsChange = (newValue: any) => {
    updateData({ skillsLookingFor: newValue.map((v: any) => v.value) });
  };

  const selectedSkills = data.skillsLookingFor.map(skill => ({
    value: skill,
    label: skill
  }));

  const handleCollaborationToggle = (val: string) => {
    const current = data.preferredCollaboration;
    if (current.includes(val)) {
      updateData({ preferredCollaboration: current.filter(c => c !== val) });
    } else {
      updateData({ preferredCollaboration: [...current, val] });
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="text-center mb-8">
        <h3 className="text-lg font-bold text-heading">What would you like help with?</h3>
        <p className="text-body mt-2">Select the skills or services you are looking to exchange for.</p>
      </div>

      <div className="space-y-6">
        {/* Skills Tag Input */}
        <div>
          <label className="block text-sm font-medium text-heading mb-1">Skills Needed</label>
          <CreatableSelect
            isMulti
            options={COMMON_SKILLS}
            value={selectedSkills}
            onChange={handleSkillsChange}
            placeholder="e.g. Logo Design, SEO, Mobile App..."
            unstyled
            classNames={{
              control: (state) => `flex min-h-[38px] w-full bg-background border ${state.isFocused ? 'border-primary' : 'border-border'} rounded-[var(--radius-input)] px-2 py-0.5 focus:outline-none transition-colors cursor-text`,
              input: () => `text-body text-sm ml-1`,
              placeholder: () => `text-muted text-sm ml-1`,
              menu: () => `mt-1 bg-surface border border-border rounded-[var(--radius-input)] shadow-subtle overflow-hidden z-50`,
              menuList: () => `p-1 max-h-48 overflow-y-auto`,
              option: (state) => `px-3 py-1.5 cursor-pointer rounded-md transition-colors text-sm ${state.isSelected ? 'bg-primary/10 text-primary font-medium' : state.isFocused ? 'bg-background text-body' : 'bg-transparent text-body'}`,
              dropdownIndicator: () => `text-muted hover:text-heading cursor-pointer p-1`,
              clearIndicator: () => `text-muted hover:text-heading cursor-pointer p-1`,
              indicatorSeparator: () => `hidden`,
              multiValue: () => `bg-surface-secondary border border-border rounded-[var(--radius-badge)] flex items-center m-1`,
              multiValueLabel: () => `text-heading text-xs font-medium px-2 py-1`,
              multiValueRemove: () => `text-muted hover:text-error hover:bg-error/10 rounded-r-[var(--radius-badge)] px-1.5 cursor-pointer transition-colors flex items-center justify-center`,
            }}
          />
        </div>

        {/* Preferred Collaboration Checkboxes */}
        <div>
          <label className="block text-sm font-medium text-heading mb-3">Preferred Collaboration Style</label>
          <div className="space-y-3">
            {[
              { id: "one-time", label: "One-time exchanges (quick gigs)" },
              { id: "long-term", label: "Long-term collaborations (ongoing projects)" },
              { id: "both", label: "Open to both" },
            ].map((option) => (
              <label key={option.id} className="flex items-center group cursor-pointer">
                <input
                  type="checkbox"
                  checked={data.preferredCollaboration.includes(option.id)}
                  onChange={() => handleCollaborationToggle(option.id)}
                  className="w-4 h-4 rounded border-border text-primary focus:ring-primary bg-background"
                />
                <span className="ml-3 text-sm text-body group-hover:text-heading transition-colors">{option.label}</span>
              </label>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
