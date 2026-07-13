"use client";

import { useState, useRef } from "react";
import { Send, Paperclip, Smile, Code } from "lucide-react";
import { sendMessage } from "@/app/actions/messages";

export default function Composer({ conversationId }: { conversationId: string }) {
  const [text, setText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = async () => {
    if (!text.trim() || isSending) return;
    
    setIsSending(true);
    const content = text;
    setText(""); // Optimistic clear
    
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'; // Reset height
    }

    const res = await sendMessage(conversationId, content, "text");
    setIsSending(false);
    
    if (!res.success) {
      // Revert if failed
      setText(content);
      console.error(res.error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const adjustHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  };

  const insertSnippet = (snippet: string) => {
    const newText = text + snippet;
    setText(newText);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  return (
    <div className="w-full">
      {/* Templates Row */}
      <div className="flex gap-2 mb-2 overflow-x-auto scrollbar-hide">
        <button onClick={() => insertSnippet("Thanks! ")} className="px-3 py-1 bg-surface-secondary text-muted text-xs font-bold rounded-full whitespace-nowrap hover:bg-border transition-colors">
          Thanks!
        </button>
        <button onClick={() => insertSnippet("Looks great. ")} className="px-3 py-1 bg-surface-secondary text-muted text-xs font-bold rounded-full whitespace-nowrap hover:bg-border transition-colors">
          Looks great.
        </button>
        <button onClick={() => insertSnippet("Can you clarify this? ")} className="px-3 py-1 bg-surface-secondary text-muted text-xs font-bold rounded-full whitespace-nowrap hover:bg-border transition-colors">
          Can you clarify this?
        </button>
        <button onClick={() => insertSnippet("Revision requested. ")} className="px-3 py-1 bg-error/10 text-error text-xs font-bold rounded-full whitespace-nowrap hover:bg-error/20 transition-colors">
          Revision requested.
        </button>
      </div>

      <div className="bg-surface border border-border rounded-[var(--radius-card)] focus-within:ring-2 focus-within:ring-primary/50 transition-shadow">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            adjustHeight();
          }}
          onKeyDown={handleKeyDown}
          placeholder="Message partner... (Markdown supported)"
          className="w-full bg-transparent text-heading text-sm p-4 outline-none resize-none min-h-[56px] max-h-[120px]"
          rows={1}
        />
        
        <div className="flex items-center justify-between px-3 pb-3">
          <div className="flex items-center gap-1">
            <button className="p-2 text-muted hover:text-heading hover:bg-surface-secondary rounded-full transition-colors relative group">
              <Paperclip className="w-4 h-4" />
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-heading text-background text-[10px] font-bold rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none">
                Attach File
              </div>
            </button>
            <button className="p-2 text-muted hover:text-heading hover:bg-surface-secondary rounded-full transition-colors hidden sm:block">
              <Smile className="w-4 h-4" />
            </button>
            <button 
              onClick={() => insertSnippet("\n```\n// Your code here\n```\n")}
              className="p-2 text-muted hover:text-heading hover:bg-surface-secondary rounded-full transition-colors hidden sm:block"
            >
              <Code className="w-4 h-4" />
            </button>
          </div>
          
          <button 
            onClick={handleSend}
            disabled={!text.trim() || isSending}
            className="p-2 bg-primary text-surface rounded-full hover:bg-primary-hover disabled:opacity-50 disabled:hover:bg-primary transition-colors"
          >
            <Send className="w-4 h-4 translate-x-[-1px] translate-y-[1px]" />
          </button>
        </div>
      </div>
    </div>
  );
}
