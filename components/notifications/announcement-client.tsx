"use client";
import { useState } from "react";
import {
  cancelNotificationAnnouncement,
  publishNotificationAnnouncement,
} from "@/app/actions/admin/notification-announcements";
import { useRouter } from "next/navigation";
import { notificationEvent } from "@/lib/notification-catalog";
export default function AnnouncementClient({
  initial,
}: {
  initial: {
    id: string;
    title: string;
    type: string;
    publishAt: string;
    published: boolean;
  }[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  return (
    <div className="space-y-6">
      <form
        className="space-y-4 rounded-xl border border-border bg-surface p-5"
        onSubmit={async (event) => {
          event.preventDefault();
          const form = event.currentTarget,
            data = new FormData(form);
          setBusy(true);
          setError("");
          try {
            const result = await publishNotificationAnnouncement({
              type: String(data.get("type")),
              title: String(data.get("title")),
              message: String(data.get("message")),
              link: String(data.get("link") || ""),
              publishAt: data.get("publishAt")
                ? new Date(String(data.get("publishAt"))).toISOString()
                : undefined,
            });
            if (!result.success) throw new Error(result.error);
            form.reset();
            router.refresh();
          } catch (cause) {
            setError(
              cause instanceof Error
                ? cause.message
                : "Could not schedule announcement",
            );
          } finally {
            setBusy(false);
          }
        }}
      >
        <label className="block text-sm">
          Type
          <select
            name="type"
            className="mt-1 block w-full rounded-lg border border-border bg-background p-3"
          >
            {[
              "community_update",
              "community_event",
              "newsletter",
              "platform_update",
              "maintenance",
              "feature_released",
              "bug_fix",
              "performance_update",
            ].map((type) => (
              <option key={type} value={type}>
                {notificationEvent(type).label}
              </option>
            ))}
          </select>
        </label>
        {[
          ["title", "Title"],
          ["link", "Resource link (optional)"],
          ["publishAt", "Publish time (optional)"],
        ].map(([name, label]) => (
          <label key={name} className="block text-sm">
            {label}
            <input
              name={name}
              required={name === "title"}
              maxLength={name === "title" ? 160 : 1000}
              type={name === "publishAt" ? "datetime-local" : "text"}
              className="mt-1 block w-full rounded-lg border border-border bg-background p-3"
              placeholder={name === "link" ? "/changelog" : undefined}
            />
          </label>
        ))}
        <label className="block text-sm">
          Description
          <textarea
            name="message"
            required
            maxLength={3000}
            rows={4}
            className="mt-1 block w-full rounded-lg border border-border bg-background p-3"
          />
        </label>
        <p className="text-xs text-muted">
          Updates are delivered to active members when the publish time is
          reached, according to their notification preferences.
        </p>
        {error && (
          <p role="alert" className="text-sm text-error">
            {error}
          </p>
        )}
        <button
          disabled={busy}
          className="rounded-lg bg-primary px-4 py-2 font-semibold text-primary-foreground"
        >
          {busy ? "Scheduling…" : "Schedule announcement"}
        </button>
      </form>
      {initial.map((item) => (
        <article
          key={item.id}
          className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border p-4"
        >
          <div>
            <h2 className="font-semibold text-heading">{item.title}</h2>
            <p className="text-xs text-muted">
              {notificationEvent(item.type).label} ·{" "}
              {new Date(item.publishAt).toLocaleString()} ·{" "}
              {item.published ? "Published" : "Scheduled"}
            </p>
          </div>
          {!item.published && (
            <button
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                try {
                  const result = await cancelNotificationAnnouncement(item.id);
                  if (!result.success) throw new Error(result.error);
                  router.refresh();
                } catch (cause) {
                  setError(
                    cause instanceof Error
                      ? cause.message
                      : "Could not cancel announcement",
                  );
                } finally {
                  setBusy(false);
                }
              }}
              className="text-sm text-error underline"
            >
              Cancel
            </button>
          )}
        </article>
      ))}
    </div>
  );
}
