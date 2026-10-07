"use server";
import { sql } from "@/lib/neon";
import { paystack, refreshSubscription } from "@/lib/billing";
import { adminSession, adminRequestContext } from "@/lib/admin-ops-access";
import { revalidatePath } from "next/cache";
const object = (v: unknown): Record<string, unknown> =>
  v && typeof v === "object" ? (v as Record<string, unknown>) : {};
export async function adminBillingOperation(input: {
  userId: string;
  action: string;
  reason: string;
  operationId: string;
  confirmed: boolean;
  amount: number;
  transactionId: string;
}) {
  let issued = false,
    claimed = false;
  try {
    const session = await adminSession("subscriptions.provider");
    if (
      !["sync", "cancel", "reactivate", "refund"].includes(input.action) ||
      typeof input.reason !== "string" ||
      input.reason.trim().length < 3 ||
      input.reason.length > 5000 ||
      !/^[a-f0-9-]{36}$/.test(input.operationId) ||
      !input.confirmed
    )
      throw new Error("Confirm the provider action and enter a reason");
    const [account] = await sql.query(
      "select provider,customer_id,subscription_id,subscription_status,amount,currency from billing_accounts where user_id=$1",
      [input.userId],
    );
    if (!account || account.provider !== "paystack")
      throw new Error(
        "This account requires a supported Paystack subscription",
      );
    let transaction: Record<string, unknown> = {};
    if (input.action === "refund") {
      if (
        !Number.isSafeInteger(input.amount) ||
        input.amount < 1 ||
        !input.transactionId ||
        input.transactionId.length > 200
      )
        throw new Error(
          "Enter a valid transaction reference and refund amount",
        );
      const [event] = await sql.query(
        "select id,amount,occurred_at from billing_events where user_id=$1 and id=$2 and event_type='payment'",
        [input.userId, input.transactionId],
      );
      if (!event) throw new Error("Choose a recorded payment for this member");
      const [policy] = await sql.query(
        "select value->>'refundWindowDays' as days from platform_settings where section='billing'",
      );
      if (
        Date.now() - new Date(String(event.occurred_at)).getTime() >
        Number(policy?.days || 30) * 86400000
      )
        throw new Error("Payment is outside the configured refund window");
      transaction = object(
        await paystack(
          "/transaction/verify/" + encodeURIComponent(input.transactionId),
        ),
      );
      if (
        transaction.status !== "success" ||
        object(transaction.customer).customer_code !== account.customer_id ||
        Number(transaction.amount) !== Number(event.amount) ||
        transaction.currency !== account.currency
      )
        throw new Error(
          "Payment ownership, amount, or currency differs from the recorded transaction",
        );
    }
    const [claim] = await sql.query(
      "select admin_ops_claim_billing($1,$2,$3,$4,$5,$6,$7,$8::jsonb) as result",
      [
        session.uid,
        input.operationId,
        input.userId,
        input.action,
        input.reason.trim(),
        input.amount || null,
        input.transactionId || null,
        JSON.stringify(await adminRequestContext()),
      ],
    );
    if (claim.result?.duplicate) {
      if (
        claim.result.state === "completed" ||
        claim.result.state === "submitted"
      )
        return { success: true };
      throw new Error(
        "This operation already exists. Reconcile its provider result before submitting another action.",
      );
    }
    claimed = true;
    let result: Record<string, unknown> = {};
    if (input.action === "refund") {
      issued = true;
      result = object(
        await paystack("/refund", {
          transaction: transaction.id,
          amount: input.amount,
          merchant_note: input.reason.slice(0, 200),
        }),
      );
      if (!result.id)
        throw new Error("The provider response requires reconciliation");
    } else {
      if (!account.subscription_id)
        throw new Error("No provider subscription is recorded");
      const subscription = object(
        await paystack(
          "/subscription/" +
            encodeURIComponent(String(account.subscription_id)),
        ),
      );
      if (object(subscription.customer).customer_code !== account.customer_id)
        throw new Error("Subscription ownership differs from this member");
      if (input.action !== "sync") {
        if (!subscription.email_token)
          throw new Error("Provider did not return an authorization token");
        issued = true;
        await paystack(
          "/subscription/" + (input.action === "cancel" ? "disable" : "enable"),
          { code: account.subscription_id, token: subscription.email_token },
        );
      }
      const updated = await refreshSubscription(input.userId);
      await sql.query(
        "update billing_accounts set billing_interval=$2 where user_id=$1",
        [input.userId, object(subscription.plan).interval || null],
      );
      result = {
        status: updated?.subscription_status,
        amount: updated?.amount,
        currency: updated?.currency,
        interval: object(subscription.plan).interval,
      };
    }
    const state = input.action === "refund" ? "submitted" : "completed";
    await sql.query(
      "with updated as(update admin_billing_operations set state=$2,provider_id=$3,result=$4::jsonb,updated_at=now() where id=$1 returning *)select admin_ops_audit($5,'subscriptions',$6,$7,$8::jsonb,$4::jsonb,$9,$1,$10::jsonb)from updated",
      [
        input.operationId,
        state,
        result.id ? String(result.id) : null,
        JSON.stringify(result),
        session.uid,
        input.userId,
        input.action,
        JSON.stringify({ status: account.subscription_status }),
        input.reason,
        JSON.stringify(await adminRequestContext()),
      ],
    );
    revalidatePath("/admin/subscriptions");
    return { success: true };
  } catch (error) {
    if (claimed)
      await sql
        .query(
          "update admin_billing_operations set state=$2,result=jsonb_build_object('message',$3::text),updated_at=now()where id=$1",
          [
            input.operationId,
            issued ? "needs_reconciliation" : "failed",
            "Provider operation did not finish locally",
          ],
        )
        .catch(() => {});
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Provider operation failed",
    };
  }
}
export async function saveAdminPlan(input: {
  id: string;
  name: string;
  planCode: string;
  features: string[];
  enabled: boolean;
  reason: string;
}) {
  try {
    const session = await adminSession("settings.write");
    if (
      !/^[a-z0-9-]{1,80}$/.test(input.id) ||
      !input.name.trim() ||
      input.name.length > 200 ||
      !/^PLN_[a-zA-Z0-9]+$/.test(input.planCode) ||
      input.reason.trim().length < 3 ||
      !Array.isArray(input.features) ||
      input.features.length > 30 ||
      input.features.some((v) => typeof v !== "string" || v.length > 500)
    )
      throw new Error("Check plan details");
    const plan = object(
      await paystack("/plan/" + encodeURIComponent(input.planCode)),
    );
    if (
      plan.plan_code !== input.planCode ||
      !Number.isSafeInteger(Number(plan.amount)) ||
      Number(plan.amount) <= 0
    )
      throw new Error("Invalid provider plan");
    await sql.query(
      "with changed as(insert into platform_plans(id,name,provider_plan_code,features,enabled,amount,currency,billing_interval)values($1,$2,$3,$4::jsonb,$5,($7::jsonb->>'amount')::integer,$7::jsonb->>'currency',$7::jsonb->>'interval')on conflict(id)do update set name=excluded.name,provider_plan_code=excluded.provider_plan_code,features=excluded.features,enabled=excluded.enabled,amount=excluded.amount,currency=excluded.currency,billing_interval=excluded.billing_interval,updated_at=now()returning id,name,features,enabled,amount,currency,billing_interval)select admin_ops_audit($6,'plans',$1,'save',null,to_jsonb(changed),$8,$9,$10::jsonb)from changed",
      [
        input.id,
        input.name.trim(),
        input.planCode,
        JSON.stringify(input.features),
        input.enabled,
        session.uid,
        JSON.stringify({
          amount: plan.amount,
          currency: plan.currency,
          interval: plan.interval,
        }),
        input.reason,
        crypto.randomUUID(),
        JSON.stringify(await adminRequestContext()),
      ],
    );
    revalidatePath("/admin/settings");
    return {
      success: true,
      price: {
        amount: Number(plan.amount),
        currency: String(plan.currency),
        interval: String(plan.interval),
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Plan could not be saved",
    };
  }
}
export async function getBillingOperationHistory(userId: string) {
  await adminSession("subscriptions.read");
  return sql.query(
    "select id,operation_type,state,amount,transaction_id,provider_id,created_at,updated_at from admin_billing_operations where user_id=$1 order by created_at desc limit 50",
    [userId],
  );
}
export async function reconcileBillingOperation(input: {
  id: string;
  providerId: string;
  reason: string;
}) {
  try {
    const session = await adminSession("subscriptions.provider");
    if (
      typeof input.reason !== "string" ||
      input.reason.trim().length < 3 ||
      input.reason.length > 5000
    )
      throw new Error("Enter a reconciliation reason");
    const [o] = await sql.query(
      "select * from admin_billing_operations where id=$1",
      [input.id],
    );
    if (
      !o ||
      !["pending", "submitted", "needs_reconciliation"].includes(o.state)
    )
      throw new Error("Operation does not require reconciliation");
    let after: Record<string, unknown> = {};
    const context = JSON.stringify(await adminRequestContext());
    const reconciliationId = crypto.randomUUID();
    if (o.operation_type === "refund") {
      const providerId = o.provider_id || input.providerId;
      if (!/^[0-9]{1,30}$/.test(String(providerId)))
        throw new Error("Enter the refund ID shown in the Paystack dashboard");
      const refund = object(
          await paystack("/refund/" + encodeURIComponent(String(providerId))),
        ),
        payment = object(
          await paystack(
            "/transaction/verify/" +
              encodeURIComponent(String(o.transaction_id)),
          ),
        );
      const transaction =
        refund.transaction && typeof refund.transaction === "object"
          ? object(refund.transaction).id
          : refund.transaction;
      if (
        Number(payment.id) !== Number(transaction) ||
        Number(refund.amount) !== Number(o.amount) ||
        payment.currency !== refund.currency
      )
        throw new Error(
          "Refund does not match the recorded payment and amount",
        );
      if (refund.status !== "processed" && refund.status !== "failed")
        throw new Error(
          "Refund is still processing. Retry reconciliation later.",
        );
      after = {
        status: refund.status,
        id: providerId,
        currency: refund.currency,
        amount: refund.amount,
      };
      await sql.query(
        "with changed as(update admin_billing_operations set state=$2,provider_id=$3,result=$4::jsonb,updated_at=now()where id=$1 and state in('pending','submitted','needs_reconciliation')returning *),event as(insert into billing_events(id,user_id,provider,event_type,description,amount,currency)select 'refund-'||id,user_id,'paystack','refund','Provider-confirmed refund',-amount,$5 from changed where $2='completed'on conflict do nothing returning id)select admin_ops_audit($6,'subscriptions',user_id,'provider_reconciliation',jsonb_build_object('state',$7::text),$4::jsonb,$8,$9,$10::jsonb)from changed",
        [
          o.id,
          refund.status === "processed" ? "completed" : "rejected",
          String(providerId),
          JSON.stringify(after),
          refund.currency,
          session.uid,
          o.state,
          input.reason,
          reconciliationId,
          context,
        ],
      );
    } else {
      const account = await refreshSubscription(String(o.user_id));
      const status = String(account?.subscription_status || "");
      if (
        (o.operation_type === "cancel" &&
          !["non-renewing", "cancelled", "complete"].includes(status)) ||
        (o.operation_type === "reactivate" && status !== "active")
      )
        throw new Error(
          "Provider status has not confirmed this operation. Review it in the provider dashboard.",
        );
      after = { status };
      await sql.query(
        "with changed as(update admin_billing_operations set state='completed',result=$2::jsonb,updated_at=now()where id=$1 and state in('pending','submitted','needs_reconciliation')returning *)select admin_ops_audit($3,'subscriptions',user_id,'provider_reconciliation',jsonb_build_object('state',$4::text),$2::jsonb,$5,$6,$7::jsonb)from changed",
        [
          o.id,
          JSON.stringify(after),
          session.uid,
          o.state,
          input.reason,
          reconciliationId,
          context,
        ],
      );
    }
    revalidatePath("/admin/subscriptions");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Could not reconcile provider state",
    };
  }
}
