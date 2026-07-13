"use client";

import { Exchange } from "@/types";
import { Lock, AlertTriangle, CheckCircle, ShieldCheck, Star } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { ExchangeTimeline } from "./exchange-timeline";
import ReviewModal from "./review-modal";

interface WorkspaceHeaderProps {
  exchange: Exchange;
  otherParty: {
    id: string;
    name: string;
    avatar: string | null;
    timezone: string;
  };
  isRequester: boolean;
  hasReviewed?: boolean;
}

export default function WorkspaceHeader({ exchange, otherParty, isRequester, hasReviewed = false }: WorkspaceHeaderProps) {
  const [showReviewModal, setShowReviewModal] = useState(false);
  return (
    <div className="bg-surface border-b border-border p-4 md:p-6 shrink-0 z-10 shadow-sm">
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider
                ${exchange.status === 'in_progress' ? 'bg-primary/10 text-primary' : ''}
                ${exchange.status === 'in_review' ? 'bg-blue-500/10 text-blue-500' : ''}
                ${exchange.status === 'revision_requested' ? 'bg-amber-500/10 text-amber-500' : ''}
                ${exchange.status === 'completed' ? 'bg-success/10 text-success' : ''}
                ${exchange.status === 'cancelled' ? 'bg-error/10 text-error' : ''}
              `}>
                {exchange.status.replace("_", " ")}
              </span>
              
              {/* Escrow Status / Health Indicator */}
              <div className="flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full bg-surface-secondary border border-border">
                {exchange.escrowStatus === 'reserved' ? (
                  <><Lock className="w-3.5 h-3.5 text-primary" /> {exchange.skillHours} Hours in Escrow</>
                ) : exchange.escrowStatus === 'released' ? (
                  <><CheckCircle className="w-3.5 h-3.5 text-success" /> Escrow Released</>
                ) : exchange.escrowStatus === 'refunded' ? (
                  <><AlertTriangle className="w-3.5 h-3.5 text-amber-500" /> Escrow Refunded</>
                ) : (
                  <><ShieldCheck className="w-3.5 h-3.5 text-muted" /> Escrow Pending</>
                )}
              </div>
            </div>
            
            <h1 className="text-2xl font-bold text-heading">{exchange.title}</h1>
          </div>

          <div className="flex items-center gap-4 text-right">
            {exchange.status === 'completed' && !hasReviewed && (
              <button
                onClick={() => setShowReviewModal(true)}
                className="hidden sm:flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-bold rounded-[var(--radius-button)] hover:bg-primary/90 transition-colors"
              >
                <Star className="w-4 h-4 fill-current" />
                Leave Review
              </button>
            )}
            
            <div className="hidden sm:block">
              <p className="text-sm font-medium text-heading">{isRequester ? "Provider" : "Requester"}</p>
              <Link href={`/profile/${otherParty.id}`} className="text-sm text-primary hover:underline font-bold">
                {otherParty.name}
              </Link>
            </div>
            {otherParty.avatar ? (
              <img src={otherParty.avatar} alt={otherParty.name} className="w-10 h-10 rounded-full object-cover border border-border" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-heading font-bold">
                {otherParty.name.charAt(0)}
              </div>
            )}
          </div>
        </div>

        {/* Mobile Review Button */}
        {exchange.status === 'completed' && !hasReviewed && (
          <div className="sm:hidden mt-2">
            <button
              onClick={() => setShowReviewModal(true)}
              className="w-full flex justify-center items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground text-sm font-bold rounded-[var(--radius-button)] hover:bg-primary/90 transition-colors"
            >
              <Star className="w-4 h-4 fill-current" />
              Leave a Review for {otherParty.name}
            </button>
          </div>
        )}

        <div className="hidden lg:block mt-2">
          <ExchangeTimeline exchange={exchange} />
        </div>
      </div>

      {showReviewModal && (
        <ReviewModal
          exchangeId={exchange.id}
          targetUserId={otherParty.id}
          targetUserName={otherParty.name}
          onClose={() => setShowReviewModal(false)}
        />
      )}
    </div>
  );
}
