import { getCurrentUserId } from "@/app/actions/user";
import { redirect } from "next/navigation";
import CreateRequestClient from "@/components/marketplace/create-request-client";
import { db } from "@/lib/firebase-admin";

export default async function CreateMarketplaceRequestPage() {
  const userId = await getCurrentUserId();
  
  if (!userId) {
    redirect("/api/auth/logout");
  }

  let userBalance = 0;
  if (db) {
    const userDoc = await db.collection("users").doc(userId).get();
    if (userDoc.exists) {
      userBalance = userDoc.data()?.skillHours || 0;
    }
  }

  return (
    <div className="container mx-auto px-4">
      <CreateRequestClient userBalance={userBalance} />
    </div>
  );
}
