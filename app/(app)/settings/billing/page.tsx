import { Suspense } from "react";
import { requireAuth } from "@/app/actions/user";
import { sql } from "@/lib/neon";
import {
  billingConfigured,
  paystack,
  refreshSubscription,
} from "@/lib/billing";
import { object } from "@/lib/settings";
import { BillingClient } from "@/components/settings/billing-client";
export const metadata = { title: "Billing & Subscription - Weave" };
export default async function Page() {
  const { uid } = await requireAuth();
  let account;
  let plan = null;
  let providerError = "";
  const [stored] = await sql.query(
    "select * from billing_accounts where user_id=$1",
    [uid],
  );
  account = stored;
  if (billingConfigured())
    try {
      account = await refreshSubscription(uid);
      const value = object(
        await paystack(
          "/plan/" +
            encodeURIComponent(process.env.PAYSTACK_VERIFIED_PLAN_CODE!),
        ),
      );
      plan = {
        amount: Number(value.amount),
        currency: String(value.currency),
        interval: String(value.interval),
      };
    } catch {
      providerError =
        "Could not refresh billing details. Showing the last recorded status. Try again shortly.";
    }
  const [history, escrow] = await Promise.all([
    sql.query(
      "select id,description,amount,currency,occurred_at from billing_events where user_id=$1 order by occurred_at desc limit 100",
      [uid],
    ),
    sql.query(
      "select id,description,amount,occurred_at from ledger_entries where user_id=$1 and entry_type in('Reserved','Refunded','Released','Refund','Deposit') order by occurred_at desc limit 10",
      [uid],
    ),
  ]);
  const method = object(account?.payment_method);
  const view = account
    ? {
        status: String(account.subscription_status),
        renewalAt: account.renewal_at
          ? new Date(account.renewal_at).toISOString()
          : null,
        amount: account.amount == null ? null : Number(account.amount),
        currency: String(account.currency || "NGN"),
        paymentMethod: method.last4
          ? {
              brand: String(method.brand || "Card"),
              last4: String(method.last4),
              expMonth: String(method.expMonth || ""),
              expYear: String(method.expYear || ""),
            }
          : null,
      }
    : null;
  return (
    <div className="p-4 sm:p-8">
      <h2 className="mb-2 text-2xl font-bold text-heading">
        Billing & Subscription
      </h2>
      <p className="mb-6 text-muted">
        Manage your plan, payment methods, and billing history.
      </p>
      {providerError && (
        <p role="alert" className="mb-4 text-sm text-error">
          {providerError}
        </p>
      )}
      <Suspense fallback={<p>Loading billing…</p>}>
        <BillingClient
          account={view}
          history={history.map((row) => ({
            id: String(row.id),
            description: String(row.description),
            amount: Number(row.amount),
            currency: String(row.currency),
            date: new Date(row.occurred_at).toISOString(),
          }))}
          escrow={escrow.map((row) => ({
            id: String(row.id),
            description: String(row.description),
            amount: Number(row.amount),
            date: new Date(row.occurred_at).toISOString(),
          }))}
          configured={billingConfigured()}
          plan={plan}
        />
      </Suspense>
    </div>
  );
}
