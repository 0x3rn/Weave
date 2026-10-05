"use client";
import { useState } from "react";
import { verifyBeforeUpdateEmail } from "firebase/auth";
import { freshIdentity } from "@/lib/reauthenticate";
import { auth } from "@/lib/firebase";
export function EmailChange() {
  const [open, setOpen] = useState(false),
    [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [code, setCode] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [message, setMessage] = useState("");
  return (
    <section className="space-y-3">
      <h3 className="text-lg font-bold text-heading">Email address</h3>
      <p className="text-sm text-muted">
        Verify a new address before it replaces your sign-in email.
      </p>
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="rounded-lg border border-border px-4 py-2 text-sm"
        >
          Change email address
        </button>
      ) : (
        <form
          className="space-y-3"
          onSubmit={async (event) => {
            event.preventDefault();
            setBusy(true);
            setError("");
            try {
              await freshIdentity(password, code);
              if (!auth.currentUser) throw new Error("Sign in again");
              await verifyBeforeUpdateEmail(auth.currentUser, email, {
                url: new URL("/login", window.location.origin).href,
              });
              setMessage(
                "Verification sent to your new address. Follow that link, then sign in again to sync your account.",
              );
              setOpen(false);
              setPassword("");
              setCode("");
            } catch (cause) {
              setError(
                cause instanceof Error
                  ? cause.message
                  : "Could not change email",
              );
            } finally {
              setBusy(false);
            }
          }}
        >
          <label className="block text-sm">
            New email
            <input
              required
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-border bg-background p-3"
            />
          </label>
          <label className="block text-sm">
            Current password (for password accounts)
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-border bg-background p-3"
            />
          </label>
          <label className="block text-sm">
            Authenticator code (if enabled)
            <input
              autoComplete="one-time-code"
              inputMode="numeric"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-border bg-background p-3"
            />
          </label>
          <button
            disabled={busy}
            className="rounded-lg bg-primary px-4 py-2 text-sm text-white"
          >
            Send verification
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => setOpen(false)}
            className="ml-4 text-sm"
          >
            Cancel
          </button>
        </form>
      )}
      {message && (
        <p role="status" className="text-sm text-success">
          {message}
        </p>
      )}
      {error && (
        <p role="alert" className="text-sm text-error">
          {error}
        </p>
      )}
    </section>
  );
}
