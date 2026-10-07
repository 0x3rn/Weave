"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { SETTINGS_SCHEMA } from "@/lib/admin-ops-settings";
import { readable, ROLE_NAMES } from "@/lib/admin-ops-types";
import {
  mutateAdminRecord,
  type platformSettingsData,
} from "@/app/actions/admin/operations";
import { saveAdminPlan } from "@/app/actions/admin/billing-operations";
const control =
  "w-full border border-border rounded-lg bg-background p-2 text-sm";
export default function PlatformSettingsClient({
  initial,
}: {
  initial: Awaited<ReturnType<typeof platformSettingsData>>;
}) {
  const router = useRouter(),
    [section, setSection] = useState("general"),
    [pending, setPending] = useState(false),
    [message, setMessage] = useState("");
  const values =
    initial.settings.find((row) => row.section === section)?.value || {};
  async function submit(form: FormData) {
    setPending(true);
    setMessage("");
    try {
      const data: Record<string, unknown> = {};
      for (const [key, spec] of Object.entries(SETTINGS_SCHEMA[section])) {
        const value = form.get(key);
        data[key] =
          spec.type === "boolean"
            ? value === "on"
            : spec.type === "number"
              ? Number(value)
              : spec.type === "list"
                ? String(value || "")
                    .split("\n")
                    .map((v) => v.trim())
                    .filter(Boolean)
                : String(value || "");
      }
      const result = await mutateAdminRecord({
        area: "settings",
        id: section,
        action: "save",
        data,
        reason: String(form.get("reason") || ""),
        operationId: crypto.randomUUID(),
      });
      if (!result.success) throw new Error(result.error);
      setMessage("Settings saved. Audit recorded.");
      router.refresh();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Save failed");
    } finally {
      setPending(false);
    }
  }
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Platform Settings</h1>
        <p className="text-muted">
          Platform policies, publishing configuration, billing plans, and
          explicitly scoped staff permissions.
        </p>
      </div>
      <div className="flex flex-col md:flex-row gap-6">
        <nav
          aria-label="Platform settings sections"
          className="md:w-52 shrink-0 flex md:flex-col gap-1 overflow-x-auto"
        >
          {[...Object.keys(SETTINGS_SCHEMA), "roles", "plans"].map((s) => (
            <button
              key={s}
              onClick={() => {
                setSection(s);
                setMessage("");
              }}
              aria-current={section === s ? "page" : undefined}
              className={
                "text-left rounded-lg px-3 py-2 whitespace-nowrap " +
                (section === s
                  ? "bg-primary text-white"
                  : "hover:bg-surface-secondary")
              }
            >
              {readable(s)}
            </button>
          ))}
        </nav>
        <div className="flex-1 rounded-xl border border-border bg-surface p-5">
          {SETTINGS_SCHEMA[section] ? (
            <form
              key={section + JSON.stringify(values)}
              action={submit}
              className="space-y-4"
            >
              <h2 className="text-xl font-semibold">{readable(section)}</h2>
              {Object.entries(SETTINGS_SCHEMA[section]).map(([key, spec]) => (
                <label key={key} className="block text-sm">
                  {spec.type === "boolean" ? (
                    <span className="flex gap-3 items-center">
                      <input
                        name={key}
                        type="checkbox"
                        defaultChecked={values[key] === true}
                      />
                      {spec.label}
                    </span>
                  ) : (
                    <>
                      {spec.label}
                      {spec.type === "text" || spec.type === "list" ? (
                        <textarea
                          name={key}
                          className={control}
                          rows={4}
                          defaultValue={
                            Array.isArray(values[key])
                              ? values[key].join("\n")
                              : String(values[key] || "")
                          }
                        />
                      ) : (
                        <input
                          name={key}
                          type={spec.type === "number" ? "number" : "text"}
                          min={spec.min}
                          max={spec.max}
                          className={control}
                          defaultValue={String(values[key] ?? "")}
                        />
                      )}
                    </>
                  )}
                  {spec.hint && (
                    <p className="mt-1 text-xs text-muted">{spec.hint}</p>
                  )}
                </label>
              ))}
              <label className="block text-sm">
                Reason
                <textarea
                  required
                  minLength={3}
                  maxLength={5000}
                  name="reason"
                  className={control}
                />
              </label>
              <button
                disabled={pending}
                className="rounded-lg bg-primary px-4 py-2 text-white disabled:opacity-50"
              >
                {pending ? "Saving…" : "Save " + readable(section)}
              </button>
            </form>
          ) : section === "roles" ? (
            <>
              <h2 className="text-xl font-semibold mb-4">
                Admin Users & Roles
              </h2>
              <p className="text-sm text-muted mb-4">
                Assignments override legacy admin access. Disabling staff access
                removes access to the admin area. At least one active Super
                Admin must remain.
              </p>
              <form
                action={async (form) => {
                  setPending(true);
                  const result = await mutateAdminRecord({
                    area: "roles",
                    id: String(form.get("member")),
                    action: "assign",
                    data: {
                      role: String(form.get("role")),
                      enabled: form.get("enabled") === "on",
                    },
                    reason: String(form.get("reason")),
                    operationId: crypto.randomUUID(),
                  });
                  setMessage(
                    result.success
                      ? "Staff permissions saved."
                      : result.error || "Could not save",
                  );
                  setPending(false);
                  router.refresh();
                }}
                className="space-y-3"
              >
                <label className="block text-sm">
                  Account
                  <select required name="member" className={control}>
                    <option value="">Select account</option>
                    {initial.staff.map((m) => (
                      <option key={String(m.id)} value={String(m.id)}>
                        {String(m.name)} — {String(m.email)} (
                        {String(m.role || "Member")})
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block text-sm">
                  Role
                  <select name="role" className={control}>
                    {ROLE_NAMES.map((r) => (
                      <option key={r}>{r}</option>
                    ))}
                  </select>
                </label>
                <label className="flex gap-2">
                  <input type="checkbox" name="enabled" defaultChecked />
                  Staff access enabled
                </label>
                <label className="block text-sm">
                  Reason
                  <input
                    required
                    minLength={3}
                    name="reason"
                    className={control}
                  />
                </label>
                <button
                  disabled={pending}
                  className="rounded-lg bg-primary text-white p-2"
                >
                  Assign permissions
                </button>
              </form>
              <div className="space-y-3 mt-6">
                {initial.roles.map((r) => (
                  <details
                    key={String(r.name)}
                    className="border border-border rounded-lg p-3"
                  >
                    <summary>{String(r.name)}</summary>
                    <p className="text-sm text-muted break-words mt-2">
                      {(r.permissions as string[]).join(", ")}
                    </p>
                  </details>
                ))}
              </div>
            </>
          ) : (
            <>
              <h2 className="text-xl font-semibold">Subscription Plans</h2>
              <p className="text-sm text-muted my-3">
                Prices, currencies, and intervals are read from the payment
                provider. Changes apply to future checkouts; existing
                subscriptions keep their provider agreement.
              </p>
              {initial.plans.map((p) => (
                <p key={String(p.id)} className="text-sm mb-3">
                  {String(p.name)} ·{" "}
                  {p.configured ? "Configured" : "Not configured"} ·{" "}
                  {p.enabled ? "Enabled" : "Disabled"}
                  {p.amount
                    ? " � " +
                      String(p.currency) +
                      " " +
                      (Number(p.amount) / 100).toFixed(2) +
                      " / " +
                      String(p.billing_interval)
                    : ""}
                </p>
              ))}
              <form
                className="space-y-3"
                action={async (form) => {
                  setPending(true);
                  const result = await saveAdminPlan({
                    id: String(form.get("id")),
                    name: String(form.get("name")),
                    planCode: String(form.get("code")),
                    features: String(form.get("features"))
                      .split("\n")
                      .filter(Boolean),
                    enabled: form.get("enabled") === "on",
                    reason: String(form.get("reason")),
                  });
                  setMessage(
                    result.success && result.price
                      ? `Saved: ${result.price.currency} ${(result.price.amount / 100).toFixed(2)} / ${result.price.interval}`
                      : result.error || "Save failed",
                  );
                  setPending(false);
                  router.refresh();
                }}
              >
                {[
                  ["id", "Plan ID", "verified"],
                  ["name", "Name", "Verified"],
                  ["code", "Paystack plan code", ""],
                  ["reason", "Reason", ""],
                ].map(([name, label, value]) => (
                  <label key={name} className="block text-sm">
                    {label}
                    <input
                      name={name}
                      required
                      className={control}
                      defaultValue={value}
                    />
                  </label>
                ))}
                <label className="block text-sm">
                  Features (one per line)
                  <textarea name="features" className={control} />
                </label>
                <label className="flex gap-2">
                  <input name="enabled" type="checkbox" defaultChecked />
                  Enabled
                </label>
                <button
                  disabled={pending}
                  className="rounded-lg bg-primary text-white p-2"
                >
                  Validate & save provider plan
                </button>
              </form>
            </>
          )}
          {message && (
            <p
              role="status"
              className="mt-4 rounded-lg border border-border p-3"
            >
              {message}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
