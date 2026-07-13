"use client";

import { Message, User } from "@/types";
import { format } from "date-fns";
import { ShieldCheck, FileText, CheckCircle2 } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface Props {
  message: Message;
  isOwn: boolean;
  partner: User | null;
}

export default function MessageBubble({ message, isOwn, partner }: Props) {
  if (message.type === "system_event") {
    return (
      <div className="flex justify-center my-4">
        <div className="bg-surface-secondary/50 border border-border px-4 py-2 rounded-full flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-primary" />
          <span className="text-xs font-bold text-muted">{message.content}</span>
          <span className="text-[10px] text-muted ml-2">{format(new Date(message.createdAt), "h:mm a")}</span>
        </div>
      </div>
    );
  }

  if (message.type === "rich_card") {
    return (
      <div className={`flex ${isOwn ? "justify-end" : "justify-start"} mb-4`}>
        <div className="max-w-[85%] sm:max-w-[70%]">
          <div className="bg-surface border border-border rounded-[var(--radius-card)] p-4 shadow-subtle hover:border-primary/50 transition-colors cursor-pointer group">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center text-primary">
                {message.metadata?.icon === "file" ? <FileText className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
              </div>
              <div>
                <p className="text-xs font-bold text-muted uppercase tracking-wider">{message.metadata?.title || "Action Required"}</p>
                <p className="text-sm font-bold text-heading">{message.content}</p>
              </div>
            </div>
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
              <span className="text-xs text-muted">{format(new Date(message.createdAt), "MMM d, h:mm a")}</span>
              <span className="text-xs font-bold text-primary group-hover:underline">View →</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex ${isOwn ? "justify-end" : "justify-start"} mb-4`}>
      <div className={`flex gap-3 max-w-[85%] sm:max-w-[70%] ${isOwn ? "flex-row-reverse" : "flex-row"}`}>
        
        {/* Avatar */}
        <div className="shrink-0 pt-1 hidden sm:block">
          <div className="w-8 h-8 rounded-full bg-border overflow-hidden">
            {isOwn ? (
              <div className="w-full h-full flex items-center justify-center bg-heading text-surface font-bold text-xs">Me</div>
            ) : partner?.photoURL ? (
              <img src={partner.photoURL} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary font-bold text-xs">
                {partner?.fullName?.charAt(0) || "U"}
              </div>
            )}
          </div>
        </div>

        {/* Bubble */}
        <div className="flex flex-col">
          <div className="flex items-baseline gap-2 mx-1 mb-1">
            <span className="text-xs font-bold text-muted">{isOwn ? "You" : partner?.fullName}</span>
            <span className="text-[10px] text-muted/70">{format(new Date(message.createdAt), "h:mm a")}</span>
          </div>
          
          <div className={`px-4 py-2.5 rounded-2xl ${
            isOwn 
              ? "bg-primary text-surface rounded-tr-sm" 
              : "bg-surface border border-border text-heading rounded-tl-sm shadow-subtle"
          }`}>
            <div className={`prose prose-sm max-w-none ${isOwn ? "prose-invert" : ""} prose-p:my-1 prose-pre:my-2 prose-pre:bg-surface-secondary prose-pre:text-heading`}>
              <ReactMarkdown>{message.content}</ReactMarkdown>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
