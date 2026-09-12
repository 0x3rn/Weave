"use client";

import { createExchangeMilestone, deleteExchangeMilestone, updateExchangeMilestone } from "@/app/actions/exchange-workspace";
import type { ExchangeMilestone } from "@/types";
import { CalendarDays, CheckCircle2, Circle, Loader2, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";

export default function MilestonesClient({ exchangeId, milestones, editable }: { exchangeId: string; milestones: ExchangeMilestone[]; editable: boolean }) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const completed = milestones.filter(milestone => milestone.status === "completed").length;

  const create = async () => {
    setBusy("create");
    const result = await createExchangeMilestone(exchangeId, { title, description, dueDate });
    setBusy(null);
    if (!result.success) return toast.error(result.error || "Unable to add milestone");
    setTitle(""); setDescription(""); setDueDate(""); setShowForm(false); router.refresh(); toast.success("Milestone added");
  };
  const update = async (id: string, status: ExchangeMilestone["status"]) => { setBusy(id); const result = await updateExchangeMilestone(exchangeId, id, status); setBusy(null); if (!result.success) return toast.error(result.error || "Unable to update milestone"); router.refresh(); };
  const remove = async (id: string) => { setBusy(id); const result = await deleteExchangeMilestone(exchangeId, id); setBusy(null); if (!result.success) return toast.error(result.error || "Unable to delete milestone"); router.refresh(); toast.success("Milestone removed"); };

  return <div className="mx-auto max-w-4xl space-y-6">
    <div className="flex items-start justify-between gap-4"><div><h2 className="text-2xl font-bold text-heading">Milestones</h2><p className="mt-1 text-sm text-muted">Break the exchange into shared checkpoints.</p></div>{editable && <button type="button" onClick={() => setShowForm(value => !value)} className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground"><Plus className="h-4 w-4" />Add milestone</button>}</div>
    <div className="rounded-xl border border-border bg-surface p-4"><div className="flex justify-between text-sm"><span className="font-bold text-heading">Overall progress</span><span className="text-muted">{completed} of {milestones.length}</span></div><div className="mt-3 h-2 rounded-full bg-surface-secondary"><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${milestones.length ? Math.round(completed / milestones.length * 100) : 0}%` }} /></div></div>
    {showForm && <div className="space-y-4 rounded-xl border border-primary/30 bg-primary/5 p-5"><label className="block text-sm font-bold text-heading">Title<input value={title} onChange={event => setTitle(event.target.value)} maxLength={160} className="mt-2 w-full rounded-lg border border-border bg-surface p-3 font-normal" placeholder="e.g. First draft ready" /></label><label className="block text-sm font-bold text-heading">Description<textarea value={description} onChange={event => setDescription(event.target.value)} maxLength={3000} rows={3} className="mt-2 w-full rounded-lg border border-border bg-surface p-3 font-normal" /></label><label className="block text-sm font-bold text-heading">Due date<input type="date" value={dueDate} onChange={event => setDueDate(event.target.value)} className="mt-2 block rounded-lg border border-border bg-surface p-3 font-normal" /></label><div className="flex justify-end gap-2"><button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm font-bold text-muted">Cancel</button><button type="button" onClick={create} disabled={!title.trim() || busy === "create"} className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground disabled:opacity-50">{busy === "create" && <Loader2 className="h-4 w-4 animate-spin" />}Save milestone</button></div></div>}
    {milestones.length === 0 ? <div className="rounded-xl border border-dashed border-border bg-surface p-10 text-center"><Circle className="mx-auto h-10 w-10 text-muted" /><h3 className="mt-3 font-bold text-heading">No milestones yet</h3><p className="mt-1 text-sm text-muted">Add checkpoints when the work benefits from staged progress.</p></div> : <div className="space-y-3">{milestones.map(milestone => <article key={milestone.id} className="flex gap-4 rounded-xl border border-border bg-surface p-4"><button type="button" disabled={!editable || busy === milestone.id} onClick={() => update(milestone.id, milestone.status === "completed" ? "pending" : "completed")} className="mt-0.5 shrink-0 disabled:cursor-default" aria-label={milestone.status === "completed" ? "Mark incomplete" : "Mark complete"}>{busy === milestone.id ? <Loader2 className="h-5 w-5 animate-spin text-muted" /> : milestone.status === "completed" ? <CheckCircle2 className="h-5 w-5 text-success" /> : <Circle className="h-5 w-5 text-muted" />}</button><div className="min-w-0 flex-1"><h3 className={`font-bold ${milestone.status === "completed" ? "text-muted line-through" : "text-heading"}`}>{milestone.title}</h3>{milestone.description && <p className="mt-1 text-sm text-body">{milestone.description}</p>}{milestone.dueDate && <p className="mt-2 flex items-center gap-1.5 text-xs text-muted"><CalendarDays className="h-3.5 w-3.5" />Due {new Date(milestone.dueDate).toLocaleDateString()}</p>}</div>{editable && <button type="button" onClick={() => remove(milestone.id)} disabled={busy === milestone.id} className="self-start rounded-lg p-2 text-muted hover:bg-error/10 hover:text-error" aria-label="Delete milestone"><Trash2 className="h-4 w-4" /></button>}</article>)}</div>}
  </div>;
}
