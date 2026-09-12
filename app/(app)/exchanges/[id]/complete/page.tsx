import { getExchange } from "@/app/actions/exchanges";
import { CalendarDays, CheckCircle2, Clock3, ExternalLink } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function CompletePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await getExchange(id);
  if (!result.success || !result.exchange) notFound();
  const { exchange, requester, provider } = result;
  if (exchange.status !== "completed") return <div className="mx-auto max-w-xl rounded-[var(--radius-card)] border border-border bg-surface p-8 text-center"><Clock3 className="mx-auto h-10 w-10 text-muted" /><h2 className="mt-4 text-2xl font-bold text-heading">Exchange still in progress</h2><p className="mt-2 text-muted">This summary becomes available after the required delivery approvals.</p><Link href={`/exchanges/${id}`} className="mt-5 inline-block font-bold text-primary">Return to workspace</Link></div>;
  return <div className="mx-auto max-w-3xl space-y-6">
    <section className="rounded-[var(--radius-card)] border border-success/30 bg-success/5 p-8 text-center"><div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success/15"><CheckCircle2 className="h-9 w-9 text-success" strokeWidth={2.25} /></div><h2 className="mt-5 text-3xl font-bold text-heading">Exchange complete</h2><p className="mt-2 text-muted">The work was accepted and escrow was released.</p></section>
    <section className="grid gap-4 sm:grid-cols-3"><div className="rounded-xl border border-border bg-surface p-5"><Clock3 className="h-5 w-5 text-primary" /><p className="mt-3 text-2xl font-bold text-heading">{exchange.skillHours}</p><p className="text-sm text-muted">Skill Hours exchanged</p></div><div className="rounded-xl border border-border bg-surface p-5"><CalendarDays className="h-5 w-5 text-primary" /><p className="mt-3 font-bold text-heading">{exchange.completedAt ? new Date(exchange.completedAt).toLocaleDateString() : "Completed"}</p><p className="text-sm text-muted">Completion date</p></div><div className="rounded-xl border border-border bg-surface p-5"><CheckCircle2 className="h-5 w-5 text-success" /><p className="mt-3 font-bold text-heading">Released</p><p className="text-sm text-muted">Escrow status</p></div></section>
    <section className="rounded-[var(--radius-card)] border border-border bg-surface p-6"><h3 className="text-lg font-bold text-heading">Collaboration</h3><p className="mt-2 text-body">{requester.name} and {provider.name} completed “{exchange.title}”.</p><div className="mt-5 flex flex-wrap gap-3"><Link href="/wallet/ledger" className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-bold text-heading">View ledger<ExternalLink className="h-4 w-4" /></Link><Link href="/marketplace" className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground">Find another exchange</Link></div></section>
  </div>;
}
