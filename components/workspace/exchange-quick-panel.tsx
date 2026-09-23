"use client";

import { useEffect, useState } from "react";
import { Conversation, Escrow, Exchange } from "@/types";
import { getExchangeQuickContext } from "@/app/actions/messages";
import { CheckCircle2, Clock, ShieldCheck, AlertCircle, MessageSquare, FileText } from "lucide-react";

interface Props { conversation?: Conversation; currentUserId: string; }

export default function ExchangeQuickPanel({ conversation }: Props) {
  const [exchange, setExchange] = useState<Exchange | null>(null);
  const [escrow, setEscrow] = useState<Escrow | null>(null);
  const [stats, setStats] = useState({ messages: 0, files: 0 });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);
  useEffect(() => {
    let active = true;
    let inFlight = false;
    const load = async () => {
      if (conversation?.type !== "exchange" || !conversation.contextId || inFlight) return;
      inFlight = true;
      try {
        const result = await getExchangeQuickContext(conversation.contextId);
        if (!active) return;
        if (!result.success || !result.exchange) {
          setLoadError(true);
          return;
        }
        setExchange(result.exchange as Exchange);
        setEscrow(result.escrow as Escrow | null);
        setStats(result.stats ?? { messages: 0, files: 0 });
        setLoadError(false);
      } catch {
        if (active) setLoadError(true);
      } finally {
        inFlight = false;
        if (active) setLoading(false);
      }
    };
    void load();
    const timer = window.setInterval(() => void load(), 10000);
    return () => { active = false; window.clearInterval(timer); };
  }, [conversation?.contextId, conversation?.type, retryKey]);
  if (!conversation || conversation.type !== "exchange" || !conversation.contextId) return <div className="p-6 text-center text-sm text-muted">No exchange is linked to this conversation.</div>;
  if (!exchange) return <div className="p-6 text-center text-sm text-muted">{loading ? "Loading project details..." : <><p>{loadError ? "Project details are temporarily unavailable." : "Project details are unavailable."}</p><button type="button" onClick={() => { setLoading(true); setRetryKey(value => value + 1); }} className="mt-3 font-bold text-primary hover:underline">Retry</button></>}</div>;
  const milestones = exchange.milestones ?? [];
  const completed = milestones.filter(item => item.status === "completed").length;
  const healthy = escrow ? escrow.status !== "disputed" : exchange.status !== "disputed" && exchange.status !== "cancelled";
  return <div className="h-full overflow-y-auto"><section className="border-b border-border p-5"><h3 className="text-xs font-bold uppercase tracking-wider text-muted">Project health</h3><div className="mt-4 rounded-xl border border-border bg-surface p-4"><div className="flex items-center gap-2"><span className={`h-2.5 w-2.5 rounded-full ${healthy ? "bg-success" : "bg-error"}`} /><span className="text-sm font-bold text-heading">{healthy ? "Healthy" : "Needs attention"}</span></div><p className="mt-2 text-xs text-muted">{exchange.deadline ? `Deadline ${new Date(exchange.deadline).toLocaleDateString()}` : "No deadline recorded"}</p></div><div className="mt-3 grid grid-cols-2 gap-3"><Metric icon={<MessageSquare className="h-4 w-4" />} label="Messages" value={stats.messages} /><Metric icon={<FileText className="h-4 w-4" />} label="Files" value={stats.files} /></div></section><section className="border-b border-border p-5"><h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted"><ShieldCheck className="h-4 w-4 text-primary" />Escrow</h3>{escrow ? <div className="mt-4 space-y-3"><div className="flex justify-between text-xs"><span className="text-muted">Status</span><span className="font-bold uppercase text-primary">{escrow.status.replaceAll("_", " ")}</span></div><div className="flex justify-between text-xs"><span className="text-muted">Skill Hours</span><span className="font-bold text-heading">{exchange.skillHours} protected</span></div><p className="rounded-lg bg-primary/5 p-3 text-xs text-heading">This exchange is protected by Weave escrow.</p></div> : <div className="mt-4 flex gap-2 rounded-lg bg-warning/10 p-3 text-xs text-heading"><AlertCircle className="h-4 w-4 shrink-0 text-warning" />Escrow has not been initialized.</div>}</section><section className="p-5"><h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted"><Clock className="h-4 w-4 text-primary" />Milestones</h3>{milestones.length ? <><p className="mt-3 text-xs text-muted">{completed}/{milestones.length} completed</p><div className="mt-3 space-y-3">{milestones.map(item => <div key={item.id} className="flex gap-2 text-xs"><span className="mt-0.5">{item.status === "completed" ? <CheckCircle2 className="h-4 w-4 text-success" /> : <span className="block h-4 w-4 rounded-full border-2 border-border" />}</span><span className={item.status === "completed" ? "text-muted line-through" : "font-medium text-heading"}>{item.title}</span></div>)}</div></> : <p className="mt-3 text-xs text-muted">No milestones tracked yet.</p>}</section></div>;
}
function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) { return <div className="rounded-lg border border-border bg-surface p-3"><div className="flex items-center gap-1 text-muted">{icon}<span className="text-[10px]">{label}</span></div><p className="mt-1 text-lg font-bold text-heading">{value}</p></div>; }
