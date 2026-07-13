import { getApplicationsForRequest } from "@/app/actions/applications";
import { getCurrentUserId } from "@/app/actions/user";
import { redirect, notFound } from "next/navigation";
import ApplicationsClient from "@/components/dashboard/applications-client";
import Link from "next/link";
import { ArrowLeft, Edit, ExternalLink } from "lucide-react";

export const metadata = {
  title: "Request Applications | Weave Dashboard",
};

export default async function RequestApplicationsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const userId = await getCurrentUserId();

  if (!userId) {
    redirect("/api/auth/logout");
  }

  const result = await getApplicationsForRequest(id);

  if (!result.success) {
    if (result.error === "Request not found") {
      notFound();
    }
    if (result.error === "You can only view applications for your own requests") {
      redirect("/dashboard");
    }
    
    // Generic error
    return (
      <div className="p-8 text-center bg-surface border border-border rounded-xl">
        <p className="text-error font-medium">{result.error}</p>
      </div>
    );
  }

  const { applications, request } = result;

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <Link href="/dashboard" className="inline-flex items-center text-sm font-medium text-muted hover:text-primary transition-colors mb-2">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Dashboard
          </Link>
          <h1 className="text-2xl font-bold text-heading flex items-center gap-3">
            {request.title}
            <span className={`text-xs px-2.5 py-1 rounded-full uppercase tracking-wider font-bold ${
              request.status === 'open' ? 'bg-primary/10 text-primary' :
              request.status === 'in_progress' ? 'bg-blue-500/10 text-blue-500' :
              request.status === 'completed' ? 'bg-success/10 text-success' :
              'bg-secondary text-muted'
            }`}>
              {request.status.replace("_", " ")}
            </span>
          </h1>
        </div>
        
        <div className="flex items-center gap-3">
          <Link 
            href={`/marketplace/${request.id}`}
            target="_blank"
            className="px-4 py-2 bg-surface-secondary border border-border text-heading rounded-[var(--radius-button)] font-medium hover:bg-border/50 transition-colors flex items-center gap-2 text-sm"
          >
            <ExternalLink className="w-4 h-4" /> View Live
          </Link>
          <Link 
            href={`/marketplace/${request.id}/edit`}
            className="px-4 py-2 bg-surface-secondary border border-border text-heading rounded-[var(--radius-button)] font-medium hover:bg-border/50 transition-colors flex items-center gap-2 text-sm"
          >
            <Edit className="w-4 h-4" /> Edit Request
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <ApplicationsClient request={request} initialApplications={applications} />
      
    </div>
  );
}
