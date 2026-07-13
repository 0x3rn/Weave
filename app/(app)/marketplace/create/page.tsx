import { getCurrentUserId } from "@/app/actions/user";
import { redirect } from "next/navigation";
import CreateRequestClient from "@/components/marketplace/create-request-client";

export default async function CreateMarketplaceRequestPage() {
  const userId = await getCurrentUserId();
  
  if (!userId) {
    redirect("/api/auth/logout");
  }

  return (
    <div className="container mx-auto px-4">
      <CreateRequestClient />
    </div>
  );
}
