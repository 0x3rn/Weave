"use client";

import { useState, useEffect } from "react";
import { Conversation, User } from "@/types";
import { Search, Filter, ShieldCheck, Star } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

interface Props {
  conversations: Conversation[];
  currentUserId: string;
  activeConversationId?: string;
  onSelect: () => void;
}

export default function ConversationList({ conversations, currentUserId, activeConversationId, onSelect }: Props) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "unread" | "exchange">("all");
  const [partners, setPartners] = useState<Record<string, User>>({});

  useEffect(() => {
    // Fetch partner details for each conversation
    const fetchPartners = async () => {
      const newPartners: Record<string, User> = {};
      for (const conv of conversations) {
        const partnerId = conv.participants.find(id => id !== currentUserId);
        if (partnerId && !partners[partnerId]) {
          try {
            const userDoc = await getDoc(doc(db, "users", partnerId));
            if (userDoc.exists()) {
              newPartners[partnerId] = userDoc.data() as User;
            }
          } catch (e) {
            console.error(e);
          }
        }
      }
      setPartners(prev => ({ ...prev, ...newPartners }));
    };
    
    if (conversations.length > 0) {
      fetchPartners();
    }
  }, [conversations, currentUserId]);

  const filtered = conversations.filter(c => {
    if (filter === "unread" && (c.unreadCount[currentUserId] || 0) === 0) return false;
    if (filter === "exchange" && c.type !== "exchange") return false;
    
    if (search) {
      const partnerId = c.participants.find(id => id !== currentUserId);
      const partnerName = partnerId ? partners[partnerId]?.fullName || "" : "";
      return partnerName.toLowerCase().includes(search.toLowerCase());
    }
    
    return true;
  });

  return (
    <div className="flex flex-col h-full">
      {/* Header & Search */}
      <div className="p-4 border-b border-border space-y-4 shrink-0">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-heading">Messages</h2>
        </div>
        
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input 
            type="text" 
            placeholder="Search conversations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-surface-secondary border border-border rounded-[var(--radius-button)] text-sm text-heading placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
          />
        </div>

        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {(["all", "unread", "exchange"] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${
                filter === f 
                  ? "bg-primary text-surface" 
                  : "bg-surface-secondary text-muted hover:text-heading"
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-muted">
            <p className="text-sm">No conversations found.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map(conv => {
              const partnerId = conv.participants.find(id => id !== currentUserId);
              const partner = partnerId ? partners[partnerId] : null;
              const unread = conv.unreadCount[currentUserId] || 0;
              const isActive = activeConversationId === conv.id;

              return (
                <Link 
                  key={conv.id} 
                  href={`/messages/${conv.id}`}
                  onClick={onSelect}
                  className={`block p-4 transition-colors hover:bg-surface-secondary/50 ${isActive ? "bg-surface-secondary border-l-2 border-primary" : "border-l-2 border-transparent"}`}
                >
                  <div className="flex gap-3">
                    {/* Avatar */}
                    <div className="relative shrink-0">
                      <div className="w-12 h-12 rounded-full bg-border overflow-hidden">
                        {partner?.photoURL ? (
                          <img src={partner.photoURL} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary font-bold text-lg">
                            {partner?.fullName?.charAt(0) || "U"}
                          </div>
                        )}
                      </div>
                      {/* Online indicator stub */}
                      <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-success border-2 border-surface rounded-full"></div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline mb-0.5">
                        <h3 className={`text-sm truncate pr-2 ${unread > 0 ? "font-bold text-heading" : "font-medium text-heading"}`}>
                          {partner?.fullName || "Loading..."}
                        </h3>
                        <span className="text-xs text-muted whitespace-nowrap">
                          {conv.lastMessageAt ? formatDistanceToNow(new Date(conv.lastMessageAt), { addSuffix: true }) : ""}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-1 mb-1">
                        {conv.type === "exchange" && <ShieldCheck className="w-3 h-3 text-primary" />}
                        <p className="text-xs font-bold text-primary truncate">
                          Project Workspace
                        </p>
                      </div>

                      <div className="flex justify-between items-center gap-2">
                        <p className={`text-sm truncate ${unread > 0 ? "font-semibold text-heading" : "text-muted"}`}>
                          {conv.lastMessage || "No messages yet"}
                        </p>
                        {unread > 0 && (
                          <div className="w-5 h-5 rounded-full bg-primary text-surface text-[10px] font-bold flex items-center justify-center shrink-0">
                            {unread}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
