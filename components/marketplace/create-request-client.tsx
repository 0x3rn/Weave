"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createMarketplaceRequest } from "@/app/actions/marketplace";
import { ArrowLeft, Loader2, Info, Plus, X } from "lucide-react";
import Link from "next/link";

const CATEGORIES = [
  "Development", "Design", "Marketing", "Writing", 
  "Business", "Audio/Video", "Photography", "Other"
];

const EXPERIENCES = ["Beginner", "Intermediate", "Expert", "Any"];

export default function CreateRequestClient() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [deliverables, setDeliverables] = useState<string[]>([""]);
  
  // Mutual Exchange State
  const [isMutual, setIsMutual] = useState(true); // Defaulting to true as standard is hidden
  const [offeredDeliverables, setOfferedDeliverables] = useState<string[]>([""]);
  const [offeredHours, setOfferedHours] = useState("");
  const [offeredSkills, setOfferedSkills] = useState("");

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "Development",
    skillsRequired: "",
    estimatedHours: "",
    exchangeType: "One-time",
    timeline: "Flexible",
    preferredExperience: "Any"
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleDeliverableChange = (index: number, value: string) => {
    const newDelivs = [...deliverables];
    newDelivs[index] = value;
    setDeliverables(newDelivs);
  };

  const addDeliverable = () => setDeliverables([...deliverables, ""]);
  
  const removeDeliverable = (index: number) => {
    if (deliverables.length === 1) return;
    setDeliverables(deliverables.filter((_, i) => i !== index));
  };

  const handleOfferedDeliverableChange = (index: number, value: string) => {
    const newDelivs = [...offeredDeliverables];
    newDelivs[index] = value;
    setOfferedDeliverables(newDelivs);
  };

  const addOfferedDeliverable = () => setOfferedDeliverables([...offeredDeliverables, ""]);
  
  const removeOfferedDeliverable = (index: number) => {
    if (offeredDeliverables.length === 1) return;
    setOfferedDeliverables(offeredDeliverables.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.title || !formData.description || !formData.estimatedHours) {
      setError("Please fill out all required fields.");
      return;
    }

    setIsSubmitting(true);

    try {
      // Process skills into array
      const skillsArr = formData.skillsRequired
        .split(",")
        .map(s => s.trim())
        .filter(s => s.length > 0);

      // Filter out empty deliverables
      const cleanDeliverables = deliverables
        .map(d => d.trim())
        .filter(d => d.length > 0);

      const requestData: any = {
        ...formData,
        skillsRequired: skillsArr,
        deliverables: cleanDeliverables,
        isMutual
      };

      if (isMutual) {
        requestData.offeredSkills = offeredSkills.split(",").map(s => s.trim()).filter(s => s.length > 0);
        requestData.offeredDeliverables = offeredDeliverables.map(d => d.trim()).filter(d => d.length > 0);
        requestData.offeredHours = offeredHours;
      }

      const result = await createMarketplaceRequest(requestData);

      if (!result.success) {
        throw new Error(result.error);
      }

      // Redirect to the newly created request
      router.push(`/marketplace/${result.id}`);
      router.refresh();

    } catch (err: any) {
      setError(err.message || "An error occurred while posting your request.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-8">
      <Link href="/marketplace" className="inline-flex items-center text-sm font-bold text-muted hover:text-heading mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Marketplace
      </Link>

      <div className="mb-8">
        <h1 className="text-3xl font-black text-heading mb-2">Post a Request</h1>
        <p className="text-body text-lg">Describe what you need help with and find the perfect collaborator.</p>
      </div>

      {error && (
        <div className="mb-6 bg-error/10 text-error p-4 rounded-[var(--radius-button)] text-sm font-bold border border-error/20">
          {error}
        </div>
      )}

      <div className="bg-surface border border-border rounded-[var(--radius-card)] shadow-elevated p-6 md:p-8 relative overflow-hidden">
        
        <form onSubmit={handleSubmit} className="space-y-8">
          
          <div className="bg-surface-secondary/50 p-6 rounded-xl border border-border mb-8">
            <h2 className="text-lg font-bold text-heading mb-4">Exchange Type</h2>
            <div className="flex flex-col sm:flex-row gap-4">
              <label className={`flex-1 border p-4 rounded-xl cursor-pointer transition-all ${!isMutual ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-border bg-surface hover:border-primary/50'}`}>
                <div className="flex items-center gap-3 mb-2">
                  <input type="radio" checked={!isMutual} onChange={() => setIsMutual(false)} className="w-4 h-4 text-primary" />
                  <span className="font-bold text-heading">Standard Exchange</span>
                </div>
                <p className="text-sm text-muted ml-7">I will pay Skill Hours to the person who completes my project.</p>
              </label>
              
              <label className={`flex-1 border p-4 rounded-xl cursor-pointer transition-all ${isMutual ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-border bg-surface hover:border-primary/50'}`}>
                <div className="flex items-center gap-3 mb-2">
                  <input type="radio" checked={isMutual} onChange={() => setIsMutual(true)} className="w-4 h-4 text-primary" />
                  <span className="font-bold text-heading">Mutual Exchange</span>
                </div>
                <p className="text-sm text-muted ml-7">I will offer my own skills/work in return instead of just spending Skill Hours.</p>
              </label>
            </div>
          </div>

          <div className="space-y-6">
            <h2 className="text-xl font-black text-heading border-b border-border pb-2">What I Need</h2>
            
            {/* Title */}
            <div>
            <label className="block text-sm font-bold text-heading mb-2">Project Title *</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g. Need a landing page design for my startup"
              className="w-full bg-surface-secondary border border-border rounded-[var(--radius-button)] p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-body"
              required
              disabled={isSubmitting}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-bold text-heading mb-2">Detailed Description *</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe your project, your goals, and what the collaborator will be doing..."
              className="w-full bg-surface-secondary border border-border rounded-[var(--radius-button)] p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-body min-h-[150px] resize-none"
              required
              disabled={isSubmitting}
            />
          </div>

          {/* Deliverables */}
          <div>
            <label className="block text-sm font-bold text-heading mb-2">Deliverables</label>
            <p className="text-xs text-muted mb-3">List exactly what you expect to receive at the end of this project.</p>
            <div className="space-y-3 mb-3">
              {deliverables.map((deliv, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={deliv}
                    onChange={(e) => handleDeliverableChange(idx, e.target.value)}
                    placeholder="e.g. 5 Screens mapped out in Figma"
                    className="flex-1 bg-surface-secondary border border-border rounded-[var(--radius-button)] p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-body"
                    disabled={isSubmitting}
                  />
                  <button
                    type="button"
                    onClick={() => removeDeliverable(idx)}
                    disabled={deliverables.length === 1 || isSubmitting}
                    className="p-3 text-muted hover:text-error hover:bg-error/10 rounded-[var(--radius-button)] transition-colors disabled:opacity-50"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addDeliverable}
              disabled={isSubmitting}
              className="text-sm font-bold text-primary hover:text-primary-hover flex items-center gap-1 transition-colors"
            >
              <Plus className="w-4 h-4" /> Add Deliverable
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Category */}
            <div>
              <label className="block text-sm font-bold text-heading mb-2">Category</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full bg-surface-secondary border border-border rounded-[var(--radius-button)] p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-body"
                disabled={isSubmitting}
              >
                {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>

            {/* Estimated Hours */}
            <div>
              <label className="block text-sm font-bold text-heading mb-2">Estimated Hours *</label>
              <input
                type="text"
                name="estimatedHours"
                value={formData.estimatedHours}
                onChange={handleChange}
                placeholder="e.g. 5, 10-15, 20+"
                className="w-full bg-surface-secondary border border-border rounded-[var(--radius-button)] p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-body"
                required
                disabled={isSubmitting}
              />
              <p className="text-xs text-muted mt-1 flex items-center gap-1">
                <Info className="w-3 h-3" /> Make sure you have this much balance.
              </p>
            </div>

            {/* Skills */}
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-heading mb-2">Skills Required (Comma separated)</label>
              <input
                type="text"
                name="skillsRequired"
                value={formData.skillsRequired}
                onChange={handleChange}
                placeholder="e.g. React, UI/UX, Firebase"
                className="w-full bg-surface-secondary border border-border rounded-[var(--radius-button)] p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-body"
                disabled={isSubmitting}
              />
            </div>

            {/* Exchange Type */}
            <div>
              <label className="block text-sm font-bold text-heading mb-2">Exchange Type</label>
              <select
                name="exchangeType"
                value={formData.exchangeType}
                onChange={handleChange}
                className="w-full bg-surface-secondary border border-border rounded-[var(--radius-button)] p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-body"
                disabled={isSubmitting}
              >
                <option value="One-time">One-time Project</option>
                <option value="Ongoing">Ongoing Part-time</option>
                <option value="Consultation">Consultation</option>
              </select>
            </div>

            {/* Timeline */}
            <div>
              <label className="block text-sm font-bold text-heading mb-2">Timeline</label>
              <select
                name="timeline"
                value={formData.timeline}
                onChange={handleChange}
                className="w-full bg-surface-secondary border border-border rounded-[var(--radius-button)] p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-body"
                disabled={isSubmitting}
              >
                <option value="Flexible">Flexible</option>
                <option value="Less than 1 week">Less than 1 week</option>
                <option value="1 to 2 weeks">1 to 2 weeks</option>
                <option value="Less than 1 month">Less than 1 month</option>
              </select>
            </div>

            {/* Experience */}
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-heading mb-2">Preferred Experience Level</label>
              <select
                name="preferredExperience"
                value={formData.preferredExperience}
                onChange={handleChange}
                className="w-full bg-surface-secondary border border-border rounded-[var(--radius-button)] p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-body"
                disabled={isSubmitting}
              >
                {EXPERIENCES.map(exp => <option key={exp} value={exp}>{exp}</option>)}
              </select>
            </div>
          </div>

          {isMutual && (
            <div className="space-y-6 pt-8 mt-8 border-t-2 border-dashed border-border">
              <div className="bg-primary/5 border border-primary/20 rounded-xl p-6">
                <h2 className="text-xl font-black text-heading mb-2 flex items-center gap-2">
                  <span className="bg-primary text-primary-foreground w-6 h-6 rounded-full flex items-center justify-center text-sm">2</span> 
                  What I Can Offer
                </h2>
                <p className="text-sm text-muted mb-6">Since this is a mutual exchange, describe what you are bringing to the table for the other person.</p>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-bold text-heading mb-2">The Skills I Can Provide (Comma separated)</label>
                    <input
                      type="text"
                      value={offeredSkills}
                      onChange={(e) => setOfferedSkills(e.target.value)}
                      placeholder="e.g. React Development, Copywriting"
                      className="w-full bg-surface border border-border rounded-[var(--radius-button)] p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-body"
                      required={isMutual}
                      disabled={isSubmitting}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-heading mb-2">My Estimated Effort (Hours) *</label>
                    <input
                      type="text"
                      value={offeredHours}
                      onChange={(e) => setOfferedHours(e.target.value)}
                      placeholder="e.g. 5, 10-15"
                      className="w-full bg-surface border border-border rounded-[var(--radius-button)] p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-body"
                      required={isMutual}
                      disabled={isSubmitting}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-heading mb-2">What I Will Deliver</label>
                    <div className="space-y-3 mb-3">
                      {offeredDeliverables.map((deliv, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <input
                            type="text"
                            value={deliv}
                            onChange={(e) => handleOfferedDeliverableChange(idx, e.target.value)}
                            placeholder="e.g. 3 fully developed React components"
                            className="flex-1 bg-surface border border-border rounded-[var(--radius-button)] p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-body"
                            disabled={isSubmitting}
                            required={isMutual && idx === 0}
                          />
                          <button
                            type="button"
                            onClick={() => removeOfferedDeliverable(idx)}
                            disabled={offeredDeliverables.length === 1 || isSubmitting}
                            className="p-3 text-muted hover:text-error hover:bg-error/10 rounded-[var(--radius-button)] transition-colors disabled:opacity-50"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={addOfferedDeliverable}
                      disabled={isSubmitting}
                      className="text-sm font-bold text-primary hover:text-primary-hover flex items-center gap-1 transition-colors"
                    >
                      <Plus className="w-4 h-4" /> Add Deliverable
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
          </div>

          <div className="pt-6 border-t border-border flex justify-end gap-3">
            <Link 
              href="/marketplace" 
              className="px-6 py-3 bg-surface-secondary text-heading font-bold rounded-[var(--radius-button)] hover:bg-border transition-colors disabled:opacity-50"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-8 py-3 bg-primary text-primary-foreground font-bold rounded-[var(--radius-button)] hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(88,199,109,0.3)] min-w-[150px]"
            >
              {isSubmitting ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Posting...</>
              ) : (
                "Post Request"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
