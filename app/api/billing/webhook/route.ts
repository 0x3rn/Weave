import { createHmac, timingSafeEqual } from "node:crypto";
import { verifyCheckout, refreshSubscription } from "@/lib/billing";
import { sql } from "@/lib/neon";
import { object } from "@/lib/settings";
export async function POST(request: Request) {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret)
    return Response.json({ error: "Billing unavailable" }, { status: 503 });
  if (Number(request.headers.get("content-length") || 0) > 256000)
    return Response.json({ error: "Event too large" }, { status: 413 });
  const body = await request.text();
  if (body.length > 256000)
    return Response.json({ error: "Event too large" }, { status: 413 });
  const signature = request.headers.get("x-paystack-signature") || "",
    expected = createHmac("sha512", secret).update(body).digest("hex");
  if (
    !/^[a-f0-9]{128}$/i.test(signature) ||
    !timingSafeEqual(
      Buffer.from(signature, "hex"),
      Buffer.from(expected, "hex"),
    )
  )
    return Response.json({ error: "Invalid signature" }, { status: 401 });
  try {
    const event = object(JSON.parse(body)),
      data = object(event.data);
    if (
      event.event === "charge.success" &&
      typeof data.reference === "string"
    ) {
      const [checkout] = await sql.query(
        "select user_id from billing_checkouts where reference=$1",
        [data.reference],
      );
      if (checkout) await verifyCheckout(data.reference);
      else {
        const customer = object(data.customer);
        const [account] = await sql.query(
          "select user_id from billing_accounts where customer_id=$1",
          [customer.customer_code || ""],
        );
        if (
          account &&
          object(data.plan).plan_code ===
            process.env.PAYSTACK_VERIFIED_PLAN_CODE
        ) {
          await refreshSubscription(String(account.user_id));
          await sql.query(
            "insert into billing_events(id,user_id,provider,event_type,description,amount,currency,occurred_at) values($1,$2,'paystack','renewal','Subscription renewal',$3,$4,$5) on conflict(id) do nothing",
            [
              data.reference,
              account.user_id,
              data.amount || 0,
              data.currency || "NGN",
              data.paid_at || new Date().toISOString(),
            ],
          );
        }
      }
    } else if (
      [
        "subscription.create",
        "subscription.disable",
        "subscription.not_renew",
        "invoice.payment_failed",
        "invoice.update",
      ].includes(String(event.event))
    ) {
      const customer = object(data.customer);
      const [account] = await sql.query(
        "select user_id from billing_accounts where customer_id=$1",
        [customer.customer_code || ""],
      );
      if (account) await refreshSubscription(String(account.user_id));
    }
    return Response.json({ received: true });
  } catch {
    return Response.json(
      { error: "Payment event could not be processed. Retry required." },
      { status: 503 },
    );
  }
}
