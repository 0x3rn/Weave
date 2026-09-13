import { getExchange, getExchangeContract } from "@/app/actions/exchanges";
import { getCurrentUserId } from "@/app/actions/user";
import ContractApprovalClient from "@/components/exchanges/contract-approval-client";
import { ArrowRight, CheckCircle2, Clock3, Lock, MessageSquare, PartyPopper } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function StartPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [result, contractResult, userId] = await Promise.all([getExchange(id), getExchangeContract(id), getCurrentUserId()]);
  if (!result.success || !result.exchange) notFound();
  const { exchange } = result;
  if (exchange.status === "pending_proposal") {
    if (!contractResult.success || !contractResult.contract || !userId) notFound();
    return <ContractApprovalClient exchange={exchange} contract={contractResult.contract} userId={userId} />;
  }
  return <div className="mx-auto max-w-3xl py-4 text-center">
    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10"><PartyPopper className="h-8 w-8 text-primary" /></div>
    <h2 className="mt-5 text-3xl font-bold text-heading">The exchange is ready</h2><p className="mx-auto mt-2 max-w-xl text-muted">Your proposal is accepted, Skill Hours are reserved, and the private workspace for “{exchange.title}” is open.</p>
    <div className="mt-8 grid gap-4 text-left sm:grid-cols-3">
      <div className="rounded-xl border border-border bg-surface p-4"><Lock className="h-5 w-5 text-primary" /><p className="mt-3 font-bold text-heading">Hours reserved</p><p className="mt-1 text-sm text-muted">{exchange.skillHours} Skill Hours are protected in escrow.</p></div>
      <div className="rounded-xl border border-border bg-surface p-4"><MessageSquare className="h-5 w-5 text-primary" /><p className="mt-3 font-bold text-heading">Conversation open</p><p className="mt-1 text-sm text-muted">Keep decisions and updates in workspace messages.</p></div>
      <div className="rounded-xl border border-border bg-surface p-4"><Clock3 className="h-5 w-5 text-primary" /><p className="mt-3 font-bold text-heading">Timeline set</p><p className="mt-1 text-sm text-muted">{exchange.deadline ? `Due ${new Date(exchange.deadline).toLocaleDateString()}` : "The timeline is flexible."}</p></div>
    </div>
    <div className="mt-8 rounded-xl bg-surface-secondary p-5 text-left"><p className="font-bold text-heading">Before work begins</p><ul className="mt-3 space-y-2 text-sm text-body">{["Confirm the deliverables and deadline", "Add milestones for important checkpoints", "Use workspace messages for changes to scope"].map(item => <li key={item} className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />{item}</li>)}</ul></div>
    <Link href={`/exchanges/${id}`} className="mt-8 inline-flex items-center gap-2 rounded-[var(--radius-button)] bg-primary px-6 py-3 font-bold text-primary-foreground">Open workspace<ArrowRight className="h-4 w-4" /></Link>
  </div>;
}
