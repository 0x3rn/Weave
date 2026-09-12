"use client";

import { savePrivateExchangeNote } from "@/app/actions/exchange-workspace";
import { Check, Loader2, Lock } from "lucide-react";
import { useEffect, useState } from "react";

export default function PrivateNotes({ exchangeId, initialContent, updatedAt }: { exchangeId: string; initialContent: string; updatedAt?: string }) {
  const [content, setContent] = useState(initialContent);
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  useEffect(() => {
    if (content === initialContent) return;
    const timer = window.setTimeout(async () => { setState("saving"); const result = await savePrivateExchangeNote(exchangeId, content); setState(result.success ? "saved" : "error"); }, 700);
    return () => window.clearTimeout(timer);
  }, [content, exchangeId, initialContent]);
  return <div className="mx-auto max-w-4xl space-y-5"><div><h2 className="text-2xl font-bold text-heading">Private notes</h2><p className="mt-1 flex items-center gap-1.5 text-sm text-muted"><Lock className="h-3.5 w-3.5" />Only you can see these notes.</p></div><div className="rounded-xl border border-border bg-surface p-5"><textarea value={content} onChange={event => setContent(event.target.value)} maxLength={20000} rows={18} placeholder="Capture ideas, reminders, meeting notes, or private feedback..." className="w-full resize-y bg-transparent text-body outline-none" /><div className="mt-3 flex items-center justify-between border-t border-border pt-3 text-xs text-muted"><span>{content.length.toLocaleString()} / 20,000</span><span className="flex items-center gap-1.5">{state === "saving" && <><Loader2 className="h-3.5 w-3.5 animate-spin" />Saving</>}{state === "saved" && <><Check className="h-3.5 w-3.5 text-success" />Saved</>}{state === "error" && <span className="text-error">Could not save</span>}{state === "idle" && updatedAt && `Last saved ${new Date(updatedAt).toLocaleString()}`}</span></div></div></div>;
}
