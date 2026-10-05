"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  startSubscriptionCheckout,
  subscriptionManagementLink,
  removePaymentMethod,
} from "@/app/actions/billing";
import { freshIdentity } from "@/lib/reauthenticate";
type Account = {
  status: string;
  renewalAt: string | null;
  amount: number | null;
  currency: string;
  paymentMethod: {
    brand?: string;
    last4?: string;
    expMonth?: string;
    expYear?: string;
  } | null;
};
type Event = {
  id: string;
  description: string;
  amount: number;
  currency: string;
  date: string;
};
const money = (amount: number, currency: string) =>
  new Intl.NumberFormat(undefined, { style: "currency", currency }).format(
    amount / 100,
  );
export function BillingClient({
  account,
  history,
  escrow,
  configured,
  plan,
}: {
  account: Account | null;
  history: Event[];
  escrow: { id: string; description: string; amount: number; date: string }[];
  configured: boolean;
  plan: { amount: number; currency: string; interval: string } | null;
}) {
  const router = useRouter(),
    params = useSearchParams(),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [removing, setRemoving] = useState(false),
    [password, setPassword] = useState(""),
    [code, setCode] = useState("");
  const active =
    account && ["active", "non-renewing", "attention"].includes(account.status);
  const go = async (kind: "upgrade" | "manage") => {
    setBusy(true);
    setError("");
    try {
      const result = await (kind === "upgrade"
        ? startSubscriptionCheckout()
        : subscriptionManagementLink());
      if (!result.success || !result.url) throw new Error(result.error);
      window.location.assign(result.url);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Billing action failed",
      );
      setBusy(false);
    }
  };
  return (
    <div className="space-y-8">
      {(error || params.get("error")) && (
        <p role="alert" className="text-sm text-error">
          {error || params.get("error")}
        </p>
      )}
      {params.get("success") && (
        <p role="status" className="text-sm text-success">
          {params.get("success")}
        </p>
      )}
      {!configured && (
        <p className="rounded-lg border border-border bg-surface-secondary p-4 text-sm text-muted">
          Subscriptions are awaiting payment-provider configuration. Your
          current account remains accessible.
        </p>
      )}
      <section className="space-y-4 rounded-xl border border-border p-5">
        <h3 className="text-lg font-bold text-heading">Current plan</h3>
        <p className="text-2xl font-bold text-heading">
          {active ? "Verified" : "Free"}
        </p>
        <p className="text-sm text-muted">
          {active && account?.amount != null
            ? money(account.amount, account.currency)
            : "Free plan"}
          {active && plan ? " / " + plan.interval : ""}
        </p>
        {account && (
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between gap-3">
              <dt>Status</dt>
              <dd className="capitalize">{account.status}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt>Next billing date</dt>
              <dd>
                {account.renewalAt
                  ? new Date(account.renewalAt).toLocaleDateString()
                  : "No renewal scheduled"}
              </dd>
            </div>
          </dl>
        )}
        <button
          disabled={!configured || busy}
          onClick={() => void go(active ? "manage" : "upgrade")}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
        >
          {busy
            ? "Opening secure page…"
            : active
              ? "Manage subscription"
              : plan
                ? "Upgrade — " +
                  money(plan.amount, plan.currency) +
                  " / " +
                  plan.interval
                : "Upgrade"}
        </button>
        <p className="text-xs text-muted">
          Manage renewal, cancel, or update payment details securely through
          Paystack.
        </p>
      </section>
      <section className="space-y-4 rounded-xl border border-border p-5">
        <h3 className="text-lg font-bold text-heading">Payment method</h3>
        {account?.paymentMethod?.last4 ? (
          <>
            <p className="text-sm text-heading">
              {account.paymentMethod.brand || "Card"} ending in{" "}
              {account.paymentMethod.last4}
            </p>
            <p className="text-xs text-muted">
              Expires {account.paymentMethod.expMonth}/
              {account.paymentMethod.expYear}
            </p>
            <div className="flex gap-4">
              <button
                disabled={busy || !configured}
                onClick={() => void go("manage")}
                className="text-sm font-bold underline"
              >
                Add or update method
              </button>
              <button
                disabled={busy || !configured}
                onClick={() => setRemoving(true)}
                className="text-sm font-bold text-error"
              >
                Remove
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="text-sm text-muted">
              No saved payment method. A method is added when you subscribe
              through secure checkout.
            </p>
            <button
              disabled={busy || !configured}
              onClick={() => void go(active ? "manage" : "upgrade")}
              className="rounded-lg border border-border px-4 py-2 text-sm font-bold disabled:opacity-50"
            >
              {active ? "Add payment method" : "Add payment method and upgrade"}
            </button>
          </>
        )}
        {removing && (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              setBusy(true);
              setError("");
              void (async () => {
                try {
                  const result = await removePaymentMethod(
                    await freshIdentity(password, code),
                  );
                  if (!result.success) throw new Error(result.error);
                  setRemoving(false);
                  router.refresh();
                } catch (cause) {
                  setError(
                    cause instanceof Error
                      ? cause.message
                      : "Could not remove method",
                  );
                } finally {
                  setBusy(false);
                }
              })();
            }}
            className="space-y-3"
          >
            <p className="text-xs text-muted">
              Cancel your subscription and wait for it to expire before removing
              its method.
            </p>
            <label className="block text-sm">
              Current password
              <input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="mt-1 w-full rounded-lg border border-border bg-background p-2"
              />
            </label>
            <label className="block text-sm">
              Authenticator code
              <input
                inputMode="numeric"
                value={code}
                onChange={(event) => setCode(event.target.value)}
                className="mt-1 w-full rounded-lg border border-border bg-background p-2"
              />
            </label>
            <button disabled={busy} className="text-sm font-bold text-error">
              Confirm removal
            </button>
            <button
              type="button"
              onClick={() => setRemoving(false)}
              className="ml-4 text-sm underline"
            >
              Cancel
            </button>
          </form>
        )}
      </section>
      <section className="space-y-4">
        <h3 className="text-lg font-bold text-heading">Billing history</h3>
        {history.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="p-3">Date</th>
                  <th className="p-3">Description</th>
                  <th className="p-3">Amount</th>
                  <th className="p-3">Invoice</th>
                </tr>
              </thead>
              <tbody>
                {history.map((event) => (
                  <tr key={event.id} className="border-b border-border">
                    <td className="p-3">
                      {new Date(event.date).toLocaleDateString()}
                    </td>
                    <td className="p-3">{event.description}</td>
                    <td className="p-3">
                      {money(event.amount, event.currency)}
                    </td>
                    <td className="p-3">
                      <a
                        href={
                          "/api/billing/invoice?id=" +
                          encodeURIComponent(event.id)
                        }
                        className="font-bold underline"
                      >
                        Download invoice
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-muted">No billing history yet.</p>
        )}
      </section>
      <section className="space-y-4">
        <h3 className="text-lg font-bold text-heading">Escrow history</h3>
        <p className="text-xs text-muted">
          Recent Skill Hour deposits, releases, and refunds.
        </p>
        {escrow.length ? (
          escrow.map((entry) => (
            <div
              key={entry.id}
              className="flex flex-wrap justify-between gap-3 rounded-lg border border-border p-3 text-sm"
            >
              <span>{entry.description}</span>
              <span>
                {entry.amount} Skill Hours ·{" "}
                {new Date(entry.date).toLocaleDateString()}
              </span>
            </div>
          ))
        ) : (
          <p className="text-sm text-muted">No recent escrow activity.</p>
        )}
      </section>
    </div>
  );
}
