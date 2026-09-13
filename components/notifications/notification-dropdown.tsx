"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Bell, Check, Settings } from "lucide-react";
import Link from "next/link";
import { Notification } from "@/types";
import NotificationCard from "./notification-card";
import { getNotifications, markAllNotificationsAsRead, markNotificationAsRead } from "@/app/actions/notifications";
import { usePathname } from "next/navigation";
import toast from "react-hot-toast";

export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  const fetchNotifications = useCallback(async () => {
    try {
      const result = await getNotifications();
      if (result.success && result.notifications) setNotifications(result.notifications.filter(item => !item.isArchived));
    } catch {
      // Keep the last successful snapshot during brief network failures.
    }
  }, []);

  useEffect(() => {
    void fetchNotifications();
    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") void fetchNotifications();
    }, 30_000);
    const handleVisibility = () => document.visibilityState === "visible" && void fetchNotifications();
    window.addEventListener("focus", handleVisibility);
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", handleVisibility);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [fetchNotifications, pathname]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMarkAllRead = async () => {
    const previous = notifications;
    setNotifications(items => items.map(item => ({ ...item, isRead: true })));
    try {
      const result = await markAllNotificationsAsRead();
      if (result.success) return;
      setNotifications(previous);
      toast.error(result.error || "Unable to mark notifications as read");
    } catch {
      setNotifications(previous);
      toast.error("Unable to mark notifications as read");
    }
  };

  const handleRead = async (id: string) => {
    const previous = notifications;
    setNotifications(items => items.map(item => item.id === id ? { ...item, isRead: true } : item));
    try {
      const result = await markNotificationAsRead(id);
      if (result.success) return;
      setNotifications(previous);
      toast.error(result.error || "Unable to update notification");
    } catch {
      setNotifications(previous);
      toast.error("Unable to update notification");
    }
  };

  const unreadCount = notifications.filter(item => !item.isRead).length;
  const newNotifications = notifications.filter(item => !item.isRead).slice(0, 5);
  const earlierNotifications = notifications.filter(item => item.isRead).slice(0, 5);

  return (
    <div className="relative" ref={dropdownRef}>
      <button type="button" aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ""}`} aria-expanded={isOpen} onClick={() => setIsOpen(open => !open)} className="relative p-2 text-muted transition-colors hover:text-heading">
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-primary" />}
      </button>

      {isOpen && (
        <div className="absolute right-0 z-50 mt-2 flex max-h-[85vh] w-[min(380px,calc(100vw-2rem))] flex-col overflow-hidden rounded-[var(--radius-card)] border border-border bg-background shadow-xl">
          <div className="flex shrink-0 items-center justify-between border-b border-border bg-surface p-4">
            <div>
              <h3 className="text-lg font-bold text-heading">Notifications</h3>
              <p className="text-xs text-muted">{unreadCount ? `${unreadCount} unread` : "You are all caught up"}</p>
            </div>
            <div className="flex items-center gap-2">
              <button type="button" onClick={handleMarkAllRead} disabled={!unreadCount} title="Mark all as read" className="rounded-full p-2 text-muted transition-colors hover:bg-surface-secondary hover:text-primary disabled:opacity-40"><Check className="h-4 w-4" /></button>
              <Link href="/settings/notifications" onClick={() => setIsOpen(false)} title="Notification settings" className="rounded-full p-2 text-muted transition-colors hover:bg-surface-secondary hover:text-primary"><Settings className="h-4 w-4" /></Link>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2">
            {!notifications.length ? (
              <div className="py-8 text-center"><Bell className="mx-auto mb-3 h-10 w-10 text-border" /><p className="text-sm font-medium text-heading">You are all caught up</p><p className="text-xs text-muted">No new notifications.</p></div>
            ) : (
              <div className="space-y-4">
                {!!newNotifications.length && <section><h4 className="px-2 py-1 text-xs font-bold uppercase tracking-wider text-muted">New</h4><div className="space-y-1">{newNotifications.map(item => <NotificationCard key={item.id} notification={item} compact onRead={handleRead} />)}</div></section>}
                {!!earlierNotifications.length && <section><h4 className="mt-2 px-2 py-1 text-xs font-bold uppercase tracking-wider text-muted">Earlier</h4><div className="space-y-1">{earlierNotifications.map(item => <NotificationCard key={item.id} notification={item} compact />)}</div></section>}
              </div>
            )}
          </div>

          <div className="shrink-0 border-t border-border bg-surface p-3 text-center">
            <Link href="/notifications" onClick={() => setIsOpen(false)} className="text-sm font-bold text-primary transition-colors hover:text-primary-hover">View all notifications <span aria-hidden="true">→</span></Link>
          </div>
        </div>
      )}
    </div>
  );
}
