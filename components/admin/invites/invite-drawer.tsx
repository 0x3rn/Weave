"use client";

import { X, ExternalLink, Mail, Check, AlertTriangle, MessageSquare } from "lucide-react";
import { useState, useEffect } from "react";
import { saveInternalNotes } from "@/app/actions/admin/invites";
import Link from "next/link";

interface InviteDrawerProps {
  application: any | null;
  isOpen: boolean;
  onClose: () => void;
  onApprove: (app: any) => void;
  onReject: (app: any) => void;
  onNotesSaved: (id: string, notes: string) => void;
}

export default function InviteDrawer({ application, isOpen, onClose, onApprove, onReject, onNotesSaved }: InviteDrawerProps) {
  const [notes, setNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Sync internal notes state when application changes
  useEffect(() => {
    if (application) {
      setNotes(application.internalNotes || "");
      setSaveSuccess(false);
    }
  }, [application]);

  if (!isOpen || !application) return null;

  const handleSaveNotes = async () => {
    setIsSaving(true);
    const result = await saveInternalNotes(application.id, notes);
    setIsSaving(false);
    if (result.success) {
      setSaveSuccess(true);
      onNotesSaved(application.id, notes);
      setTimeout(() => setSaveSuccess(false), 2000);
    }
  };

  return (
    <>
      {/* Backdrop overlay */}
      <div 
        className="fixed inset-0 bg-black/50 z-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Drawer Panel */}
      <div className="fixed inset-y-0 right-0 z-[60] w-full max-w-2xl bg-surface border-l border-border shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out">
        
        {/* Header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-border bg-surface-secondary">
          <div>
            <h2 className="text-lg font-bold text-heading">Applicant Information</h2>
            <p className="text-xs text-muted">Applied on {new Date(application.createdAt).toLocaleDateString()}</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-border text-muted hover:text-heading transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          
          {/* Status Badge */}
          <div className="flex justify-between items-center bg-background border border-border p-4 rounded-[var(--radius-card)]">
            <span className="text-sm font-semibold text-heading">Current Status</span>
            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
              application.status === 'approved' ? 'bg-success/20 text-success' :
              application.status === 'rejected' ? 'bg-error/20 text-error' :
              'bg-warning/20 text-warning'
            }`}>
              {application.status || 'pending'}
            </span>
          </div>

          {/* Personal Info */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-muted uppercase tracking-wider border-b border-border pb-2 flex items-center gap-2">
              <UserIcon /> Personal
            </h3>
            <div className="grid grid-cols-2 gap-y-4 gap-x-6">
              <div>
                <span className="text-xs text-muted block mb-1">Full Name</span>
                <span className="text-sm font-medium text-heading">{application.fullName}</span>
              </div>
              <div>
                <span className="text-xs text-muted block mb-1">Email</span>
                <a href={`mailto:${application.email}`} className="text-sm font-medium text-primary hover:underline flex items-center gap-1">
                  <Mail className="w-3 h-3" /> {application.email}
                </a>
              </div>
              <div>
                <span className="text-xs text-muted block mb-1">Country</span>
                <span className="text-sm font-medium text-heading">{application.country}</span>
              </div>
              <div>
                <span className="text-xs text-muted block mb-1">Timezone</span>
                <span className="text-sm font-medium text-heading truncate block" title={application.timeZone}>{application.timeZone}</span>
              </div>
            </div>
          </div>

          {/* Professional Info */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-muted uppercase tracking-wider border-b border-border pb-2">Professional</h3>
            <div className="grid grid-cols-2 gap-y-4 gap-x-6">
              <div>
                <span className="text-xs text-muted block mb-1">Profession</span>
                <span className="text-sm font-medium text-heading">{application.profession}</span>
              </div>
              <div>
                <span className="text-xs text-muted block mb-1">Experience</span>
                <span className="text-sm font-medium text-heading">{application.experience}</span>
              </div>
              <div className="col-span-2">
                <span className="text-xs text-muted block mb-2">Links</span>
                <div className="flex gap-3">
                  {application.portfolio ? (
                    <a href={application.portfolio} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 bg-background border border-border rounded-md text-xs font-medium text-heading hover:border-primary transition-colors flex items-center gap-1">
                      Portfolio <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : <span className="text-xs text-muted line-through">Portfolio</span>}
                  
                  {application.linkedIn ? (
                    <a href={application.linkedIn} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 bg-background border border-border rounded-md text-xs font-medium text-heading hover:border-primary transition-colors flex items-center gap-1">
                      LinkedIn <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : <span className="text-xs text-muted line-through">LinkedIn</span>}

                  {application.github ? (
                    <a href={application.github} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 bg-background border border-border rounded-md text-xs font-medium text-heading hover:border-primary transition-colors flex items-center gap-1">
                      GitHub <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : <span className="text-xs text-muted line-through">GitHub</span>}
                </div>
              </div>
            </div>
          </div>

          {/* Skills */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-muted uppercase tracking-wider border-b border-border pb-2">Skills</h3>
            
            <div className="grid grid-cols-2 gap-6">
              <div>
                <span className="text-xs font-medium text-success block mb-2 flex items-center gap-1">
                  <Check className="w-3 h-3" /> Skills Offered
                </span>
                <div className="flex flex-wrap gap-2">
                  {application.skillsOffered?.length > 0 ? application.skillsOffered.map((skill: string) => (
                    <span key={skill} className="bg-surface-secondary border border-border text-heading text-xs px-2 py-1 rounded-[var(--radius-badge)]">
                      {skill}
                    </span>
                  )) : <span className="text-xs text-muted">None specified</span>}
                </div>
              </div>

              <div>
                <span className="text-xs font-medium text-info block mb-2 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> Skills Needed
                </span>
                <div className="flex flex-wrap gap-2">
                  {application.skillsLookingFor?.length > 0 ? application.skillsLookingFor.map((skill: string) => (
                    <span key={skill} className="bg-surface-secondary border border-border text-heading text-xs px-2 py-1 rounded-[var(--radius-badge)]">
                      {skill}
                    </span>
                  )) : <span className="text-xs text-muted">None specified</span>}
                </div>
              </div>
            </div>
          </div>

          {/* Why Join */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-muted uppercase tracking-wider border-b border-border pb-2 flex items-center gap-2">
              <MessageSquare className="w-4 h-4" /> Why They Want To Join
            </h3>
            <div className="bg-background border border-border rounded-[var(--radius-input)] p-4 text-sm text-body whitespace-pre-wrap leading-relaxed">
              {application.whyJoin}
            </div>
          </div>

          {/* Internal Notes */}
          <div className="space-y-4 pt-4">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <h3 className="text-sm font-bold text-muted uppercase tracking-wider">Internal Notes</h3>
              <span className="text-xs text-muted italic">Private - Only visible to admins</span>
            </div>
            <textarea 
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add private notes about this applicant..."
              rows={4}
              className="w-full bg-background border border-border rounded-[var(--radius-input)] p-3 text-sm focus:outline-none focus:border-primary text-body resize-y"
            />
            <div className="flex justify-end">
              <button 
                onClick={handleSaveNotes}
                disabled={isSaving}
                className="px-4 py-2 bg-surface-secondary border border-border rounded-md text-sm font-medium hover:bg-border transition-colors flex items-center gap-2"
              >
                {isSaving ? "Saving..." : saveSuccess ? <><Check className="w-4 h-4 text-success" /> Saved</> : "Save Notes"}
              </button>
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="h-20 border-t border-border bg-surface-secondary px-6 flex items-center justify-between">
          <div className="text-xs text-muted">
            Via: {application.heardAboutUs || 'Unknown'}
          </div>
          
          <div className="flex gap-3">
            <button 
              onClick={() => onReject(application)}
              disabled={application.status === 'rejected'}
              className="px-6 py-2 border border-error text-error font-medium rounded-[var(--radius-button)] hover:bg-error/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Reject
            </button>
            <button 
              onClick={() => onApprove(application)}
              disabled={application.status === 'approved'}
              className="px-6 py-2 bg-primary text-surface font-medium rounded-[var(--radius-button)] hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Approve
            </button>
          </div>
        </div>

      </div>
    </>
  );
}

// Simple internal icon for layout
function UserIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
  );
}
