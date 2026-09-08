import { getCurrentUserId } from "@/app/actions/user";
import { redirect } from "next/navigation";
import CreateRequestClient from "@/components/marketplace/create-request-client";
import { getUserById } from "@/lib/users";

export default async function CreateMarketplaceRequestPage() {
  const userId = await getCurrentUserId();
  
  if (!userId) {
    redirect("/api/auth/logout");
  }

  const user = await getUserById(userId);
  const userBalance = user?.skillHours || 0;

  return (
    <div className="container mx-auto px-4">
      <CreateRequestClient userBalance={userBalance} />
    </div>
  );
}
