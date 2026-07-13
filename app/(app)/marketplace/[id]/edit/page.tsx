import { getMarketplaceRequest } from "@/app/actions/marketplace";
import { getCurrentUserId } from "@/app/actions/user";
import { redirect, notFound } from "next/navigation";
import EditRequestClient from "@/components/marketplace/edit-request-client";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await getMarketplaceRequest(id);
  if (!result.success || !result.request) {
    return { title: "Request Not Found - Weave" };
  }
  return {
    title: `Edit ${result.request.title} - Weave`,
  };
}

export default async function EditMarketplaceRequestPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const userId = await getCurrentUserId();
  
  if (!userId) {
    redirect("/api/auth/logout");
  }

  const result = await getMarketplaceRequest(id);
  
  if (!result.success || !result.request) {
    notFound();
  }

  const req = result.request;

  if (req.requesterId !== userId) {
    redirect(`/marketplace/${id}`);
  }

  if (req.applicantsCount > 0) {
    // Can't edit if there are applicants
    redirect(`/marketplace/${id}`);
  }

  return (
    <div className="container mx-auto px-4">
      <EditRequestClient request={req} />
    </div>
  );
}
