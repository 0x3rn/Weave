"use client";

import { useState } from "react";
import { ExchangeRequest } from "@/types";
import { updateExchangeRequest } from "@/app/actions/exchanges";
import { X, Loader2, Send } from "lucide-react";

interface RequestReviewModalProps {
  request: ExchangeRequest;
  onClose: () => void;
  onSuccess: () => void;
}

export default function RequestReviewModal({ request, onClose, onSuccess }: RequestReviewModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [message, setMessage] = useState("");
  const [hoursNeeded, setHoursNeeded] = useState(request.hoursNeeded?.toString() || "");
  const [timeNeeded, setTimeNeeded] = useState(request.timeNeeded || "");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const updates: any = {};
    if (request.hoursNeeded !== undefined && hoursNeeded) {
      updates.hoursNeeded = Number(hoursNeeded);
    }
    if (request.timeNeeded !== undefined && timeNeeded) {
      updates.timeNeeded = timeNeeded;
    }

    const result = await updateExchangeRequest(request.id, "reviewing", message, updates);

    if (result.success) {
      onSuccess();
    } else {
      setError(result.error || "An error occurred");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-4">
      <div className="bg-surface border border-border w-full max-w-md rounded-[var(--radius-card)] shadow-elevated flex flex-col max-h-[90vh]">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h2 className="text-lg font-bold text-heading">Review Request</h2>
          <button onClick={onClose} className="p-2 text-muted hover:text-heading transition-colors rounded-full hover:bg-surface-secondary">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          <form id="reviewForm" onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-3 bg-error/10 text-error text-sm rounded-[var(--radius-button)]">
                {error}
              </div>
            )}
            
            <p className="text-sm text-body">
              Propose new terms if you cannot accommodate the original request.
            </p>

            {request.hoursNeeded !== undefined && (
              <div>
                <label className="block text-sm font-bold text-heading mb-2">Total Hours Needed</label>
                <div className="flex items-center gap-3">
                  <input 
                    type="number" 
                    min="1"
                    max="100"
                    value={hoursNeeded}
                    onChange={e => setHoursNeeded(e.target.value)}
                    required
                    className="w-full bg-background border border-border rounded-[var(--radius-button)] px-4 py-2.5 text-body focus:outline-none focus:border-primary transition-colors"
                  />
                  <span className="text-sm font-bold text-muted whitespace-nowrap">hours</span>
                </div>
              </div>
            )}

            {request.timeNeeded !== undefined && (
              <div>
                <label className="block text-sm font-bold text-heading mb-2">Specific Time</label>
                <input 
                  type="time" 
                  value={timeNeeded}
                  onChange={e => setTimeNeeded(e.target.value)}
                  required
                  className="w-full bg-background border border-border rounded-[var(--radius-button)] px-4 py-2.5 text-body focus:outline-none focus:border-primary transition-colors"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-bold text-heading mb-2">Message (Required)</label>
              <textarea 
                value={message}
                onChange={e => setMessage(e.target.value)}
                required
                rows={3}
                placeholder="Hi, I can't do 3 hours but I can do 2 hours at..."
                className="w-full bg-background border border-border rounded-xl px-4 py-3 text-body focus:outline-none focus:border-primary transition-colors resize-none"
              />
            </div>
          </form>
        </div>

        <div className="p-4 border-t border-border flex justify-end gap-3 bg-surface-secondary rounded-b-[var(--radius-card)]">
          <button 
            type="button" 
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-bold text-muted hover:text-heading transition-colors"
          >
            Cancel
          </button>
          <button 
            form="reviewForm"
            type="submit" 
            disabled={isSubmitting || !message}
            className="px-6 py-2 bg-primary text-surface font-bold text-sm rounded-[var(--radius-button)] hover:bg-primary-hover transition-colors shadow-subtle flex items-center gap-2 disabled:opacity-50"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Send Counter-Offer
          </button>
        </div>
      </div>
    </div>
  );
}
