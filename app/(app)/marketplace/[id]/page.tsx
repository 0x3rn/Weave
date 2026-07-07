import { getMarketplaceRequest } from "@/app/actions/marketplace";
import { BadgeCheck, Clock, MapPin, CheckCircle, ChevronLeft, Calendar } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SkillIcon } from "@/components/profile/skill-icon";

export async function generateMetadata({ params }: { params: { id: string } }) {
  const result = await getMarketplaceRequest(params.id);
  if (!result.success || !result.request) {
    return { title: "Request Not Found - Weave" };
  }
  return {
    title: `${result.request.title} - Weave Marketplace`,
    description: result.request.description,
  };
}

export default async function RequestDetailsPage({ params }: { params: { id: string } }) {
  const result = await getMarketplaceRequest(params.id);
  
  if (!result.success || !result.request) {
    notFound();
  }
  
  const req = result.request;

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

              <section className="bg-surface-secondary border border-border p-6 rounded-xl">
                <h2 className="text-xl font-bold text-heading mb-4">Apply for this Request</h2>
                <form className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-heading mb-2">Why are you a good fit?</label>
                    <textarea 
                      className="w-full min-h-[120px] p-4 bg-background border border-border rounded-lg text-body focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all resize-y"
                      placeholder="Describe your relevant experience and how you plan to approach this..."
                    ></textarea>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-heading mb-2">Estimated Skill Hours required</label>
                    <input 
                      type="number"
                      className="w-full p-3 bg-background border border-border rounded-lg text-body focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                      placeholder="e.g. 5"
                    />
                  </div>
                  <button type="button" className="w-full py-3 bg-primary hover:bg-primary-hover text-background font-bold rounded-lg transition-colors shadow-[0_0_15px_rgba(88,199,109,0.3)]">
                    Submit Application
                  </button>
                </form>
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
