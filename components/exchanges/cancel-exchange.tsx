"use client";

import { cancelExchange } from "@/app/actions/exchange-workspace";
import { AlertTriangle, Loader2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";

export default function CancelExchange({ exchangeId }: { exchangeId: string }) {
  const router = useRouter(); const [open, setOpen] = useState(false); const [reason, setReason] = useState(""); const [busy, setBusy] = useState(false);
  const submit = async () => { setBusy(true); const result = await cancelExchange(exchangeId, reason); setBusy(false); if (!result.success) return toast.error(result.error || "Unable to cancel exchange"); toast.success("Exchange cancelled and reserved hours refunded"); setOpen(false); router.refresh(); };
  return <><button type="button" onClick={() => setOpen(true)} className="text-sm font-bold text-error hover:underline">Cancel before work begins</button>{open && <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm"><div className="relative w-full max-w-md rounded-[var(--radius-card)] border border-border bg-surface p-6 shadow-elevated"><button type="button" onClick={() => setOpen(false)} className="absolute right-4 top-4 p-2 text-muted" aria-label="Close"><X className="h-5 w-5" /></button><AlertTriangle className="h-8 w-8 text-error" /><h2 className="mt-4 text-xl font-bold text-heading">Cancel this exchange?</h2><p className="mt-2 text-sm text-muted">Cancellation is available only before a delivery is submitted. All reserved Skill Hours will be refunded.</p><label className="mt-5 block text-sm font-bold text-heading">Reason<textarea value={reason} onChange={event => setReason(event.target.value)} maxLength={500} rows={4} className="mt-2 w-full rounded-lg border border-border bg-surface-secondary p-3 font-normal" placeholder="Explain why the exchange is being cancelled" /></label><div className="mt-5 flex justify-end gap-3"><button type="button" onClick={() => setOpen(false)} className="px-4 py-2 text-sm font-bold text-muted">Keep exchange</button><button type="button" onClick={submit} disabled={!reason.trim() || busy} className="flex items-center gap-2 rounded-lg bg-error px-4 py-2 text-sm font-bold text-error-foreground disabled:opacity-50">{busy && <Loader2 className="h-4 w-4 animate-spin" />}Cancel and refund</button></div></div></div>}</>;
}
