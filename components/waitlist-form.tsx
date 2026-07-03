"use client";

import { useState, FormEvent } from "react";
import { submitWaitlist } from "@/app/actions/waitlist";
import { useRouter } from "next/navigation";

export default function WaitlistForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [skill, setSkill] = useState("");

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const result = await submitWaitlist(formData);

    if (result.error) {
      setError(result.error);
      setIsSubmitting(false);
    } else {
      router.push("/waitlist/success");
    }
  };

  return (
    <form id="waitlist-form" onSubmit={handleSubmit} className="bg-surface border border-border p-8 rounded-[var(--radius-card)] space-y-6 shadow-subtle">
      {error && (
        <div className="bg-error/10 border border-error/20 text-error px-4 py-3 rounded-[var(--radius-input)] text-sm font-medium">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-bold text-heading">First Name <span className="text-error">*</span></label>
          <input required type="text" name="firstName" className="w-full bg-background border border-border rounded-[var(--radius-input)] px-4 py-3 focus:outline-none focus:border-primary text-body" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-bold text-heading">Last Name <span className="text-error">*</span></label>
          <input required type="text" name="lastName" className="w-full bg-background border border-border rounded-[var(--radius-input)] px-4 py-3 focus:outline-none focus:border-primary text-body" />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-bold text-heading">Email Address <span className="text-error">*</span></label>
        <input required type="email" name="email" className="w-full bg-background border border-border rounded-[var(--radius-input)] px-4 py-3 focus:outline-none focus:border-primary text-body" />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-bold text-heading">Primary Skill <span className="text-error">*</span></label>
        <select required name="skill" value={skill} onChange={(e) => setSkill(e.target.value)} className="w-full bg-background border border-border rounded-[var(--radius-input)] px-4 py-3 focus:outline-none focus:border-primary text-body appearance-none">
          <option value="" disabled>Select a skill...</option>
          <option value="Frontend Developer">Frontend Developer</option>
          <option value="Backend Developer">Backend Developer</option>
          <option value="Fullstack Developer">Fullstack Developer</option>
          <option value="Mobile Developer">Mobile Developer</option>
          <option value="Game Developer">Game Developer</option>
          <option value="DevOps Engineer">DevOps Engineer</option>
          <option value="Data Scientist">Data Scientist</option>
          <option value="Data Analyst">Data Analyst</option>
          <option value="AI / Machine Learning">AI / Machine Learning</option>
          <option value="Cyber Security">Cyber Security</option>
          <option value="UI Designer">UI Designer</option>
          <option value="UX Designer">UX Designer</option>
          <option value="Product Designer">Product Designer</option>
          <option value="Graphic Designer">Graphic Designer</option>
          <option value="Motion Designer">Motion Designer</option>
          <option value="3D Artist">3D Artist</option>
          <option value="Illustrator">Illustrator</option>
          <option value="Video Editor">Video Editor</option>
          <option value="Audio Engineer">Audio Engineer</option>
          <option value="Copywriter">Copywriter</option>
          <option value="Technical Writer">Technical Writer</option>
          <option value="Content Creator">Content Creator</option>
          <option value="Digital Marketer">Digital Marketer</option>
          <option value="SEO Specialist">SEO Specialist</option>
          <option value="Social Media Manager">Social Media Manager</option>
          <option value="Product Manager">Product Manager</option>
          <option value="Project Manager">Project Manager</option>
          <option value="No-Code Developer">No-Code Developer</option>
          <option value="Founder / Entrepreneur">Founder / Entrepreneur</option>
          <option value="Other">Other</option>
        </select>
        {skill === "Other" && (
          <input required type="text" name="otherSkill" placeholder="Please specify your skill..." className="w-full mt-2 bg-background border border-border rounded-[var(--radius-input)] px-4 py-3 focus:outline-none focus:border-primary text-body" />
        )}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-bold text-heading">Years of Experience <span className="text-error">*</span></label>
        <select required name="experience" defaultValue="" className="w-full bg-background border border-border rounded-[var(--radius-input)] px-4 py-3 focus:outline-none focus:border-primary text-body appearance-none">
          <option value="" disabled>Select experience...</option>
          <option value="Less than 1 year">Less than 1 year</option>
          <option value="1-3 years">1–3 years</option>
          <option value="3-5 years">3–5 years</option>
          <option value="5-10 years">5–10 years</option>
          <option value="10+ years">10+ years</option>
        </select>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-bold text-heading">Portfolio Website <span className="text-muted font-normal">(Optional)</span></label>
        <input type="url" name="portfolio" placeholder="https://" className="w-full bg-background border border-border rounded-[var(--radius-input)] px-4 py-3 focus:outline-none focus:border-primary text-sm text-body" />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-bold text-heading">How did you hear about Weave? <span className="text-error">*</span></label>
        <select required name="heardAboutUs" defaultValue="" className="w-full bg-background border border-border rounded-[var(--radius-input)] px-4 py-3 focus:outline-none focus:border-primary text-body appearance-none">
          <option value="" disabled>Select an option...</option>
          <option value="Twitter / X">Twitter / X</option>
          <option value="LinkedIn">LinkedIn</option>
          <option value="Friend or Colleague">Friend or Colleague</option>
          <option value="Blog Post">Blog Post</option>
          <option value="Search Engine">Search Engine</option>
          <option value="Other">Other</option>
        </select>
      </div>

      <div className="pt-4">
        <button 
          type="submit" 
          disabled={isSubmitting}
          className="w-full px-8 py-3 text-base font-bold text-surface bg-primary rounded-[var(--radius-button)] hover:bg-primary-hover transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "Submitting..." : "Join Waitlist"}
        </button>
        <p className="text-xs text-muted mt-4 text-center">
          We'll only contact you regarding Weave updates and your waitlist status.
        </p>
      </div>
    </form>
  );
}
