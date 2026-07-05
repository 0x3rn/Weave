"use client";

import { useState } from "react";
import { User, UserSkill } from "@/types";
import { createExchangeRequest } from "@/app/actions/exchanges";
import { Loader2, X, Calendar, Clock, BookOpen, Send } from "lucide-react";

interface ExchangeRequestModalProps {
  owner: User;
  senderId: string;
  selectedDates: string[]; // YYYY-MM-DD format
  onClose: () => void;
  onSuccess: () => void;
}

export default function ExchangeRequestModal({ owner, senderId, selectedDates, onClose, onSuccess }: ExchangeRequestModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [skillNeeded, setSkillNeeded] = useState<string>("");
  const [timeType, setTimeType] = useState<"time" | "hours">("hours");
  const [timeValue, setTimeValue] = useState("");
  const [message, setMessage] = useState("");

  const offeredSkills = (owner.skillsOffered || []).map(skill => {
    return typeof skill === 'string' ? skill : skill.name;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!skillNeeded) {
      setError("Please select a skill you need.");
      return;
    }
    
    if (!timeValue) {
      setError("Please specify the time or hours needed.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const payload: any = {
      senderId,
      receiverId: owner.uid,
      skillNeeded,
      dateOptions: selectedDates,
      message
    };

    if (timeType === "time") {
      payload.timeNeeded = timeValue;
    } else {
      payload.hoursNeeded = Number(timeValue);
    }

    const result = await createExchangeRequest(payload);

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
          <h2 className="text-lg font-bold text-heading">Request Exchange</h2>
          <button onClick={onClose} className="p-2 text-muted hover:text-heading transition-colors rounded-full hover:bg-surface-secondary">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          <form id="requestForm" onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-3 bg-error/10 text-error text-sm rounded-[var(--radius-button)]">
                {error}
              </div>
            )}

            <div>
              <label className="flex items-center gap-2 text-sm font-bold text-heading mb-2">
                <Calendar className="w-4 h-4 text-primary" />
                Selected Dates
              </label>
              <div className="flex flex-wrap gap-2">
                {selectedDates.map(date => (
                  <span key={date} className="bg-primary/10 text-primary text-xs font-bold px-2 py-1 rounded">
                    {date}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-bold text-heading mb-2">
                <BookOpen className="w-4 h-4 text-primary" />
                Skill Needed
              </label>
              <select 
                value={skillNeeded}
                onChange={e => setSkillNeeded(e.target.value)}
                required
                className="w-full bg-background border border-border rounded-[var(--radius-button)] px-4 py-2.5 text-body focus:outline-none focus:border-primary transition-colors appearance-none"
              >
                <option value="" disabled>Select a skill...</option>
                {offeredSkills.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="flex items-center gap-2 text-sm font-bold text-heading">
                  <Clock className="w-4 h-4 text-primary" />
                  Time Required
                </label>
                <div className="flex bg-surface-secondary rounded p-0.5">
                  <button 
                    type="button" 
                    onClick={() => setTimeType("hours")}
                    className={`px-2 py-1 text-xs font-bold rounded ${timeType === "hours" ? "bg-background text-heading shadow-subtle" : "text-muted hover:text-heading"}`}
                  >
                    Total Hours
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setTimeType("time")}
                    className={`px-2 py-1 text-xs font-bold rounded ${timeType === "time" ? "bg-background text-heading shadow-subtle" : "text-muted hover:text-heading"}`}
                  >
                    Specific Time
                  </button>
                </div>
              </div>
              
              {timeType === "hours" ? (
                <div className="flex items-center gap-3">
                  <input 
                    type="number" 
                    min="1"
                    max="100"
                    placeholder="e.g. 2"
                    value={timeValue}
                    onChange={e => setTimeValue(e.target.value)}
                    required
                    className="w-full bg-background border border-border rounded-[var(--radius-button)] px-4 py-2.5 text-body focus:outline-none focus:border-primary transition-colors"
                  />
                  <span className="text-sm font-bold text-muted whitespace-nowrap">hours total</span>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <input 
                    type="time" 
                    value={timeValue}
                    onChange={e => setTimeValue(e.target.value)}
                    required
                    className="w-full bg-background border border-border rounded-[var(--radius-button)] px-4 py-2.5 text-body focus:outline-none focus:border-primary transition-colors"
                  />
                  <span className="text-sm font-bold text-muted whitespace-nowrap">{owner.timeZone || "UTC"}</span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-bold text-heading mb-2">Message (Optional)</label>
              <textarea 
                value={message}
                onChange={e => setMessage(e.target.value)}
                rows={3}
                placeholder="Hi! I'd love to exchange some time for this skill..."
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
            form="requestForm"
            type="submit" 
            disabled={isSubmitting || !skillNeeded || !timeValue}
            className="px-6 py-2 bg-primary text-surface font-bold text-sm rounded-[var(--radius-button)] hover:bg-primary-hover transition-colors shadow-subtle flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Send Request
          </button>
        </div>
      </div>
    </div>
  );
}
