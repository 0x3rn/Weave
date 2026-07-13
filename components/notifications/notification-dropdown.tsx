"use client";

import { useState, useRef, useEffect } from "react";
import { Bell, Check, Settings } from "lucide-react";
import Link from "next/link";
import { Notification } from "@/types";
import NotificationCard from "./notification-card";
import { markAllNotificationsAsRead, getNotifications } from "@/app/actions/notifications";
import { usePathname } from "next/navigation";

export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    fetchNotifications();
  }, [pathname]); // Refresh on navigation

  const fetchNotifications = async () => {
    const result = await getNotifications();
    if (result.success && result.notifications) {
      setNotifications(result.notifications);
      setUnreadCount(result.notifications.filter(n => !n.isRead).length);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMarkAllRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    setUnreadCount(0);
    await markAllNotificationsAsRead();
  };

  const handleRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const newNotifications = notifications.filter(n => !n.isRead).slice(0, 5);
  const earlierNotifications = notifications.filter(n => n.isRead).slice(0, 5);

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-muted hover:text-heading transition-colors relative"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full"></span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-[380px] bg-background border border-border shadow-xl rounded-[var(--radius-card)] z-50 overflow-hidden flex flex-col max-h-[85vh]">
          {/* Header */}
          <div className="p-4 border-b border-border flex items-center justify-between bg-surface shrink-0">
            <div>
              <h3 className="font-bold text-heading text-lg">Notifications</h3>
              <p className="text-xs text-muted">Stay updated on your exchanges and account.</p>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={handleMarkAllRead}
                title="Mark all as read"
                className="p-2 text-muted hover:text-primary transition-colors rounded-full hover:bg-surface-secondary"
              >
                <Check className="w-4 h-4" />
              </button>
              <Link 
                href="/settings/notifications"
                onClick={() => setIsOpen(false)}
                title="Notification Settings"
                className="p-2 text-muted hover:text-primary transition-colors rounded-full hover:bg-surface-secondary"
              >
                <Settings className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Body */}
          <div className="overflow-y-auto flex-1 p-2">
            {notifications.length === 0 ? (
              <div className="py-8 text-center">
                <Bell className="w-10 h-10 text-border mx-auto mb-3" />
                <p className="text-sm font-medium text-heading">You're all caught up 🎉</p>
                <p className="text-xs text-muted">No new notifications.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {newNotifications.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-muted uppercase tracking-wider px-2 py-1">New</h4>
                    <div className="space-y-1">
                      {newNotifications.map(notif => (
                        <NotificationCard key={notif.id} notification={notif} compact onRead={handleRead} />
                      ))}
                    </div>
                  </div>
                )}

                {earlierNotifications.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-muted uppercase tracking-wider px-2 py-1 mt-2">Earlier</h4>
                    <div className="space-y-1">
                      {earlierNotifications.map(notif => (
                        <NotificationCard key={notif.id} notification={notif} compact onRead={handleRead} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-3 border-t border-border bg-surface shrink-0 text-center">
            <Link 
              href="/dashboard/notifications" 
              onClick={() => setIsOpen(false)}
              className="text-sm font-bold text-primary hover:text-primary-hover transition-colors inline-block"
            >
              View All Notifications &rarr;
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
