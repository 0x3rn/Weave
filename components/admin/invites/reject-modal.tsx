"use client";

import { useState } from "react";
import { X, AlertCircle } from "lucide-react";
import { rejectInvite } from "@/app/actions/admin/invites";

interface RejectModalProps {
  application: any | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (id: string) => void;
}

const REJECTION_REASONS = [
  "Incomplete Profile",
  "Not Enough Information",
  "Spam / Low Effort",
  "Outside Target Audience",
  "Other"
];

export default function RejectModal({ application, isOpen, onClose, onSuccess }: RejectModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [reason, setReason] = useState(REJECTION_REASONS[0]);
  const [feedback, setFeedback] = useState("");

  if (!isOpen || !application) return null;

  const handleReject = async () => {
    setIsSubmitting(true);
    setError(null);
    
    const result = await rejectInvite(application.id, {
      reason,
      feedback
    });

    setIsSubmitting(false);

    if (result.error) {
      setError(result.error);
    } else {
      onSuccess(application.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal Box */}
      <div className="relative bg-surface border border-border w-full max-w-md rounded-[var(--radius-card)] shadow-2xl flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border bg-error/10">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-error" />
            <h2 className="text-lg font-bold text-heading">Reject Application</h2>
          </div>
          <button onClick={onClose} className="text-muted hover:text-heading transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          <p className="text-sm text-body">
            You are rejecting the application for <strong className="text-heading">{application.fullName}</strong>. They will receive an email notification.
          </p>

          {error && (
            <div className="p-3 bg-error/10 border border-error/20 text-error text-sm rounded-md">
              {error}
            </div>
          )}

          <div className="space-y-4">
            
            {/* Reason */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-heading block">Primary Reason</label>
              <select 
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full bg-background border border-border rounded-[var(--radius-input)] p-3 text-sm focus:outline-none focus:border-primary text-heading appearance-none"
              >
                {REJECTION_REASONS.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            {/* Optional Feedback */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-heading block">Optional Feedback <span className="text-muted font-normal">(Included in email)</span></label>
              <textarea 
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Add constructive feedback explaining the rejection..."
                rows={4}
                className="w-full bg-background border border-border rounded-[var(--radius-input)] p-3 text-sm focus:outline-none focus:border-primary text-body resize-none"
              />
            </div>

          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-border bg-surface-secondary flex gap-3 justify-end">
          <button 
            onClick={onClose}
            className="px-4 py-2 font-medium text-sm text-heading hover:bg-border rounded-md transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={handleReject}
            disabled={isSubmitting}
            className="px-6 py-2 bg-error text-white font-medium text-sm rounded-md hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {isSubmitting ? "Rejecting..." : "Reject Application"}
          </button>
        </div>

      </div>
    </div>
  );
}
