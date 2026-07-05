"use client";

import { Review } from "@/types";
import { formatDistanceToNow } from "date-fns";
import { Star, ThumbsUp, MessageSquareDashed } from "lucide-react";
import Image from "next/image";

interface ReviewsSectionProps {
  reviews: Review[];
  isOwner: boolean;
}

export default function ReviewsSection({ reviews, isOwner }: ReviewsSectionProps) {
  const averageRating = reviews.length > 0 
    ? (reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviews.length).toFixed(1)
    : "0.0";

  return (
    <section>
      <div className="flex items-center gap-4 mb-6 border-b border-border pb-4">
        <h2 className="text-2xl font-bold text-heading">Reviews</h2>
        
        {reviews.length > 0 && (
          <div className="flex items-center gap-3 ml-auto bg-surface border border-border px-4 py-1.5 rounded-full">
            <div className="flex items-center gap-1 text-warning">
              <Star className="w-4 h-4 fill-current" />
              <span className="font-bold text-heading text-sm">{averageRating}</span>
            </div>
            <div className="w-px h-4 bg-border"></div>
            <span className="text-xs text-muted font-medium">{reviews.length} Reviews</span>
          </div>
        )}
      </div>

      {reviews.length > 0 ? (
        <div className="space-y-6">
          {reviews.map((review) => (
            <div key={review.id} className="bg-surface border border-border p-5 rounded-[var(--radius-card)] shadow-subtle flex flex-col sm:flex-row gap-5">
              
              {/* Reviewer Info */}
              <div className="flex sm:flex-col gap-3 sm:w-48 shrink-0">
                <div className="w-10 h-10 rounded-full bg-surface-secondary border border-border flex items-center justify-center shrink-0">
                  <span className="text-muted text-sm font-bold">R</span>
                </div>
                <div>
                  <h4 className="font-bold text-heading text-sm truncate">Reviewer Name</h4>
                  <p className="text-xs text-muted">Exchange Partner</p>
                </div>
              </div>

              {/* Review Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center text-warning gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`w-3.5 h-3.5 ${i < review.rating ? "fill-current" : "text-border"}`} />
                    ))}
                  </div>
                  <span className="text-xs text-muted">
                    {formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })}
                  </span>
                </div>
                
                <p className="text-sm text-body leading-relaxed mb-4">
                  "{review.comment}"
                </p>

                <div className="flex justify-end">
                  <button className="flex items-center gap-1.5 text-xs font-medium text-muted hover:text-primary transition-colors border border-border bg-surface-secondary px-3 py-1 rounded-full">
                    <ThumbsUp className="w-3.5 h-3.5" />
                    Helpful
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-surface border border-border rounded-[var(--radius-card)] p-8 text-center flex flex-col items-center justify-center">
          <MessageSquareDashed className="w-12 h-12 text-muted mb-4" />
          <h3 className="text-lg font-bold text-heading mb-2">No Reviews Yet</h3>
          <p className="text-body text-sm max-w-sm mx-auto">
            {isOwner 
              ? "Complete your first exchange to start receiving reviews from collaborators." 
              : "This user hasn't received any reviews yet."}
          </p>
        </div>
      )}
    </section>
  );
}
