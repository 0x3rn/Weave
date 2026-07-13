"use client";

import { Notification } from "@/types";
import { formatDistanceToNow } from "date-fns";
import { 
  RefreshCw, Store, MessageSquare, Wallet, Star, Shield, 
  Trophy, User, CreditCard, Users, Lock, Info, Bell
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { markNotificationAsRead } from "@/app/actions/notifications";

export function getCategoryIcon(category?: string) {
  switch (category) {
    case "Exchanges": return <RefreshCw className="w-5 h-5" />;
    case "Marketplace": return <Store className="w-5 h-5" />;
    case "Messages": return <MessageSquare className="w-5 h-5" />;
    case "Ledger": return <Wallet className="w-5 h-5" />;
    case "Reviews": return <Star className="w-5 h-5" />;
    case "Trust Score": return <Shield className="w-5 h-5" />;
    case "Achievements": return <Trophy className="w-5 h-5" />;
    case "Account": return <User className="w-5 h-5" />;
    case "Billing": return <CreditCard className="w-5 h-5" />;
    case "Community": return <Users className="w-5 h-5" />;
    case "Security": return <Lock className="w-5 h-5" />;
    case "System": return <Info className="w-5 h-5" />;
    default: return <Bell className="w-5 h-5" />;
  }
}

export function getPriorityColor(priority?: string) {
  switch (priority) {
    case "Critical": return "bg-error/10 text-error";
    case "High": return "bg-warning/10 text-warning";
    case "Normal": return "bg-primary/10 text-primary";
    case "Low": return "bg-surface-secondary text-muted";
    default: return "bg-surface-secondary text-muted";
  }
}

interface NotificationCardProps {
  notification: Notification;
  onRead?: (id: string) => void;
  compact?: boolean;
}

export default function NotificationCard({ notification, onRead, compact = false }: NotificationCardProps) {
  const [isRead, setIsRead] = useState(notification.isRead);

  const handleMouseEnter = async () => {
    if (isRead) return;
    setIsRead(true);
    if (onRead) onRead(notification.id);
    await markNotificationAsRead(notification.id);
  };

  return (
    <div 
      onMouseEnter={handleMouseEnter}
      className={`relative flex items-start gap-3 p-4 transition-colors ${!isRead ? "bg-primary/5" : "bg-transparent"} hover:bg-surface-secondary ${compact ? "" : "border border-border rounded-[var(--radius-card)]"}`}
    >
      {!isRead && (
        <span className="absolute top-4 right-4 w-2 h-2 bg-primary rounded-full"></span>
      )}
      
      <div className={`shrink-0 p-2 rounded-full ${getPriorityColor(notification.priority)}`}>
        {getCategoryIcon(notification.category)}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
          <h4 className="text-sm font-bold text-heading truncate pr-4">{notification.title}</h4>
          <span className="text-xs text-muted shrink-0">
            {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
          </span>
        </div>
        
        <p className={`text-sm text-body ${compact ? "line-clamp-2" : "line-clamp-3"}`}>
          {notification.message}
        </p>
        
        {notification.link && notification.actionLabel && (
          <div className="mt-3">
            <Link 
              href={notification.link}
              className="inline-flex items-center justify-center px-4 py-2 text-xs font-bold text-surface bg-primary rounded-[var(--radius-button)] hover:bg-primary-hover transition-colors"
            >
              {notification.actionLabel}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
