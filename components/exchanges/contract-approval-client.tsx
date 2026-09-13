"use client";

import { approveExchangeContract } from "@/app/actions/exchanges";
import { Exchange, ExchangeContract } from "@/types";
import { Check, Loader2, LockKeyhole, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function ContractApprovalClient({ exchange, contract, userId }: { exchange: Exchange; contract: ExchangeContract; userId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const hasApproved = contract.approvedBy.includes(userId);

  const approve = async () => {
    setLoading(true);
    setError("");
    const result = await approveExchangeContract(exchange.id);
    if (!result.success) { setError(result.error || "Unable to approve the contract"); setLoading(false); return; }
    router.refresh();
    if (result.status === "active") router.push(`/exchanges/${exchange.id}`);
  };

  const rows = [
    { label: "Requester provides", values: contract.requesterDeliverables, hours: contract.providerPaysHours },
    { label: "Provider provides", values: contract.providerDeliverables, hours: contract.requesterPaysHours },
  ].filter(row => contract.exchangeType === "mutual" || row.label === "Provider provides");

  return <div className="mx-auto max-w-3xl py-4">
    <div className="text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10"><LockKeyhole className="h-8 w-8 text-primary" /></div>
      <p className="mt-5 text-sm font-bold uppercase tracking-[0.18em] text-primary">Final contract</p>
      <h2 className="mt-2 text-3xl font-bold text-heading">Review before work begins</h2>
      <p className="mx-auto mt-2 max-w-xl text-muted">This version is frozen. Skill Hours are reserved only after both participants approve the same contract.</p>
    </div>

    <div className="mt-8 overflow-hidden rounded-[var(--radius-card)] border border-border bg-surface shadow-subtle">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-surface-secondary px-5 py-4">
        <div><p className="font-bold text-heading">{exchange.title}</p><p className="mt-1 text-xs text-muted">Contract v{contract.version} · {contract.exchangeType === "mutual" ? "Mutual exchange" : "Standard exchange"}</p></div>
        <span className="rounded-full border border-border bg-surface px-3 py-1 font-mono text-[11px] text-muted" title={contract.fingerprint}>ID {contract.fingerprint.slice(0, 10)}</span>
      </div>
      <div className="grid gap-5 p-5 md:grid-cols-2">
        {rows.map(row => <section key={row.label} className="rounded-xl border border-border p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-muted">{row.label}</p>
          <ul className="mt-3 space-y-2">{row.values.map(item => <li key={item} className="flex gap-2 text-sm text-body"><Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />{item}</li>)}</ul>
          <p className="mt-4 border-t border-border pt-3 text-sm font-bold text-heading">{row.hours} Skill Hours</p>
        </section>)}
      </div>
      <div className="grid gap-3 border-t border-border px-5 py-4 text-sm sm:grid-cols-3">
        <div><p className="text-muted">Deadline</p><p className="mt-1 font-bold text-heading">{contract.deadline ? new Date(contract.deadline).toLocaleDateString() : "Flexible"}</p></div>
        <div><p className="text-muted">Revisions included</p><p className="mt-1 font-bold text-heading">{contract.revisionsIncluded}</p></div>
        <div><p className="text-muted">Hour difference</p><p className="mt-1 font-bold text-heading">{contract.hourDifference} · {contract.differenceResolution.replaceAll("_", " ")}</p></div>
      </div>
    </div>

    <div className="mt-5 rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm text-body"><ShieldCheck className="mr-2 inline h-4 w-4 text-primary" />Approval covers the listed work, hours, deadline, commit and reveal review, and atomic settlement.</div>
    {error && <div className="mt-4 rounded-lg bg-error/10 p-3 text-sm font-bold text-error">{error}</div>}
    <div className="mt-6 flex flex-col items-center gap-3">
      {exchange.status === "pending_proposal" && !hasApproved ? <button type="button" onClick={approve} disabled={loading} className="flex w-full max-w-sm items-center justify-center gap-2 rounded-[var(--radius-button)] bg-primary px-6 py-3 font-bold text-primary-foreground disabled:opacity-50">{loading ? <><Loader2 className="h-4 w-4 animate-spin" />Approving...</> : "Approve contract and reserve hours"}</button> : null}
      {exchange.status === "pending_proposal" && hasApproved ? <p className="rounded-full bg-amber-500/10 px-4 py-2 text-sm font-bold text-amber-600">You approved. Waiting for the other participant.</p> : null}
    </div>
  </div>;
}
