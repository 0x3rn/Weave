"use client";

import { resolveAdminDispute, type AdminDispute } from "@/app/actions/admin/disputes";
import { AlertTriangle, Download, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";

function DisputeCard({ dispute }: { dispute: AdminDispute }) {
  const router = useRouter();
  const [providerAward, setProviderAward] = useState(dispute.requesterHours);
  const [requesterAward, setRequesterAward] = useState(dispute.providerHours);
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);

  async function resolve(nextProviderAward: number, nextRequesterAward: number) {
    if (notes.trim().length < 3) return toast.error("Add resolution notes before deciding.");
    setBusy(true);
    const result = await resolveAdminDispute(dispute.exchangeId, nextProviderAward, nextRequesterAward, notes);
    setBusy(false);
    if (!result.success) return toast.error(result.error || "Unable to resolve dispute");
    toast.success(`Dispute resolved: ${result.outcome}`);
    router.refresh();
  }

  return (
    <article className="rounded-[var(--radius-card)] border border-border bg-surface p-6 shadow-subtle">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-error" /><span className="text-xs font-bold uppercase tracking-wide text-error">Under review</span></div>
          <h2 className="mt-2 text-xl font-bold text-heading">{dispute.title}</h2>
          <p className="mt-1 text-sm text-muted">Opened {new Date(dispute.openedAt).toLocaleString()}</p>
        </div>
        <div className="flex gap-4 text-sm text-muted"><span>{dispute.deliveryCount} deliveries</span><span>{dispute.activityCount} events</span></div>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <div className="rounded-lg bg-surface-secondary p-4"><p className="text-xs font-bold uppercase text-muted">Requester</p><p className="mt-1 font-bold text-heading">{dispute.requester.name}</p><p className="text-sm text-muted">{dispute.requesterHours} hours held</p></div>
        <div className="rounded-lg bg-surface-secondary p-4"><p className="text-xs font-bold uppercase text-muted">Provider</p><p className="mt-1 font-bold text-heading">{dispute.provider.name}</p><p className="text-sm text-muted">{dispute.providerHours} hours held</p></div>
      </div>

      <div className="mt-5 rounded-lg border border-border p-4"><p className="font-bold text-heading">{dispute.reason}</p><p className="mt-2 whitespace-pre-wrap text-sm text-body">{dispute.details}</p></div>

      <div className="mt-5 grid gap-4 lg:grid-cols-3">
        <details className="rounded-lg border border-border p-4"><summary className="cursor-pointer font-bold text-heading">Activity ({dispute.activity.length})</summary><div className="mt-3 max-h-64 space-y-3 overflow-y-auto">{dispute.activity.map(event => <div key={event.id} className="text-sm"><p className="text-body">{event.description}</p><p className="text-xs text-muted">{new Date(event.occurredAt).toLocaleString()}</p></div>)}</div></details>
        <details className="rounded-lg border border-border p-4"><summary className="cursor-pointer font-bold text-heading">Deliveries ({dispute.deliveries.length})</summary><div className="mt-3 max-h-64 space-y-4 overflow-y-auto">{dispute.deliveries.map(delivery => <div key={delivery.id} className="text-sm"><p className="font-bold text-body">Version {delivery.version}</p>{delivery.comments && <p className="text-muted">{delivery.comments}</p>}{delivery.files.map(file => <a key={file.url} href={file.url} target="_blank" rel="noreferrer" className="mt-1 flex items-center gap-1 text-primary"><Download className="h-3.5 w-3.5" />{file.name}</a>)}</div>)}</div></details>
        <details className="rounded-lg border border-border p-4"><summary className="cursor-pointer font-bold text-heading">Messages ({dispute.messages.length})</summary><div className="mt-3 max-h-64 space-y-3 overflow-y-auto">{dispute.messages.map(message => <div key={message.id} className="text-sm"><p className="text-xs font-bold text-muted">{message.senderId === dispute.requester.id ? dispute.requester.name : dispute.provider.name}</p><p className="whitespace-pre-wrap text-body">{message.content}</p><p className="text-xs text-muted">{new Date(message.createdAt).toLocaleString()}</p></div>)}</div></details>
      </div>

      <label className="mt-5 block text-sm font-bold text-heading">Resolution notes<textarea value={notes} onChange={event => setNotes(event.target.value)} maxLength={5000} rows={4} className="mt-2 w-full rounded-lg border border-border bg-surface-secondary p-3 font-normal" placeholder="Record the evidence considered and why this decision is fair." /></label>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-bold text-heading">Hours awarded to provider<input type="number" min={0} max={dispute.requesterHours} value={providerAward} onChange={event => setProviderAward(Number(event.target.value))} className="mt-2 w-full rounded-lg border border-border bg-surface-secondary p-3 font-normal" /></label>
        <label className="text-sm font-bold text-heading">Hours awarded to requester<input type="number" min={0} max={dispute.providerHours} value={requesterAward} onChange={event => setRequesterAward(Number(event.target.value))} className="mt-2 w-full rounded-lg border border-border bg-surface-secondary p-3 font-normal" /></label>
      </div>
      <p className="mt-2 text-xs text-muted">Unawarded held hours return to their original owner. Every resolution is written to the ledger and both members are notified.</p>
      <div className="mt-5 flex flex-wrap gap-3">
        <button type="button" disabled={busy} onClick={() => resolve(dispute.requesterHours, dispute.providerHours)} className="rounded-lg bg-success px-4 py-2 text-sm font-bold text-success-foreground disabled:opacity-50">Release all agreed hours</button>
        <button type="button" disabled={busy} onClick={() => resolve(0, 0)} className="rounded-lg border border-border px-4 py-2 text-sm font-bold text-heading disabled:opacity-50">Refund all held hours</button>
        <button type="button" disabled={busy || !Number.isInteger(providerAward) || !Number.isInteger(requesterAward)} onClick={() => resolve(providerAward, requesterAward)} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground disabled:opacity-50">{busy && <Loader2 className="h-4 w-4 animate-spin" />}Apply partial resolution</button>
      </div>
    </article>
  );
}

export default function DisputeResolutionClient({ disputes }: { disputes: AdminDispute[] }) {
  if (!disputes.length) return <div className="rounded-[var(--radius-card)] border border-dashed border-border bg-surface p-12 text-center"><h2 className="text-xl font-bold text-heading">No open disputes</h2><p className="mt-2 text-muted">New disputes will appear here for review.</p></div>;
  return <div className="space-y-6">{disputes.map(dispute => <DisputeCard key={dispute.exchangeId} dispute={dispute} />)}</div>;
}
