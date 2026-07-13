"use client";

import { useState } from "react";
import { MarketplaceApplication, MarketplaceRequest } from "@/types";
import { BadgeCheck, MessageSquare, Check, X, Star, Clock, AlertCircle } from "lucide-react";
import Link from "next/link";
import { updateApplicationStatus } from "@/app/actions/applications";
import toast from "react-hot-toast";

interface EnrichedApplication extends MarketplaceApplication {
  applicant: {
    name: string;
    avatar: string | null;
    trustScore: number;
    stats: {
      rating: number;
      exchangesCompleted: number;
    };
  } | null;
}

interface ApplicationsClientProps {
  request: MarketplaceRequest;
  initialApplications: EnrichedApplication[];
}

export default function ApplicationsClient({ request, initialApplications }: ApplicationsClientProps) {
  const [applications, setApplications] = useState(initialApplications);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const handleUpdateStatus = async (appId: string, newStatus: string) => {
    setProcessingId(appId);
    try {
      const result = await updateApplicationStatus(appId, newStatus) as any;
      if (result.success) {
        setApplications(apps => 
          apps.map(app => app.id === appId ? { ...app, status: newStatus as any } : app)
        );
        toast.success(`Application marked as ${newStatus}`);
      } else {
        toast.error(result.error || "Failed to update status");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-xl font-bold text-heading">Applications</h2>
          <p className="text-sm text-muted mt-1">Review proposals for "{request.title}"</p>
        </div>
        <div className="text-sm font-medium px-3 py-1 bg-surface-secondary border border-border rounded-full">
          {applications.length} {applications.length === 1 ? 'Applicant' : 'Applicants'}
        </div>
      </div>

      {applications.length === 0 ? (
        <div className="bg-surface border border-border rounded-[var(--radius-card)] p-12 text-center">
          <div className="w-16 h-16 bg-surface-secondary rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="w-8 h-8 text-muted" />
          </div>
          <h3 className="text-lg font-bold text-heading mb-2">No applications yet</h3>
          <p className="text-muted max-w-md mx-auto">
            Your request is live on the marketplace. You'll receive a notification when professionals start applying.
          </p>
        </div>
      ) : (
        <div className="bg-surface border border-border rounded-[var(--radius-card)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-secondary/50 text-xs uppercase tracking-wider text-muted font-bold border-b border-border">
                  <th className="px-6 py-4">Applicant</th>
                  <th className="px-6 py-4">Trust / Stats</th>
                  <th className="px-6 py-4">Proposal</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {applications.map((app) => (
                  <tr key={app.id} className="hover:bg-surface-secondary/30 transition-colors">
                    {/* Applicant */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {app.applicant?.avatar ? (
                          <img src={app.applicant.avatar} alt="" className="w-10 h-10 rounded-full object-cover border border-border" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-heading font-bold">
                            {app.applicant?.name?.charAt(0) || "?"}
                          </div>
                        )}
                        <div>
                          <Link href={`/profile/${app.applicantId}`} className="font-bold text-heading hover:text-primary transition-colors flex items-center gap-1">
                            {app.applicant?.name || "Unknown User"}
                          </Link>
                          <div className="text-xs text-muted mt-0.5">
                            Available: {app.availability}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Trust / Stats */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-success text-sm">{app.applicant?.trustScore || 0} Trust</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted">
                        <span className="flex items-center gap-1">
                          <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                          {app.applicant?.stats.rating.toFixed(1) || "0.0"}
                        </span>
                        <span>{app.applicant?.stats.exchangesCompleted || 0} exchanges</span>
                      </div>
                    </td>

                    {/* Proposal */}
                    <td className="px-6 py-4">
                      <div className="text-sm text-heading font-medium mb-1">
                        {app.estimatedHours} Hours
                      </div>
                      <div className="text-xs text-muted max-w-[200px] truncate" title={app.coverMessage}>
                        {app.coverMessage}
                      </div>
                      {app.portfolioLinks && app.portfolioLinks.length > 0 && (
                        <div className="mt-2 flex gap-2">
                          {app.portfolioLinks.slice(0, 2).map((link, i) => (
                            <a key={i} href={link} target="_blank" rel="noreferrer" className="text-[10px] uppercase font-bold px-2 py-1 bg-surface-secondary rounded text-primary hover:bg-primary/10 transition-colors">
                              Link {i + 1}
                            </a>
                          ))}
                        </div>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold capitalize
                        ${app.status === 'pending' ? 'bg-secondary text-heading' : ''}
                        ${app.status === 'shortlisted' ? 'bg-blue-500/10 text-blue-500' : ''}
                        ${app.status === 'accepted' ? 'bg-primary/10 text-primary' : ''}
                        ${app.status === 'rejected' ? 'bg-error/10 text-error' : ''}
                      `}>
                        {app.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link 
                          href={`/messages?user=${app.applicantId}`}
                          className="p-2 text-muted hover:text-primary transition-colors bg-surface-secondary hover:bg-primary/10 rounded-lg"
                          title="Message Applicant"
                        >
                          <MessageSquare className="w-4 h-4" />
                        </Link>
                        
                        {app.status === 'pending' && (
                          <button
                            disabled={processingId === app.id}
                            onClick={() => handleUpdateStatus(app.id, 'shortlisted')}
                            className="p-2 text-muted hover:text-blue-500 transition-colors bg-surface-secondary hover:bg-blue-500/10 rounded-lg disabled:opacity-50"
                            title="Shortlist"
                          >
                            <Star className="w-4 h-4" />
                          </button>
                        )}
                        
                        {(app.status === 'pending' || app.status === 'shortlisted') && (
                          <>
                            <button
                              disabled={processingId === app.id}
                              onClick={() => handleUpdateStatus(app.id, 'rejected')}
                              className="p-2 text-muted hover:text-error transition-colors bg-surface-secondary hover:bg-error/10 rounded-lg disabled:opacity-50"
                              title="Reject"
                            >
                              <X className="w-4 h-4" />
                            </button>
                            <button
                              disabled={processingId === app.id}
                              onClick={() => {
                                if (confirm("Are you sure you want to accept this proposal and begin the exchange?")) {
                                  handleUpdateStatus(app.id, 'accepted');
                                }
                              }}
                              className="px-3 py-2 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold rounded-lg transition-colors shadow-sm disabled:opacity-50"
                            >
                              Accept Proposal
                            </button>
                          </>
                        )}
                        
                        {app.status === 'accepted' && (
                          <span className="text-xs font-bold text-primary flex items-center gap-1">
                            <Check className="w-4 h-4" /> Accepted
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
