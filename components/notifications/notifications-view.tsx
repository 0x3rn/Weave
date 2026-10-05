"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Archive,
  Bell,
  Check,
  ChevronDown,
  RefreshCw,
  Search,
  Settings,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";
import type { Notification } from "@/types";
import {
  bulkDeleteNotifications,
  bulkUpdateNotifications,
  getNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "@/app/actions/notifications";
import {
  groupNotifications,
  NOTIFICATION_CATEGORIES,
  type NotificationPage,
  type NotificationQuery,
} from "@/lib/notification-catalog";
import NotificationCard from "./notification-card";
import NotificationDetails from "./notification-details";
const emptySummary = { unread: 0, today: 0, week: 0, actionable: 0 };
const defaults: NotificationQuery = {
  tab: "all",
  status: "All",
  category: "All",
  priority: "All",
  date: "All",
  sort: "Newest",
  search: "",
  group: true,
};
function dayLabel(value: string, timeZone: string) {
  const format = (date: Date) =>
    new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(date);
  const date = new Date(value);
  if (format(date) === format(new Date())) return "Today";
  return new Intl.DateTimeFormat("en-GB", {
    timeZone,
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}
export default function NotificationsView({
  initialPage,
  initialError,
}: {
  initialPage: NotificationPage;
  initialError?: string;
}) {
  const [notifications, setNotifications] = useState(initialPage.notifications),
    [summary, setSummary] = useState(initialPage.summary || emptySummary),
    [timeZone, setTimeZone] = useState(initialPage.timeZone),
    [query, setQuery] = useState<NotificationQuery>(defaults),
    [search, setSearch] = useState(""),
    [page, setPage] = useState(0),
    [total, setTotal] = useState(initialPage.total),
    [hasMore, setHasMore] = useState(initialPage.hasMore),
    [selected, setSelected] = useState<Set<string>>(new Set()),
    [details, setDetails] = useState<Notification | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(initialError || ""),
    [newUpdates, setNewUpdates] = useState(false);
  const epoch = useRef(0),
    mounted = useRef(true),
    first = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      epoch.current++;
    };
  }, []);
  const load = useCallback(
    async (nextPage = 0, append = false) => {
      const request = ++epoch.current;
      setBusy(true);
      setError("");
      try {
        const result = await getNotifications({
          ...query,
          page: nextPage,
          limit: 50,
        });
        if (!mounted.current || request !== epoch.current) return;
        if (!result.success) throw new Error(result.error);
        setNotifications((previous) =>
          append
            ? Array.from(
                new Map(
                  [...previous, ...result.notifications].map((n) => [n.id, n]),
                ).values(),
              )
            : result.notifications,
        );
        setPage(nextPage);
        setTotal(result.total);
        setHasMore(result.hasMore);
        setSummary(result.summary);
        setTimeZone(result.timeZone);
        setNewUpdates(false);
        if (!append) setSelected(new Set());
      } catch (cause) {
        if (mounted.current && request === epoch.current)
          setError(
            cause instanceof Error
              ? cause.message
              : "Could not load notifications",
          );
      } finally {
        if (mounted.current && request === epoch.current) setBusy(false);
      }
    },
    [query],
  );
  useEffect(() => {
    const timer = setTimeout(
      () =>
        setQuery((previous) =>
          previous.search === search ? previous : { ...previous, search },
        ),
      250,
    );
    return () => clearTimeout(timer);
  }, [search]);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    setSelected(new Set());
    void load();
  }, [load]);
  useEffect(() => {
    let active = true;
    const poll = async () => {
      if (document.visibilityState !== "visible") return;
      const result = await getNotifications({ limit: 1 }).catch(() => null);
      if (active && result && result.success) {
        setSummary(result.summary);
        if (
          result.notifications[0] &&
          !notifications.some((item) => item.id === result.notifications[0].id)
        )
          setNewUpdates(true);
      }
    };
    const timer = setInterval(() => void poll(), 30000);
    window.addEventListener("focus", poll);
    return () => {
      active = false;
      clearInterval(timer);
      window.removeEventListener("focus", poll);
    };
  }, [notifications]);
  const change = (key: keyof NotificationQuery, value: string | boolean) => {
    epoch.current++;
    setQuery((previous) => ({ ...previous, [key]: value }));
  };
  const closeDetails = useCallback(() => setDetails(null), []);
  const mutate = async (
    ids: string[],
    action: "read" | "archive" | "delete",
  ) => {
    if (busy || !ids.length) return;
    if (
      action === "delete" &&
      !window.confirm(
        `Permanently delete ${ids.length === 1 ? "this notification" : `these ${ids.length} notifications`}?`,
      )
    )
      return;
    setBusy(true);
    try {
      const archived = query.tab !== "archive";
      const result =
        action === "delete"
          ? await bulkDeleteNotifications(ids)
          : await bulkUpdateNotifications(
              ids,
              action === "read" ? { isRead: true } : { isArchived: archived },
            );
      if (!result.success) throw new Error(result.error);
      toast.success(
        action === "read"
          ? "Marked as read"
          : action === "delete"
            ? "Notifications deleted"
            : archived
              ? "Notifications archived"
              : "Notifications restored",
      );
      await load();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Could not update notifications",
      );
      setBusy(false);
    }
  };
  const read = async (id: string) => {
    try {
      const result = await markNotificationAsRead(id);
      if (!result.success) throw new Error(result.error);
      setNotifications((items) =>
        items.map((item) =>
          item.id === id ? { ...item, isRead: true } : item,
        ),
      );
      if (query.status === "Unread") await load();
      else {
        const latest = await getNotifications({ limit: 1 });
        if (latest.success) setSummary(latest.summary);
      }
    } catch (cause) {
      toast.error(
        cause instanceof Error ? cause.message : "Could not mark as read",
      );
    }
  };
  const archive = (id: string) => void mutate([id], "archive");
  const select = (id: string) =>
    setSelected((previous) => {
      const next = new Set(previous);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const groups = useMemo(
    () => groupNotifications(notifications, query.group !== false, timeZone),
    [notifications, query.group, timeZone],
  );
  const byDay = useMemo(
    () =>
      groups.reduce<Record<string, Notification[][]>>((days, group) => {
        const label = dayLabel(group[0].createdAt, timeZone);
        (days[label] ||= []).push(group);
        return days;
      }, {}),
    [groups, timeZone],
  );
  return (
    <div className="mx-auto w-full max-w-6xl space-y-7 px-4 py-8 sm:px-6 lg:px-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-heading">Notifications</h1>
          <p className="mt-2 text-sm text-muted">
            Everything happening across your Weave account in one place.
          </p>
        </div>
        <Link
          href="/settings/notifications"
          className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm text-heading"
        >
          <Settings className="h-4 w-4" />
          Notification settings
        </Link>
      </header>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {(
          [
            ["Unread", summary.unread],
            ["Today", summary.today],
            ["This Week", summary.week],
            ["Action Required", summary.actionable],
          ] as const
        ).map(([label, count]) => (
          <div
            key={label}
            className="rounded-xl border border-border bg-surface p-4"
          >
            <span className="text-xs font-semibold text-muted">{label}</span>
            <span className="mt-1 block text-2xl font-bold text-heading">
              {count}
            </span>
          </div>
        ))}
      </div>
      <section
        className="space-y-4 rounded-xl border border-border bg-surface p-4"
        aria-label="Notification filters"
      >
        <label className="relative block">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted" />
          <span className="sr-only">Search notifications</span>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search notifications..."
            className="w-full rounded-lg border border-border bg-background py-2.5 pl-10 pr-3 text-sm text-heading"
          />
        </label>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <Filter
            label="Status"
            value={query.status!}
            options={["All", "Unread", "Read"]}
            onChange={(value) => change("status", value)}
          />
          <Filter
            label="Category"
            value={query.category!}
            options={["All", ...NOTIFICATION_CATEGORIES]}
            onChange={(value) => change("category", value)}
          />
          <Filter
            label="Priority"
            value={query.priority!}
            options={["All", "Critical", "High", "Normal", "Low"]}
            onChange={(value) => change("priority", value)}
          />
          <Filter
            label="Date"
            value={query.date!}
            options={["All", "Today", "This Week", "This Month", "Custom"]}
            onChange={(value) => change("date", value)}
          />
          <Filter
            label="Sort"
            value={query.sort!}
            options={["Newest", "Oldest", "Unread First", "Priority"]}
            onChange={(value) => change("sort", value)}
          />
        </div>
        {query.date === "Custom" && (
          <div className="grid max-w-xl grid-cols-2 gap-3">
            {(["from", "to"] as const).map((key) => (
              <label key={key} className="text-xs font-semibold text-muted">
                {key === "from" ? "Start date" : "End date"}
                <input
                  type="date"
                  value={query[key] || ""}
                  onChange={(event) => change(key, event.target.value)}
                  className="mt-1 w-full min-w-0 rounded-lg border border-border bg-background p-2 text-sm text-heading"
                />
              </label>
            ))}
          </div>
        )}
        <label className="inline-flex items-center gap-2 text-sm text-muted">
          <input
            type="checkbox"
            checked={query.group !== false}
            onChange={(event) => change("group", event.target.checked)}
            className="accent-primary"
          />
          Group related exchange activity
        </label>
        <p className="text-xs text-muted">
          Dates use your account time zone: {timeZone}.
        </p>
      </section>
      <nav className="flex flex-wrap gap-2" aria-label="Notification views">
        {(
          [
            ["all", "All"],
            ["actionable", "Action Required"],
            ["archive", "Archive"],
          ] as const
        ).map(([value, label]) => (
          <button
            type="button"
            aria-pressed={query.tab === value}
            key={value}
            onClick={() => change("tab", value)}
            className={`rounded-lg px-4 py-2 text-sm font-semibold ${query.tab === value ? "bg-primary/10 text-primary" : "text-muted hover:bg-surface-secondary"}`}
          >
            {label}
            {value === "actionable" && summary.actionable > 0
              ? ` (${summary.actionable})`
              : ""}
          </button>
        ))}
        <button
          disabled
          title="Mentions are planned for a future release"
          className="rounded-lg px-4 py-2 text-sm text-muted opacity-50"
        >
          Mentions · Future
        </button>
      </nav>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          {!!notifications.length && (
            <label className="inline-flex items-center gap-2 text-sm text-muted">
              <input
                type="checkbox"
                checked={
                  notifications.length > 0 &&
                  notifications.every((item) => selected.has(item.id))
                }
                onChange={() =>
                  setSelected((previous) =>
                    notifications.every((item) => previous.has(item.id))
                      ? new Set()
                      : new Set(notifications.map((item) => item.id)),
                  )
                }
                className="accent-primary"
              />
              Select loaded notifications
            </label>
          )}
          {!!selected.size && (
            <>
              <span className="text-sm text-primary">
                {selected.size} selected
              </span>
              <Action
                title="Mark selected as read"
                disabled={busy}
                onClick={() => void mutate([...selected], "read")}
              >
                <Check className="h-4 w-4" />
              </Action>
              <Action
                title={
                  query.tab === "archive"
                    ? "Restore selected"
                    : "Archive selected"
                }
                disabled={busy}
                onClick={() => void mutate([...selected], "archive")}
              >
                <Archive className="h-4 w-4" />
              </Action>
              <Action
                title="Delete selected"
                disabled={busy}
                onClick={() => void mutate([...selected], "delete")}
              >
                <Trash2 className="h-4 w-4" />
              </Action>
            </>
          )}
        </div>
        <div className="flex gap-3">
          <button
            disabled={busy || !summary.unread}
            onClick={async () => {
              try {
                const result = await markAllNotificationsAsRead();
                if (result.success) await load();
                else setError(result.error || "Could not mark all as read");
              } catch {
                setError(
                  "Could not mark all as read. Retry when your connection is restored.",
                );
              }
            }}
            className="text-sm font-semibold text-primary disabled:opacity-50"
          >
            Mark all as read
          </button>
          <Action
            title="Refresh notifications"
            disabled={busy}
            onClick={() => void load()}
          >
            <RefreshCw className={`h-4 w-4 ${busy ? "animate-spin" : ""}`} />
          </Action>
        </div>
      </div>
      {newUpdates && (
        <button
          onClick={() => void load()}
          className="w-full rounded-lg bg-primary/10 p-3 text-sm font-semibold text-primary"
        >
          New updates available · Refresh
        </button>
      )}
      {error && (
        <div
          role="alert"
          className="flex flex-wrap items-center gap-3 rounded-lg border border-error/30 bg-error/5 p-4 text-sm text-error"
        >
          {error}
          <button onClick={() => void load()} className="font-bold underline">
            Retry
          </button>
        </div>
      )}
      {!notifications.length && !busy && !error && (
        <div className="rounded-xl border border-border bg-surface p-12 text-center">
          <Bell className="mx-auto mb-4 h-12 w-12 text-muted" />
          <h2 className="text-lg font-bold text-heading">
            {query.tab === "actionable"
              ? "No actions waiting"
              : query.tab === "archive"
                ? "No archived notifications"
                : search ||
                    query.status !== "All" ||
                    query.category !== "All" ||
                    query.priority !== "All" ||
                    query.date !== "All"
                  ? "No matching notifications"
                  : "You're all caught up 🎉"}
          </h2>
          <p className="mt-2 text-sm text-muted">
            {search || query.status !== "All" || query.category !== "All"
              ? "Try another filter."
              : "No new notifications."}
          </p>
        </div>
      )}
      {Object.entries(byDay).map(([day, items]) => (
        <section key={day} className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">
            {day}
          </h2>
          <div className="space-y-3">
            {items.map((group) => (
              <div
                key={group[0].id}
                className="overflow-hidden rounded-xl border border-border bg-surface"
              >
                {group.length > 1 ? (
                  <details>
                    <summary className="cursor-pointer p-4 text-sm text-heading">
                      <span className="font-bold">
                        {group[0].relatedUser?.name || "Your partner"} updated{" "}
                        {group[0].relatedProject?.title || "your exchange"}
                      </span>
                      <span className="ml-2 text-xs text-muted">
                        {group.length} updates
                        {group.some((n) => n.requiresAction)
                          ? " · Action required"
                          : ""}
                      </span>
                    </summary>
                    {group.map((item) => (
                      <Row
                        key={item.id}
                        item={item}
                        selected={selected.has(item.id)}
                        onSelect={select}
                        onRead={read}
                        onArchive={archive}
                        onOpen={setDetails}
                      />
                    ))}
                  </details>
                ) : (
                  <Row
                    item={group[0]}
                    selected={selected.has(group[0].id)}
                    onSelect={select}
                    onRead={read}
                    onArchive={archive}
                    onOpen={setDetails}
                  />
                )}
              </div>
            ))}
          </div>
        </section>
      ))}
      <footer className="space-y-3 text-center">
        <p className="text-xs text-muted">
          Showing {notifications.length} of {total} notifications
        </p>
        {hasMore && (
          <button
            disabled={busy}
            onClick={() => void load(page + 1, true)}
            className="inline-flex items-center gap-2 rounded-lg border border-border px-5 py-2.5 text-sm font-semibold text-heading disabled:opacity-50"
          >
            {busy ? "Loading…" : "Load more"}
            <ChevronDown className="h-4 w-4" />
          </button>
        )}
        <p className="text-xs text-muted sm:hidden">
          Swipe right to mark read, left to archive. Hold a card to select it.
        </p>
      </footer>
      {details && (
        <NotificationDetails
          key={details.id}
          initial={details}
          onClose={closeDetails}
          onChange={() => void load()}
        />
      )}
    </div>
  );
}
function Row({
  item,
  selected,
  onSelect,
  onRead,
  onArchive,
  onOpen,
}: {
  item: Notification;
  selected: boolean;
  onSelect: (id: string) => void;
  onRead: (id: string) => void;
  onArchive: (id: string) => void;
  onOpen: (item: Notification) => void;
}) {
  return (
    <div className="flex border-t border-border first:border-t-0">
      <label className="p-4 pr-0">
        <span className="sr-only">Select {item.title}</span>
        <input
          type="checkbox"
          checked={selected}
          onChange={() => onSelect(item.id)}
          className="mt-2 accent-primary"
        />
      </label>
      <div className="min-w-0 flex-1">
        <NotificationCard
          notification={item}
          compact
          onRead={onRead}
          onArchive={onArchive}
          onOpen={onOpen}
          onSelect={onSelect}
        />
      </div>
    </div>
  );
}
function Filter({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: readonly string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="min-w-0 text-xs font-semibold text-muted">
      {label}
      <select
        aria-label={label}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 block w-full rounded-lg border border-border bg-background p-2 text-sm text-heading"
      >
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
    </label>
  );
}
function Action({
  title,
  onClick,
  disabled,
  children,
}: {
  title: string;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      disabled={disabled}
      onClick={onClick}
      className="rounded-lg border border-border p-2 text-muted hover:text-primary disabled:opacity-40"
    >
      {children}
    </button>
  );
}
