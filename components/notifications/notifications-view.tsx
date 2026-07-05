"use client";

import { useState } from "react";
import { Notification, ExchangeRequest } from "@/types";
import { updateExchangeRequest, getExchangeRequests } from "@/app/actions/exchanges";
import { markNotificationAsRead } from "@/app/actions/notifications";
import { Bell, Check, X, Clock, Calendar, MessageSquare, Edit2, Loader2 } from "lucide-react";
import RequestReviewModal from "./request-review-modal";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface NotificationsViewProps {
  initialNotifications: Notification[];
  initialRequests: ExchangeRequest[];
  currentUserId: string;
}

export default function NotificationsView({ initialNotifications, initialRequests, currentUserId }: NotificationsViewProps) {
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);
  const [requests, setRequests] = useState<ExchangeRequest[]>(initialRequests);
  const [reviewingRequest, setReviewingRequest] = useState<ExchangeRequest | null>(null);
  const [isProcessing, setIsProcessing] = useState<string | null>(null); // requestId being processed

  const handleMarkAsRead = async (id: string) => {
    if (notifications.find(n => n.id === id)?.isRead) return;
    
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    await markNotificationAsRead(id);
  };

  const handleAction = async (requestId: string, action: "accepted" | "rejected") => {
    setIsProcessing(requestId);
    const result = await updateExchangeRequest(requestId, action);
    if (result.success) {
      toast.success(`Request ${action}.`);
      setRequests(prev => prev.map(r => r.id === requestId ? { ...r, status: action } : r));
    } else {
      toast.error(result.error || "Failed to process request.");
    }
    setIsProcessing(null);
  };

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
          <Bell className="w-6 h-6 text-primary" />
        </div>
        <h1 className="text-3xl font-bold text-heading">Notifications</h1>
      </div>

      <div className="space-y-6">
        {notifications.length === 0 ? (
          <div className="bg-surface border border-border rounded-[var(--radius-card)] p-12 text-center shadow-subtle">
            <Bell className="w-12 h-12 text-border mx-auto mb-4" />
            <h3 className="text-lg font-bold text-heading">All caught up!</h3>
            <p className="text-muted mt-2">You have no new notifications.</p>
          </div>
        ) : (
          notifications.map(notif => {
            const isRequestNotif = notif.type === "exchange_request" || notif.type === "request_update";
            const request = isRequestNotif ? requests.find(r => r.id === notif.relatedId) : null;
            const isReceiver = request?.receiverId === currentUserId;
            
            return (
              <div 
                key={notif.id}
                onMouseEnter={() => handleMarkAsRead(notif.id)}
                className={`bg-surface border ${notif.isRead ? "border-border" : "border-primary/30 shadow-md"} rounded-[var(--radius-card)] p-5 transition-all`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      {!notif.isRead && <span className="w-2 h-2 rounded-full bg-primary" />}
                      <h3 className="font-bold text-heading">{notif.title}</h3>
                      <span className="text-xs text-muted font-medium ml-2">
                        {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-sm text-body">{notif.message}</p>
                  </div>
                </div>

                {request && (
                  <div className="mt-4 p-4 bg-background border border-border rounded-[var(--radius-button)]">
                    <div className="flex flex-wrap items-center gap-4 text-sm font-medium mb-3">
                      <span className="flex items-center gap-1.5 text-heading bg-surface-secondary px-2 py-1 rounded">
                        <Check className="w-4 h-4 text-primary" />
                        Skill: {request.skillNeeded}
                      </span>
                      <span className="flex items-center gap-1.5 text-heading bg-surface-secondary px-2 py-1 rounded">
                        <Calendar className="w-4 h-4 text-primary" />
                        {request.dateOptions.length} date(s)
                      </span>
                      <span className="flex items-center gap-1.5 text-heading bg-surface-secondary px-2 py-1 rounded">
                        <Clock className="w-4 h-4 text-primary" />
                        {request.hoursNeeded ? `${request.hoursNeeded} hours` : `At ${request.timeNeeded}`}
                      </span>
                      <span className="flex items-center gap-1.5 font-bold uppercase tracking-wide text-xs px-2 py-1 rounded bg-surface">
                        Status: 
                        <span className={`
                          ${request.status === 'pending' ? 'text-warning' : ''}
                          ${request.status === 'accepted' ? 'text-success' : ''}
                          ${request.status === 'rejected' ? 'text-error' : ''}
                          ${request.status === 'reviewing' ? 'text-primary' : ''}
                        `}>
                          {request.status}
                        </span>
                      </span>
                    </div>
                    
                    {request.message && (
                      <div className="flex items-start gap-2 text-sm text-muted bg-surface-secondary/50 p-3 rounded mb-4">
                        <MessageSquare className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <p className="italic">"{request.message}"</p>
                      </div>
                    )}

                    {isReceiver && request.status === "pending" && (
                      <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-border/50">
                        <button
                          onClick={() => handleAction(request.id, "accepted")}
                          disabled={isProcessing === request.id}
                          className="px-4 py-2 bg-success text-surface text-sm font-bold rounded-[var(--radius-button)] hover:bg-success/90 transition-colors flex items-center gap-2"
                        >
                          {isProcessing === request.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                          Accept
                        </button>
                        <button
                          onClick={() => setReviewingRequest(request)}
                          disabled={isProcessing === request.id}
                          className="px-4 py-2 bg-primary/10 text-primary text-sm font-bold rounded-[var(--radius-button)] hover:bg-primary/20 transition-colors flex items-center gap-2"
                        >
                          <Edit2 className="w-4 h-4" />
                          Review (Edit)
                        </button>
                        <button
                          onClick={() => handleAction(request.id, "rejected")}
                          disabled={isProcessing === request.id}
                          className="px-4 py-2 bg-surface border border-error text-error text-sm font-bold rounded-[var(--radius-button)] hover:bg-error hover:text-surface transition-colors flex items-center gap-2 ml-auto"
                        >
                          <X className="w-4 h-4" />
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
      
      {reviewingRequest && (
        <RequestReviewModal
          request={reviewingRequest}
          onClose={() => setReviewingRequest(null)}
          onSuccess={() => {
            setReviewingRequest(null);
            setRequests(prev => prev.map(r => r.id === reviewingRequest.id ? { ...r, status: "reviewing" } : r));
            toast.success("Counter-offer sent successfully.");
          }}
        />
      )}
    </div>
  );
}
