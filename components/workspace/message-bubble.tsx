"use client";

import { useState } from "react";
import { Message, User } from "@/types";
import { format } from "date-fns";
import { Check, CheckCheck, CheckCircle2, Copy, FileText, MoreHorizontal, Pin, Reply, ShieldCheck, SmilePlus, Flag, Pencil } from "lucide-react";
import ReactMarkdown from "react-markdown";
import Link from "next/link";
import { editMessage, reportMessage, toggleMessagePin, toggleMessageReaction } from "@/app/actions/messages";

interface Props {
  message: Message;
  isOwn: boolean;
  partner: User | null;
  currentUserId: string;
  onReply: (message: Message) => void;
}

const reactionChoices = ["👍", "🔥", "👏", "❤️", "😂", "🎉"];

function CodeBlock({ children, className }: { children?: React.ReactNode; className?: string }) {
  const [copied, setCopied] = useState(false);
  const text = String(children ?? "").replace(/\n$/, "");
  const copy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };
  if (!className) return <code className="rounded bg-surface-secondary px-1.5 py-0.5 font-mono text-[0.85em]">{children}</code>;
  return <span className="relative my-3 block overflow-hidden rounded-lg bg-heading p-3 pr-12 font-mono text-xs text-surface"><button onClick={copy} type="button" aria-label="Copy code" className="absolute right-2 top-2 rounded p-1.5 text-surface/80 hover:bg-white/10 hover:text-white">{copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}</button><code className={className}>{children}</code></span>;
}

