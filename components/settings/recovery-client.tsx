"use client";
import { useState } from "react";
import { freshIdentity } from "@/lib/reauthenticate";
import { restoreAccount } from "@/app/actions/account-recovery";
import Link from "next/link";
import WeaveLogo from "@/components/brand/weave-logo";
export function RecoveryClient({
  status,
  deleteAfter,
}: {
  status: string;
  deleteAfter?: string;
}) {
  const [password, setPassword] = useState(""),
    [code, setCode] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const allowed =
    status === "deactivated" ||
    (status === "deletion_pending" &&
      deleteAfter &&
      new Date(deleteAfter).getTime() > Date.now());
  return (
    <main className="mx-auto max-w-lg space-y-5 px-4 py-20">
      <Link href="/" className="inline-block" aria-label="Weave home">
        <WeaveLogo size={40} />
      </Link>
      <h1 className="text-3xl font-bold text-heading">
        {status === "deactivated"
          ? "Reactivate your account"
          : "Account recovery"}
      </h1>
      <p className="text-muted">
        {status === "deletion_pending"
          ? `Deletion is scheduled for ${deleteAfter ? new Date(deleteAfter).toLocaleDateString() : "after the grace period"}. You can cancel it before that date.`
          : status === "deactivated"
            ? "Your data is preserved. Confirm your identity to return to Weave."
            : "This account is unavailable. Contact Weave support if you need help."}
      </p>
      {allowed && (
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            setBusy(true);
            setError("");
            void (async () => {
              try {
                const result = await restoreAccount(
                  await freshIdentity(password, code),
                );
                if (!result.success) throw new Error(result.error);
                window.location.assign("/dashboard");
              } catch (cause) {
                setError(
                  cause instanceof Error ? cause.message : "Recovery failed",
                );
              } finally {
                setBusy(false);
              }
            })();
          }}
        >
          <label className="block text-sm">
            Password (or continue with connected provider)
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
          {error && (
            <p role="alert" className="text-error">
              {error}
            </p>
          )}
          <button
            disabled={busy}
            className="rounded-lg bg-primary px-4 py-3 font-bold text-white"
          >
            {busy
              ? "Restoring…"
              : status === "deactivated"
                ? "Reactivate account"
                : "Cancel deletion and restore account"}
          </button>
        </form>
      )}
      <a href="/api/auth/logout" className="block text-sm underline">
        Sign out
      </a>
    </main>
  );
}
