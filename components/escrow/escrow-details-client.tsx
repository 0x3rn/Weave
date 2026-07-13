"use client";

import { useState } from "react";
import { Escrow, Exchange, User } from "@/types";
import { processDeposit, submitDeliverables, approveDeliverables } from "@/app/actions/escrow";
import { Check, ShieldCheck, Upload, AlertTriangle, FileText, Download } from "lucide-react";
import toast from "react-hot-toast";
import Link from "next/link";
import ReleasePreviewModal from "./release-preview-modal";
import DisputeModal from "./dispute-modal";

interface Props {
  escrow: Escrow;
  exchange: Exchange;
  usersMap: Record<string, User>;
  currentUserId: string;
}

export default function EscrowDetailsClient({ escrow, exchange, usersMap, currentUserId }: Props) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [showReleaseModal, setShowReleaseModal] = useState(false);
  const [showDisputeModal, setShowDisputeModal] = useState(false);

  const me = escrow.participants[currentUserId];
  const partnerId = Object.keys(escrow.participants).find(id => id !== currentUserId)!;
  const partner = escrow.participants[partnerId];

  const handlePayDeposit = async () => {
    setIsProcessing(true);
    const res = await processDeposit(escrow.id);
    setIsProcessing(false);
    if (res.success) {
      toast.success("Deposit processed successfully!");
    } else {
      toast.error(res.error || "Failed to process deposit");
    }
  };

  const handleSubmitDeliverables = async () => {
    setIsProcessing(true);
    const res = await submitDeliverables(escrow.id);
    setIsProcessing(false);
    if (res.success) {
      toast.success("Deliverables submitted!");
    } else {
      toast.error(res.error || "Failed to submit deliverables");
    }
  };

  const handleApprove = async () => {
    setIsProcessing(true);
    const res = await approveDeliverables(escrow.id, partnerId);
    setIsProcessing(false);
    if (res.success) {
      toast.success("Approved successfully!");
    } else {
      toast.error(res.error || "Failed to approve");
    }
  };

  // Calculate Progress
  let progress = 0;
  if (escrow.status === "pending_deposits") progress = 20;
  if (escrow.status === "locked") progress = 50;
  if (me.deliverablesStatus === "submitted" || partner.deliverablesStatus === "submitted") progress = 70;
  if (me.approvalStatus === "approved" || partner.approvalStatus === "approved") progress = 85;
  if (escrow.status === "released") progress = 100;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-3xl font-black text-heading">{exchange.title}</h1>
            <span className={`px-2.5 py-1 rounded text-xs font-bold uppercase tracking-wide
              ${escrow.status === "locked" ? "bg-primary/10 text-primary" : 
                escrow.status === "pending_deposits" ? "bg-warning/10 text-warning" :
                escrow.status === "released" ? "bg-success/10 text-success" :
                "bg-surface-secondary text-muted"}`}>
              {escrow.status.replace("_", " ")}
            </span>
          </div>
          <p className="text-muted">
            Mutual Exchange between You and {usersMap[partnerId]?.fullName || "User"}
          </p>
        </div>

        <div className="flex gap-2">
          {escrow.status === "released" && (
            <button className="flex items-center gap-2 px-4 py-2 bg-surface-secondary text-heading font-bold rounded-[var(--radius-button)] hover:bg-border transition-colors">
              <Download className="w-4 h-4" />
              Receipt
            </button>
          )}
          {escrow.status !== "released" && escrow.status !== "cancelled" && (
            <button 
              onClick={() => setShowDisputeModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-error/10 text-error font-bold rounded-[var(--radius-button)] hover:bg-error/20 transition-colors"
            >
              <AlertTriangle className="w-4 h-4" />
              Dispute
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Progress Bar */}
          <div className="bg-surface border border-border rounded-[var(--radius-card)] p-6">
            <div className="flex justify-between items-end mb-2">
              <h3 className="font-bold text-heading">Escrow Progress</h3>
              <span className="text-sm font-bold text-primary">{progress}%</span>
            </div>
            <div className="w-full h-3 bg-surface-secondary rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-1000 ease-in-out"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>

          {/* Action Required Box */}
          {escrow.status !== "released" && (
            <div className="bg-primary/5 border border-primary/20 rounded-[var(--radius-card)] p-6">
              <h3 className="font-bold text-primary mb-2">Action Required</h3>
              
              {escrow.status === "pending_deposits" && me.depositStatus !== "received" && (
                <div>
                  <p className="text-sm text-heading mb-4">You need to submit your refundable security deposit to activate this contract.</p>
                  <button 
                    onClick={handlePayDeposit}
                    disabled={isProcessing}
                    className="px-6 py-2 bg-primary text-surface font-bold rounded-[var(--radius-button)] hover:bg-primary-hover disabled:opacity-50"
                  >
                    Pay ${me.securityDepositAmount} Deposit
                  </button>
                </div>
              )}
              
              {escrow.status === "pending_deposits" && me.depositStatus === "received" && (
                <p className="text-sm text-heading">Waiting for {usersMap[partnerId]?.fullName} to submit their deposit...</p>
              )}

              {escrow.status === "locked" && me.deliverablesStatus !== "submitted" && (
                <div>
                  <p className="text-sm text-heading mb-4">Work is in progress. Submit your deliverables when ready.</p>
                  <button 
                    onClick={handleSubmitDeliverables}
                    disabled={isProcessing}
                    className="flex items-center gap-2 px-6 py-2 bg-primary text-surface font-bold rounded-[var(--radius-button)] hover:bg-primary-hover disabled:opacity-50"
                  >
                    <Upload className="w-4 h-4" />
                    Submit Deliverables
                  </button>
                </div>
              )}

              {escrow.status === "locked" && partner.deliverablesStatus === "submitted" && me.approvalStatus !== "approved" && (
                <div>
                  <p className="text-sm text-heading mb-4">{usersMap[partnerId]?.fullName} has submitted their deliverables. Please review and approve.</p>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setShowReleaseModal(true)}
                      className="px-6 py-2 bg-success text-surface font-bold rounded-[var(--radius-button)] hover:bg-success/90"
                    >
                      Review & Approve
                    </button>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* Deliverables Status */}
          <div className="bg-surface border border-border rounded-[var(--radius-card)] overflow-hidden">
            <div className="px-6 py-4 border-b border-border bg-surface-secondary">
              <h2 className="text-lg font-bold text-heading">Deliverables Status</h2>
            </div>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border text-xs font-bold uppercase text-muted">
                  <th className="p-4 pl-6">Participant</th>
                  <th className="p-4 text-center">Submitted</th>
                  <th className="p-4 text-center">Approved</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                <tr className="hover:bg-surface-secondary/50">
                  <td className="p-4 pl-6 font-medium text-heading">You</td>
                  <td className="p-4 text-center">
                    {me.deliverablesStatus === "submitted" || me.deliverablesStatus === "approved" ? <Check className="w-5 h-5 text-success mx-auto" /> : <span className="text-muted">-</span>}
                  </td>
                  <td className="p-4 text-center">
                    {me.approvalStatus === "approved" || partner.approvalStatus === "approved" ? <Check className="w-5 h-5 text-success mx-auto" /> : <span className="text-muted">-</span>}
                  </td>
                </tr>
                <tr className="hover:bg-surface-secondary/50">
                  <td className="p-4 pl-6 font-medium text-heading">{usersMap[partnerId]?.fullName || "Partner"}</td>
                  <td className="p-4 text-center">
                    {partner.deliverablesStatus === "submitted" || partner.deliverablesStatus === "approved" ? <Check className="w-5 h-5 text-success mx-auto" /> : <span className="text-muted">-</span>}
                  </td>
                  <td className="p-4 text-center">
                    {me.approvalStatus === "approved" ? <Check className="w-5 h-5 text-success mx-auto" /> : <span className="text-muted">-</span>}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Security Deposits & Hours */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-surface border border-border rounded-[var(--radius-card)] overflow-hidden">
              <div className="px-6 py-4 border-b border-border bg-surface-secondary flex justify-between items-center">
                <h2 className="font-bold text-heading">Security Deposits</h2>
                <span className="text-sm font-bold text-muted">${me.securityDepositAmount + partner.securityDepositAmount} Total</span>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-heading">You</span>
                  <span className={`text-xs font-bold uppercase px-2 py-1 rounded ${me.depositStatus === "received" ? "bg-success/10 text-success" : "bg-warning/10 text-warning"}`}>{me.depositStatus}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-heading">{usersMap[partnerId]?.fullName}</span>
                  <span className={`text-xs font-bold uppercase px-2 py-1 rounded ${partner.depositStatus === "received" ? "bg-success/10 text-success" : "bg-warning/10 text-warning"}`}>{partner.depositStatus}</span>
                </div>
              </div>
            </div>
            
            <div className="bg-surface border border-border rounded-[var(--radius-card)] overflow-hidden">
              <div className="px-6 py-4 border-b border-border bg-surface-secondary flex justify-between items-center">
                <h2 className="font-bold text-heading">Skill Hours Locked</h2>
                <span className="text-sm font-bold text-muted">{me.skillHoursReserved + partner.skillHoursReserved} Total</span>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-heading">You</span>
                  <span className="text-sm font-bold text-heading">{me.skillHoursReserved} hrs</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-heading">{usersMap[partnerId]?.fullName}</span>
                  <span className="text-sm font-bold text-heading">{partner.skillHoursReserved} hrs</span>
                </div>
              </div>
            </div>
          </div>

          {/* Commitments */}
          <div className="bg-surface border border-border rounded-[var(--radius-card)] overflow-hidden">
             <div className="px-6 py-4 border-b border-border bg-surface-secondary">
              <h2 className="text-lg font-bold text-heading">Completion Commitments</h2>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h4 className="text-sm font-bold text-heading mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-muted" />
                  You will deliver:
                </h4>
                <ul className="space-y-2 text-sm text-body list-disc pl-5">
                  {me.commitments.map((c, i) => <li key={i}>{c}</li>)}
                </ul>
              </div>
              <div>
                <h4 className="text-sm font-bold text-heading mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-muted" />
                  Partner will deliver:
                </h4>
                <ul className="space-y-2 text-sm text-body list-disc pl-5">
                  {partner.commitments.map((c, i) => <li key={i}>{c}</li>)}
                </ul>
              </div>
            </div>
          </div>

        </div>

        {/* Right Sidebar - Timeline */}
        <div className="space-y-6">
          <div className="bg-surface border border-border rounded-[var(--radius-card)] p-6">
            <h2 className="text-lg font-bold text-heading mb-6">Escrow Timeline</h2>
            
            <div className="space-y-6 relative before:absolute before:inset-0 before:ml-2 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
              {escrow.timeline.map((event, index) => (
                <div key={event.id} className="relative flex items-start gap-4">
                  <div className="w-5 h-5 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center shrink-0 z-10 mt-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                  </div>
                  <div>
                    <span className="text-xs font-bold text-muted uppercase block mb-0.5">
                      {new Date(event.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <p className="text-sm text-heading">{event.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-surface-secondary border border-border rounded-[var(--radius-card)] p-6">
            <h3 className="font-bold text-heading text-sm mb-3">Escrow Conditions</h3>
            <p className="text-xs text-muted leading-relaxed">
              Escrow will automatically release when:
            </p>
            <ul className="text-xs text-muted leading-relaxed mt-2 space-y-1">
              <li className="flex items-center gap-2"><Check className="w-3 h-3 text-primary" /> Both members submit agreed deliverables.</li>
              <li className="flex items-center gap-2"><Check className="w-3 h-3 text-primary" /> Both members approve the exchange.</li>
              <li className="flex items-center gap-2"><Check className="w-3 h-3 text-primary" /> No dispute exists.</li>
            </ul>
          </div>
        </div>

      </div>

      {showReleaseModal && (
        <ReleasePreviewModal 
          escrow={escrow}
          me={me}
          partner={partner}
          onApprove={handleApprove}
          onClose={() => setShowReleaseModal(false)}
        />
      )}

      {showDisputeModal && (
        <DisputeModal 
          escrow={escrow}
          onClose={() => setShowDisputeModal(false)}
        />
      )}
    </div>
  );
}
