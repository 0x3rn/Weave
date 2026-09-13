"use client";

import { Notification } from "@/types";
import { formatDistanceToNow } from "date-fns";
import {
  Archive, Bell, Check, CreditCard, Info, Lock, MessageSquare,
  RefreshCw, Shield, Star, Store, Trophy, User, Users, Wallet,
} from "lucide-react";
import Link from "next/link";

export function getCategoryIcon(category?: string) {
  switch (category) {
    case "Exchanges": return <RefreshCw className="h-5 w-5" />;
    case "Marketplace": return <Store className="h-5 w-5" />;
    case "Messages": return <MessageSquare className="h-5 w-5" />;
    case "Ledger": return <Wallet className="h-5 w-5" />;
    case "Reviews": return <Star className="h-5 w-5" />;
    case "Trust Score": return <Shield className="h-5 w-5" />;
    case "Achievements": return <Trophy className="h-5 w-5" />;
    case "Account": return <User className="h-5 w-5" />;
    case "Billing": return <CreditCard className="h-5 w-5" />;
    case "Community": return <Users className="h-5 w-5" />;
    case "Security": return <Lock className="h-5 w-5" />;
    case "System": return <Info className="h-5 w-5" />;
    default: return <Bell className="h-5 w-5" />;
  }
}

export function getPriorityColor(priority?: string) {
  switch (priority) {
    case "Critical": return "bg-error/10 text-error";
    case "High": return "bg-warning/10 text-warning";
    case "Normal": return "bg-primary/10 text-primary";
    default: return "bg-surface-secondary text-muted";
  }
}

interface NotificationCardProps {
  notification: Notification;
  onRead?: (id: string) => void;
  onArchive?: (id: string) => void;
  onOpen?: (notification: Notification) => void;
  compact?: boolean;
}

function internalHref(link?: string) {
  return link?.startsWith("/") && !link.startsWith("//") ? link : undefined;
}

export default function NotificationCard({ notification, onRead, onArchive, onOpen, compact = false }: NotificationCardProps) {
  const href = internalHref(notification.link);
  const date = new Date(notification.createdAt);
  const relativeTime = Number.isNaN(date.getTime()) ? "Recently" : formatDistanceToNow(date, { addSuffix: true });

  return (
    <article className={`relative flex items-start gap-3 p-4 transition-colors ${!notification.isRead ? "bg-primary/5" : "bg-transparent"} ${compact ? "rounded-lg hover:bg-surface-secondary" : "border border-border rounded-[var(--radius-card)]"}`}>
      <div className={`shrink-0 rounded-full p-2 ${getPriorityColor(notification.priority)}`}>
        {getCategoryIcon(notification.category)}
      </div>
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
          <button type="button" onClick={() => onOpen?.(notification)} className="min-w-0 text-left">
            <span className="line-clamp-2 block text-sm font-bold text-heading">{notification.title}</span>
          </button>
          <span className="shrink-0 text-xs text-muted">{relativeTime}</span>
        </div>
        <p className={`text-sm text-body ${compact ? "line-clamp-2" : "line-clamp-3"}`}>{notification.message}</p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {notification.category && <span className="rounded-full bg-surface-secondary px-2 py-1 text-[11px] font-semibold text-muted">{notification.category}</span>}
          {notification.priority && notification.priority !== "Normal" && <span className={`rounded-full px-2 py-1 text-[11px] font-semibold ${getPriorityColor(notification.priority)}`}>{notification.priority}</span>}
          {href && notification.actionLabel && (
            <Link href={href} onClick={() => !notification.isRead && onRead?.(notification.id)} className="rounded-[var(--radius-button)] bg-primary px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-primary-hover">
              {notification.actionLabel}
            </Link>
          )}
          {!notification.isRead && onRead && (
            <button type="button" onClick={() => onRead(notification.id)} className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold text-primary hover:text-primary-hover">
              <Check className="h-3.5 w-3.5" /> Mark read
            </button>
          )}
          {onArchive && (
            <button type="button" onClick={() => onArchive(notification.id)} className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold text-muted hover:text-heading">
              <Archive className="h-3.5 w-3.5" /> {notification.isArchived ? "Restore" : "Archive"}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
