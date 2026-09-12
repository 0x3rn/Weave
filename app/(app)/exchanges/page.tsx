import { getMyExchanges } from "@/app/actions/exchange-workspace";
import { ArrowRight, CheckCircle2, Clock3, Repeat2 } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

const activeStatuses = new Set(["in_progress", "in_review", "revision_requested", "disputed"]);

export default async function ExchangesPage() {
  const result = await getMyExchanges();
  if (!result.success && result.error === "Unauthorized") redirect("/login?next=/exchanges");
  const exchanges = result.exchanges;
  const active = exchanges.filter(exchange => activeStatuses.has(exchange.status));
  const history = exchanges.filter(exchange => !activeStatuses.has(exchange.status));

  const section = (title: string, items: typeof exchanges) => (
    <section className="space-y-3">
      <div className="flex items-center justify-between"><h2 className="text-lg font-bold text-heading">{title}</h2><span className="text-sm text-muted">{items.length}</span></div>
      {items.length > 0 && <div className="grid gap-4 lg:grid-cols-2">{items.map(exchange => {
        const nextLabel = exchange.status === "in_review" ? "Review delivery" : exchange.status === "revision_requested" ? "Continue revision" : exchange.status === "completed" ? "View summary" : "Open workspace";
        return <Link key={exchange.id} href={`/exchanges/${exchange.id}${exchange.status === "completed" ? "/complete" : ""}`} className="group rounded-[var(--radius-card)] border border-border bg-surface p-5 shadow-subtle transition hover:border-primary/40 hover:shadow-md">
          <div className="flex items-start justify-between gap-4"><div className="min-w-0"><p className="truncate text-lg font-bold text-heading">{exchange.title}</p><p className="mt-1 text-sm text-muted">with {exchange.partner.name} · You are the {exchange.role}</p></div><span className="shrink-0 rounded-full bg-surface-secondary px-2.5 py-1 text-xs font-bold capitalize text-body">{exchange.status.replaceAll("_", " ")}</span></div>
          <div className="mt-5 flex items-center gap-5 text-sm text-muted"><span className="flex items-center gap-1.5"><Clock3 className="h-4 w-4" />{exchange.skillHours} Skill Hours</span>{exchange.isMutual && <span className="flex items-center gap-1.5"><Repeat2 className="h-4 w-4" />Mutual</span>}</div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-surface-secondary"><div className="h-full rounded-full bg-primary" style={{ width: `${Math.max(0, Math.min(100, exchange.progress ?? 0))}%` }} /></div>
          <div className="mt-4 flex items-center justify-between text-xs text-muted"><span>{exchange.progress ?? 0}% complete</span><span className="flex items-center gap-1 font-bold text-primary">{nextLabel}<ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" /></span></div>
        </Link>;
      })}</div>}
    </section>
  );

  return <div className="mx-auto max-w-6xl space-y-8 p-4 py-8 md:p-8">
    <div><h1 className="text-3xl font-bold text-heading">My Exchanges</h1><p className="mt-1 text-muted">Manage active work, reviews, and completed collaborations.</p></div>
    {exchanges.length === 0 ? <div className="rounded-[var(--radius-card)] border border-dashed border-border bg-surface p-12 text-center"><CheckCircle2 className="mx-auto h-12 w-12 text-muted" /><h2 className="mt-4 text-xl font-bold text-heading">No exchanges yet</h2><p className="mx-auto mt-2 max-w-md text-muted">Apply to a marketplace request or accept an application. The exchange workspace will appear here.</p><Link href="/marketplace" className="mt-6 inline-flex rounded-[var(--radius-button)] bg-primary px-5 py-2.5 font-bold text-primary-foreground">Explore marketplace</Link></div> : <>{section("Active", active)}{section("History", history)}</>}
  </div>;
}
