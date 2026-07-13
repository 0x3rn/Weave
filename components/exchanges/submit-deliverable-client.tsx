"use client";

import { useState } from "react";
import { Exchange, ExchangeDeliverable } from "@/types";
import { uploadFile } from "@/app/actions/upload";
import { submitDeliverable } from "@/app/actions/deliverables";
import { requestRevision, acceptDelivery } from "@/app/actions/exchanges";
import { useRouter } from "next/navigation";
import { UploadCloud, File as FileIcon, X, CheckCircle, Loader2 } from "lucide-react";

interface SubmitDeliverableClientProps {
  exchange: Exchange;
  isProvider: boolean;
  deliveries: ExchangeDeliverable[];
  userId: string;
}

export default function SubmitDeliverableClient({ exchange, isProvider, deliveries, userId }: SubmitDeliverableClientProps) {
  const router = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [comments, setComments] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [revisionMessage, setRevisionMessage] = useState("");
  const [isRequestingRevision, setIsRequestingRevision] = useState(false);
  const [isAccepting, setIsAccepting] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(prev => [...prev, ...Array.from(e.target.files!)]);
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
          type: file.type,
          size: file.size
        });
      }

      // Submit deliverable metadata to Firestore
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
    if (!confirm("Are you sure you want to accept this delivery? Escrow will be released to the provider and the exchange will be marked as completed.")) {
      return;
    }

    setIsAccepting(true);
    setError("");

    try {
      const result = await acceptDelivery(exchange.id);
      if (!result.success) throw new Error(result.error);
      
      router.refresh();
      // Wait a bit, then redirect to overview or a review page
      setTimeout(() => {
        router.push(`/exchanges/${exchange.id}`);
      }, 1000);
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
  const isRequester = exchange.requesterId === userId;
  const hasSubmitted = isMutual ? 
    (isProvider ? !!exchange.providerSubmittedAt : !!exchange.requesterSubmittedAt) : 
    (deliveries.length > 0);

  const canSubmit = isMutual ? 
    (!hasSubmitted && exchange.status !== "completed" && exchange.status !== "cancelled") :
    (isProvider && exchange.status !== "completed" && exchange.status !== "cancelled");

  // Filter deliveries based on Commit-Reveal:
  // If mutual, you can only see their deliveries if both have submitted.
  // Otherwise, you only see your own.
  const visibleDeliveries = deliveries.filter(d => {
    if (!isMutual) return true; // Standard exchange: both can see
    
    const isMyDelivery = d.submittedBy === userId;
    const bothSubmitted = exchange.providerSubmittedAt && exchange.requesterSubmittedAt;
    
    if (bothSubmitted) return true;
    return isMyDelivery;
  });

  return (
    <div className="space-y-8 max-w-3xl">
      {/* Provider/Requester Submit Form */}
      {canSubmit && (
        <div className="bg-surface border border-border rounded-[var(--radius-card)] p-6 shadow-subtle space-y-6">
          <div>
            <h2 className="text-xl font-bold text-heading flex items-center gap-2">
              Submit Work
              {isMutual && <span className="text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider bg-primary/10 text-primary">Commit Phase</span>}
            </h2>
            <p className="text-sm text-muted">Upload your deliverables for the requester to review.</p>
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
                <p className="text-xs text-muted">Max file size 5MB</p>
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
          {isMutual && exchange.status === 'in_progress' && (
             <div className="text-sm font-bold text-amber-500 bg-amber-500/10 px-3 py-1 rounded-full flex items-center gap-2">
               <Loader2 className="w-4 h-4 animate-spin" />
               Waiting for {hasSubmitted ? "the other party" : "you"} to submit
             </div>
          )}
        </div>
        
        {visibleDeliveries.length === 0 ? (
          <div className="p-8 text-center bg-surface-secondary border border-border rounded-[var(--radius-card)]">
            <p className="text-muted font-medium">No work has been submitted yet.</p>
          </div>
        ) : (
          visibleDeliveries.map((delivery) => {
            const isMyDelivery = delivery.submittedBy === userId;
            
            return (
            <div key={delivery.id} className="bg-surface border border-border rounded-[var(--radius-card)] p-6 shadow-subtle space-y-4 relative overflow-hidden">
              <div className={`absolute top-0 left-0 w-1 h-full ${isMyDelivery ? 'bg-primary' : 'bg-blue-500'}`} />
              
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-heading text-lg">
                    {isMutual ? (isMyDelivery ? "Your Submission" : "Their Submission") : `Version ${delivery.version}`}
                  </h3>
                  <p className="text-xs text-muted">Submitted on {new Date(delivery.uploadedAt).toLocaleString()}</p>
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
                    <a 
                      key={idx} 
                      href={file.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 border border-border rounded-[var(--radius-button)] hover:border-primary/50 hover:bg-primary/5 transition-colors group"
                    >
                      <FileIcon className="w-5 h-5 text-muted group-hover:text-primary transition-colors shrink-0" />
                      <div className="truncate">
                        <p className="text-sm font-bold text-heading truncate">{file.name}</p>
                        <p className="text-xs text-muted">{formatSize(file.size)}</p>
                      </div>
                    </a>
                  ))}
                </div>
              </div>

              {/* Requester Review Actions (For standard exchanges, or if mutual and reviewing other party) */}
              {exchange.status === 'in_review' && (!isMyDelivery || !isMutual) && (!isProvider || isMutual) && (
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
                        className="flex-1 py-2.5 bg-success text-white font-bold rounded-[var(--radius-button)] hover:bg-success/90 transition-colors disabled:opacity-50 flex justify-center items-center gap-2"
                      >
                        {isAccepting ? (
                          <><Loader2 className="w-4 h-4 animate-spin" /> Accepting...</>
                        ) : (
                          "Accept & Release Escrow"
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
    </div>
  );
}
