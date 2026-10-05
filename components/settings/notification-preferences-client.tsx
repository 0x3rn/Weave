"use client";
import { useRef, useState } from "react";
import {
  notificationCategory,
  notificationSettings,
  NOTIFICATION_CATEGORIES,
  type NotificationSettings,
} from "@/lib/settings";
import { updateNotificationPreferences } from "@/app/actions/notifications";
import {
  NOTIFICATION_EVENTS,
  NOTIFICATION_CATEGORIES as EVENT_CATEGORIES,
  notificationEvent,
} from "@/lib/notification-catalog";
import { AutoSaveWrapper } from "./auto-save-wrapper";
const names = {
  applications: "Applications",
  messages: "Messages",
  reviews: "Reviews",
  skillHours: "Skill Hours",
  trustScore: "Trust score changes",
  marketplace: "Marketplace recommendations",
  escrow: "Escrow updates",
  announcements: "Product announcements",
};
export default function NotificationPreferencesClient({
  initialPreferences,
}: {
  initialPreferences: unknown;
}) {
  const [prefs, setPrefs] = useState(() =>
      notificationSettings(initialPreferences),
    ),
    current = useRef(prefs);
  const update = (
    next: NotificationSettings,
    save: (fn: () => Promise<unknown>) => Promise<void>,
  ) => {
    current.current = next;
    setPrefs(next);
    void save(() => updateNotificationPreferences(current.current));
  };
  let zones: string[];
  try {
    zones = ["UTC", ...Intl.supportedValuesOf("timeZone")];
  } catch {
    zones = ["UTC", "Africa/Lagos", "Europe/London", "America/New_York"];
  }
  return (
    <AutoSaveWrapper>
      {({ handleSave }) => (
        <div className="space-y-8">
          <p className="text-sm text-muted">
            Choose categories separately for each channel. Security alerts are
            always enabled for in-app and email delivery.
          </p>
          <div className="grid gap-6 md:grid-cols-2">
            {(["inApp", "email"] as const).map((channel) => (
              <section
                key={channel}
                className="overflow-hidden rounded-xl border border-border"
              >
                <h3 className="border-b border-border bg-surface-secondary p-4 font-bold text-heading">
                  {channel === "inApp" ? "In-app" : "Email"}
                </h3>
                <div className="divide-y divide-border">
                  {NOTIFICATION_CATEGORIES.map((category) => (
                    <label
                      key={category}
                      className="flex items-center justify-between gap-3 p-4 text-sm"
                    >
                      <span>{names[category]}</span>
                      <input
                        type="checkbox"
                        role="switch"
                        checked={prefs.channels[channel][category]}
                        onChange={(event) =>
                          update(
                            {
                              ...current.current,
                              events: {
                                ...current.current.events,
                                [channel]: {
                                  ...current.current.events[channel],
                                  ...Object.fromEntries(
                                    Object.keys(NOTIFICATION_EVENTS)
                                      .filter(
                                        (type) =>
                                          notificationCategory(type) ===
                                            category &&
                                          notificationEvent(type).category !==
                                            "Security",
                                      )
                                      .map((type) => [
                                        type,
                                        event.target.checked,
                                      ]),
                                  ),
                                },
                              },
                              channels: {
                                ...current.current.channels,
                                [channel]: {
                                  ...current.current.channels[channel],
                                  [category]: event.target.checked,
                                },
                              },
                            },
                            handleSave,
                          )
                        }
                        className="h-5 w-5 accent-primary"
                      />
                    </label>
                  ))}
                </div>
              </section>
            ))}
          </div>
          <section className="space-y-4 rounded-xl border border-border p-5">
            <h3 className="font-bold text-heading">Email digest frequency</h3>
            <label className="block text-sm">
              Delivery frequency
              <select
                value={prefs.digest}
                onChange={(event) =>
                  update(
                    {
                      ...current.current,
                      digest: event.target
                        .value as NotificationSettings["digest"],
                    },
                    handleSave,
                  )
                }
                className="mt-2 block w-full rounded-lg border border-border bg-background p-3"
              >
                {["instant", "daily", "weekly", "never"].map((value) => (
                  <option key={value} value={value}>
                    {value[0].toUpperCase() + value.slice(1)}
                  </option>
                ))}
              </select>
            </label>
            <p className="text-xs text-muted">
              Daily digests use your chosen morning delivery time; weekly
              digests arrive on Monday. Security alerts bypass digests and quiet
              hours.
            </p>
          </section>
          <section className="space-y-4 rounded-xl border border-border p-5">
            <h3 className="font-bold text-heading">Messages</h3>
            <label className="block text-sm">
              Message email frequency
              <select
                value={prefs.messageFrequency}
                onChange={(event) =>
                  update(
                    {
                      ...current.current,
                      messageFrequency: event.target
                        .value as NotificationSettings["messageFrequency"],
                    },
                    handleSave,
                  )
                }
                className="mt-2 block w-full rounded-lg border border-border bg-background p-3"
              >
                {["default", "instant", "daily", "weekly", "never"].map(
                  (value) => (
                    <option key={value} value={value}>
                      {value === "default"
                        ? "Use general digest frequency"
                        : value[0].toUpperCase() + value.slice(1)}
                    </option>
                  ),
                )}
              </select>
            </label>
          </section>
          <section className="space-y-4 rounded-xl border border-border p-5">
            <h3 className="font-bold text-heading">
              Morning productivity digest
            </h3>
            <label className="flex items-center justify-between gap-3 text-sm">
              Send my daily overview
              <input
                type="checkbox"
                checked={prefs.dailySummary.enabled}
                onChange={(event) =>
                  update(
                    {
                      ...current.current,
                      dailySummary: {
                        ...current.current.dailySummary,
                        enabled: event.target.checked,
                      },
                    },
                    handleSave,
                  )
                }
              />
            </label>
            <label className="block text-sm">
              Morning delivery time
              <input
                type="time"
                value={prefs.dailySummary.time}
                onChange={(event) => {
                  const next = {
                    ...current.current,
                    dailySummary: {
                      ...current.current.dailySummary,
                      time: event.target.value,
                    },
                  };
                  current.current = next;
                  setPrefs(next);
                }}
                onBlur={() =>
                  void handleSave(() =>
                    updateNotificationPreferences(current.current),
                  )
                }
                className="mt-2 block rounded-lg border border-border bg-background p-3"
              />
            </label>
            <p className="text-xs text-muted">
              An overview of exchanges waiting for review, unread messages,
              relevant matches, and Trust Score changes. Uses the time zone
              below and respects quiet hours.
            </p>
          </section>
          <section className="space-y-4">
            <h3 className="font-bold text-heading">
              Individual event preferences
            </h3>
            <p className="text-sm text-muted">
              Choose which updates you receive. Individual choices override
              category defaults.
            </p>
            {EVENT_CATEGORIES.map((category) => (
              <details
                key={category}
                className="rounded-xl border border-border"
              >
                <summary className="cursor-pointer p-4 text-sm font-bold text-heading">
                  {category}
                  {category === "Security" ? " · Always enabled" : ""}
                </summary>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-t border-border bg-surface-secondary">
                        <th className="p-3">Event</th>
                        <th className="p-3">In-app</th>
                        <th className="p-3">Email</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.keys(NOTIFICATION_EVENTS)
                        .filter(
                          (type) =>
                            notificationEvent(type).category === category,
                        )
                        .map((type) => (
                          <tr key={type} className="border-t border-border">
                            <td className="p-3 text-heading">
                              {notificationEvent(type).label}
                            </td>
                            {(["inApp", "email"] as const).map((channel) => (
                              <td className="p-3" key={channel}>
                                <input
                                  type="checkbox"
                                  disabled={category === "Security"}
                                  aria-label={
                                    notificationEvent(type).label +
                                    " " +
                                    (channel === "inApp" ? "in-app" : "email")
                                  }
                                  checked={prefs.events[channel][type]}
                                  onChange={(event) =>
                                    update(
                                      {
                                        ...current.current,
                                        events: {
                                          ...current.current.events,
                                          [channel]: {
                                            ...current.current.events[channel],
                                            [type]: event.target.checked,
                                          },
                                        },
                                      },
                                      handleSave,
                                    )
                                  }
                                  className="accent-primary disabled:opacity-60"
                                />
                              </td>
                            ))}
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </details>
            ))}
          </section>
          <section className="space-y-4 rounded-xl border border-border p-5">
            <h3 className="font-bold text-heading">Quiet hours</h3>
            <label className="flex items-center justify-between text-sm">
              Pause email delivery during quiet hours
              <input
                type="checkbox"
                checked={prefs.quietHours.enabled}
                onChange={(event) =>
                  update(
                    {
                      ...current.current,
                      quietHours: {
                        ...current.current.quietHours,
                        enabled: event.target.checked,
                      },
                    },
                    handleSave,
                  )
                }
              />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              {(["start", "end"] as const).map((key) => (
                <label key={key} className="text-sm capitalize">
                  {key} time
                  <input
                    type="time"
                    value={prefs.quietHours[key]}
                    onChange={(event) => {
                      const next = {
                        ...current.current,
                        quietHours: {
                          ...current.current.quietHours,
                          [key]: event.target.value,
                        },
                      };
                      current.current = next;
                      setPrefs(next);
                    }}
                    onBlur={() =>
                      void handleSave(() =>
                        updateNotificationPreferences(current.current),
                      )
                    }
                    className="mt-1 block w-full rounded-lg border border-border bg-background p-3"
                  />
                </label>
              ))}
            </div>
            <label className="block text-sm">
              Time zone
              <select
                value={prefs.quietHours.timeZone}
                onChange={(event) =>
                  update(
                    {
                      ...current.current,
                      quietHours: {
                        ...current.current.quietHours,
                        timeZone: event.target.value,
                      },
                    },
                    handleSave,
                  )
                }
                className="mt-1 block w-full rounded-lg border border-border bg-background p-3"
              >
                {zones.map((zone) => (
                  <option key={zone}>{zone}</option>
                ))}
              </select>
            </label>
          </section>
          <section className="rounded-xl border border-border bg-surface-secondary p-5">
            <h3 className="font-bold text-heading">Future delivery channels</h3>
            <p className="mt-2 text-sm text-muted">
              Push notifications and SMS alerts are planned for a future
              release.
            </p>
          </section>
        </div>
      )}
    </AutoSaveWrapper>
  );
}
