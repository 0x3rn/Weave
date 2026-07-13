"use client";

import { Escrow, EscrowParticipant } from "@/types";
import { Check, X } from "lucide-react";

interface Props {
  escrow: Escrow;
  me: EscrowParticipant;
  partner: EscrowParticipant;
  onApprove: () => void;
  onClose: () => void;
}

export default function ReleasePreviewModal({ escrow, me, partner, onApprove, onClose }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <div className="w-full max-w-md bg-surface border border-border rounded-[var(--radius-card)] shadow-2xl overflow-hidden">
        
        <div className="px-6 py-4 border-b border-border flex justify-between items-center">
          <h2 className="text-xl font-bold text-heading">Release Preview</h2>
          <button onClick={onClose} className="text-muted hover:text-heading">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <p className="text-sm text-body">
            You are about to approve the deliverables and authorize the release of this escrow contract. This action is final.
          </p>

          <div className="bg-surface-secondary border border-border rounded-[var(--radius-card)] p-4 space-y-4">
            <div>
              <h3 className="font-bold text-heading text-sm mb-2 uppercase tracking-wider">Upon Release</h3>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted">Deposit Returned to You</span>
                  <span className="font-bold text-success flex items-center gap-1"><Check className="w-4 h-4"/> ${me.securityDepositAmount}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted">Deposit Returned to Partner</span>
                  <span className="font-bold text-success flex items-center gap-1"><Check className="w-4 h-4"/> ${partner.securityDepositAmount}</span>
                </div>
              </div>
            </div>

            <div className="border-t border-border pt-4">
              <h3 className="font-bold text-heading text-sm mb-2 uppercase tracking-wider">Skill Hours Transferred</h3>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted">To Your Balance</span>
                  <span className="font-bold text-success">+{partner.skillHoursReserved} Hours</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted">From Your Reserve</span>
                  <span className="font-bold text-error">-{me.skillHoursReserved} Hours</span>
                </div>
              </div>
            </div>
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
            onClick={() => {
              onApprove();
              onClose();
            }}
            className="px-6 py-2 text-sm font-bold text-surface bg-success rounded-[var(--radius-button)] hover:bg-success/90 transition-colors"
          >
            Confirm & Release
          </button>
        </div>

      </div>
    </div>
  );
}
