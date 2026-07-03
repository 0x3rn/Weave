"use client";

import { useState, useRef, FormEvent } from "react";
import { submitInviteApplication } from "@/app/actions/invite";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import Link from "next/link";
import { getNames } from "country-list";

// Pre-compute formatted timezones with UTC offsets outside the component to avoid re-calculating on render
const timeZonesWithOffsets = Intl.supportedValuesOf('timeZone').map(tz => {
  try {
    const parts = new Intl.DateTimeFormat('en', { timeZone: tz, timeZoneName: 'longOffset' }).formatToParts(new Date());
    const offsetString = parts.find(p => p.type === 'timeZoneName')?.value || 'GMT+00:00';
    // Replace GMT with UTC and handle the case where it just returns "GMT" (which means UTC+00:00)
    const utcOffset = offsetString === 'GMT' ? 'UTC+00:00' : offsetString.replace('GMT', 'UTC');
    return {
      id: tz,
      label: `(${utcOffset}) ${tz.replace(/_/g, ' ')}`
    };
  } catch (e) {
    return { id: tz, label: tz };
  }
}).sort((a, b) => a.label.localeCompare(b.label));

export default function InviteForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [skillsOffered, setSkillsOffered] = useState<string[]>([]);
  const [skillsLookingFor, setSkillsLookingFor] = useState<string[]>([]);
  const [currentOffered, setCurrentOffered] = useState("");
  const [currentLooking, setCurrentLooking] = useState("");
  const [profession, setProfession] = useState("");

  const handleAddSkill = (e: React.KeyboardEvent<HTMLInputElement>, type: "offered" | "looking") => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const val = type === "offered" ? currentOffered.trim() : currentLooking.trim();
      if (!val) return;

      if (type === "offered" && !skillsOffered.includes(val)) {
        setSkillsOffered([...skillsOffered, val]);
      } else if (type === "looking" && !skillsLookingFor.includes(val)) {
        setSkillsLookingFor([...skillsLookingFor, val]);
      }
      
      if (type === "offered") setCurrentOffered("");
      else setCurrentLooking("");
    }
  };

  const removeSkill = (skill: string, type: "offered" | "looking") => {
    if (type === "offered") {
      setSkillsOffered(skillsOffered.filter(s => s !== skill));
    } else {
      setSkillsLookingFor(skillsLookingFor.filter(s => s !== skill));
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    formData.append("skillsOffered", JSON.stringify(skillsOffered));
    formData.append("skillsLookingFor", JSON.stringify(skillsLookingFor));

    const result = await submitInviteApplication(formData);

    if (result.error) {
      setError(result.error);
      setIsSubmitting(false);
    } else {
      router.push("/request-invite/success");
    }
  };

  return (
    <form id="invite-form" onSubmit={handleSubmit} className="bg-surface border border-border p-8 rounded-[var(--radius-card)] space-y-8 shadow-subtle">
      {error && (
        <div className="bg-error/10 border border-error/20 text-error px-4 py-3 rounded-[var(--radius-input)] text-sm font-medium">
          {error}
        </div>
      )}

      {/* Personal Information */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-muted uppercase tracking-wider border-b border-border pb-2">Personal Information</h3>
        
        <div className="space-y-2">
          <label className="text-sm font-bold text-heading">Full Name <span className="text-error">*</span></label>
          <input required type="text" name="fullName" className="w-full bg-background border border-border rounded-[var(--radius-input)] px-4 py-3 focus:outline-none focus:border-primary text-body" />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-bold text-heading">Email Address <span className="text-error">*</span></label>
          <input required type="email" name="email" className="w-full bg-background border border-border rounded-[var(--radius-input)] px-4 py-3 focus:outline-none focus:border-primary text-body" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-bold text-heading">Country <span className="text-error">*</span></label>
            <input required type="text" list="countries" name="country" placeholder="e.g. United States" className="w-full bg-background border border-border rounded-[var(--radius-input)] px-4 py-3 focus:outline-none focus:border-primary text-body" />
            <datalist id="countries">
              {getNames().map(country => (
                <option key={country} value={country} />
              ))}
            </datalist>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-heading">Time Zone <span className="text-error">*</span></label>
            <input required type="text" list="timezones" name="timeZone" placeholder="e.g. (UTC-05:00) America/New York" className="w-full bg-background border border-border rounded-[var(--radius-input)] px-4 py-3 focus:outline-none focus:border-primary text-body" />
            <datalist id="timezones">
              {timeZonesWithOffsets.map(tz => (
                <option key={tz.id} value={tz.label} />
              ))}
            </datalist>
          </div>
        </div>
      </div>

      {/* Professional Information */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-muted uppercase tracking-wider border-b border-border pb-2">Professional Information</h3>
        
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-bold text-heading">Primary Profession <span className="text-error">*</span></label>
            <select required name="profession" value={profession} onChange={(e) => setProfession(e.target.value)} className="w-full bg-background border border-border rounded-[var(--radius-input)] px-4 py-3 focus:outline-none focus:border-primary text-body appearance-none">
              <option value="" disabled>Select a profession...</option>
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
            {profession === "Other" && (
              <input required type="text" name="otherProfession" placeholder="Please specify your profession..." className="w-full mt-2 bg-background border border-border rounded-[var(--radius-input)] px-4 py-3 focus:outline-none focus:border-primary text-body" />
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-heading">Years of Experience <span className="text-error">*</span></label>
            <select required name="experience" defaultValue="" className="w-full bg-background border border-border rounded-[var(--radius-input)] px-4 py-3 focus:outline-none focus:border-primary text-body appearance-none">
              <option value="" disabled>Select experience...</option>
              <option value="Student">Student</option>
              <option value="< 1 year">&lt; 1 year</option>
              <option value="1-2 years">1–2 years</option>
              <option value="3-5 years">3–5 years</option>
              <option value="5-10 years">5–10 years</option>
              <option value="10+ years">10+ years</option>
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-bold text-heading">Portfolio / Website <span className="text-muted font-normal">(Optional)</span></label>
          <input type="url" name="portfolio" placeholder="https://" className="w-full bg-background border border-border rounded-[var(--radius-input)] px-4 py-3 focus:outline-none focus:border-primary text-sm text-body" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-bold text-heading">LinkedIn <span className="text-muted font-normal">(Optional)</span></label>
          <input type="url" name="linkedIn" placeholder="https://linkedin.com/in/..." className="w-full bg-background border border-border rounded-[var(--radius-input)] px-4 py-3 focus:outline-none focus:border-primary text-sm text-body" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-bold text-heading">GitHub <span className="text-muted font-normal">(Optional)</span></label>
          <input type="url" name="github" placeholder="https://github.com/..." className="w-full bg-background border border-border rounded-[var(--radius-input)] px-4 py-3 focus:outline-none focus:border-primary text-sm text-body" />
        </div>
      </div>

      {/* Skills */}
      <div className="space-y-6">
        <h3 className="text-sm font-bold text-muted uppercase tracking-wider border-b border-border pb-2">Skills & Exchange</h3>
        
        <div className="space-y-2">
          <label className="text-sm font-bold text-heading">Skills You Offer</label>
          <p className="text-xs text-muted mb-2">Type a skill and press Enter (e.g., React, Next.js, Figma, SEO)</p>
          <div className="w-full min-h-[50px] bg-background border border-border rounded-[var(--radius-input)] p-2 flex flex-wrap gap-2 focus-within:border-primary transition-colors">
            {skillsOffered.map(skill => (
              <div key={skill} className="flex items-center gap-1 bg-surface-secondary text-heading text-xs font-medium px-2 py-1 rounded-[var(--radius-badge)] border border-border">
                {skill}
                <button type="button" onClick={() => removeSkill(skill, "offered")} className="text-muted hover:text-error transition-colors">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
            <input 
              type="text" 
              value={currentOffered}
              onChange={(e) => setCurrentOffered(e.target.value)}
              onKeyDown={(e) => handleAddSkill(e, "offered")}
              className="flex-1 bg-transparent border-none outline-none text-sm min-w-[120px] text-body" 
              placeholder={skillsOffered.length === 0 ? "Add a skill..." : ""}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-bold text-heading">Skills You're Looking For</label>
          <p className="text-xs text-muted mb-2">What skills do you need help with in exchange?</p>
          <div className="w-full min-h-[50px] bg-background border border-border rounded-[var(--radius-input)] p-2 flex flex-wrap gap-2 focus-within:border-primary transition-colors">
            {skillsLookingFor.map(skill => (
              <div key={skill} className="flex items-center gap-1 bg-surface-secondary text-heading text-xs font-medium px-2 py-1 rounded-[var(--radius-badge)] border border-border">
                {skill}
                <button type="button" onClick={() => removeSkill(skill, "looking")} className="text-muted hover:text-error transition-colors">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
            <input 
              type="text" 
              value={currentLooking}
              onChange={(e) => setCurrentLooking(e.target.value)}
              onKeyDown={(e) => handleAddSkill(e, "looking")}
              className="flex-1 bg-transparent border-none outline-none text-sm min-w-[120px] text-body" 
              placeholder={skillsLookingFor.length === 0 ? "Add a skill..." : ""}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-bold text-heading">Why do you want to join Weave? <span className="text-error">*</span></label>
          <p className="text-xs text-muted mb-1">Tell us how you plan to use Weave and why exchanging Skill Hours would be valuable to you.</p>
          <textarea required name="whyJoin" rows={4} className="w-full bg-background border border-border rounded-[var(--radius-input)] px-4 py-3 focus:outline-none focus:border-primary text-body resize-none"></textarea>
        </div>
      </div>

      <div className="space-y-4 pt-4 border-t border-border">
        <div className="space-y-2">
          <label className="text-sm font-bold text-heading">How did you hear about us?</label>
          <select name="heardAboutUs" defaultValue="" className="w-full bg-background border border-border rounded-[var(--radius-input)] px-4 py-3 focus:outline-none focus:border-primary text-body appearance-none">
            <option value="" disabled>Select an option...</option>
            <option value="LinkedIn">LinkedIn</option>
            <option value="X">X (Twitter)</option>
            <option value="Friend">Friend</option>
            <option value="Google">Google</option>
            <option value="Reddit">Reddit</option>
            <option value="Product Hunt">Product Hunt</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div className="flex items-start gap-3 pt-4">
          <input required type="checkbox" name="agreedToTerms" value="true" className="mt-1 flex-shrink-0" />
          <p className="text-sm text-body">
            I agree to the <Link href="/legal/terms" className="text-primary hover:underline">Terms of Service</Link> and <Link href="/legal/privacy" className="text-primary hover:underline">Privacy Policy</Link>.
          </p>
        </div>
      </div>

      <div className="pt-4">
        <button 
          type="submit" 
          disabled={isSubmitting}
          className="w-full px-8 py-3 text-base font-bold text-surface bg-primary rounded-[var(--radius-button)] hover:bg-primary-hover transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "Submitting..." : "Request Invite"}
        </button>
      </div>
    </form>
  );
}
