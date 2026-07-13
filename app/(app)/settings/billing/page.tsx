import { getCurrentUserId } from "@/app/actions/user";
import { db } from "@/lib/firebase-admin";
import { redirect } from "next/navigation";
import { BillingClient } from "@/components/settings/billing-client";

export const metadata = {
  title: "Billing & Subscription - Weave",
};

export default async function BillingSettingsPage() {
  const userId = await getCurrentUserId();
  
  if (!userId) {
    redirect("/login");
  }

  let user = null;
  if (db) {
    const userDoc = await db.collection("users").doc(userId).get();
    if (userDoc.exists) {
      user = { id: userDoc.id, ...userDoc.data() };
    }
  }

  if (!user) {
    return <div className="p-8 text-error">Failed to load account data.</div>;
  }

  return (
    <div className="p-8">
      <div className="border-b border-border pb-6 mb-8">
        <h2 className="text-2xl font-black text-heading mb-2">Billing & Subscription</h2>
        <p className="text-muted">Manage your subscription, payment methods, and view billing history.</p>
      </div>

      <BillingClient user={user} />
    </div>
  );
}
