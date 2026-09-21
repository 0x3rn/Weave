"use client";

import { useRef, useState } from "react";
import { Code, Paperclip, Send, Smile, X } from "lucide-react";
import { Message } from "@/types";
import { sendMessage, sendMessageAttachment, setConversationTyping } from "@/app/actions/messages";

interface Props { conversationId: string; replyTo?: Message | null; onClearReply: () => void; }

export default function Composer({ conversationId, replyTo, onClearReply }: Props) {
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTypingAt = useRef(0);
  const send = async () => {
    if ((!text.trim() && !file) || isSending) return;
    setIsSending(true); setError("");
    try {
      const result = file ? await (() => { const data = new FormData(); data.append("file", file); return sendMessageAttachment(conversationId, data, text); })() : await sendMessage(conversationId, text, replyTo?.id);
      if (!result.success) throw new Error(result.error);
      setText(""); setFile(null); onClearReply(); void setConversationTyping(conversationId, false);
      if (textareaRef.current) textareaRef.current.style.height = "auto";
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Message could not be sent"); }
    finally { setIsSending(false); }
  };
  const insert = (snippet: string) => { setText(current => current + snippet); textareaRef.current?.focus(); };
  return <div className="w-full">
    {replyTo && <div className="mb-2 flex items-center gap-2 rounded-lg border-l-2 border-primary bg-primary/5 px-3 py-2 text-xs"><div className="min-w-0 flex-1"><p className="font-bold text-primary">Replying to message</p><p className="truncate text-muted">{replyTo.content}</p></div><button type="button" onClick={onClearReply} className="rounded p-1 text-muted hover:bg-surface-secondary"><X className="h-4 w-4" /></button></div>}
    {file && <div className="mb-2 flex items-center gap-2 rounded-lg border border-border bg-surface-secondary px-3 py-2 text-xs"><Paperclip className="h-4 w-4 text-primary" /><span className="min-w-0 flex-1 truncate font-bold text-heading">{file.name} ({Math.ceil(file.size / 1024)} KB)</span><button type="button" onClick={() => setFile(null)} className="rounded p-1 text-muted hover:bg-border"><X className="h-4 w-4" /></button></div>}
    <div className="mb-2 flex gap-2 overflow-x-auto"><button type="button" onClick={() => insert("Thanks! ")} className="whitespace-nowrap rounded-full bg-surface-secondary px-3 py-1 text-xs font-bold text-muted hover:bg-border">Thanks!</button><button type="button" onClick={() => insert("Looks great. ")} className="whitespace-nowrap rounded-full bg-surface-secondary px-3 py-1 text-xs font-bold text-muted hover:bg-border">Looks great.</button><button type="button" onClick={() => insert("Can you clarify this? ")} className="whitespace-nowrap rounded-full bg-surface-secondary px-3 py-1 text-xs font-bold text-muted hover:bg-border">Clarify</button><button type="button" onClick={() => insert("Revision requested. ")} className="whitespace-nowrap rounded-full bg-error/10 px-3 py-1 text-xs font-bold text-error hover:bg-error/20">Revision requested</button></div>
    <div className="rounded-[var(--radius-card)] border border-border bg-surface focus-within:ring-2 focus-within:ring-primary/50"><textarea ref={textareaRef} value={text} maxLength={5000} onChange={event => { setText(event.target.value); event.currentTarget.style.height = "auto"; event.currentTarget.style.height = `${Math.min(event.currentTarget.scrollHeight, 140)}px`; if (Date.now() - lastTypingAt.current > 3000) { lastTypingAt.current = Date.now(); void setConversationTyping(conversationId, true); } if (typingTimer.current) clearTimeout(typingTimer.current); typingTimer.current = setTimeout(() => void setConversationTyping(conversationId, false), 5000); }} onKeyDown={event => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void send(); } }} placeholder="Message partner... Markdown supported" className="min-h-14 w-full resize-none bg-transparent p-4 text-sm text-heading outline-none" rows={1} /><div className="flex items-center justify-between px-3 pb-3"><div className="flex items-center gap-1"><input ref={fileRef} type="file" className="hidden" accept=".pdf,.png,.jpg,.jpeg,.webp,.zip,.txt,.md,.json,.js,.ts,.tsx,.css" onChange={event => setFile(event.target.files?.[0] ?? null)} /><button type="button" aria-label="Attach file" onClick={() => fileRef.current?.click()} className="rounded-full p-2 text-muted hover:bg-surface-secondary hover:text-heading"><Paperclip className="h-4 w-4" /></button><button type="button" aria-label="Insert emoji" onClick={() => insert(" 🙂")} className="rounded-full p-2 text-muted hover:bg-surface-secondary hover:text-heading"><Smile className="h-4 w-4" /></button><button type="button" aria-label="Insert code block" onClick={() => insert("\n```ts\n\n```\n")} className="rounded-full p-2 text-muted hover:bg-surface-secondary hover:text-heading"><Code className="h-4 w-4" /></button></div><span className="text-[10px] text-muted">{text.length}/5000</span><button type="button" aria-label="Send message" onClick={() => void send()} disabled={isSending || (!text.trim() && !file)} className="rounded-full bg-primary p-2 text-surface hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"><Send className="h-4 w-4" /></button></div></div>{error && <p className="mt-2 text-xs text-error">{error}</p>}
  </div>;
}