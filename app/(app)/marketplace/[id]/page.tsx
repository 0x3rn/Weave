import { getMarketplaceRequest } from "@/app/actions/marketplace";
import { BadgeCheck, Clock, MapPin, CheckCircle, ChevronLeft, Calendar } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SkillIcon } from "@/components/profile/skill-icon";
import { getCurrentUserId } from "@/app/actions/user";
import { db } from "@/lib/firebase-admin";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await getMarketplaceRequest(id);
  if (!result.success || !result.request) {
    return { title: "Request Not Found - Weave" };
  }
  return {
    title: `${result.request.title} - Weave Marketplace`,
    description: result.request.description,
  };
}

export default async function RequestDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await getMarketplaceRequest(id);
  
  if (!result.success || !result.request) {
    notFound();
  }
  
  const req = result.request;
  const userId = await getCurrentUserId();
  
  let hasApplied = false;
  if (userId && db) {
    const existingApp = await db.collection("marketplace_applications")
      .where("requestId", "==", req.id)
      .where("applicantId", "==", userId)
      .limit(1)
      .get();
    hasApplied = !existingApp.empty;
  }
  
  const isOwner = userId === req.requesterId;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Link href="/marketplace" className="inline-flex items-center gap-2 text-sm font-bold text-muted hover:text-primary transition-colors mb-8">
        <ChevronLeft className="w-4 h-4" /> Back to Marketplace
      </Link>

      <div className="bg-surface border border-border rounded-[var(--radius-card)] shadow-subtle overflow-hidden">
        {/* Hero Section */}
        <div className="p-8 border-b border-border bg-gradient-to-br from-surface to-surface-secondary">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary font-bold text-xs uppercase tracking-wider mb-4 border border-primary/20">
                {req.category}
              </div>
              <h1 className="text-3xl font-black text-heading leading-tight mb-4">{req.title}</h1>
              
              <div className="flex items-center gap-4 text-sm font-medium text-body">
                <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-muted" /> Posted {new Date(req.createdAt).toLocaleDateString()}</span>
                <span>•</span>
                <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4 text-muted" /> {req.timeline}</span>
              </div>
            </div>
            
            <div className="flex-shrink-0 bg-background p-4 rounded-xl border border-border flex flex-col items-center min-w-[200px] shadow-sm">
              <div className="w-16 h-16 rounded-full bg-surface-secondary border border-border flex items-center justify-center overflow-hidden mb-3">
                {req.requesterAvatar ? (
                  <img src={req.requesterAvatar} alt={req.requesterName} className="w-full h-full object-cover" />
                ) : (
                  <span className="font-bold text-xl text-heading">{req.requesterName.charAt(0)}</span>
                )}
              </div>
              <div className="text-center">
                <div className="font-bold text-heading">
                  {req.requesterName.split(" ").slice(0, -1).join(" ")}
                  {req.requesterName.split(" ").length > 1 ? " " : ""}
                  <span className="whitespace-nowrap">
                    {req.requesterName.split(" ").slice(-1)[0]}
                    {req.requesterVerification && <BadgeCheck className="inline-block w-4 h-4 text-primary fill-primary/10 ml-1 align-[-0.15em]" />}
                  </span>
                </div>
                <div className="text-xs text-muted font-bold mt-1">
                  Trust Score: <span className="text-success text-sm">{req.requesterTrustScore}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            
            <div className="md:col-span-2 space-y-10">
              <section>
                <h2 className="text-xl font-bold text-heading mb-4">Project Overview</h2>
                <div className="prose prose-sm dark:prose-invert max-w-none text-body leading-relaxed whitespace-pre-wrap">
                  {req.description}
                </div>
              </section>

              <section>
                <h2 className="text-xl font-bold text-heading mb-4">Deliverables</h2>
                <ul className="space-y-3">
                  {req.deliverables.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-body">
                      <CheckCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </section>

              <section className="bg-surface-secondary border border-border p-6 rounded-xl text-center">
                {isOwner ? (
                  <div>
                    <h2 className="text-xl font-bold text-heading mb-2">Your Request</h2>
                    <p className="text-muted mb-4">You can manage applications for this request from your dashboard.</p>
                    <div className="flex flex-col gap-3">
                      <Link href={`/dashboard/requests/${req.id}`} className="inline-block w-full py-3 bg-secondary hover:bg-secondary/80 text-heading font-bold rounded-lg transition-colors">
                        View Applications
                      </Link>
                      {req.applicantsCount === 0 && (
                        <Link href={`/marketplace/${req.id}/edit`} className="inline-block w-full py-3 bg-background border border-border hover:bg-surface-secondary text-heading font-bold rounded-lg transition-colors">
                          Edit Request
                        </Link>
                      )}
                    </div>
                  </div>
                ) : hasApplied ? (
                  <div>
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                      <CheckCircle className="w-6 h-6 text-primary" />
                    </div>
                    <h2 className="text-xl font-bold text-heading mb-2">Application Submitted</h2>
                    <p className="text-muted mb-4">You have already applied for this exchange. The requester will be in touch if it's a match.</p>
                  </div>
                ) : req.status !== "open" ? (
                  <div>
                    <h2 className="text-xl font-bold text-heading mb-2">Request Closed</h2>
                    <p className="text-muted">This request is no longer accepting applications.</p>
                  </div>
                ) : (
                  <div>
                    <h2 className="text-xl font-bold text-heading mb-4">Interested in this project?</h2>
                    <Link href={`/marketplace/${req.id}/apply`} className="inline-flex justify-center items-center w-full py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-lg transition-colors shadow-[0_0_15px_rgba(88,199,109,0.3)]">
                      Apply for Exchange
                    </Link>
                  </div>
                )}
              </section>
            </div>

            <div className="space-y-8">
              <div>
                <h3 className="text-xs font-bold text-muted uppercase tracking-wider mb-3">Skills Required</h3>
                <div className="flex flex-wrap gap-2">
                  {req.skillsRequired.map((skill, idx) => (
                    <span key={idx} className="px-3 py-1.5 bg-surface-secondary border border-border text-sm font-medium text-heading rounded-md flex items-center gap-1.5">
                      <SkillIcon skill={skill} className="w-4 h-4" />
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-xs font-bold text-muted uppercase tracking-wider mb-3">Project Details</h3>
                <div className="space-y-4 bg-surface-secondary p-5 rounded-xl border border-border">
                  <div>
                    <div className="text-xs text-muted mb-1">Estimated Effort</div>
                    <div className="font-semibold text-heading">{req.estimatedHours}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted mb-1">Experience Level</div>
                    <div className="font-semibold text-heading">{req.preferredExperience}</div>
                  </div>
                  {req.preferredTimeZone && (
                    <div>
                      <div className="text-xs text-muted mb-1">Preferred Time Zone</div>
                      <div className="font-semibold text-heading flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-muted" /> {req.preferredTimeZone}
                      </div>
                    </div>
                  )}
                  <div>
                    <div className="text-xs text-muted mb-1">Exchange Type</div>
                    <div className="font-semibold text-heading">{req.exchangeType}</div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
