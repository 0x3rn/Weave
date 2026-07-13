"use client";

import { useEffect, useState } from "react";
import { Conversation, Exchange, Escrow } from "@/types";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { ShieldCheck, Clock, CheckCircle2, AlertCircle } from "lucide-react";

interface Props {
  conversation?: Conversation;
  currentUserId: string;
}

export default function ExchangeQuickPanel({ conversation, currentUserId }: Props) {
  const [exchange, setExchange] = useState<Exchange | null>(null);
  const [escrow, setEscrow] = useState<Escrow | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (conversation?.type === "exchange" && conversation.contextId) {
        const exDoc = await getDoc(doc(db, "exchanges", conversation.contextId));
        if (exDoc.exists()) {
          const exData = exDoc.data() as Exchange;
          setExchange(exData);

          if (exData.escrowId) {
            const escDoc = await getDoc(doc(db, "escrows", exData.escrowId));
            if (escDoc.exists()) {
              setEscrow(escDoc.data() as Escrow);
            }
          }
        }
      }
    };
    fetchData();
  }, [conversation]);

  if (!conversation || conversation.type !== "exchange" || !exchange) {
    return (
      <div className="p-6 text-center text-muted">
        <p className="text-sm">No active exchange context.</p>
      </div>
    );
  }

  // Calculate Health
  const isHealthy = escrow ? escrow.status !== "disputed" : exchange.status !== "disputed" && exchange.status !== "cancelled";

  return (
    <div className="h-full flex flex-col overflow-y-auto">
      <div className="p-6 border-b border-border bg-surface-secondary/30">
        <h3 className="text-sm font-bold text-heading uppercase tracking-wider mb-4">Project Health</h3>
        
        <div className="bg-surface border border-border p-4 rounded-[var(--radius-card)] mb-4">
          <div className="flex items-center gap-2 mb-2">
            <div className={`w-2.5 h-2.5 rounded-full ${isHealthy ? "bg-success" : "bg-error"}`}></div>
            <span className="text-sm font-bold text-heading">{isHealthy ? "Healthy" : "Needs Attention"}</span>
          </div>
          <p className="text-xs text-muted">Active collaboration in progress.</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-surface border border-border p-3 rounded-[var(--radius-button)]">
            <span className="text-xs text-muted block mb-1">Messages</span>
            <span className="text-sm font-bold text-heading">--</span>
          </div>
          <div className="bg-surface border border-border p-3 rounded-[var(--radius-button)]">
            <span className="text-xs text-muted block mb-1">Files</span>
            <span className="text-sm font-bold text-heading">--</span>
          </div>
        </div>
      </div>

      <div className="p-6 border-b border-border space-y-4">
        <h3 className="text-sm font-bold text-heading uppercase tracking-wider flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-primary" />
          Escrow Protection
        </h3>
        
        {escrow ? (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted">Status</span>
              <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                escrow.status === "locked" ? "bg-primary/10 text-primary" : 
                escrow.status === "pending_deposits" ? "bg-warning/10 text-warning" :
                "bg-surface-secondary text-muted"
              }`}>
                {escrow.status.replace("_", " ")}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted">Skill Hours</span>
              <span className="text-xs font-bold text-heading">{exchange.skillHours} Locked</span>
            </div>
            
            <div className="mt-4 p-3 bg-primary/5 rounded-[var(--radius-button)]">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <p className="text-xs text-heading">This exchange is fully protected by Weave Escrow.</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-3 bg-warning/10 rounded-[var(--radius-button)]">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-warning shrink-0 mt-0.5" />
              <p className="text-xs text-heading font-medium">Escrow not initialized.</p>
            </div>
          </div>
        )}
      </div>

      <div className="p-6 border-b border-border space-y-4">
        <h3 className="text-sm font-bold text-heading uppercase tracking-wider flex items-center gap-2">
          <Clock className="w-4 h-4 text-primary" />
          Milestones
        </h3>
        
        <div className="space-y-3">
          {exchange.milestones && exchange.milestones.length > 0 ? (
            exchange.milestones.map(m => (
              <div key={m.id} className="flex gap-2">
                <div className="mt-0.5 shrink-0">
                  {m.status === "completed" ? (
                    <CheckCircle2 className="w-4 h-4 text-success" />
                  ) : m.status === "in_progress" ? (
                    <div className="w-4 h-4 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
                  ) : (
                    <div className="w-4 h-4 rounded-full border-2 border-border"></div>
                  )}
                </div>
                <div>
                  <p className={`text-xs font-medium ${m.status === "completed" ? "text-muted line-through" : "text-heading"}`}>
                    {m.title}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-xs text-muted">No specific milestones tracked.</p>
          )}
        </div>
      </div>
      
    </div>
  );
}
