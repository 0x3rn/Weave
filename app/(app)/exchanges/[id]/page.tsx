import { getExchange } from "@/app/actions/exchanges";
import { getCurrentUserId } from "@/app/actions/user";
import { notFound, redirect } from "next/navigation";
import { Clock, CheckCircle, ShieldCheck, FileText, LayoutList } from "lucide-react";
import Link from "next/link";

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
  const isRequester = userId === exchange.requesterId;

  return (
    <div className="max-w-4xl space-y-8">
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
        </div>
      </div>
    </div>
  );
}
