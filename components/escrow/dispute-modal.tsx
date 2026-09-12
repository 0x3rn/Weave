"use client";

import { useState } from "react";
import { Escrow } from "@/types";
import { X, AlertTriangle } from "lucide-react";
import { openDispute } from "@/app/actions/escrow";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

interface Props {
  escrow: Escrow;
  onClose: () => void;
}

const DISPUTE_REASONS = [
  "Missed Deadline",
  "Poor Quality / Not as Described",
  "Incomplete Work",
  "Unresponsive Communication",
  "Other"
];

export default function DisputeModal({ escrow, onClose }: Props) {
  const router = useRouter();
  const [reason, setReason] = useState(DISPUTE_REASONS[0]);
  const [details, setDetails] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleOpenDispute = async () => {
    if (!details.trim()) {
      toast.error("Please provide details for the dispute.");
      return;
    }

    setIsSubmitting(true);
    const result = await openDispute(escrow.id, reason, details);
    if (!result.success) { toast.error(result.error || "Unable to open dispute"); setIsSubmitting(false); return; }
    toast.success("Dispute opened. The exchange is now frozen for review.");
    router.refresh();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-background/80 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-lg bg-surface border border-border rounded-[var(--radius-card)] shadow-2xl overflow-hidden my-4">
        
        <div className="px-6 py-4 border-b border-border flex justify-between items-center bg-error/5">
          <h2 className="text-xl font-bold text-error flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Open Dispute
          </h2>
          <button onClick={onClose} className="text-muted hover:text-heading">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <p className="text-sm text-body">
            Opening a dispute will freeze this escrow contract and alert our moderation team. Please provide as much detail as possible to help us resolve the issue fairly.
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-heading mb-2">Reason for Dispute</label>
              <select 
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-4 py-2 border border-border rounded-[var(--radius-button)] bg-surface text-body focus:ring-2 focus:ring-primary/50 outline-none"
              >
                {DISPUTE_REASONS.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-heading mb-2">Detailed Explanation</label>
              <textarea 
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                rows={4}
                className="w-full px-4 py-2 border border-border rounded-[var(--radius-button)] bg-surface text-body focus:ring-2 focus:ring-primary/50 outline-none resize-none"
                placeholder="Explain what happened..."
              />
            </div>

            <p className="rounded-lg bg-surface-secondary p-3 text-xs text-muted">Mention any relevant filenames or messages in your explanation. Existing workspace files and messages remain available to the moderation team.</p>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-border bg-surface flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-sm font-bold text-muted hover:text-heading transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={handleOpenDispute}
            disabled={isSubmitting}
            className="px-6 py-2 text-sm font-bold text-error-foreground bg-error rounded-[var(--radius-button)] hover:bg-error/90 transition-colors disabled:opacity-50"
          >
            {isSubmitting ? "Submitting..." : "Submit Dispute"}
          </button>
        </div>

      </div>
    </div>
  );
}