export default function MessageBubble({ message, isOwn, partner, currentUserId, onReply }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [reactionOpen, setReactionOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(message.content);
  const [busy, setBusy] = useState(false);

  const updateReaction = async (emoji: string) => {
    setBusy(true);
    await toggleMessageReaction(message.id, emoji);
    setBusy(false);
    setReactionOpen(false);
  };
  const saveEdit = async () => {
    if (!value.trim() || value.trim() === message.content) return setEditing(false);
    setBusy(true);
    const result = await editMessage(message.id, value);
    setBusy(false);
    if (result.success) setEditing(false);
  };
  const report = async () => {
    const reason = window.prompt("Why are you reporting this message?");
    if (reason) await reportMessage(message.id, reason);
    setMenuOpen(false);
  };

  if (message.type === "system_event") return <div className="my-4 flex justify-center"><div className="flex max-w-md items-center gap-2 rounded-full border border-border bg-surface-secondary/50 px-4 py-2 text-center"><ShieldCheck className="h-4 w-4 shrink-0 text-primary" /><span className="text-xs font-bold text-muted">{message.content}</span><span className="text-[10px] text-muted">{format(new Date(message.createdAt), "h:mm a")}</span></div></div>;

  if (message.type === "rich_card" && message.metadata?.kind === "milestone") {
    const title = String(message.metadata.title ?? "Milestone");
    const status = String(message.metadata.status ?? "pending").replaceAll("_", " ");
    const action = message.content.startsWith("Milestone added:") ? "added this milestone" : `marked this ${status}`;
    return <div className="my-5 flex justify-center px-2"><article className="w-full max-w-lg rounded-xl border border-border bg-surface p-4 shadow-subtle"><div className="flex items-start gap-3"><div className="rounded-lg bg-primary/10 p-2 text-primary"><CheckCircle2 className="h-5 w-5" /></div><div className="min-w-0 flex-1"><p className="text-xs font-bold uppercase tracking-wide text-muted">Milestone update</p><h3 className="mt-1 break-words font-bold text-heading">{title}</h3><p className="mt-1 text-xs text-muted">{isOwn ? "You" : partner?.fullName || "Your partner"} {action} · {format(new Date(message.createdAt), "MMM d, h:mm a")}</p></div><span className="rounded-full bg-primary/10 px-2 py-1 text-[11px] font-bold capitalize text-primary">{status}</span></div><div className="mt-4 flex items-center justify-between border-t border-border pt-3"><Link href={`/exchanges/${encodeURIComponent(message.conversationId)}/milestones`} className="text-xs font-bold text-primary hover:underline">View milestones</Link><button type="button" onClick={() => onReply(message)} className="flex items-center gap-1 text-xs font-bold text-muted hover:text-heading"><Reply className="h-3.5 w-3.5" />Discuss this</button></div></article></div>;
  }

  return <div className={`group mb-5 flex ${isOwn ? "justify-end" : "justify-start"}`}>
    <div className={`flex max-w-[92%] gap-2 sm:max-w-[76%] ${isOwn ? "flex-row-reverse" : "flex-row"}`}>
      <div className="hidden shrink-0 pt-5 sm:block"><div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-border text-xs font-bold text-primary">{isOwn ? "You" : partner?.photoURL ? <img src={partner.photoURL} alt="" className="h-full w-full object-cover" /> : partner?.fullName?.charAt(0) || "W"}</div></div>
      <div className="min-w-0">
        <div className={`mb-1 flex items-center gap-2 px-1 text-[11px] text-muted ${isOwn ? "justify-end" : "justify-start"}`}><span className="font-bold">{isOwn ? "You" : partner?.fullName || "Member"}</span><span>{format(new Date(message.createdAt), "h:mm a")}</span>{message.editedAt && <span>Edited</span>}{message.isPinned && <Pin className="h-3 w-3 text-primary" />}</div>
        {message.replyTo && <button type="button" onClick={() => onReply({ ...message, id: message.replyTo!.id, content: message.replyTo!.content })} className={`mb-1 block max-w-full rounded border-l-2 border-primary bg-primary/5 px-3 py-2 text-left text-xs text-muted hover:bg-primary/10 ${isOwn ? "ml-auto" : "mr-auto"}`}><span className="block font-bold text-primary">Replying to {message.replyTo.senderName}</span><span className="line-clamp-2">{message.replyTo.content}</span></button>}
        <div className={`relative rounded-2xl px-4 py-3 ${isOwn ? "rounded-tr-sm bg-primary text-surface" : "rounded-tl-sm border border-border bg-surface text-heading shadow-subtle"}`}>
          {editing ? <div className="space-y-2"><textarea value={value} onChange={event => setValue(event.target.value)} className="min-h-20 w-full resize-none rounded border border-border bg-surface-secondary p-2 text-sm text-heading" /><div className="flex justify-end gap-2"><button onClick={() => { setValue(message.content); setEditing(false); }} className="text-xs font-bold">Cancel</button><button disabled={busy} onClick={saveEdit} className="rounded bg-surface px-2 py-1 text-xs font-bold text-primary">Save</button></div></div> : <div className={`prose prose-sm max-w-none break-words ${isOwn ? "prose-invert" : ""} prose-p:my-1`}><ReactMarkdown components={{ code: CodeBlock }}>{message.content}</ReactMarkdown></div>}
          {message.attachments?.map(attachment => <div key={attachment.id} className={`mt-3 flex items-center gap-3 rounded-lg border p-3 ${isOwn ? "border-white/25 bg-white/10" : "border-border bg-surface-secondary"}`}><FileText className="h-5 w-5 shrink-0 text-primary" /><div className="min-w-0 flex-1"><p className="truncate text-xs font-bold">{attachment.name}</p><p className="text-[11px] opacity-70">{Math.ceil(attachment.sizeBytes / 1024)} KB</p></div><a href={attachment.url} target="_blank" rel="noreferrer" className="rounded px-2 py-1 text-xs font-bold text-primary hover:bg-primary/10">Open</a></div>)}
        </div>
        <div className={`mt-1 flex flex-wrap items-center gap-1 ${isOwn ? "justify-end" : "justify-start"}`}>{message.reactions?.map(reaction => <button disabled={busy} key={reaction.emoji} onClick={() => updateReaction(reaction.emoji)} className={`rounded-full border px-2 py-0.5 text-xs ${reaction.userIds.includes(currentUserId) ? "border-primary bg-primary/10 text-primary" : "border-border text-muted"}`}>{reaction.emoji} {reaction.userIds.length}</button>)}<div className="relative opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100"><button type="button" onClick={() => setReactionOpen(!reactionOpen)} className="rounded p-1 text-muted hover:bg-surface-secondary"><SmilePlus className="h-4 w-4" /></button>{reactionOpen && <div className="absolute bottom-8 z-20 flex gap-1 rounded-full border border-border bg-surface p-1 shadow-lg">{reactionChoices.map(emoji => <button type="button" onClick={() => updateReaction(emoji)} key={emoji} className="rounded p-1 hover:bg-surface-secondary">{emoji}</button>)}</div>}</div><button type="button" onClick={() => onReply(message)} className="rounded p-1 text-muted opacity-0 transition-opacity hover:bg-surface-secondary group-hover:opacity-100"><Reply className="h-4 w-4" /></button><div className="relative opacity-0 transition-opacity group-hover:opacity-100"><button type="button" onClick={() => setMenuOpen(!menuOpen)} className="rounded p-1 text-muted hover:bg-surface-secondary"><MoreHorizontal className="h-4 w-4" /></button>{menuOpen && <div className="absolute right-0 z-20 mt-1 w-36 rounded-lg border border-border bg-surface p-1 text-xs shadow-lg">{isOwn && <button onClick={() => { setEditing(true); setMenuOpen(false); }} className="flex w-full items-center gap-2 rounded px-2 py-2 text-left hover:bg-surface-secondary"><Pencil className="h-3.5 w-3.5" />Edit</button>}<button onClick={async () => { await toggleMessagePin(message.id); setMenuOpen(false); }} className="flex w-full items-center gap-2 rounded px-2 py-2 text-left hover:bg-surface-secondary"><Pin className="h-3.5 w-3.5" />{message.isPinned ? "Unpin" : "Pin"}</button>{!isOwn && <button onClick={report} className="flex w-full items-center gap-2 rounded px-2 py-2 text-left text-error hover:bg-error/10"><Flag className="h-3.5 w-3.5" />Report</button>}</div>}</div></div>
        {isOwn && <div className="mt-1 flex items-center justify-end gap-1 px-1 text-[10px] text-muted">{message.readBy.length > 1 ? <><CheckCheck className="h-3.5 w-3.5 text-primary" />Read</> : <><Check className="h-3.5 w-3.5" />Sent</>}</div>}
      </div>
    </div>
  </div>;
}
