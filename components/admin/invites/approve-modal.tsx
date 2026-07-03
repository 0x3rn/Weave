"use client";

import { useState } from "react";
import { X, CheckCircle2 } from "lucide-react";
import { approveInvite } from "@/app/actions/admin/invites";

interface ApproveModalProps {
  application: any | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (id: string) => void;
}

export default function ApproveModal({ application, isOpen, onClose, onSuccess }: ApproveModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [expiresInDays, setExpiresInDays] = useState<number | null>(7);
  const [welcomeMessage, setWelcomeMessage] = useState("");

  if (!isOpen || !application) return null;

  const handleApprove = async () => {
    setIsSubmitting(true);
    setError(null);
    
    const result = await approveInvite(application.id, {
      expiresInDays,
      startingHours: 5, // Default for now, can be configured later
      badge: false, // Default for now
      welcomeMessage
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
        <div className="flex items-center justify-between p-6 border-b border-border bg-surface-secondary">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-success" />
            <h2 className="text-lg font-bold text-heading">Approve Invite</h2>
          </div>
          <button onClick={onClose} className="text-muted hover:text-heading transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          <p className="text-sm text-body">
            You are about to approve <strong className="text-heading">{application.fullName}</strong>. This will generate a unique invite code and send it to their email.
          </p>

          {error && (
            <div className="p-3 bg-error/10 border border-error/20 text-error text-sm rounded-md">
              {error}
            </div>
          )}

          <div className="space-y-4">
            
            {/* Expiration */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-heading block">Invite Expires</label>
              <select 
                value={expiresInDays === null ? "never" : expiresInDays.toString()}
                onChange={(e) => setExpiresInDays(e.target.value === "never" ? null : parseInt(e.target.value))}
                className="w-full bg-background border border-border rounded-[var(--radius-input)] p-3 text-sm focus:outline-none focus:border-primary text-heading appearance-none"
              >
                <option value="7">7 Days</option>
                <option value="14">14 Days</option>
                <option value="30">30 Days</option>
                <option value="never">Never</option>
              </select>
            </div>

            {/* Welcome Message */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-heading block">Welcome Message <span className="text-muted font-normal">(Optional)</span></label>
              <textarea 
                value={welcomeMessage}
                onChange={(e) => setWelcomeMessage(e.target.value)}
                placeholder="Add a personal note to their welcome email..."
                rows={3}
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
            onClick={handleApprove}
            disabled={isSubmitting}
            className="px-6 py-2 bg-primary text-surface font-medium text-sm rounded-md hover:bg-primary-hover transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {isSubmitting ? "Approving..." : "Approve User"}
          </button>
        </div>

      </div>
    </div>
  );
}
