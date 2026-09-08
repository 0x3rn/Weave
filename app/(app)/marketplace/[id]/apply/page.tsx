import { getMarketplaceRequest } from "@/app/actions/marketplace";
import { getCurrentUserId } from "@/app/actions/user";
import { redirect, notFound } from "next/navigation";
import ApplyClient from "@/components/marketplace/apply-client";
import { sql } from "@/lib/neon";

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
  const [existingApp] = await sql.query("select id from marketplace_applications where request_id=$1 and applicant_id=$2 limit 1", [id, userId]);
  if (existingApp) {
    // Already applied, redirect to dashboard or request page
    redirect(`/marketplace/${id}`);
  }

  return <ApplyClient request={request} />;
}
