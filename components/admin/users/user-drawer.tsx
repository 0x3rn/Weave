"use client";

import { useState, useRef } from "react";
import { User } from "@/types";

import { 
  X, BadgeCheck, MapPin, ExternalLink, MessageSquare, ShieldAlert, ShieldCheck, Shield, Ban, UserCheck, Database
} from "lucide-react";
import Link from "next/link";
import { saveAdminUserNotes, updateUserStatus, updateUserVerification, adjustUserSkillHours, deleteUserAccount } from "@/app/actions/admin/users";
import { calculateTrustScore } from "@/lib/user-metrics";
import { startDirectConversation } from "@/app/actions/messages";
import { useRouter } from "next/navigation";
import { useAdminDialog } from "@/lib/use-admin-dialog";

interface UserDrawerProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (updatedUser: User) => void;
}

export default function UserDrawer({ user, isOpen, onClose, onUpdate }: UserDrawerProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "notes" | "actions">("overview");
  
  const [notes, setNotes] = useState(user?.adminNotes || "");
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  
  const [isAdjustingHours, setIsAdjustingHours] = useState(false);
  const [hoursDelta, setHoursDelta] = useState(0);
  const [hoursReason, setHoursReason] = useState("");

  const router = useRouter();
  const busyRef = useRef(false);
  const operationId = useRef("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const dialog = useAdminDialog(isOpen, () => { if (!busyRef.current) onClose(); });
  if (!user) return null;
  const run = async (operation: () => Promise<void>) => {
    if (busyRef.current) return;
    busyRef.current = true; setBusy(true); setError("");
    try { await operation(); } catch(e) { setError(e instanceof Error ? e.message : "Operation failed. Retry."); }
    finally { busyRef.current = false; setBusy(false); setIsSavingNotes(false); }
  };
  const handleSaveNotes = () => run(async () => {
    setIsSavingNotes(true);
    const result = await saveAdminUserNotes(user.uid, notes);
    if (!result.success) throw new Error(result.error);
    onUpdate({ ...user, adminNotes: notes });
  });
  const handleStatusChange = (status: "active" | "suspended" | "banned") => run(async () => {
    if (!confirm("Change this member's status to " + status + "?")) return;
    const result = await updateUserStatus(user.uid, status);
    if (!result.success) throw new Error(result.error);
    onUpdate({ ...user, status });
  });
  const handleVerificationToggle = () => run(async () => {
    if (!confirm(user.isVerified ? "Remove this member's verified badge?" : "Grant this member a verified badge?")) return;
    const result = await updateUserVerification(user.uid, !user.isVerified);
    if (!result.success) throw new Error(result.error);
    onUpdate({ ...user, isVerified: !user.isVerified });
  });
  const handleAdjustHours = () => run(async () => {
    if (!Number.isInteger(hoursDelta) || !hoursDelta || !hoursReason.trim()) throw new Error("Enter whole Skill Hours and a reason.");
    operationId.current ||= crypto.randomUUID();
    const result = await adjustUserSkillHours(user.uid, hoursDelta, hoursReason, operationId.current);
    if (!result.success) throw new Error(result.error);
    onUpdate({ ...user, skillHours: result.newBalance });
    operationId.current = ""; setHoursDelta(0); setHoursReason(""); setIsAdjustingHours(false);
  });
  const handleMessage = () => run(async () => {
    const result = await startDirectConversation(user.uid);
    if (!result.success || !result.conversationId) throw new Error(result.error || "Could not open conversation");
    router.push("/messages/" + result.conversationId);
  });
  const handleDelete = () => run(async () => {
    if (!confirm("Schedule deletion after a 14-day recovery period? Active exchanges, disputes, and subscriptions must be resolved. Required ledger records will be retained.")) return;
    const result = await deleteUserAccount(user.uid);
    if (!result.success) throw new Error(result.error);
    onUpdate({ ...user, status: "deletion_pending" });
  });

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 transition-opacity"
          onClick={() => { if (!busyRef.current) onClose(); }}
        />
      )}

      {/* Drawer */}
      <div 
        ref={dialog}
        role="dialog"
        aria-modal="true"
        aria-label="Manage member"
        tabIndex={-1}
        className={`fixed top-0 right-0 h-full w-full sm:w-[500px] bg-surface border-l border-border shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="p-6 border-b border-border flex items-start justify-between bg-surface-secondary">
          <div className="flex gap-4">
            {user.photoURL ? (
              <img src={user.photoURL} alt={user.fullName} className="w-16 h-16 rounded-full object-cover border border-border shadow-sm" />
            ) : (
              <div className="w-16 h-16 rounded-full bg-background border border-border shadow-sm flex items-center justify-center text-xl font-bold text-heading">
                {user.fullName.charAt(0)}
              </div>
            )}
            <div>
              <h2 className="text-xl font-bold text-heading flex items-center gap-2">
                {user.fullName}
                {user.isVerified && <BadgeCheck className="w-5 h-5 text-primary" />}
              </h2>
              <p className="text-sm text-body">{user.headline || user.profession || "No headline"}</p>
              
              <div className="flex items-center gap-3 mt-2 text-xs font-semibold">
                <span className={`inline-flex items-center gap-1 ${
                    calculateTrustScore(user) >= 90 ? 'text-success' :
                    calculateTrustScore(user) >= 70 ? 'text-info' :
                    calculateTrustScore(user) >= 40 ? 'text-warning' :
                    'text-error'
                  }`}>
                  {calculateTrustScore(user) >= 70 ? <ShieldCheck className="w-3.5 h-3.5" /> : 
                   calculateTrustScore(user) >= 40 ? <Shield className="w-3.5 h-3.5" /> : 
                   <ShieldAlert className="w-3.5 h-3.5" />}
                  Trust: {calculateTrustScore(user)}
                </span>
                <span className="text-muted">•</span>
                <span className="text-muted flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {user.country || "Unknown"}
                </span>
              </div>
            </div>
          </div>
          <button 
            aria-label="Close member details"
            onClick={() => { if (!busyRef.current) onClose(); }}
            className="p-2 text-muted hover:text-heading hover:bg-background rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Actions Bar */}
        <div className="px-6 py-3 border-b border-border bg-background flex items-center gap-2 overflow-x-auto">
          <Link href={`/u/${user.username}`} target="_blank" className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-surface border border-border hover:border-primary transition-colors text-xs font-semibold text-heading">
            <ExternalLink className="w-3.5 h-3.5" /> View Public
          </Link>
          <button onClick={handleMessage} disabled={busy} className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-surface border border-border hover:border-primary transition-colors text-xs font-semibold text-heading">
            <MessageSquare className="w-3.5 h-3.5" /> Message
          </button>
        </div>

        {error && <p role="alert" className="p-4 text-sm text-error">{error}</p>}
        {/* Tabs */}
        <div className="flex px-6 border-b border-border bg-surface-secondary">
          <button 
            onClick={() => setActiveTab("overview")}
            className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${activeTab === "overview" ? "border-primary text-primary" : "border-transparent text-muted hover:text-heading"}`}
          >
            Overview
          </button>
          <button 
            onClick={() => setActiveTab("notes")}
            className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${activeTab === "notes" ? "border-primary text-primary" : "border-transparent text-muted hover:text-heading"}`}
          >
            Notes
          </button>
          <button 
            onClick={() => setActiveTab("actions")}
            className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${activeTab === "actions" ? "border-error text-error" : "border-transparent text-muted hover:text-error"}`}
          >
            Actions
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-surface">
          
          {activeTab === "overview" && (
            <>
              {/* Account Info */}
              <section>
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted mb-4">Account Information</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted">User ID</span>
                    <span className="font-mono text-xs">{user.uid}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">Email</span>
                    <span className="text-heading font-medium">{user.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">Username</span>
                    <span className="text-heading font-medium">@{user.username}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">Joined</span>
                    <span className="text-heading font-medium">{new Date(user.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">Last Active</span>
                    <span className="text-heading font-medium">{user.lastActive ? new Date(user.lastActive).toLocaleString() : 'Never'}</span>
                  </div>
                </div>
              </section>

              <hr className="border-border" />

              {/* Skill Hours */}
              <section>
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted mb-4 flex justify-between items-center">
                  Skill Hours
                  <button onClick={() => {setActiveTab("actions"); setIsAdjustingHours(true);}} className="text-primary hover:underline">Adjust</button>
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-background border border-border rounded-md p-3">
                    <div className="text-xs text-muted mb-1">Current Balance</div>
                    <div className="text-xl font-mono font-bold text-heading">{user.skillHours || 0}</div>
                  </div>
                  <div className="bg-background border border-border rounded-md p-3">
                    <div className="text-xs text-muted mb-1">Lifetime Earned</div>
                    <div className="text-xl font-mono font-bold text-success">{user.stats?.skillHoursEarned || 0}</div>
                  </div>
                </div>
              </section>

              <hr className="border-border" />

              {/* Stats */}
              <section>
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted mb-4">Exchange Statistics</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted">Completed Exchanges</span>
                    <span className="text-heading font-mono">{user.stats?.exchangesCompleted || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">Completion Rate</span>
                    <span className="text-heading font-mono">{user.stats?.completionRate || 0}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">Average Rating</span>
                    <span className="text-heading font-mono">{user.stats?.rating || 0} ({user.stats?.reviewsCount || 0})</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">Response Time</span>
                    <span className="text-heading font-mono">{user.stats?.responseTimeHours || 0}h</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">Repeat Collaborators</span>
                    <span className="text-heading font-mono">{user.stats?.repeatCollaborations || 0}</span>
                  </div>
                </div>
              </section>
            </>
          )}

          {activeTab === "notes" && (
            <section className="h-full flex flex-col">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted mb-4">Private Admin Notes</h3>
              <p className="text-xs text-muted mb-4">Only visible to administrators and moderators. Use this to track warnings, manual verifications, or community feedback.</p>
              <textarea 
                className="w-full flex-1 min-h-[300px] bg-background border border-border rounded-[var(--radius-input)] p-4 text-sm text-body focus:outline-none focus:border-primary resize-none"
                placeholder="Add notes about this user..."
                aria-label="Private admin notes"
                disabled={busy}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
              <div className="mt-4 flex justify-end">
                <button 
                  onClick={handleSaveNotes}
                  disabled={busy || isSavingNotes || notes === (user.adminNotes || "")}
                  className="px-4 py-2 bg-primary text-background font-semibold rounded-[var(--radius-button)] disabled:opacity-50"
                >
                  {isSavingNotes ? "Saving..." : "Save Notes"}
                </button>
              </div>
            </section>
          )}

          {activeTab === "actions" && (
            <section className="space-y-8">
              
              {/* Adjust Hours */}
              {isAdjustingHours && (
                <div className="bg-background border border-border p-4 rounded-[var(--radius-card)]">
                  <h3 className="text-sm font-bold text-heading mb-3 flex items-center gap-2"><Database className="w-4 h-4"/> Adjust Skill Hours</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-muted mb-1">Amount (Negative to debit)</label>
                      <input 
                        type="number" 
                        value={hoursDelta} 
                        disabled={busy}
                        onChange={(e) => { setHoursDelta(Number(e.target.value)); operationId.current = ""; }}
                        className="w-full bg-surface border border-border rounded-[var(--radius-input)] p-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-muted mb-1">Reason for Ledger</label>
                      <input 
                        type="text" 
                        disabled={busy}
                        value={hoursReason}
                        onChange={(e) => { setHoursReason(e.target.value); operationId.current = ""; }}
                        placeholder="e.g. Refund for disputed exchange"
                        className="w-full bg-surface border border-border rounded-[var(--radius-input)] p-2 text-sm"
                      />
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                      <button onClick={() => setIsAdjustingHours(false)} className="px-3 py-1.5 text-xs font-semibold text-muted hover:text-heading">Cancel</button>
                      <button disabled={busy} onClick={handleAdjustHours} className="px-3 py-1.5 text-xs font-semibold bg-primary text-background rounded">Confirm</button>
                    </div>
                  </div>
                </div>
              )}

              {/* Status Actions */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted mb-4">Verification & Status</h3>
                <div className="space-y-2">
                  <button 
                    disabled={busy} onClick={handleVerificationToggle}
                    className="w-full flex items-center gap-3 p-3 rounded-md bg-background border border-border hover:border-primary transition-colors text-left"
                  >
                    <UserCheck className="w-4 h-4 text-primary" />
                    <div>
                      <div className="text-sm font-semibold text-heading">{user.isVerified ? "Remove Verification" : "Verify User"}</div>
                      <div className="text-xs text-muted">{user.isVerified ? "Revoke trusted badge" : "Manually grant identity verification"}</div>
                    </div>
                  </button>
                  
                  {user.status !== "suspended" ? (
                    <button 
                      disabled={busy} onClick={() => handleStatusChange("suspended")}
                      className="w-full flex items-center gap-3 p-3 rounded-md bg-background border border-border hover:border-primary transition-colors text-left"
                    >
                      <ShieldAlert className="w-4 h-4 text-warning" />
                      <div>
                        <div className="text-sm font-semibold text-warning">Suspend Account</div>
                        <div className="text-xs text-muted">Temporarily block login and exchanges</div>
                      </div>
                    </button>
                  ) : (
                    <button 
                      onClick={() => handleStatusChange("active")}
                      className="w-full flex items-center gap-3 p-3 rounded-md bg-background border border-border hover:border-success transition-colors text-left"
                    >
                      <ShieldAlert className="w-4 h-4 text-success" />
                      <div>
                        <div className="text-sm font-semibold text-success">Unsuspend Account</div>
                        <div className="text-xs text-muted">Restore full platform access</div>
                      </div>
                    </button>
                  )}
                </div>
              </div>

              {/* Danger Zone */}
              {user.status === "active" && <button disabled={busy} onClick={handleDelete} className="w-full p-3 border border-error text-error rounded-md text-left">Schedule account deletion</button>}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-error mb-4">Danger Zone</h3>
                <div className="space-y-2">
                  {user.status !== "banned" && (
                    <button 
                      onClick={() => handleStatusChange("banned")}
                      className="w-full flex items-center gap-3 p-3 rounded-md bg-error/5 border border-error/20 hover:bg-error/10 transition-colors text-left"
                    >
                      <Ban className="w-4 h-4 text-error" />
                      <div>
                        <div className="text-sm font-semibold text-error">Ban Permanently</div>
                        <div className="text-xs text-error/70">Prevent any future access or registration</div>
                      </div>
                    </button>
                  )}
                </div>
              </div>
            </section>
          )}

        </div>
      </div>
    </>
  );
}
