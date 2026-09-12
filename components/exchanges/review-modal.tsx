"use client";

import { submitReview } from "@/app/actions/reviews";
import { Check, Loader2, Star, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface ReviewModalProps { exchangeId: string; targetUserId: string; targetUserName: string; onClose: () => void; }
type ScoreName = "communication" | "quality" | "timeliness" | "professionalism";

function ScorePicker({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm font-medium text-heading">{label}</span>
      <div className="flex" role="group" aria-label={`${label} rating`}>
        {[1, 2, 3, 4, 5].map(score => (
          <button key={score} type="button" onClick={() => onChange(score)} className="p-1" aria-label={`${score} stars`}>
            <Star className={`h-5 w-5 ${score <= value ? "fill-amber-400 text-amber-400" : "text-border"}`} />
          </button>
        ))}
      </div>
    </div>
  );
}

export default function ReviewModal({ exchangeId, targetUserId, targetUserName, onClose }: ReviewModalProps) {
  const router = useRouter();
  const [rating, setRating] = useState(0);
  const [scores, setScores] = useState<Record<ScoreName, number>>({ communication: 0, quality: 0, timeliness: 0, professionalism: 0 });
  const [comment, setComment] = useState("");
  const [privateFeedback, setPrivateFeedback] = useState("");
  const [skills, setSkills] = useState("");
  const [wouldCollaborateAgain, setWouldCollaborateAgain] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!rating || Object.values(scores).some(score => !score)) return setError("Please complete every rating.");
    if (!comment.trim()) return setError("Please leave a brief public review.");
    setIsSubmitting(true);
    setError("");
    const skillEndorsements = [...new Set(skills.split(",").map(skill => skill.trim()).filter(Boolean))].slice(0, 5);
    const result = await submitReview(exchangeId, targetUserId, { rating, ...scores, wouldCollaborateAgain, comment, privateFeedback, skillEndorsements });
    if (!result.success) { setError(result.error || "Failed to submit review"); setIsSubmitting(false); return; }
    router.refresh();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-background/80 p-4 backdrop-blur-sm">
      <div className="relative my-4 w-full max-w-lg rounded-[var(--radius-card)] border border-border bg-surface p-6 shadow-elevated">
        <button type="button" onClick={onClose} disabled={isSubmitting} className="absolute right-4 top-4 rounded-full p-2 text-muted hover:bg-surface-secondary hover:text-heading" aria-label="Close review"><X className="h-5 w-5" /></button>
        <h2 className="pr-10 text-2xl font-bold text-heading">Review {targetUserName}</h2>
        <p className="mt-1 text-sm text-muted">Your public feedback builds trust. Private feedback is visible only to Weave.</p>

        {error && <div className="mt-4 rounded-lg bg-error/10 p-3 text-sm font-bold text-error">{error}</div>}
        <div className="mt-6 space-y-5">
          <div>
            <p className="mb-2 text-sm font-bold text-heading">Overall experience</p>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map(star => <button key={star} type="button" onClick={() => setRating(star)} className="p-1" aria-label={`${star} stars`}><Star className={`h-8 w-8 ${star <= rating ? "fill-amber-400 text-amber-400" : "text-border"}`} /></button>)}
            </div>
          </div>
          <div className="space-y-3 rounded-xl bg-surface-secondary p-4">
            {(Object.keys(scores) as ScoreName[]).map(name => <ScorePicker key={name} label={name.charAt(0).toUpperCase() + name.slice(1)} value={scores[name]} onChange={value => setScores(current => ({ ...current, [name]: value }))} />)}
          </div>
          <label className="block text-sm font-bold text-heading">Public review<textarea value={comment} onChange={event => setComment(event.target.value)} maxLength={3000} rows={4} placeholder={`What was it like working with ${targetUserName}?`} className="mt-2 w-full rounded-lg border border-border bg-surface-secondary p-3 font-normal text-body outline-none focus:ring-2 focus:ring-primary/50" /></label>
          <label className="block text-sm font-bold text-heading">Skills to endorse <span className="font-normal text-muted">(up to 5, comma separated)</span><input value={skills} onChange={event => setSkills(event.target.value)} maxLength={400} placeholder="e.g. Product design, Communication" className="mt-2 w-full rounded-lg border border-border bg-surface-secondary p-3 font-normal text-body outline-none focus:ring-2 focus:ring-primary/50" /></label>
          <button type="button" onClick={() => setWouldCollaborateAgain(value => !value)} className="flex w-full items-center gap-3 rounded-lg border border-border p-3 text-left text-sm font-medium text-heading"><span className={`flex h-5 w-5 items-center justify-center rounded border ${wouldCollaborateAgain ? "border-primary bg-primary text-primary-foreground" : "border-border"}`}>{wouldCollaborateAgain && <Check className="h-3.5 w-3.5" />}</span>I would collaborate with {targetUserName} again</button>
          <label className="block text-sm font-bold text-heading">Private feedback <span className="font-normal text-muted">(optional)</span><textarea value={privateFeedback} onChange={event => setPrivateFeedback(event.target.value)} maxLength={3000} rows={3} placeholder="Share confidential feedback with the Weave team." className="mt-2 w-full rounded-lg border border-border bg-surface-secondary p-3 font-normal text-body outline-none focus:ring-2 focus:ring-primary/50" /></label>
          <button type="button" onClick={handleSubmit} disabled={isSubmitting} className="flex w-full items-center justify-center gap-2 rounded-[var(--radius-button)] bg-primary py-3 font-bold text-primary-foreground disabled:opacity-50">{isSubmitting ? <><Loader2 className="h-5 w-5 animate-spin" />Submitting...</> : "Submit review"}</button>
        </div>
      </div>
    </div>
  );
}
