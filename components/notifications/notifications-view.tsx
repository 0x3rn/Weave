"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Archive, Bell, Check, RefreshCw, Search, Trash2, X } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";
import { Notification } from "@/types";
import { bulkDeleteNotifications, bulkUpdateNotifications, getNotifications, markAllNotificationsAsRead, markNotificationAsRead } from "@/app/actions/notifications";
import NotificationCard, { getCategoryIcon, getPriorityColor } from "./notification-card";

type Tab = "all" | "actionable" | "archive";
type DateFilter = "All" | "Today" | "7 days" | "30 days";
type Sort = "Newest" | "Oldest" | "Unread first" | "Priority";

const categories = ["All", "Exchanges", "Marketplace", "Messages", "Ledger", "Reviews", "Trust Score", "Achievements", "Account", "Billing", "Community", "Security", "System"];
const priorities = ["All", "Critical", "High", "Normal", "Low"];
const priorityRank = { Critical: 4, High: 3, Normal: 2, Low: 1 } as const;

function dayLabel(value: string) {
  const date = new Date(value);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  return new Intl.DateTimeFormat("en-GB", { weekday: "long", month: "short", day: "numeric" }).format(date);
}

export default function NotificationsView({ initialNotifications }: { initialNotifications: Notification[] }) {
  const [notifications, setNotifications] = useState(initialNotifications);
  const [activeTab, setActiveTab] = useState<Tab>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [statusFilter, setStatusFilter] = useState<"All" | "Unread" | "Read">("All");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [dateFilter, setDateFilter] = useState<DateFilter>("All");
  const [sort, setSort] = useState<Sort>("Newest");
  const [details, setDetails] = useState<Notification | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refresh = useCallback(async (showError = false) => {
    setIsRefreshing(true);
    try {
      const result = await getNotifications();
      if (result.success && result.notifications) setNotifications(result.notifications);
      else if (showError) toast.error(result.error || "Unable to refresh notifications");
    } catch {
      if (showError) toast.error("Unable to refresh notifications");
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => document.visibilityState === "visible" && void refresh(), 30_000);
    return () => window.clearInterval(timer);
  }, [refresh]);

  const replaceAfterAction = async (next: Notification[], action: () => Promise<{ success: boolean; error?: string }>, successMessage?: string) => {
    const previous = notifications;
    setNotifications(next);
    try {
      const result = await action();
      if (!result.success) {
        setNotifications(previous);
        toast.error(result.error || "Unable to update notifications");
        return false;
      }
    } catch {
      setNotifications(previous);
      toast.error("Unable to update notifications");
      return false;
    }
    if (successMessage) toast.success(successMessage);
    return true;
  };

  const handleRead = async (id: string) => {
    const next = notifications.map(item => item.id === id ? { ...item, isRead: true } : item);
    await replaceAfterAction(next, () => markNotificationAsRead(id));
  };

  const handleArchive = async (id: string) => {
    const item = notifications.find(notification => notification.id === id);
    if (!item) return;
    const archived = !item.isArchived;
    const next = notifications.map(notification => notification.id === id ? { ...notification, isArchived: archived } : notification);
    await replaceAfterAction(next, () => bulkUpdateNotifications([id], { isArchived: archived }), archived ? "Notification archived" : "Notification restored");
  };

  const filteredNotifications = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const cutoffDays = dateFilter === "7 days" ? 7 : dateFilter === "30 days" ? 30 : 0;
    const cutoff = cutoffDays ? Date.now() - cutoffDays * 86_400_000 : 0;
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
    const result = notifications.filter(item => {
      if (activeTab === "all" && item.isArchived) return false;
      if (activeTab === "archive" && !item.isArchived) return false;
      if (activeTab === "actionable" && (item.isArchived || item.isRead || !item.actionLabel || !item.link || !["Critical", "High"].includes(item.priority || ""))) return false;
      if (query && !`${item.title} ${item.message} ${item.category || ""}`.toLowerCase().includes(query)) return false;
      if (statusFilter === "Unread" && item.isRead) return false;
      if (statusFilter === "Read" && !item.isRead) return false;
      if (categoryFilter !== "All" && item.category !== categoryFilter) return false;
      if (priorityFilter !== "All" && item.priority !== priorityFilter) return false;
      const createdAt = new Date(item.createdAt).getTime();
      if (dateFilter === "Today" && createdAt < startOfToday) return false;
      if (cutoff && createdAt < cutoff) return false;
      return true;
    });
    return result.sort((a, b) => {
      if (sort === "Oldest") return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      if (sort === "Unread first" && a.isRead !== b.isRead) return a.isRead ? 1 : -1;
      if (sort === "Priority") {
        const difference = (priorityRank[b.priority || "Low"] || 0) - (priorityRank[a.priority || "Low"] || 0);
        if (difference) return difference;
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [activeTab, categoryFilter, dateFilter, notifications, priorityFilter, searchQuery, sort, statusFilter]);

  const grouped = useMemo(() => filteredNotifications.reduce<Record<string, Notification[]>>((groups, item) => {
    const label = dayLabel(item.createdAt);
    groups[label] = [...(groups[label] || []), item];
    return groups;
  }, {}), [filteredNotifications]);

  const unreadCount = notifications.filter(item => !item.isRead && !item.isArchived).length;
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const todayCount = notifications.filter(item => !item.isArchived && new Date(item.createdAt).getTime() >= startOfToday).length;
  const weekCount = notifications.filter(item => !item.isArchived && new Date(item.createdAt).getTime() >= Date.now() - 7 * 86_400_000).length;
  const actionableCount = notifications.filter(item => !item.isArchived && !item.isRead && item.actionLabel && item.link && ["Critical", "High"].includes(item.priority || "")).length;

  const toggleSelect = (id: string) => setSelectedIds(previous => {
    const next = new Set(previous);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  const selectAll = () => setSelectedIds(previous => previous.size === filteredNotifications.length ? new Set() : new Set(filteredNotifications.map(item => item.id)));

  const handleBulkAction = async (action: "read" | "archive" | "delete") => {
    const ids = [...selectedIds];
    if (!ids.length) return;
    let next = notifications;
    let request: () => Promise<{ success: boolean; error?: string }>;
    if (action === "read") {
      next = notifications.map(item => ids.includes(item.id) ? { ...item, isRead: true } : item);
      request = () => bulkUpdateNotifications(ids, { isRead: true });
    } else if (action === "archive") {
      next = notifications.map(item => ids.includes(item.id) ? { ...item, isArchived: activeTab !== "archive" } : item);
      request = () => bulkUpdateNotifications(ids, { isArchived: activeTab !== "archive" });
    } else {
      next = notifications.filter(item => !ids.includes(item.id));
      request = () => bulkDeleteNotifications(ids);
    }
    if (await replaceAfterAction(next, request, action === "archive" && activeTab === "archive" ? "Notifications restored" : `Notifications ${action === "read" ? "marked as read" : `${action}d`}`)) setSelectedIds(new Set());
  };

  const markAllRead = async () => {
    const next = notifications.map(item => item.isArchived ? item : { ...item, isRead: true });
    await replaceAfterAction(next, markAllNotificationsAsRead, "All caught up");
  };

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 overflow-x-hidden px-4 py-8 sm:px-6 lg:flex-row lg:px-8">
      <aside className="w-full shrink-0 space-y-6 lg:w-64">
        <div><h1 className="mb-1 text-3xl font-black text-heading">Notifications</h1><p className="text-sm text-muted">Updates and actions across your Weave account.</p></div>
        <nav className="flex flex-col gap-1" aria-label="Notification views">
          {([['all', 'All notifications'], ['actionable', 'Action required'], ['archive', 'Archive']] as const).map(([value, label]) => (
            <button key={value} type="button" onClick={() => { setActiveTab(value); setSelectedIds(new Set()); }} className={`flex items-center justify-between rounded-[var(--radius-button)] px-4 py-2.5 text-left text-sm font-bold transition-colors ${activeTab === value ? "bg-primary/10 text-primary" : "text-muted hover:bg-surface-secondary hover:text-heading"}`}>
              {label}{value === "actionable" && actionableCount > 0 && <span className="rounded-full bg-error px-2 py-0.5 text-[10px] text-white">{actionableCount}</span>}
            </button>
          ))}
        </nav>
        <div className="grid grid-cols-2 gap-3 border-t border-border pt-4 lg:grid-cols-1">
          <FilterSelect label="Status" value={statusFilter} options={["All", "Unread", "Read"]} onChange={value => setStatusFilter(value as "All" | "Unread" | "Read")} />
          <FilterSelect label="Category" value={categoryFilter} options={categories} onChange={setCategoryFilter} />
          <FilterSelect label="Priority" value={priorityFilter} options={priorities} onChange={setPriorityFilter} />
          <FilterSelect label="Date" value={dateFilter} options={["All", "Today", "7 days", "30 days"]} onChange={value => setDateFilter(value as DateFilter)} />
          <FilterSelect label="Sort" value={sort} options={["Newest", "Oldest", "Unread first", "Priority"]} onChange={value => setSort(value as Sort)} />
        </div>
      </aside>

      <main className="min-w-0 flex-1 space-y-6">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {[['Unread', unreadCount], ['Today', todayCount], ['This week', weekCount], ['Action required', actionableCount]].map(([label, count]) => <div key={label} className="rounded-[var(--radius-card)] border border-border bg-surface p-4"><span className="text-sm font-medium text-muted">{label}</span><span className="block text-2xl font-black text-heading">{count}</span></div>)}
        </div>

        <div className="flex flex-col gap-3 rounded-[var(--radius-card)] border border-border bg-surface p-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:w-72"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" /><input value={searchQuery} onChange={event => setSearchQuery(event.target.value)} placeholder="Search notifications" className="w-full rounded-[var(--radius-button)] bg-surface-secondary py-2 pl-9 pr-4 text-sm text-body outline-none ring-primary/50 focus:ring-2" /></div>
          <div className="flex items-center gap-2 overflow-x-auto">
            {selectedIds.size ? <><span className="mr-1 whitespace-nowrap text-sm font-medium text-primary">{selectedIds.size} selected</span><IconButton title="Mark as read" onClick={() => handleBulkAction("read")}><Check /></IconButton><IconButton title={activeTab === "archive" ? "Restore" : "Archive"} onClick={() => handleBulkAction("archive")}><Archive /></IconButton><IconButton title="Delete" onClick={() => handleBulkAction("delete")} danger><Trash2 /></IconButton></> : <><button type="button" onClick={markAllRead} disabled={!unreadCount} className="whitespace-nowrap text-sm font-bold text-primary hover:text-primary-hover disabled:opacity-40">Mark all as read</button><button type="button" onClick={() => refresh(true)} disabled={isRefreshing} aria-label="Refresh notifications" className="rounded p-2 text-muted hover:bg-surface-secondary hover:text-heading"><RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} /></button></>}
          </div>
        </div>

        {!!filteredNotifications.length && <label className="inline-flex items-center gap-2 text-sm text-muted"><input type="checkbox" checked={selectedIds.size === filteredNotifications.length} onChange={selectAll} className="h-4 w-4 accent-primary" /> Select all shown</label>}
        {!filteredNotifications.length ? <div className="rounded-[var(--radius-card)] border border-border bg-surface p-12 text-center"><Bell className="mx-auto mb-4 h-12 w-12 text-border" /><h2 className="text-lg font-bold text-heading">Nothing to see here</h2><p className="mt-2 text-muted">Try another filter or check back later.</p></div> : Object.entries(grouped).map(([label, items]) => <section key={label} className="space-y-2"><h2 className="text-xs font-bold uppercase tracking-wider text-muted">{label}</h2><div className="overflow-hidden rounded-[var(--radius-card)] border border-border bg-surface">{items.map(item => <div key={item.id} className="flex border-b border-border last:border-0"><div className="p-4 pr-0"><input type="checkbox" checked={selectedIds.has(item.id)} onChange={() => toggleSelect(item.id)} aria-label={`Select ${item.title}`} className="mt-2 h-4 w-4 accent-primary" /></div><div className="min-w-0 flex-1"><NotificationCard notification={item} compact onRead={handleRead} onArchive={handleArchive} onOpen={setDetails} /></div></div>)}</div></section>)}
      </main>

      {details && <div className="fixed inset-0 z-[60] flex justify-end bg-black/35" role="presentation" onMouseDown={event => event.target === event.currentTarget && setDetails(null)}><aside role="dialog" aria-modal="true" aria-label="Notification details" className="h-full w-full max-w-md overflow-y-auto border-l border-border bg-background p-6 shadow-2xl"><div className="mb-8 flex items-center justify-between"><h2 className="text-xl font-black text-heading">Notification details</h2><button type="button" onClick={() => setDetails(null)} aria-label="Close details" className="rounded-full p-2 text-muted hover:bg-surface-secondary"><X className="h-5 w-5" /></button></div><div className="flex items-start gap-4"><div className={`rounded-full p-3 ${getPriorityColor(details.priority)}`}>{getCategoryIcon(details.category)}</div><div><p className="text-xs font-bold uppercase tracking-wider text-muted">{details.category || "System"} · {details.priority || "Normal"}</p><h3 className="mt-2 text-xl font-bold text-heading">{details.title}</h3><p className="mt-3 leading-7 text-body">{details.message}</p><p className="mt-4 text-sm text-muted">{new Intl.DateTimeFormat("en-GB", { dateStyle: "long", timeStyle: "short" }).format(new Date(details.createdAt))}</p></div></div><div className="mt-8 flex flex-wrap gap-3">{details.link?.startsWith("/") && !details.link.startsWith("//") && details.actionLabel && <Link href={details.link} onClick={() => { if (!details.isRead) void handleRead(details.id); setDetails(null); }} className="rounded-[var(--radius-button)] bg-primary px-5 py-2.5 text-sm font-bold text-white hover:bg-primary-hover">{details.actionLabel}</Link>}{!details.isRead && <button type="button" onClick={() => { void handleRead(details.id); setDetails({ ...details, isRead: true }); }} className="rounded-[var(--radius-button)] border border-border px-5 py-2.5 text-sm font-bold text-heading hover:bg-surface-secondary">Mark as read</button>}</div></aside></div>}
    </div>
  );
}

function FilterSelect({ label, value, options, onChange }: { label: string; value: string; options: readonly string[]; onChange: (value: string) => void }) {
  return <label><span className="mb-2 block text-xs font-bold uppercase tracking-wider text-heading">{label}</span><select value={value} onChange={event => onChange(event.target.value)} className="w-full rounded-[var(--radius-button)] border border-border bg-surface p-2 text-sm text-body focus:ring-1 focus:ring-primary">{options.map(option => <option key={option}>{option}</option>)}</select></label>;
}

function IconButton({ title, onClick, danger = false, children }: { title: string; onClick: () => void; danger?: boolean; children: React.ReactElement<{ className?: string }> }) {
  return <button type="button" title={title} aria-label={title} onClick={onClick} className={`rounded bg-surface-secondary p-2 transition-colors ${danger ? "text-muted hover:text-error" : "text-muted hover:text-primary"}`}>{children}</button>;
}
