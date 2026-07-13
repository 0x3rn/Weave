"use client";

import { useState } from "react";
import { Star, X, Loader2 } from "lucide-react";
import { submitReview } from "@/app/actions/reviews";
import { useRouter } from "next/navigation";

interface ReviewModalProps {
  exchangeId: string;
  targetUserId: string;
  targetUserName: string;
  onClose: () => void;
}

export default function ReviewModal({ exchangeId, targetUserId, targetUserName, onClose }: ReviewModalProps) {
  const router = useRouter();
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (rating === 0) {
      setError("Please select a rating.");
      return;
    }

    if (!comment.trim()) {
      setError("Please leave a brief comment.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const isPositive = rating >= 4;
      const result = await submitReview(exchangeId, targetUserId, rating, comment, isPositive);
      
      if (!result.success) throw new Error(result.error);
      
      router.refresh();
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to submit review");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-surface border border-border w-full max-w-md rounded-[var(--radius-card)] shadow-elevated p-6 relative animate-in zoom-in-95 duration-200">
        
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-surface-secondary text-muted hover:text-heading transition-colors"
          disabled={isSubmitting}
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-heading mb-2">Leave a Review</h2>
          <p className="text-muted text-sm">
            Rate your experience working with <span className="font-bold text-primary">{targetUserName}</span>. This helps build Trust on Weave.
          </p>
        </div>

        {error && (
          <div className="bg-error/10 text-error p-3 rounded-[var(--radius-button)] text-sm font-bold mb-4">
            {error}
          </div>
        )}

        <div className="space-y-6">
          {/* Star Rating */}
          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                onClick={() => setRating(star)}
                disabled={isSubmitting}
                className="p-1 transition-transform hover:scale-110 disabled:scale-100"
              >
                <Star 
                  className={`w-10 h-10 ${
                    (hoveredRating || rating) >= star 
                      ? "fill-amber-400 text-amber-400" 
                      : "text-border"
                  } transition-colors`} 
                />
              </button>
            ))}
          </div>

          {/* Comment */}
          <div>
            <label className="block text-sm font-bold text-heading mb-2">Your Feedback</label>
            <textarea 
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={`What was it like working with ${targetUserName}?`}
              className="w-full bg-surface-secondary border border-border rounded-[var(--radius-button)] p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-body min-h-[120px]"
              disabled={isSubmitting}
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={isSubmitting || rating === 0 || !comment.trim()}
            className="w-full py-3 bg-primary text-primary-foreground font-bold rounded-[var(--radius-button)] hover:bg-primary/90 transition-colors disabled:opacity-50 flex justify-center items-center gap-2"
          >
            {isSubmitting ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> Submitting...</>
            ) : (
              "Submit Review"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
