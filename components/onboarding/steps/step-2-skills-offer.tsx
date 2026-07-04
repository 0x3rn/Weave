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

export default function Step2SkillsOffer({ data, updateData }: StepProps) {
  
  const handleSkillsChange = (newValue: any) => {
    updateData({ skillsOffered: newValue.map((v: any) => v.value) });
  };

  const selectedSkills = data.skillsOffered.map(skill => ({
    value: skill,
    label: skill
  }));

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="text-center mb-8">
        <h3 className="text-lg font-bold text-heading">What can you help others with?</h3>
        <p className="text-body mt-2">Choose your strongest skills. You can add custom ones by typing and pressing enter.</p>
      </div>

      <div className="space-y-6">
        {/* Skills Tag Input */}
        <div>
          <label className="block text-sm font-medium text-heading mb-1">Skills Offered</label>
          <CreatableSelect
            isMulti
            options={COMMON_SKILLS}
            value={selectedSkills}
            onChange={handleSkillsChange}
            placeholder="e.g. Next.js, Figma, Copywriting..."
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

        {/* Experience Level */}
        <div>
          <label className="block text-sm font-medium text-heading mb-1">Experience Level</label>
          <select
            value={data.experienceLevel}
            onChange={(e) => updateData({ experienceLevel: e.target.value })}
            className="w-full bg-background border border-border rounded-[var(--radius-input)] px-3 py-2 text-sm focus:outline-none focus:border-primary text-body appearance-none"
          >
            <option value="" disabled>Select your level</option>
            <option value="Beginner">Beginner (1-2 yrs)</option>
            <option value="Intermediate">Intermediate (3-5 yrs)</option>
            <option value="Advanced">Advanced (5-8 yrs)</option>
            <option value="Expert">Expert (8+ yrs)</option>
          </select>
        </div>

        {/* Years of Experience */}
        <div>
          <label className="block text-sm font-medium text-heading mb-1">Exact Years of Experience (Optional)</label>
          <input
            type="number"
            min="0"
            max="50"
            value={data.yearsOfExperience}
            onChange={(e) => updateData({ yearsOfExperience: e.target.value })}
            className="w-full bg-background border border-border rounded-[var(--radius-input)] px-3 py-2 text-sm focus:outline-none focus:border-primary text-body"
            placeholder="e.g. 4"
          />
        </div>

        {/* Availability */}
        <div>
          <label className="block text-sm font-medium text-heading mb-1">Availability</label>
          <select
            value={data.availability}
            onChange={(e) => updateData({ availability: e.target.value })}
            className="w-full bg-background border border-border rounded-[var(--radius-input)] px-3 py-2 text-sm focus:outline-none focus:border-primary text-body appearance-none"
          >
            <option value="" disabled>How much time can you dedicate?</option>
            <option value="Less than 5 hrs/week">Less than 5 hrs/week</option>
            <option value="5–10 hrs/week">5–10 hrs/week</option>
            <option value="10–20 hrs/week">10–20 hrs/week</option>
            <option value="20+ hrs/week">20+ hrs/week</option>
          </select>
        </div>

      </div>
    </div>
  );
}
