"use server";
import { requireAuth } from "./user";
import {
  billingConfigured,
  paystack,
  refreshSubscription,
} from "@/lib/billing";
import { sql } from "@/lib/neon";
import { object } from "@/lib/settings";
import { verifyFirebaseIdToken } from "@/lib/firebase-auth-server";
export async function startSubscriptionCheckout() {
  try {
    const { uid } = await requireAuth();
    if (!billingConfigured())
      throw new Error("Weave billing setup is not complete.");
    const [user] = await sql.query("select email from users where id=$1", [
      uid,
    ]);
    const [existing] = await sql.query(
      "select subscription_status from billing_accounts where user_id=$1",
      [uid],
    );
    if (
      existing &&
      ["active", "non-renewing", "attention"].includes(
        String(existing.subscription_status),
      )
    )
      throw new Error(
        "Manage your current subscription before starting another one.",
      );
    const plan = object(
      await paystack(
        `/plan/${encodeURIComponent(process.env.PAYSTACK_VERIFIED_PLAN_CODE!)}`,
      ),
    );
    if (
      !Number.isInteger(plan.amount) ||
      Number(plan.amount) <= 0 ||
      typeof plan.currency !== "string"
    )
      throw new Error("The subscription plan is unavailable.");
    const reference = `weave_${crypto.randomUUID().replaceAll("-", "")}`;
    const [reservation] = await sql.query(
      "select * from reserve_member_checkout($1,$2,$3,$4,$5)",
      [
        uid,
        reference,
        plan.amount,
        plan.currency,
        process.env.PAYSTACK_VERIFIED_PLAN_CODE,
      ],
    );
    if (reservation.reference !== reference) {
      if (reservation.authorization_url)
        return { success: true, url: String(reservation.authorization_url) };
      throw new Error(
        "A checkout is being prepared. Retry shortly, or wait 30 minutes for it to expire.",
      );
    }
    const result = object(
      await paystack("/transaction/initialize", {
        email: user.email,
        amount: plan.amount,
        plan: process.env.PAYSTACK_VERIFIED_PLAN_CODE,
        reference,
        callback_url: new URL(
          "/api/billing/callback",
          process.env.NEXT_PUBLIC_APP_URL!,
        ).href,
        metadata: { weaveUserId: uid },
      }),
    );
    if (
      typeof result.authorization_url !== "string" ||
      new URL(result.authorization_url).hostname !== "checkout.paystack.com" ||
      new URL(result.authorization_url).protocol !== "https:"
    )
      throw new Error("No secure checkout URL returned");
    await sql.query(
      "update billing_checkouts set authorization_url=$2 where reference=$1",
      [reference, result.authorization_url],
    );
    return { success: true, url: result.authorization_url };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Could not start checkout",
    };
  }
}
export async function subscriptionManagementLink() {
  try {
    const { uid } = await requireAuth();
    const account = await refreshSubscription(uid);
    if (!account?.subscription_id)
      throw new Error("No active subscription found");
    const result = object(
      await paystack(
        `/subscription/${encodeURIComponent(String(account.subscription_id))}/manage/link`,
      ),
    );
    if (
      typeof result.link !== "string" ||
      !new URL(result.link).hostname.endsWith(".paystack.com") ||
      new URL(result.link).protocol !== "https:"
    )
      throw new Error("No secure management link returned");
    return { success: true, url: result.link };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Could not open subscription management",
    };
  }
}
export async function removePaymentMethod(idToken: string) {
  try {
    const { uid } = await requireAuth();
    const claims = await verifyFirebaseIdToken(idToken);
    if (
      claims.uid !== uid ||
      !claims.auth_time ||
      Date.now() / 1000 - claims.auth_time > 300
    )
      throw new Error("Confirm your identity again");
    const account = await refreshSubscription(uid);
    if (!account) throw new Error("No payment method found");
    if (
      ["active", "non-renewing", "attention"].includes(
        String(account.subscription_status),
      )
    )
      throw new Error(
        "Cancel your subscription and wait until it expires before removing its payment method.",
      );
    const method = object(account.payment_method);
    if (typeof method.authorizationCode !== "string")
      throw new Error("No payment method found");
    await paystack("/customer/deactivate_authorization", {
      authorization_code: method.authorizationCode,
    });
    await sql.query(
      "update billing_accounts set payment_method=null where user_id=$1",
      [uid],
    );
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Could not remove payment method",
    };
  }
}
