import { getExchange } from "@/app/actions/exchanges";
import { getCurrentUserId } from "@/app/actions/user";
import { notFound, redirect } from "next/navigation";
import { Clock, CheckCircle, ShieldCheck, FileText, LayoutList, MessageSquare, Milestone, AlertTriangle, ShieldAlert } from "lucide-react";
import Link from "next/link";
import CancelExchange from "@/components/exchanges/cancel-exchange";

export default async function ExchangeOverviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const userId = await getCurrentUserId();
  
  if (!userId) {
    redirect("/api/auth/logout");
  }

  const result = await getExchange(id);

  if (!result.success || !result.exchange) {
    notFound();
  }

  const { exchange, requester, provider } = result;
  if (exchange.status === "pending_proposal") redirect(`/exchanges/${id}/start`);
  const isRequester = userId === exchange.requesterId;
  const nextAction = exchange.status === "in_review"
    ? exchange.isMutual ? "Review the other participant's work and submit your private decision." : isRequester ? "Review the submitted work and accept it or request a revision." : "Your work is awaiting the requester's review."
    : exchange.status === "revision_requested" ? exchange.pendingSubmissions?.includes(userId) ? "Address the revealed feedback and commit a revised submission." : "Waiting for the requested revisions before review reopens."
    : exchange.status === "disputed" ? "The exchange is frozen while the dispute is reviewed."
    : isRequester ? "Track progress, answer questions, and review milestones." : "Confirm the scope, add milestones, and submit your work when ready.";
  const health = exchange.status === "disputed" ? { label: "Needs attention", className: "text-error bg-error/10", icon: AlertTriangle } : exchange.deadline && new Date(exchange.deadline).getTime() < Date.now() && exchange.status !== "completed" ? { label: "Past deadline", className: "text-amber-600 bg-amber-500/10", icon: Clock } : { label: "On track", className: "text-success bg-success/10", icon: CheckCircle };
  const HealthIcon = health.icon;

  return (
    <div className="max-w-4xl space-y-8">
      <section className="rounded-[var(--radius-card)] border border-primary/20 bg-primary/5 p-5">
        <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-wider text-primary">Your next step</p><p className="mt-1 font-medium text-heading">{nextAction}</p></div><span className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${health.className}`}><HealthIcon className="h-3.5 w-3.5" />{health.label}</span></div>
        <div className="mt-4 flex flex-wrap gap-3"><Link href={`/exchanges/${id}/messages`} className="flex items-center gap-2 rounded-lg bg-surface px-3 py-2 text-sm font-bold text-heading"><MessageSquare className="h-4 w-4" />Message partner</Link><Link href={`/exchanges/${id}/milestones`} className="flex items-center gap-2 rounded-lg bg-surface px-3 py-2 text-sm font-bold text-heading"><Milestone className="h-4 w-4" />View milestones</Link></div>
      </section>
      {/* Overview Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Brief & Deliverables */}
        <div className="md:col-span-2 space-y-6">
          <section className="bg-surface border border-border rounded-[var(--radius-card)] p-6 shadow-subtle">
            <h2 className="text-xl font-bold text-heading flex items-center gap-2 mb-4">
              <FileText className="w-5 h-5 text-primary" />
              Project Deliverables
            </h2>
            <ul className="space-y-3">
              {(exchange.deliverables || []).map((deliverable: string, idx: number) => (
                <li key={idx} className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-muted shrink-0 mt-0.5" />
                  <span className="text-body font-medium">{deliverable}</span>
                </li>
              ))}
              {(!exchange.deliverables || exchange.deliverables.length === 0) && (
                <li className="text-muted text-sm italic">No specific deliverables listed.</li>
              )}
            </ul>
          </section>

          <section className="bg-surface border border-border rounded-[var(--radius-card)] p-6 shadow-subtle flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-heading mb-1">Ready to submit your work?</h2>
              <p className="text-sm text-muted">Upload your final deliverables for review when you're done.</p>
            </div>
            <Link 
              href={`/exchanges/${exchange.id}/files`}
              className="px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-[var(--radius-button)] transition-colors shadow-sm"
            >
              Upload Files
            </Link>
          </section>
        </div>

        {/* Right Column: Terms */}
        <div className="space-y-6">
          <div className="bg-surface-secondary border border-border rounded-[var(--radius-card)] p-6">
            <h2 className="text-xs font-bold text-muted uppercase tracking-wider mb-4 flex items-center gap-2">
              <LayoutList className="w-4 h-4" />
              Agreed Terms
            </h2>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-muted mb-1">Total Reward</p>
                <div className="flex items-center gap-1.5 font-bold text-heading text-lg">
                  <ShieldCheck className="w-5 h-5 text-primary" />
                  {exchange.skillHours} Skill Hours
                </div>
              </div>
              <div>
                <p className="text-xs text-muted mb-1">Deadline</p>
                <div className="flex items-center gap-1.5 font-bold text-heading">
                  <Clock className="w-4 h-4 text-muted" />
                  {exchange.deadline ? new Date(exchange.deadline).toLocaleDateString() : "Flexible"}
                </div>
              </div>
              <div>
                <p className="text-xs text-muted mb-1">Escrow Status</p>
                <div className="font-bold text-heading capitalize">
                  {exchange.escrowStatus}
                </div>
              </div>
            </div>
          </div>
          {exchange.status === "in_progress" && <div className="rounded-[var(--radius-card)] border border-border bg-surface p-5"><p className="mb-2 text-sm text-muted">Plans changed before any work was submitted?</p><CancelExchange exchangeId={exchange.id} /></div>}
          {exchange.escrowId && ["in_progress", "in_review", "revision_requested"].includes(exchange.status) && <Link href={`/dashboard/escrow/${exchange.escrowId}`} className="flex items-center gap-2 rounded-[var(--radius-card)] border border-border bg-surface p-4 text-sm font-bold text-heading hover:border-error/40 hover:text-error"><ShieldAlert className="h-4 w-4" />Report an issue or open a dispute</Link>}
        </div>
      </div>
    </div>
  );
}
