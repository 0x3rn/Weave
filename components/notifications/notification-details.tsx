"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Archive, Check, Loader2, Trash2, X } from "lucide-react";
import type { Notification } from "@/types";
import {
  acknowledgeNotification,
  bulkDeleteNotifications,
  bulkUpdateNotifications,
  getNotificationDetails,
  markNotificationAsRead,
} from "@/app/actions/notifications";
import { extendMarketplaceRequest } from "@/app/actions/marketplace";
import { safeNotificationLink } from "@/lib/notification-catalog";
import { getCategoryIcon, getPriorityColor } from "./notification-card";

export default function NotificationDetails({
  initial,
  onClose,
  onChange,
}: {
  initial: Notification;
  onClose: () => void;
  onChange: () => void;
}) {
  const [item, setItem] = useState(initial),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const panel = useRef<HTMLElement>(null);
  useEffect(() => {
    let active = true;
    void getNotificationDetails(initial.id)
      .then((result) => {
        if (active) {
          if (result.success && result.notification)
            setItem(result.notification);
          else setError(result.error || "Could not load details");
        }
      })
      .catch(() => {
        if (active)
          setError("Could not load details. Close and reopen to retry.");
      });
    return () => {
      active = false;
    };
  }, [initial.id]);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const old = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panel.current?.focus();
    const key = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
      if (event.key === "Tab") {
        const focusable = Array.from(
          panel.current?.querySelectorAll<HTMLElement>(
            'button:not(:disabled),a[href],input:not(:disabled),[tabindex="0"]',
          ) || [],
        );
        const first = focusable[0],
          last = focusable.at(-1);
        if (!first) {
          event.preventDefault();
          return;
        }
        if (
          event.shiftKey &&
          (document.activeElement === first ||
            document.activeElement === panel.current)
        ) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", key);
    return () => {
      document.body.style.overflow = old;
      document.removeEventListener("keydown", key);
      if (previous?.isConnected) previous.focus();
    };
  }, [onClose]);
  const run = async (
    work: () => Promise<{ success: boolean; error?: string }>,
    remove = false,
  ) => {
    setBusy(true);
    setError("");
    try {
      const result = await work();
      if (!result.success)
        throw new Error(result.error || "Could not update notification");
      onChange();
      if (remove) onClose();
      else {
        const latest = await getNotificationDetails(item.id);
        if (latest.success && latest.notification) setItem(latest.notification);
      }
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Could not update notification",
      );
    } finally {
      setBusy(false);
    }
  };
  const href = safeNotificationLink(item.link);
  return (
    <div
      className="fixed inset-0 z-[80] flex justify-end bg-black/40"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !busy) onClose();
      }}
    >
      <aside
        ref={panel}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="notification-details-title"
        className="h-full w-full max-w-lg overflow-y-auto border-l border-border bg-background p-5 shadow-2xl sm:p-8"
      >
        <div className="mb-8 flex items-center justify-between">
          <h2
            id="notification-details-title"
            className="text-xl font-bold text-heading"
          >
            Notification details
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close details"
            className="rounded-lg p-2 text-muted hover:bg-surface-secondary"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div
          className={`mb-5 inline-flex rounded-xl p-3 ${getPriorityColor(item.priority)}`}
        >
          {getCategoryIcon(item.category)}
        </div>
        <p className="text-xs font-semibold text-muted">
          {item.category} · {item.priority}
        </p>
        <h3 className="mt-2 text-2xl font-bold text-heading">{item.title}</h3>
        <p className="mt-4 leading-7 text-body">{item.message}</p>
        <p className="mt-3 text-sm leading-6 text-muted">{item.why}</p>
        <time
          className="mt-4 block text-xs text-muted"
          dateTime={item.createdAt}
        >
          {new Date(item.createdAt).toLocaleString()}
        </time>
        {item.requiresAction && (
          <p className="mt-5 rounded-xl border border-warning/30 bg-warning/10 p-3 text-sm text-heading">
            Action required
            {item.isRead ? " · Reading this does not complete the task." : ""}
          </p>
        )}
        {(item.relatedProject || item.relatedUser) && (
          <dl className="mt-6 space-y-4 rounded-xl border border-border p-4">
            {item.relatedProject && (
              <div>
                <dt className="text-xs font-semibold text-muted">
                  Related project
                </dt>
                <dd className="mt-1 text-sm font-medium text-heading">
                  {safeNotificationLink(item.relatedProject.link) ? (
                    <Link
                      href={item.relatedProject.link!}
                      className="hover:underline"
                    >
                      {item.relatedProject.title}
                    </Link>
                  ) : (
                    item.relatedProject.title
                  )}
                </dd>
              </div>
            )}
            {item.relatedUser && (
              <div>
                <dt className="text-xs font-semibold text-muted">
                  Related member
                </dt>
                <dd className="mt-1 text-sm font-medium text-heading">
                  {safeNotificationLink(item.relatedUser.link) ? (
                    <Link
                      href={item.relatedUser.link!}
                      className="hover:underline"
                    >
                      {item.relatedUser.name}
                    </Link>
                  ) : (
                    item.relatedUser.name
                  )}
                </dd>
              </div>
            )}
          </dl>
        )}
        {error && (
          <p role="alert" className="mt-5 text-sm text-error">
            {error}
          </p>
        )}
        <div className="mt-8 flex flex-wrap gap-3">
          {item.type === "request_expiring" &&
            item.requiresAction &&
            item.relatedId && (
              <button
                disabled={busy}
                onClick={() =>
                  void run(() => extendMarketplaceRequest(item.relatedId!))
                }
                className="rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground"
              >
                Extend request by 30 days
              </button>
            )}
          {href && (
            <Link
              href={href}
              onClick={() => {
                if (!item.isRead)
                  void markNotificationAsRead(item.id)
                    .then((result) => {
                      if (result.success) onChange();
                      else setError(result.error || "Could not mark as read");
                    })
                    .catch(() => setError("Could not mark as read"));
              }}
              className="rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground"
            >
              {item.actionLabel || "Open resource"}
            </Link>
          )}
          {!item.isRead && (
            <button
              disabled={busy}
              onClick={() => void run(() => markNotificationAsRead(item.id))}
              className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm"
            >
              <Check className="h-4 w-4" />
              Mark read
            </button>
          )}
          {item.requiresAction && item.canAcknowledge && (
            <button
              disabled={busy}
              onClick={() => void run(() => acknowledgeNotification(item.id))}
              className="rounded-lg border border-border px-4 py-2 text-sm"
            >
              I reviewed this
            </button>
          )}
          <button
            disabled={busy}
            onClick={() =>
              void run(() =>
                bulkUpdateNotifications([item.id], {
                  isArchived: !item.isArchived,
                }),
              )
            }
            className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm"
          >
            <Archive className="h-4 w-4" />
            {item.isArchived ? "Restore" : "Archive"}
          </button>
          <button
            disabled={busy}
            onClick={() => {
              if (window.confirm("Permanently delete this notification?"))
                void run(() => bulkDeleteNotifications([item.id]), true);
            }}
            className="inline-flex items-center gap-2 rounded-lg border border-error/30 px-4 py-2 text-sm text-error"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </button>
          {busy && (
            <Loader2
              role="status"
              aria-label="Updating notification"
              className="h-5 w-5 animate-spin"
            />
          )}
        </div>
      </aside>
    </div>
  );
}
