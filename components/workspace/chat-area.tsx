"use client";

import { useState, useEffect, useRef } from "react";
import { Conversation, Message, User, Exchange } from "@/types";
import { db } from "@/lib/firebase";
import { collection, query, where, orderBy, onSnapshot, doc, getDoc } from "firebase/firestore";
import { markConversationRead } from "@/app/actions/messages";
import { ArrowLeft, Phone, Video, MoreVertical, ShieldCheck, CheckCircle2 } from "lucide-react";
import MessageBubble from "./message-bubble";
import Composer from "./composer";

interface Props {
  conversation: Conversation;
  currentUserId: string;
  onBack: () => void;
}

export default function ChatArea({ conversation, currentUserId, onBack }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [partner, setPartner] = useState<User | null>(null);
  const [exchange, setExchange] = useState<Exchange | null>(null);
  const [activeTab, setActiveTab] = useState<"chat" | "files" | "links" | "activity" | "notes">("chat");
  const scrollRef = useRef<HTMLDivElement>(null);

  const partnerId = conversation.participants.find(id => id !== currentUserId);

  useEffect(() => {
    // Mark read
    if ((conversation.unreadCount[currentUserId] || 0) > 0) {
      markConversationRead(conversation.id);
    }
  }, [conversation.id, conversation.unreadCount, currentUserId]);

  useEffect(() => {
    // Fetch Partner and Exchange context
    const fetchContext = async () => {
      if (partnerId) {
        const userDoc = await getDoc(doc(db, "users", partnerId));
        if (userDoc.exists()) setPartner(userDoc.data() as User);
      }
      if (conversation.type === "exchange" && conversation.contextId) {
        const exDoc = await getDoc(doc(db, "exchanges", conversation.contextId));
        if (exDoc.exists()) setExchange(exDoc.data() as Exchange);
      }
    };
    fetchContext();
  }, [partnerId, conversation]);

  useEffect(() => {
    // Real-time listener for messages
    const q = query(
      collection(db, "messages"),
      where("conversationId", "==", conversation.id),
      orderBy("createdAt", "asc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs: Message[] = [];
      snapshot.forEach(doc => {
        msgs.push({ id: doc.id, ...doc.data() } as Message);
      });
      setMessages(msgs);
      
      // Auto-scroll to bottom
      setTimeout(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
      }, 100);
    });

    return () => unsubscribe();
  }, [conversation.id]);

  return (
    <div className="flex flex-col h-full bg-background relative">
      {/* Header */}
      <header className="h-16 px-4 border-b border-border bg-surface shrink-0 flex items-center justify-between z-10 relative">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="md:hidden p-2 -ml-2 text-muted hover:text-heading">
            <ArrowLeft className="w-5 h-5" />
          </button>
          
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-border overflow-hidden">
              {partner?.photoURL ? (
                <img src={partner.photoURL} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary font-bold">
                  {partner?.fullName?.charAt(0) || "U"}
                </div>
              )}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-heading">{partner?.fullName || "Loading..."}</h2>
              {partner?.isVerified && <CheckCircle2 className="w-3 h-3 text-primary" />}
              <span className="text-xs px-1.5 py-0.5 rounded bg-surface-secondary text-muted font-medium border border-border">
                Trust Score {partner?.trustScore || 0}
              </span>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-success"></span>
              <span className="text-xs text-muted">Online</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Coming Soon Features */}
          <div className="hidden sm:flex items-center gap-2 mr-2">
            <button className="p-2 text-muted hover:text-heading hover:bg-surface-secondary rounded-full transition-colors relative group">
              <Phone className="w-5 h-5" />
              <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-heading text-background text-[10px] font-bold rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none transition-opacity">
                Coming Soon
              </div>
            </button>
            <button className="p-2 text-muted hover:text-heading hover:bg-surface-secondary rounded-full transition-colors relative group">
              <Video className="w-5 h-5" />
              <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-heading text-background text-[10px] font-bold rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none transition-opacity">
                Coming Soon
              </div>
            </button>
          </div>
          
          <button className="p-2 text-muted hover:text-heading hover:bg-surface-secondary rounded-full transition-colors">
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex items-center px-4 border-b border-border bg-surface shrink-0 overflow-x-auto scrollbar-hide relative z-10 shadow-subtle">
        {(["chat", "files", "links", "activity", "notes"] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-3 text-sm font-bold border-b-2 whitespace-nowrap transition-colors ${
              activeTab === tab ? "border-primary text-primary" : "border-transparent text-muted hover:text-heading"
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Main Content Area */}
      {activeTab === "chat" ? (
        <>
          {/* Pinned Summary */}
          {exchange && (
            <div className="bg-primary/5 border-b border-primary/10 p-3 flex items-center justify-between shrink-0 relative z-10 shadow-sm">
              <div className="flex items-center gap-3 overflow-hidden">
                <ShieldCheck className="w-5 h-5 text-primary shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-heading truncate">{exchange.title}</p>
                  <p className="text-[10px] text-muted">Exchange Status: <span className="uppercase text-primary font-bold">{exchange.status.replace("_", " ")}</span></p>
                </div>
              </div>
              <button className="text-xs font-bold text-primary hover:underline whitespace-nowrap px-2">
                View Contract
              </button>
            </div>
          )}

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-6 relative z-0">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center max-w-sm mx-auto">
                <div className="w-16 h-16 rounded-full bg-surface-secondary flex items-center justify-center mb-4">
                  <ShieldCheck className="w-8 h-8 text-primary opacity-50" />
                </div>
                <h3 className="text-lg font-bold text-heading mb-2">Secure Workspace</h3>
                <p className="text-sm text-muted">Messages here are protected and tied to your exchange contract. Start the collaboration!</p>
              </div>
            ) : (
              messages.map(msg => (
                <MessageBubble 
                  key={msg.id} 
                  message={msg} 
                  isOwn={msg.senderId === currentUserId} 
                  partner={partner}
                />
              ))
            )}
          </div>

          {/* Composer */}
          <div className="shrink-0 p-4 bg-surface border-t border-border relative z-10">
            <Composer conversationId={conversation.id} />
          </div>
        </>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-surface-secondary/20">
          <div className="px-4 py-2 bg-primary/10 text-primary font-bold text-sm rounded-full mb-4">Coming Soon</div>
          <p className="text-muted max-w-sm">
            {activeTab === "files" && "A dedicated grid for all files shared in this workspace."}
            {activeTab === "links" && "Automatically extracted links to Figma, GitHub, Google Docs."}
            {activeTab === "activity" && "An immutable audit log of all system events."}
            {activeTab === "notes" && "Private scratchpad notes only visible to you."}
          </p>
        </div>
      )}
    </div>
  );
}
