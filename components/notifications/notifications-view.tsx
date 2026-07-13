"use client";

import { useState, useMemo } from "react";
import { Notification, ExchangeRequest } from "@/types";
import { updateExchangeRequest } from "@/app/actions/exchanges";
import { markNotificationAsRead, bulkUpdateNotifications, bulkDeleteNotifications, markAllNotificationsAsRead } from "@/app/actions/notifications";
import { 
  Bell, Check, Trash2, Archive, Search, Filter, AlertCircle, 
  Clock, Calendar, X
} from "lucide-react";
import toast from "react-hot-toast";
import NotificationCard from "./notification-card";

interface NotificationsViewProps {
  initialNotifications: Notification[];
  initialRequests: ExchangeRequest[];
  currentUserId: string;
}

export default function NotificationsView({ initialNotifications, initialRequests, currentUserId }: NotificationsViewProps) {
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);
  const [activeTab, setActiveTab] = useState<"all" | "actionable" | "mentions" | "archive">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<"All" | "Unread" | "Read">("All");
  const [categoryFilter, setCategoryFilter] = useState<string>("All");
  const [priorityFilter, setPriorityFilter] = useState<string>("All");

  const categories = ["All", "Exchanges", "Marketplace", "Messages", "Ledger", "Reviews", "Trust Score", "Achievements", "Account", "Billing", "Community", "Security", "System"];
  const priorities = ["All", "Critical", "High", "Normal", "Low"];

  const handleRead = async (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    await markNotificationAsRead(id);
  };

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const selectAll = () => {
    if (selectedIds.size === filteredNotifications.length) {
      setSelectedIds(newSet => { newSet.clear(); return newSet; });
    } else {
      setSelectedIds(new Set(filteredNotifications.map(n => n.id)));
    }
  };

  const handleBulkAction = async (action: "read" | "archive" | "delete") => {
    if (selectedIds.size === 0) return;
    const ids = Array.from(selectedIds);

    if (action === "read") {
      setNotifications(prev => prev.map(n => ids.includes(n.id) ? { ...n, isRead: true } : n));
      await bulkUpdateNotifications(ids, { isRead: true });
      toast.success("Marked as read");
    } else if (action === "archive") {
      setNotifications(prev => prev.map(n => ids.includes(n.id) ? { ...n, isArchived: true } : n));
      await bulkUpdateNotifications(ids, { isArchived: true });
      toast.success("Archived");
    } else if (action === "delete") {
      setNotifications(prev => prev.filter(n => !ids.includes(n.id)));
      await bulkDeleteNotifications(ids);
      toast.success("Deleted");
    }
    
    setSelectedIds(new Set());
  };

  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const startOfWeek = startOfToday - (7 * 24 * 60 * 60 * 1000);

  const unreadCount = notifications.filter(n => !n.isRead && !n.isArchived).length;
  const todayCount = notifications.filter(n => !n.isArchived && new Date(n.createdAt).getTime() >= startOfToday).length;
  const weekCount = notifications.filter(n => !n.isArchived && new Date(n.createdAt).getTime() >= startOfWeek).length;
  const actionableCount = notifications.filter(n => !n.isArchived && n.actionLabel).length;

  const filteredNotifications = useMemo(() => {
    return notifications.filter(n => {
      // Tab filter
      if (activeTab === "all" && n.isArchived) return false;
      if (activeTab === "archive" && !n.isArchived) return false;
      if (activeTab === "actionable" && (n.isArchived || !n.actionLabel)) return false;
      if (activeTab === "mentions") return false; // Mentions not implemented

      // Search filter
      if (searchQuery && !n.title.toLowerCase().includes(searchQuery.toLowerCase()) && !n.message.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }

      // Status filter
      if (statusFilter === "Unread" && n.isRead) return false;
      if (statusFilter === "Read" && !n.isRead) return false;

      // Category filter
      if (categoryFilter !== "All" && n.category !== categoryFilter) return false;

      // Priority filter
      if (priorityFilter !== "All" && n.priority !== priorityFilter) return false;

      return true;
    });
  }, [notifications, activeTab, searchQuery, statusFilter, categoryFilter, priorityFilter]);

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row gap-8">
      {/* Left Sidebar - Filters & Navigation */}
      <div className="w-full lg:w-64 shrink-0 space-y-6">
        <div>
          <h1 className="text-3xl font-black text-heading mb-1">Notifications</h1>
          <p className="text-sm text-muted">Everything happening across your Weave account in one place.</p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-col gap-1">
          <button onClick={() => setActiveTab("all")} className={`text-left px-4 py-2.5 rounded-[var(--radius-button)] text-sm font-bold transition-colors ${activeTab === "all" ? "bg-primary/10 text-primary" : "text-muted hover:text-heading hover:bg-surface-secondary"}`}>
            All Notifications
          </button>
          <button onClick={() => setActiveTab("actionable")} className={`text-left px-4 py-2.5 rounded-[var(--radius-button)] text-sm font-bold transition-colors flex items-center justify-between ${activeTab === "actionable" ? "bg-primary/10 text-primary" : "text-muted hover:text-heading hover:bg-surface-secondary"}`}>
            Action Required
            {actionableCount > 0 && <span className="bg-error text-surface text-[10px] px-2 py-0.5 rounded-full">{actionableCount}</span>}
          </button>
          <button disabled onClick={() => setActiveTab("mentions")} className={`text-left px-4 py-2.5 rounded-[var(--radius-button)] text-sm font-bold transition-colors flex items-center justify-between opacity-50 cursor-not-allowed ${activeTab === "mentions" ? "bg-primary/10 text-primary" : "text-muted"}`}>
            Mentions <span className="text-[10px] uppercase bg-surface-secondary px-2 rounded">Soon</span>
          </button>
          <button onClick={() => setActiveTab("archive")} className={`text-left px-4 py-2.5 rounded-[var(--radius-button)] text-sm font-bold transition-colors ${activeTab === "archive" ? "bg-primary/10 text-primary" : "text-muted hover:text-heading hover:bg-surface-secondary"}`}>
            Archive
          </button>
        </div>

        {/* Filters */}
        <div className="space-y-4 pt-4 border-t border-border">
          <div>
            <label className="text-xs font-bold text-heading uppercase tracking-wider mb-2 block">Status</label>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)} className="w-full bg-surface border border-border rounded-[var(--radius-button)] p-2 text-sm text-body focus:ring-1 focus:ring-primary">
              <option value="All">All</option>
              <option value="Unread">Unread</option>
              <option value="Read">Read</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-heading uppercase tracking-wider mb-2 block">Category</label>
            <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="w-full bg-surface border border-border rounded-[var(--radius-button)] p-2 text-sm text-body focus:ring-1 focus:ring-primary">
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-heading uppercase tracking-wider mb-2 block">Priority</label>
            <select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)} className="w-full bg-surface border border-border rounded-[var(--radius-button)] p-2 text-sm text-body focus:ring-1 focus:ring-primary">
              {priorities.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 space-y-6">
        
        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-surface border border-border p-4 rounded-[var(--radius-card)] flex flex-col justify-center">
            <span className="text-sm font-medium text-muted">Unread</span>
            <span className="text-2xl font-black text-heading">{unreadCount}</span>
          </div>
          <div className="bg-surface border border-border p-4 rounded-[var(--radius-card)] flex flex-col justify-center">
            <span className="text-sm font-medium text-muted">Today</span>
            <span className="text-2xl font-black text-heading">{todayCount}</span>
          </div>
          <div className="bg-surface border border-border p-4 rounded-[var(--radius-card)] flex flex-col justify-center">
            <span className="text-sm font-medium text-muted">This Week</span>
            <span className="text-2xl font-black text-heading">{weekCount}</span>
          </div>
          <div className="bg-surface border border-border p-4 rounded-[var(--radius-card)] flex flex-col justify-center">
            <span className="text-sm font-medium text-muted">Action Required</span>
            <span className="text-2xl font-black text-error">{actionableCount}</span>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-surface border border-border p-3 rounded-[var(--radius-card)]">
          <div className="relative w-full sm:w-64 shrink-0">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input 
              type="text" 
              placeholder="Search notifications..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-surface-secondary border-none rounded-[var(--radius-button)] text-sm focus:ring-2 focus:ring-primary/50 text-body"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0">
            {selectedIds.size > 0 ? (
              <>
                <span className="text-sm font-medium text-primary mr-2 whitespace-nowrap">{selectedIds.size} selected</span>
                <button onClick={() => handleBulkAction("read")} className="p-2 text-muted hover:text-primary bg-surface-secondary rounded transition-colors" title="Mark as read"><Check className="w-4 h-4" /></button>
                <button onClick={() => handleBulkAction("archive")} className="p-2 text-muted hover:text-warning bg-surface-secondary rounded transition-colors" title="Archive"><Archive className="w-4 h-4" /></button>
                <button onClick={() => handleBulkAction("delete")} className="p-2 text-muted hover:text-error bg-surface-secondary rounded transition-colors" title="Delete"><Trash2 className="w-4 h-4" /></button>
              </>
            ) : (
              <button 
                onClick={async () => {
                  setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
                  await markAllNotificationsAsRead();
                  toast.success("All caught up!");
                }}
                className="text-sm font-bold text-primary hover:text-primary-hover transition-colors whitespace-nowrap"
              >
                Mark all as read
              </button>
            )}
          </div>
        </div>

        {/* Timeline */}
        <div className="space-y-3">
          {filteredNotifications.length === 0 ? (
            <div className="bg-surface border border-border rounded-[var(--radius-card)] p-12 text-center">
              <Bell className="w-12 h-12 text-border mx-auto mb-4" />
              <h3 className="text-lg font-bold text-heading">Nothing to see here</h3>
              <p className="text-muted mt-2">Try adjusting your filters or tab selection.</p>
            </div>
          ) : (
            <div className="bg-surface border border-border rounded-[var(--radius-card)] overflow-hidden">
              {filteredNotifications.map(notif => (
                <div key={notif.id} className="flex border-b border-border last:border-0 relative hover:bg-surface-secondary transition-colors group">
                  <div className="p-4 flex items-start">
                    <input 
                      type="checkbox" 
                      checked={selectedIds.has(notif.id)}
                      onChange={() => toggleSelect(notif.id)}
                      className="w-4 h-4 mt-2 accent-primary"
                    />
                  </div>
                  <div className="flex-1 py-4 pr-4">
                    <NotificationCard notification={notif} onRead={handleRead} compact />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
      </div>
    </div>
  );
}
