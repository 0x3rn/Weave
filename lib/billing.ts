import "server-only";
import { sql } from "./neon";
import { object } from "./settings";
export function billingConfigured() {
  return (
    !!process.env.PAYSTACK_SECRET_KEY &&
    !!process.env.PAYSTACK_VERIFIED_PLAN_CODE &&
    !!process.env.NEXT_PUBLIC_APP_URL
  );
}
export async function paystack(path: string, body?: Record<string, unknown>) {
  if (!process.env.PAYSTACK_SECRET_KEY)
    throw new Error("Billing is not configured yet");
  const response = await fetch(`https://api.paystack.co${path}`, {
    method: body ? "POST" : "GET",
    headers: {
      authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      "content-type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
    signal: AbortSignal.timeout(15000),
  });
  const result = object(await response.json());
  if (!response.ok || result.status !== true)
    throw new Error(
      "The payment provider could not complete this request. Please retry.",
    );
  return result.data;
}
export async function verifyCheckout(reference: string, userId?: string) {
  const [checkout] = await sql.query(
    "select * from billing_checkouts where reference=$1" +
      (userId ? " and user_id=$2" : ""),
    userId ? [reference, userId] : [reference],
  );
  if (!checkout) throw new Error("Unknown payment reference");
  if (checkout.verified_at) return { userId: String(checkout.user_id) };
  const transaction = object(
    await paystack(`/transaction/verify/${encodeURIComponent(reference)}`),
  );
  if (
    transaction.status !== "success" ||
    transaction.reference !== reference ||
    Number(transaction.amount) !== Number(checkout.expected_amount) ||
    transaction.currency !== checkout.expected_currency
  )
    throw new Error("Payment has not been verified");
  const customer = object(transaction.customer),
    authorization = object(transaction.authorization);
  if (
    typeof customer.customer_code !== "string" ||
    !Number.isSafeInteger(Number(customer.id)) ||
    Number(customer.id) <= 0
  )
    throw new Error("Missing payment customer");
  const subscriptions = await paystack(
    `/subscription?customer=${encodeURIComponent(String(customer.id))}`,
  );
  const subscription = (Array.isArray(subscriptions) ? subscriptions : [])
    .map(object)
    .sort(
      (a, b) =>
        new Date(String(b.createdAt || b.created_at || 0)).getTime() -
        new Date(String(a.createdAt || a.created_at || 0)).getTime(),
    )
    .find(
      (item) =>
        object(item.plan).plan_code === checkout.plan_code &&
        ["active", "non-renewing", "attention"].includes(String(item.status)),
    );
  if (!subscription || typeof subscription.subscription_code !== "string")
    throw new Error(
      "Your subscription is still being confirmed. Please retry shortly.",
    );
  const plan = object(subscription.plan);
  if (
    Number(plan.amount) !== Number(checkout.expected_amount) ||
    plan.currency !== checkout.expected_currency
  )
    throw new Error("Subscription plan differs from the verified checkout");
  const method = {
    brand: authorization.card_type,
    last4: authorization.last4,
    expMonth: authorization.exp_month,
    expYear: authorization.exp_year,
    authorizationCode: authorization.authorization_code,
  };
  await sql.transaction((tx) => [
    tx.query(
      "insert into billing_accounts(user_id,provider,customer_id,subscription_id,subscription_status,renewal_at,amount,currency,payment_method) values($1,'paystack',$2,$3,$4,$5,$6,$7,$8::jsonb) on conflict(user_id) do update set customer_id=excluded.customer_id,subscription_id=excluded.subscription_id,subscription_status=excluded.subscription_status,renewal_at=excluded.renewal_at,amount=excluded.amount,currency=excluded.currency,payment_method=excluded.payment_method,updated_at=now()",
      [
        checkout.user_id,
        customer.customer_code,
        subscription.subscription_code,
        subscription.status,
        subscription.next_payment_date || null,
        plan.amount || checkout.expected_amount,
        plan.currency || checkout.expected_currency,
        JSON.stringify(method),
      ],
    ),
    tx.query(
      "insert into billing_events(id,user_id,provider,event_type,description,amount,currency,occurred_at) values($1,$2,'paystack','payment','Verified subscription',$3,$4,$5) on conflict(id) do nothing",
      [
        reference,
        checkout.user_id,
        transaction.amount,
        transaction.currency,
        transaction.paid_at || new Date().toISOString(),
      ],
    ),
    tx.query(
      'update users set payload=payload||\'{"subscriptionTier":"verified"}\'::jsonb,updated_at=now() where id=$1',
      [checkout.user_id],
    ),
    tx.query(
      "update billing_checkouts set verified_at=now() where reference=$1",
      [reference],
    ),
    tx.query(
      "update billing_accounts set billing_interval=$2 where user_id=$1",
      [checkout.user_id, plan.interval || null],
    ),
  ]);
  return { userId: String(checkout.user_id) };
}
export async function refreshSubscription(userId: string) {
  const [account] = await sql.query(
    "select * from billing_accounts where user_id=$1",
    [userId],
  );
  if (!account?.subscription_id) return account || null;
  const subscription = object(
    await paystack(
      `/subscription/${encodeURIComponent(String(account.subscription_id))}`,
    ),
  );
  const plan = object(subscription.plan),
    authorization = object(subscription.authorization);
  const [policy] = await sql.query(
    "select value->>'failedPaymentGraceDays'as days from platform_settings where section='billing'",
  );
  const pastDue =
    subscription.status === "attention"
      ? account.past_due_since || new Date().toISOString()
      : null;
  const active =
    ["active", "non-renewing"].includes(String(subscription.status)) ||
    (subscription.status === "attention" &&
      Date.now() - new Date(String(pastDue)).getTime() <
        Number(policy?.days ?? 7) * 86400000);
  await sql.transaction((tx) => [
    tx.query("update billing_accounts set past_due_since=$2 where user_id=$1", [
      userId,
      pastDue,
    ]),
    tx.query(
      "update billing_accounts set billing_interval=$2 where user_id=$1",
      [userId, plan.interval || null],
    ),
    tx.query(
      "update billing_accounts set subscription_status=$2,renewal_at=$3,amount=$4,currency=$5,payment_method=$6::jsonb,updated_at=now() where user_id=$1",
      [
        userId,
        subscription.status,
        subscription.next_payment_date || null,
        plan.amount || account.amount,
        plan.currency || account.currency,
        JSON.stringify({
          brand: authorization.card_type,
          last4: authorization.last4,
          expMonth: authorization.exp_month,
          expYear: authorization.exp_year,
          authorizationCode: authorization.authorization_code,
        }),
      ],
    ),
    tx.query(
      "update users set payload=payload||jsonb_build_object('subscriptionTier',$2::text),updated_at=now() where id=$1",
      [userId, active ? "verified" : "free"],
    ),
  ]);
  const [updated] = await sql.query(
    "select * from billing_accounts where user_id=$1",
    [userId],
  );
  return updated;
}
