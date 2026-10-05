"use client";
import { useState } from "react";
import { changeAccountState } from "@/app/actions/settings";
import { freshIdentity } from "@/lib/reauthenticate";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
export function DangerClient({ initialPaused }: { initialPaused: boolean }) {
  const [paused, setPaused] = useState(initialPaused),
    [confirm, setConfirm] = useState<"deactivate" | "delete" | null>(null),
    [password, setPassword] = useState(""),
    [code, setCode] = useState(""),
    [ack, setAck] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const run = async (action: "pause" | "resume" | "deactivate" | "delete") => {
    setBusy(true);
    setError("");
    try {
      const token =
        action === "deactivate" || action === "delete"
          ? await freshIdentity(password, code)
          : undefined;
      const result = await changeAccountState(action, token, ack);
      if (!result.success) throw new Error(result.error);
      if (action === "pause" || action === "resume")
        setPaused(action === "pause");
      else {
        await signOut(auth);
        window.location.assign("/api/auth/logout");
      }
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Account action failed",
      );
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="space-y-6">
      {error && (
        <p
          role="alert"
          className="rounded-lg bg-error/10 p-3 text-sm text-error"
        >
          {error}
        </p>
      )}
      <section className="rounded-xl border border-error/30 p-5">
        <h3 className="font-bold text-heading">Pause Marketplace Activity</h3>
        <p className="my-3 text-sm text-muted">
          Hide your profile and requests from discovery and recommendations.
          Existing exchanges remain accessible.
        </p>
        <button
          disabled={busy}
          onClick={() => void run(paused ? "resume" : "pause")}
          className="rounded-lg border border-border px-4 py-2 text-sm font-bold"
        >
          {paused ? "Resume activity" : "Pause activity"}
        </button>
      </section>
      <section className="rounded-xl border border-error/30 p-5">
        <h3 className="font-bold text-heading">Deactivate Account</h3>
        <p className="my-3 text-sm text-muted">
          Hide your account and preserve your data. Sign in again to reactivate
          it. You will be signed out of all devices. Paid subscriptions continue
          until you cancel them in Billing.
        </p>
        <button
          disabled={busy}
          onClick={() => {
            setConfirm("deactivate");
            setAck(false);
            setError("");
          }}
          className="rounded-lg border border-border px-4 py-2 text-sm font-bold"
        >
          Deactivate account
        </button>
      </section>
      <section className="rounded-xl border border-error/40 bg-error/5 p-5">
        <h3 className="font-bold text-error">Delete Account</h3>
        <p className="my-3 text-sm text-muted">
          Deletion is scheduled after a 14-day grace period. Sign in during that
          period to cancel it. Once processed, deletion is irreversible.
        </p>
        <ul className="mb-4 list-disc space-y-2 pl-5 text-sm text-muted">
          <li>Complete or cancel every active exchange.</li>
          <li>Resolve all pending disputes.</li>
          <li>Cancel any paid subscription and wait until it expires.</li>
          <li>
            Ledger and audit records required by the platform may be retained
            with an anonymized member identifier.
          </li>
        </ul>
        <button
          disabled={busy}
          onClick={() => {
            setConfirm("delete");
            setAck(false);
            setError("");
          }}
          className="rounded-lg bg-error px-4 py-2 text-sm font-bold text-white"
        >
          Delete account
        </button>
      </section>
      {confirm && (
        <section
          role="region"
          aria-label="Confirm account action"
          className="space-y-4 rounded-xl border border-error bg-surface p-5"
        >
          <h3 className="font-bold text-error">
            Confirm {confirm === "delete" ? "account deletion" : "deactivation"}
          </h3>
          <p className="text-sm text-muted">
            Confirm your password, or continue with your connected sign-in
            provider.
          </p>
          <label className="block text-sm">
            Current password
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-1 block w-full rounded-lg border border-border bg-background p-3"
            />
          </label>
          <label className="block text-sm">
            Authenticator code (if enabled)
            <input
              inputMode="numeric"
              autoComplete="one-time-code"
              value={code}
              onChange={(event) => setCode(event.target.value)}
              className="mt-1 block w-full rounded-lg border border-border bg-background p-3"
            />
          </label>
          {confirm === "delete" && (
            <label className="flex items-start gap-3 text-sm">
              <input
                type="checkbox"
                checked={ack}
                onChange={(event) => setAck(event.target.checked)}
                className="mt-1"
              />
              <span>
                I understand my account will be permanently deleted after 14
                days unless I cancel, and required platform records may be
                retained.
              </span>
            </label>
          )}
          <div className="flex gap-3">
            <button
              disabled={busy || (confirm === "delete" && !ack)}
              onClick={() => void run(confirm)}
              className="rounded-lg bg-error px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
            >
              {busy
                ? "Processing…"
                : confirm === "delete"
                  ? "Schedule permanent deletion"
                  : "Confirm deactivation"}
            </button>
            <button
              disabled={busy}
              onClick={() => {
                setConfirm(null);
                setPassword("");
                setCode("");
              }}
              className="rounded-lg border border-border px-4 py-2 text-sm"
            >
              Cancel
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
