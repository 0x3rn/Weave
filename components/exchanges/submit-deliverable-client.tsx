"use client";

import { useState } from "react";
import { Exchange, ExchangeDeliverable, ExchangeReviewState } from "@/types";
import { uploadFile } from "@/app/actions/upload";
import { submitDeliverable } from "@/app/actions/deliverables";
import { requestRevision, acceptDelivery } from "@/app/actions/exchanges";
import { useRouter } from "next/navigation";
import { UploadCloud, File as FileIcon, X, CheckCircle, Loader2, Eye, Download, LockKeyhole } from "lucide-react";

interface SubmitDeliverableClientProps {
  exchange: Exchange;
  isProvider: boolean;
  deliveries: ExchangeDeliverable[];
  userId: string;
  reviewState: ExchangeReviewState;
}

export default function SubmitDeliverableClient({ exchange, isProvider, deliveries, userId, reviewState }: SubmitDeliverableClientProps) {
  const router = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [comments, setComments] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [revisionMessage, setRevisionMessage] = useState("");
  const [isRequestingRevision, setIsRequestingRevision] = useState(false);
  const [isAccepting, setIsAccepting] = useState(false);
  const [previewFile, setPreviewFile] = useState<ExchangeDeliverable["files"][number] | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const incoming = Array.from(e.target.files).filter(file => file.size > 0 && file.size <= 5 * 1024 * 1024);
      setFiles(prev => [...prev, ...incoming].slice(0, 20));
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (files.length === 0) {
      setError("Please select at least one file to submit.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const uploadedFiles = [];
      
      // Upload each file to Storage via Server Action
      for (const file of files) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("folder", `exchanges/${exchange.id}`);
        
        const result = await uploadFile(formData);
        if (!result.success || !result.url) {
          throw new Error(result.error || `Failed to upload ${file.name}`);
        }
        
        uploadedFiles.push({
          name: file.name,
          url: result.url,
          type: file.type || ({ txt: "text/plain", md: "text/markdown", json: "application/json", css: "text/css", js: "text/javascript", jsx: "text/javascript", ts: "text/typescript", tsx: "text/typescript" }[file.name.split(".").at(-1)?.toLowerCase() || ""] || "application/octet-stream"),
          size: file.size
        });
      }

      // Submit deliverable metadata to the application database
      const submitResult = await submitDeliverable(exchange.id, uploadedFiles, comments);
      
      if (!submitResult.success) {
        throw new Error(submitResult.error);
      }

      // Reset form & Refresh
      setFiles([]);
      setComments("");
      router.refresh();

    } catch (err: any) {
      setError(err.message || "An error occurred while submitting deliverables.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRequestRevision = async () => {
    if (!revisionMessage.trim()) {
      setError("Please provide feedback for the revision.");
      return;
    }

    setIsRequestingRevision(true);
    setError("");

    try {
      const result = await requestRevision(exchange.id, revisionMessage);
      if (!result.success) throw new Error(result.error);
      
      setRevisionMessage("");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to request revision");
    } finally {
      setIsRequestingRevision(false);
    }
  };

  const handleAcceptDelivery = async () => {
    if (!confirm("Submit your acceptance? Your decision stays private until every required reviewer decides.")) {
      return;
    }

    setIsAccepting(true);
    setError("");

    try {
      const result = await acceptDelivery(exchange.id);
      if (!result.success) throw new Error(result.error);
      
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to accept delivery");
      setIsAccepting(false);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const isMutual = !!exchange.isMutual;
  const myCurrentDelivery = deliveries.find(delivery => delivery.isCurrent && delivery.submittedBy === userId);

  const canSubmitStatus = exchange.status === "in_progress" || exchange.status === "revision_requested";
  const legacyCanSubmit = isMutual ? !(isProvider ? exchange.providerSubmittedAt : exchange.requesterSubmittedAt) : isProvider && !myCurrentDelivery;
  const canSubmit = canSubmitStatus && (exchange.pendingSubmissions ? exchange.pendingSubmissions.includes(userId) : legacyCanSubmit);
  const previewable = (type: string) => type.startsWith("image/") || type === "application/pdf" || type.startsWith("text/") || type === "application/json" || type === "application/javascript" || type === "application/typescript";

  return (
    <div className="space-y-8 max-w-3xl">
      <div className="rounded-[var(--radius-card)] border border-border bg-surface p-5 shadow-subtle">
        <div className="flex items-start gap-3"><LockKeyhole className="mt-0.5 h-5 w-5 shrink-0 text-primary" /><div><h2 className="font-bold text-heading">Atomic delivery · Round {reviewState.round}</h2><p className="mt-1 text-sm text-muted">Files stay sealed during commitment, open only for in-app review, and become downloadable only after every required reviewer accepts.</p></div></div>
        <div className="mt-4 grid gap-2 text-xs font-bold sm:grid-cols-3">
          <div className={`rounded-lg p-3 ${["commit", "revision"].includes(reviewState.phase) ? "bg-primary/10 text-primary" : "bg-surface-secondary text-muted"}`}>1. Commit work</div>
          <div className={`rounded-lg p-3 ${["review", "waiting_decisions"].includes(reviewState.phase) ? "bg-primary/10 text-primary" : "bg-surface-secondary text-muted"}`}>2. Private review</div>
          <div className={`rounded-lg p-3 ${reviewState.phase === "released" ? "bg-success/10 text-success" : "bg-surface-secondary text-muted"}`}>3. Atomic release</div>
        </div>
      </div>

      {exchange.status === "revision_requested" && reviewState.revisionFeedback.length > 0 && <div className="rounded-[var(--radius-card)] border border-amber-500/30 bg-amber-500/10 p-5"><h2 className="font-bold text-heading">Revision feedback</h2><div className="mt-3 space-y-2">{reviewState.revisionFeedback.map((item, index) => <p key={`${item.reviewerId}-${index}`} className="rounded-lg bg-surface p-3 text-sm text-body">{item.feedback}</p>)}</div></div>}
      {/* Provider/Requester Submit Form */}
      {canSubmit && (
        <div className="bg-surface border border-border rounded-[var(--radius-card)] p-6 shadow-subtle space-y-6">
          <div>
            <h2 className="text-xl font-bold text-heading flex items-center gap-2">
              Submit Work
              {isMutual && <span className="text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider bg-primary/10 text-primary">Commit Phase</span>}
            </h2>
            <p className="text-sm text-muted">Your files remain inaccessible to the other participant until the commit phase finishes.</p>
          </div>

          {error && (
            <div className="bg-error/10 text-error p-3 rounded-[var(--radius-button)] text-sm font-bold">
              {error}
            </div>
          )}

          <div className="space-y-4">
            {/* File Upload Zone */}
            <div className="border-2 border-dashed border-border rounded-[var(--radius-card)] p-8 text-center bg-surface-secondary relative hover:bg-surface transition-colors">
              <input 
                type="file" 
                multiple 
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                disabled={isSubmitting}
              />
              <div className="flex flex-col items-center gap-2">
                <UploadCloud className="w-10 h-10 text-primary" />
                <p className="text-body font-medium">Click or drag files here to upload</p>
                <p className="text-xs text-muted">Images, PDF, ZIP, text, JSON, CSS, JavaScript, and TypeScript · 5MB each</p>
              </div>
            </div>

            {/* Selected Files List */}
            {files.length > 0 && (
              <div className="space-y-2">
                {files.map((file, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-surface border border-border rounded-[var(--radius-button)]">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <FileIcon className="w-5 h-5 text-muted shrink-0" />
                      <div className="truncate">
                        <p className="text-sm font-bold text-heading truncate">{file.name}</p>
                        <p className="text-xs text-muted">{formatSize(file.size)}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => removeFile(idx)}
                      disabled={isSubmitting}
                      className="p-1 hover:bg-surface-secondary rounded-full text-muted hover:text-error transition-colors shrink-0"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Comments */}
            <div>
              <label className="block text-sm font-bold text-heading mb-2">Comments (Optional)</label>
              <textarea 
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="Add any notes about this submission..."
                className="w-full bg-surface-secondary border border-border rounded-[var(--radius-button)] p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-body min-h-[100px]"
                disabled={isSubmitting}
              />
            </div>

            <button
              onClick={handleSubmit}
              disabled={isSubmitting || files.length === 0}
              className="w-full py-3 bg-primary text-primary-foreground font-bold rounded-[var(--radius-button)] hover:bg-primary/90 transition-colors disabled:opacity-50 flex justify-center items-center gap-2"
            >
              {isSubmitting ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Submitting...</>
              ) : (
                "Submit Deliverables"
              )}
            </button>
          </div>
        </div>
      )}

      {/* Delivery History */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-heading">Delivery History</h2>
          {isMutual && ["in_progress", "revision_requested"].includes(exchange.status) && (
             <div className="text-sm font-bold text-amber-500 bg-amber-500/10 px-3 py-1 rounded-full flex items-center gap-2">
               <Loader2 className="w-4 h-4 animate-spin" />
               {canSubmit ? "Your submission is required" : "Your files are sealed while we wait"}
             </div>
          )}
        </div>
        
        {deliveries.length === 0 ? (
          <div className="p-8 text-center bg-surface-secondary border border-border rounded-[var(--radius-card)]">
            <p className="text-muted font-medium">No work has been submitted yet.</p>
          </div>
        ) : (
          deliveries.map((delivery) => {
            const isMyDelivery = delivery.submittedBy === userId;
            
            return (
            <div key={delivery.id} className="bg-surface border border-border rounded-[var(--radius-card)] p-6 shadow-subtle space-y-4 relative overflow-hidden">
              <div className={`absolute top-0 left-0 w-1 h-full ${isMyDelivery ? 'bg-primary' : 'bg-blue-500'}`} />
              
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-heading text-lg">
                    {isMutual ? (isMyDelivery ? "Your Submission" : "Their Submission") : `Version ${delivery.version}`}
                  </h3>
                  <p className="text-xs text-muted">Version {delivery.version} · Round {delivery.reviewRound || 1} · {new Date(delivery.uploadedAt).toLocaleString()}</p>
                </div>
                {delivery.version === deliveries[0].version && exchange.status === 'in_review' && (
                  <span className="px-2.5 py-1 bg-amber-500/10 text-amber-500 text-xs font-bold uppercase rounded-full">
                    Awaiting Review
                  </span>
                )}
              </div>

              {delivery.comments && (
                <div className="p-3 bg-surface-secondary rounded-[var(--radius-button)] text-sm text-body mt-4">
                  <span className="font-bold block mb-1">Notes:</span>
                  {delivery.comments}
                </div>
              )}

              <div className="space-y-2 mt-4">
                <span className="font-bold text-sm text-heading block">Files ({delivery.files.length}):</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {delivery.files.map((file, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-3 border border-border rounded-[var(--radius-button)] group">
                      <FileIcon className="w-5 h-5 text-muted group-hover:text-primary transition-colors shrink-0" />
                      <div className="min-w-0 flex-1 truncate">
                        <p className="text-sm font-bold text-heading truncate">{file.name}</p>
                        <p className="text-xs text-muted">{formatSize(file.size)}</p>
                      </div>
                      {!isMyDelivery && !reviewState.filesReleased && previewable(file.type) ? <button type="button" onClick={() => setPreviewFile(file)} className="rounded-lg p-2 text-primary hover:bg-primary/10" aria-label={`Preview ${file.name}`}><Eye className="h-4 w-4" /></button> : (isMyDelivery || reviewState.filesReleased) ? <a href={file.url} className="rounded-lg p-2 text-primary hover:bg-primary/10" aria-label={`Download ${file.name}`}><Download className="h-4 w-4" /></a> : <LockKeyhole className="h-4 w-4 text-muted" />}
                    </div>
                  ))}
                </div>
              </div>

              {/* Requester Review Actions (For standard exchanges, or if mutual and reviewing other party) */}
              {reviewState.canReview && !isMyDelivery && delivery.isCurrent && (
                <div className="mt-6 pt-6 border-t border-border">
                  <h4 className="font-bold text-heading mb-4">Review Submission</h4>
                  
                  {error && (
                    <div className="bg-error/10 text-error p-3 rounded-[var(--radius-button)] text-sm font-bold mb-4">
                      {error}
                    </div>
                  )}

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-bold text-heading mb-2">Request Revisions</label>
                      <textarea 
                        value={revisionMessage}
                        onChange={(e) => setRevisionMessage(e.target.value)}
                        placeholder="Detail what needs to be changed..."
                        className="w-full bg-surface-secondary border border-border rounded-[var(--radius-button)] p-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 text-body min-h-[80px]"
                        disabled={isRequestingRevision}
                      />
                    </div>
                    
                    <div className="flex gap-3">
                      <button
                        onClick={handleRequestRevision}
                        disabled={isRequestingRevision || !revisionMessage.trim()}
                        className="flex-1 py-2.5 bg-surface-secondary border border-border text-heading font-bold rounded-[var(--radius-button)] hover:border-amber-500 hover:text-amber-500 transition-colors disabled:opacity-50"
                      >
                        {isRequestingRevision ? "Requesting..." : "Request Revisions"}
                      </button>
                      <button
                        onClick={handleAcceptDelivery}
                        disabled={isAccepting || isRequestingRevision}
                        className="flex-1 py-2.5 bg-success text-success-foreground font-bold rounded-[var(--radius-button)] hover:bg-success/90 transition-colors disabled:opacity-50 flex justify-center items-center gap-2"
                      >
                        {isAccepting ? (
                          <><Loader2 className="w-4 h-4 animate-spin" /> Accepting...</>
                        ) : (
                          "Submit private acceptance"
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
            );
          })
        )}
      </div>
      {reviewState.phase === "waiting_decisions" && <div className="rounded-[var(--radius-card)] border border-primary/20 bg-primary/5 p-5 text-center"><CheckCircle className="mx-auto h-6 w-6 text-primary" /><p className="mt-2 font-bold text-heading">Your decision is recorded</p><p className="mt-1 text-sm text-muted">It remains private while the other reviewer decides.</p></div>}
      {previewFile && <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 p-3 backdrop-blur-sm" role="dialog" aria-modal="true"><div className="flex h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-[var(--radius-card)] border border-border bg-surface shadow-elevated"><div className="flex items-center justify-between gap-4 border-b border-border px-4 py-3"><div className="min-w-0"><p className="truncate font-bold text-heading">{previewFile.name}</p><p className="text-xs text-muted">Secure review preview · Download remains locked</p></div><button type="button" onClick={() => setPreviewFile(null)} className="rounded-full p-2 text-muted hover:bg-surface-secondary" aria-label="Close preview"><X className="h-5 w-5" /></button></div><div className="min-h-0 flex-1 bg-surface-secondary p-2">{previewFile.type.startsWith("image/") ? <div className="flex h-full items-center justify-center overflow-auto"><img src={`${previewFile.url}?mode=preview`} alt={previewFile.name} className="max-h-full max-w-full object-contain" /></div> : <iframe src={`${previewFile.url}?mode=preview`} title={previewFile.name} sandbox="" className="h-full w-full rounded-lg border-0 bg-white" />}</div></div></div>}
    </div>
  );
}
