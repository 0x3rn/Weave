import { getMarketplaceRequest } from "@/app/actions/marketplace";
import { getCurrentUserId } from "@/app/actions/user";
import { redirect, notFound } from "next/navigation";
import ApplyClient from "@/components/marketplace/apply-client";
import { db } from "@/lib/firebase-admin";

export const metadata = {
  title: "Apply for Exchange | Weave",
};

export default async function ApplyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const userId = await getCurrentUserId();

  if (!userId) {
    redirect("/api/auth/logout");
  }

  // Fetch the request using the helper to get live trust score
  const result = await getMarketplaceRequest(id);
  
  if (!result.success || !result.request) {
    notFound();
  }

  const request = result.request;

  // Ensure request is open
  if (request.status !== "open") {
    redirect(`/marketplace/${id}`);
  }

  // Ensure user is not the requester
  if (request.requesterId === userId) {
    redirect(`/marketplace/${id}`);
  }

  // Check if already applied
  const existingApp = await db.collection("marketplace_applications")
    .where("requestId", "==", id)
    .where("applicantId", "==", userId)
    .limit(1)
    .get();

  if (!existingApp.empty) {
    // Already applied, redirect to dashboard or request page
    redirect(`/marketplace/${id}`);
  }

  return <ApplyClient request={request} />;
}
