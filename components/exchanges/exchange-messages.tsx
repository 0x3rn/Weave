"use client";

import { useState, useEffect, useRef } from "react";
import { getMessages, getOrCreateExchangeConversation, sendMessage } from "@/app/actions/messages";
import { Send } from "lucide-react";
import { ExchangeMessage } from "@/types";

interface ExchangeMessagesProps {
  exchangeId: string;
  currentUserId: string;
  otherPartyName: string;
  otherPartyAvatar: string | null;
  initialMessages?: ExchangeMessage[];
}

export default function ExchangeMessages({ 
  exchangeId, 
  currentUserId,
  otherPartyName,
  otherPartyAvatar,
  initialMessages = [],
}: ExchangeMessagesProps) {
  const [messages, setMessages] = useState<ExchangeMessage[]>(initialMessages);
  const [newMessage, setNewMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!exchangeId) return;
    let active = true;
    const load = async () => {
      const conversation = await getOrCreateExchangeConversation(exchangeId);
      if (!conversation.success) return;
      const result = await getMessages(exchangeId);
      if (active && result.success) setMessages(result.messages.map(message => ({ id: message.id, exchangeId, senderId: message.senderId, text: message.content, createdAt: message.createdAt, isRead: message.readBy?.includes(currentUserId) ?? false })));
    };
    load();
    const timer = window.setInterval(load, 5000);
    return () => { active = false; window.clearInterval(timer); };
  }, [exchangeId, currentUserId]);

  useEffect(() => {
    // Scroll to bottom on new messages
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    setIsSending(true);
    try {
      const conversation = await getOrCreateExchangeConversation(exchangeId);
      if (!conversation.success) throw new Error(conversation.error);
      const result = await sendMessage(exchangeId, newMessage.trim());
      if (!result.success) throw new Error(result.error);
      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-280px)] bg-surface border border-border rounded-[var(--radius-card)] shadow-subtle overflow-hidden">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-muted">
            <p className="font-medium mb-1">No messages yet</p>
            <p className="text-sm">Start the conversation with {otherPartyName}</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.senderId === currentUserId;
            
            return (
              <div key={msg.id} className={`flex gap-3 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                {/* Avatar */}
                {!isMe && (
                  otherPartyAvatar ? (
                    <img src={otherPartyAvatar} alt={otherPartyName} className="w-8 h-8 rounded-full shrink-0 object-cover mt-auto" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-secondary shrink-0 flex items-center justify-center text-heading font-bold mt-auto text-xs">
                      {otherPartyName.charAt(0)}
                    </div>
                  )
                )}
                
                {/* Message Bubble */}
                <div className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${
                  isMe 
                    ? 'bg-primary text-primary-foreground rounded-br-sm' 
                    : 'bg-surface-secondary text-body border border-border rounded-bl-sm'
                }`}>
                  <p className="whitespace-pre-wrap break-words">{msg.text}</p>
                  <p className={`text-[10px] mt-1 text-right opacity-70 ${isMe ? 'text-primary-foreground' : 'text-muted'}`}>
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-3 bg-surface border-t border-border">
        <form onSubmit={handleSendMessage} className="flex gap-2 items-center">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 bg-surface-secondary border border-border rounded-full px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-body"
            disabled={isSending}
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || isSending}
            className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
          >
            <Send className="w-4 h-4 ml-0.5" />
          </button>
        </form>
      </div>
    </div>
  );
}
