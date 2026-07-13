"use client";

import { useState } from "react";
import { MarketplaceRequest } from "@/types";
import { BadgeCheck, Clock, ShieldCheck, ArrowLeft, Plus, X } from "lucide-react";
import Link from "next/link";
import { submitApplication } from "@/app/actions/applications";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

interface ApplyClientProps {
  request: MarketplaceRequest;
}

export default function ApplyClient({ request }: ApplyClientProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // Form State
  const [coverMessage, setCoverMessage] = useState("");
  const [estimatedHours, setEstimatedHours] = useState("");
  const [estimatedCompletionDate, setEstimatedCompletionDate] = useState("");
  const [availability, setAvailability] = useState("Available Immediately");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  
  // Mutual Exchange fields
  const isMutual = !!request.isMutual;
  const [offeredDeliverables, setOfferedDeliverables] = useState<string[]>([""]);
  
  const [portfolioLinkInput, setPortfolioLinkInput] = useState("");
  const [portfolioLinks, setPortfolioLinks] = useState<string[]>([]);

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

  const handleAddLink = () => {
    if (portfolioLinkInput.trim() && !portfolioLinks.includes(portfolioLinkInput.trim())) {
      setPortfolioLinks([...portfolioLinks, portfolioLinkInput.trim()]);
      setPortfolioLinkInput("");
    }
  };

  const handleRemoveLink = (link: string) => {
    setPortfolioLinks(portfolioLinks.filter(l => l !== link));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreedToTerms) {
      toast.error("You must agree to the Skill Hour settlement terms");
      return;
    }

    setIsSubmitting(true);
    
    const cleanDeliverables = offeredDeliverables
      .map(d => d.trim())
      .filter(d => d.length > 0);

    const result = await submitApplication(request.id, {
      coverMessage,
      portfolioLinks,
      availability,
      estimatedHours: Number(estimatedHours),
      estimatedCompletionDate,
      agreedToTerms,
      isMutualProposal: isMutual,
      ...(isMutual && { offeredDeliverables: cleanDeliverables }),
      ...(isMutual && { offeredHours: Number(estimatedHours) })
    });

    setIsSubmitting(false);

    if (result.success) {
      setSuccess(true);
      toast.success("Application submitted successfully");
    } else {
      toast.error(result.error || "Failed to submit application");
    }
  };

  if (success) {
    return (
      <div className="max-w-2xl mx-auto py-24 text-center">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <BadgeCheck className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-3xl font-bold text-heading mb-4">Application Submitted</h1>
        <p className="text-body text-lg mb-8">
          The requester has been notified. We'll let you know when they respond.
        </p>
        <Link 
          href="/marketplace" 
          className="inline-flex items-center justify-center px-6 py-3 rounded-[var(--radius-button)] bg-primary text-primary-foreground font-medium transition-colors hover:bg-primary/90"
        >
          Return to Marketplace
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-12 px-4 sm:px-6">
      <Link 
        href={`/marketplace/${request.id}`}
        className="inline-flex items-center text-muted hover:text-primary transition-colors font-medium mb-8"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Request
      </Link>

      <h1 className="text-3xl font-bold text-heading mb-8">Apply for Exchange</h1>

      {/* Hero: Request Details */}
      <div className="bg-surface border border-border rounded-[var(--radius-card)] p-6 mb-8 shadow-subtle">
        <h2 className="text-xl font-bold text-heading mb-4">{request.title}</h2>
        
        <div className="flex items-center gap-3 mb-6">
          {request.requesterAvatar ? (
            <img src={request.requesterAvatar} alt={request.requesterName} className="w-10 h-10 rounded-full object-cover" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-heading font-bold">
              {request.requesterName.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-heading">{request.requesterName}</span>
              {request.requesterVerification && <BadgeCheck className="w-4 h-4 text-primary" />}
            </div>
            <div className="flex items-center gap-2 text-sm text-muted">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                Trust Score: {request.requesterTrustScore}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-6 border-t border-border/50">
          <div>
            <span className="block text-sm text-muted mb-1">Estimated Hours</span>
            <span className="font-medium text-heading flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-primary" />
              {request.estimatedHours}
            </span>
          </div>
          <div>
            <span className="block text-sm text-muted mb-1">Timeline</span>
            <span className="font-medium text-heading">{request.timeline}</span>
          </div>
        </div>
      </div>

      {isMutual && (
        <div className="bg-primary/5 border border-primary/20 rounded-[var(--radius-card)] p-6 mb-8">
          <div className="flex items-start gap-3">
            <BadgeCheck className="w-6 h-6 text-primary mt-0.5" />
            <div>
              <h3 className="font-bold text-heading text-lg mb-2">Mutual Exchange Opportunity</h3>
              <p className="text-sm text-muted mb-4">
                The requester wants to trade their skills ({request.offeredSkills?.join(", ")}) for yours. 
                In your application below, you will propose exactly what you can deliver to them in return.
              </p>
              <div className="bg-background rounded-lg p-4 border border-border/50">
                <span className="block text-xs font-bold text-primary uppercase tracking-wider mb-2">They Are Offering:</span>
                <ul className="list-disc list-inside text-sm text-body space-y-1">
                  {request.offeredDeliverables?.map((deliv, idx) => (
                    <li key={idx}>{deliv}</li>
                  ))}
                </ul>
                <p className="text-xs text-muted mt-3 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" /> Est. {request.offeredHours} Hours
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Application Form */}
      <form onSubmit={handleSubmit} className="space-y-8 bg-surface border border-border rounded-[var(--radius-card)] p-6 shadow-subtle">
        
        {isMutual && (
          <div className="bg-surface-secondary/50 rounded-xl p-6 border border-border">
            <h3 className="text-lg font-bold text-heading mb-2">What I Will Deliver</h3>
            <p className="text-sm text-muted mb-4">List out the exact deliverables you will provide to satisfy their request.</p>
            <div className="space-y-3 mb-3">
              {offeredDeliverables.map((deliv, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={deliv}
                    onChange={(e) => handleOfferedDeliverableChange(idx, e.target.value)}
                    placeholder="e.g. 5 fully developed React components"
                    className="flex-1 bg-background border border-input rounded-[var(--radius-button)] p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-body"
                    disabled={isSubmitting}
                    required={idx === 0}
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
        )}

        {/* Cover Message */}
        <div>
          <label className="block text-sm font-medium text-heading mb-2">
            Cover Message
          </label>
          <p className="text-sm text-muted mb-3">Introduce yourself and explain why you're a good fit for this project.</p>
          <textarea
            required
            rows={5}
            value={coverMessage}
            onChange={(e) => setCoverMessage(e.target.value)}
            className="w-full bg-background border border-input rounded-[var(--radius-input)] px-4 py-3 text-body focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors resize-none"
            placeholder="Hi there! I've built several landing pages recently..."
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Estimated Skill Hours */}
          <div>
            <label className="block text-sm font-medium text-heading mb-2">
              {isMutual ? "My Estimated Effort" : "Estimated Skill Hours"}
            </label>
            <div className="relative">
              <input
                type="number"
                required
                min="1"
                value={estimatedHours}
                onChange={(e) => setEstimatedHours(e.target.value)}
                className="w-full bg-background border border-input rounded-[var(--radius-input)] px-4 py-3 text-body focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                placeholder="6"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted text-sm">
                Hours
              </span>
            </div>
          </div>

          {/* Estimated Completion Date */}
          <div>
            <label className="block text-sm font-medium text-heading mb-2">
              Estimated Completion
            </label>
            <input
              type="date"
              required
              value={estimatedCompletionDate}
              onChange={(e) => setEstimatedCompletionDate(e.target.value)}
              className="w-full bg-background border border-input rounded-[var(--radius-input)] px-4 py-3 text-body focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
            />
          </div>
        </div>

        {/* Portfolio Links */}
        <div>
          <label className="block text-sm font-medium text-heading mb-2">
            Portfolio Links
          </label>
          <p className="text-sm text-muted mb-3">Add links to your previous work (GitHub, Behance, Dribbble, etc.)</p>
          
          <div className="flex gap-2 mb-3">
            <input
              type="url"
              value={portfolioLinkInput}
              onChange={(e) => setPortfolioLinkInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddLink())}
              className="flex-1 bg-background border border-input rounded-[var(--radius-input)] px-4 py-3 text-body focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
              placeholder="https://github.com/username"
            />
            <button
              type="button"
              onClick={handleAddLink}
              className="px-4 py-3 bg-secondary text-heading rounded-[var(--radius-button)] font-medium hover:bg-secondary/80 transition-colors flex items-center"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>

          {portfolioLinks.length > 0 && (
            <div className="flex flex-col gap-2">
              {portfolioLinks.map((link, idx) => (
                <div key={idx} className="flex items-center justify-between bg-background border border-border/50 rounded-lg px-4 py-2">
                  <span className="text-sm text-body truncate mr-4">{link}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveLink(link)}
                    className="text-muted hover:text-error transition-colors p-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Availability */}
        <div>
          <label className="block text-sm font-medium text-heading mb-2">
            Availability
          </label>
          <select
            value={availability}
            onChange={(e) => setAvailability(e.target.value)}
            className="w-full bg-background border border-input rounded-[var(--radius-input)] px-4 py-3 text-body focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors appearance-none"
          >
            <option value="Available Immediately">Available Immediately</option>
            <option value="This Week">This Week</option>
            <option value="Next Week">Next Week</option>
            <option value="In 2 Weeks+">In 2 Weeks+</option>
          </select>
        </div>

        {/* Terms Checkbox */}
        <div className="flex flex-col gap-2 pt-4 border-t border-border/50">
          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              id="terms"
              required
              checked={agreedToTerms}
              onChange={(e) => setAgreedToTerms(e.target.checked)}
              className="mt-1 w-4 h-4 rounded border-input text-primary focus:ring-primary/20 bg-background"
            />
            <label htmlFor="terms" className="text-sm text-body">
              I understand this exchange will require Skill Hour settlement upon completion.
            </label>
          </div>
          {!isMutual && (
            <p className="text-xs font-bold text-amber-500/80 ml-7">
              Note: This is a Standard Exchange. You will be working for free just to earn Skill Hours.
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting || !agreedToTerms}
          className="w-full py-4 rounded-[var(--radius-button)] bg-primary text-primary-foreground font-semibold text-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "Submitting Application..." : "Submit Application"}
        </button>
      </form>
    </div>
  );
}
