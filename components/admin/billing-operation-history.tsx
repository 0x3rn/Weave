"use client";
import { useEffect, useState } from "react";
import {
  getBillingOperationHistory,
  reconcileBillingOperation,
} from "@/app/actions/admin/billing-operations";
export default function BillingOperationHistory({
  userId,
  canWrite,
}: {
  userId: string;
  canWrite: boolean;
}) {
  const [rows, setRows] = useState<Record<string, unknown>[]>([]),
    [error, setError] = useState(""),
    [pending, setPending] = useState(false);
  useEffect(() => {
    getBillingOperationHistory(userId)
      .then(setRows)
      .catch((e) => setError(e.message));
  }, [userId]);
  return (
    <section className="my-5 rounded-xl border border-border p-4 space-y-3">
      <h3 className="font-semibold">Provider operation history</h3>
      {!rows.length && (
        <p className="text-sm text-muted">No provider operations recorded.</p>
      )}
      {rows.map((row) => (
        <div
          key={String(row.id)}
          className="border border-border p-3 rounded-lg"
        >
          <p className="text-sm font-medium">
            {String(row.operation_type)} · {String(row.state)}
          </p>
          <p className="text-xs text-muted break-all">
            {String(row.id)} · Provider ID:{" "}
            {String(row.provider_id || "Unconfirmed")} ·{" "}
            {String(row.transaction_id || "")}
          </p>
          {canWrite &&
            ["pending", "submitted", "needs_reconciliation"].includes(
              String(row.state),
            ) && (
              <form
                action={async (f) => {
                  setPending(true);
                  const r = await reconcileBillingOperation({
                    id: String(row.id),
                    providerId: String(f.get("providerId") || ""),
                    reason: String(f.get("reason") || ""),
                  });
                  setError(
                    r.success
                      ? "Provider result confirmed."
                      : r.error || "Could not reconcile",
                  );
                  setRows(await getBillingOperationHistory(userId));
                  setPending(false);
                }}
                className="mt-3 space-y-2"
              >
                <p className="text-xs text-muted">
                  Reconciliation reads the provider result. It does not send
                  another payment mutation.
                </p>
                {row.operation_type === "refund" && !row.provider_id && (
                  <label className="block text-sm">
                    Paystack refund ID
                    <input
                      required
                      name="providerId"
                      inputMode="numeric"
                      pattern="[0-9]+"
                      className="block border border-border bg-background rounded-lg p-2 w-full"
                    />
                  </label>
                )}
                <label className="block text-sm">
                  Reconciliation reason
                  <input
                    required
                    minLength={3}
                    name="reason"
                    className="block border border-border bg-background rounded-lg p-2 w-full"
                  />
                </label>
                <button
                  disabled={pending}
                  className="border border-border rounded-lg px-3 py-2 text-sm"
                >
                  {pending ? "Checking provider…" : "Reconcile"}
                </button>
              </form>
            )}
        </div>
      ))}
      {error && (
        <p role="status" className="text-sm">
          {error}
        </p>
      )}
    </section>
  );
}
