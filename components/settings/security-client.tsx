"use client";
import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { freshIdentity } from "@/lib/reauthenticate";
import {
  multiFactor,
  onAuthStateChanged,
  updatePassword,
  sendEmailVerification,
  TotpMultiFactorGenerator,
  type TotpSecret,
  type User as AuthUser,
} from "firebase/auth";
import { DevicesClient } from "./devices-client";
export function SecurityClient({
  devices,
}: {
  devices: Record<string, unknown>[];
}) {
  const [user, setUser] = useState<AuthUser | null>(null),
    [current, setCurrent] = useState(""),
    [password, setPassword] = useState(""),
    [confirm, setConfirm] = useState(""),
    [code, setCode] = useState(""),
    [secret, setSecret] = useState<TotpSecret | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [message, setMessage] = useState("");
  useEffect(() => onAuthStateChanged(auth, setUser), []);
  const run = async (work: () => Promise<void>) => {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await work();
    } catch (cause) {
      setError(
        (cause as { code?: string }).code === "auth/operation-not-allowed"
          ? "Authenticator sign-in must be enabled for this Firebase project before enrollment is available."
          : cause instanceof Error
            ? cause.message
            : "Security update failed",
      );
    } finally {
      setBusy(false);
    }
  };
  const refreshSession = async () => {
    const response = await fetch("/api/auth/session", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        idToken: await auth.currentUser?.getIdToken(true),
      }),
    });
    if (!response.ok) throw new Error("Sign in again to refresh your session.");
  };
  const factors = auth.currentUser
    ? multiFactor(auth.currentUser).enrolledFactors
    : [];
  const hasPassword = user?.providerData.some(
    (provider) => provider.providerId === "password",
  );
  return (
    <div className="space-y-8">
      {error && (
        <p
          role="alert"
          className="rounded-lg bg-error/10 p-3 text-sm text-error"
        >
          {error}
        </p>
      )}
      {message && (
        <p
          role="status"
          className="rounded-lg bg-success/10 p-3 text-sm text-success"
        >
          {message}
        </p>
      )}
      <section className="space-y-4 rounded-xl border border-border p-5">
        <h3 className="text-lg font-bold text-heading">
          Confirm your identity
        </h3>
        <p className="text-sm text-muted">
          Sensitive changes require a fresh sign-in. Enter your password and
          authenticator code, or continue with your connected provider.
        </p>
        <label className="block text-sm">
          Current password
          <input
            type="password"
            autoComplete="current-password"
            value={current}
            onChange={(event) => setCurrent(event.target.value)}
            className="mt-1 w-full rounded-lg border border-border bg-background p-3"
          />
        </label>
        <label className="block text-sm">
          Authenticator code (if enabled)
          <input
            inputMode="numeric"
            autoComplete="one-time-code"
            value={code}
            onChange={(event) => setCode(event.target.value)}
            className="mt-1 w-full rounded-lg border border-border bg-background p-3"
          />
        </label>
        {!user && (
          <p className="text-sm text-muted">
            Sign out and sign in again if your browser’s authentication session
            is unavailable.
          </p>
        )}
      </section>
      <section className="space-y-4 rounded-xl border border-border p-5">
        <h3 className="text-lg font-bold text-heading">Password</h3>
        {hasPassword ? (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void run(async () => {
                if (password !== confirm)
                  throw new Error("New passwords do not match.");
                if (password.length < 12)
                  throw new Error(
                    "Use a password with at least 12 characters.",
                  );
                await freshIdentity(current, code);
                if (!auth.currentUser) throw new Error("Sign in again");
                await updatePassword(auth.currentUser, password);
                await refreshSession();
                setPassword("");
                setConfirm("");
                setCurrent("");
                setMessage("Password updated.");
              });
            }}
            className="space-y-4"
          >
            <label className="block text-sm">
              New password
              <input
                required
                minLength={12}
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="mt-1 w-full rounded-lg border border-border bg-background p-3"
              />
            </label>
            <label className="block text-sm">
              Confirm password
              <input
                required
                type="password"
                autoComplete="new-password"
                value={confirm}
                onChange={(event) => setConfirm(event.target.value)}
                className="mt-1 w-full rounded-lg border border-border bg-background p-3"
              />
            </label>
            <button
              disabled={busy}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
            >
              Update password
            </button>
          </form>
        ) : (
          <p className="text-sm text-muted">
            Your password is managed by your connected sign-in provider.
          </p>
        )}
      </section>
      <section className="space-y-4 rounded-xl border border-border p-5">
        <h3 className="text-lg font-bold text-heading">
          Two-factor authentication
        </h3>
        <p className="text-sm text-muted">
          {factors.length
            ? "Enabled — authenticator required at sign-in."
            : "Disabled — add an authenticator app to protect your account."}
        </p>
        {user && !user.emailVerified && (
          <button
            disabled={busy}
            onClick={() =>
              void run(async () => {
                await sendEmailVerification(user);
                setMessage(
                  "Verification email sent. Verify your email and sign in again before enabling 2FA.",
                );
              })
            }
            className="rounded-lg border border-border px-4 py-2 text-sm"
          >
            Send verification email
          </button>
        )}
        {!factors.length && !secret && (
          <button
            disabled={busy || !user}
            onClick={() =>
              void run(async () => {
                await freshIdentity(current, code);
                if (!auth.currentUser?.emailVerified)
                  throw new Error("Verify your email before enabling 2FA.");
                const session = await multiFactor(
                  auth.currentUser,
                ).getSession();
                setSecret(
                  await TotpMultiFactorGenerator.generateSecret(session),
                );
                setCode("");
              })
            }
            className="rounded-lg border border-border px-4 py-2 text-sm font-bold disabled:opacity-50"
          >
            Enable 2FA
          </button>
        )}
        {secret && (
          <div className="space-y-3 rounded-lg bg-surface-secondary p-4">
            <p className="text-sm">
              Add a time-based account to your authenticator using this setup
              key:
            </p>
            <code className="block break-all rounded border border-border bg-background p-3">
              {secret.secretKey}
            </code>
            <p className="text-xs text-muted">
              Account: {user?.email} · Issuer: Weave · {secret.codeLength}{" "}
              digits · {secret.codeIntervalSeconds} seconds
            </p>
            <label className="block text-sm">
              Code from your new authenticator
              <input
                inputMode="numeric"
                value={code}
                onChange={(event) => setCode(event.target.value)}
                className="mt-1 block w-full rounded-lg border border-border bg-background p-3"
              />
            </label>
            <button
              disabled={busy || !code}
              onClick={() =>
                void run(async () => {
                  if (!auth.currentUser) throw new Error("Sign in again");
                  await multiFactor(auth.currentUser).enroll(
                    TotpMultiFactorGenerator.assertionForEnrollment(
                      secret,
                      code,
                    ),
                    "Weave authenticator",
                  );
                  setSecret(null);
                  setCode("");
                  setUser(auth.currentUser);
                  await refreshSession();
                  setMessage("Two-factor authentication enabled.");
                })
              }
              className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
            >
              Verify and enable
            </button>
            <button
              disabled={busy}
              onClick={() => {
                setSecret(null);
                setCode("");
              }}
              className="ml-3 text-sm underline"
            >
              Cancel
            </button>
          </div>
        )}
        {factors.map((factor) => (
          <div
            key={factor.uid}
            className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border p-3"
          >
            <span className="text-sm">
              {factor.displayName || "Authenticator"}
            </span>
            <button
              disabled={busy}
              onClick={() =>
                void run(async () => {
                  await freshIdentity(current, code);
                  if (!auth.currentUser) throw new Error("Sign in again");
                  await multiFactor(auth.currentUser).unenroll(factor.uid);
                  setUser(auth.currentUser);
                  await refreshSession();
                  setMessage("Authenticator removed.");
                })
              }
              className="text-sm font-bold text-error"
            >
              Remove authenticator
            </button>
          </div>
        ))}
      </section>
      <section className="rounded-xl border border-border p-5">
        <h3 className="font-bold text-heading">Passkeys</h3>
        <p className="mt-2 text-sm text-muted">
          Passwordless passkeys are planned for a future release.
        </p>
      </section>
      <section className="space-y-4">
        <h3 className="text-lg font-bold text-heading">
          Login activity & trusted devices
        </h3>
        <DevicesClient initialDevices={devices} />
      </section>
    </div>
  );
}
