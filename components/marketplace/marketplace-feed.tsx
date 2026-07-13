import { MarketplaceRequest } from "@/types";
import { RequestCard } from "./request-card";
import { ProfessionalCard } from "./professional-card";
import { Sparkles, SearchX, Bookmark } from "lucide-react";

interface MarketplaceFeedProps {
  activeTab: string;
  requests: MarketplaceRequest[];
  professionals: any[];
  savedItemIds?: string[];
  appliedRequestIds?: string[];
  onToggleSave?: (id: string, isSaved: boolean) => void;
}

export function MarketplaceFeed({ activeTab, requests, professionals, savedItemIds = [], appliedRequestIds = [], onToggleSave }: MarketplaceFeedProps) {
  
  if (activeTab === "Requests") {
    if (requests.length === 0) {
      return (
        <div className="bg-surface border border-border rounded-[var(--radius-card)] p-16 text-center shadow-subtle">
          <div className="w-20 h-20 bg-surface-secondary border border-border rounded-full flex items-center justify-center mx-auto mb-6">
            <SearchX className="w-8 h-8 text-muted" />
          </div>
          <h3 className="text-xl font-bold text-heading mb-2">No matching requests found</h3>
          <p className="text-muted max-w-sm mx-auto mb-6">Try adjusting your filters, searching for a different skill, or broadening your categories.</p>
          <button className="px-6 py-2.5 bg-background border border-border hover:bg-surface-secondary font-bold text-heading rounded-[var(--radius-button)] transition-colors shadow-subtle">
            Clear Filters
          </button>
        </div>
      );
    }
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {requests.map(req => (
          <RequestCard 
            key={req.id} 
            request={req} 
            isSavedInitial={savedItemIds.includes(req.id)} 
            isApplied={appliedRequestIds.includes(req.id)}
            onToggleSave={onToggleSave} 
          />
        ))}
      </div>
    );
  }

  if (activeTab === "Professionals") {
    if (professionals.length === 0) {
      return (
        <div className="bg-surface border border-border rounded-[var(--radius-card)] p-16 text-center shadow-subtle">
          <div className="w-20 h-20 bg-surface-secondary border border-border rounded-full flex items-center justify-center mx-auto mb-6">
            <SearchX className="w-8 h-8 text-muted" />
          </div>
          <h3 className="text-xl font-bold text-heading mb-2">No professionals found</h3>
          <p className="text-muted max-w-sm mx-auto">Try adjusting your filters to find the right collaborator.</p>
        </div>
      );
    }
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {professionals.map(pro => (
          <ProfessionalCard key={pro.id} professional={pro} isSavedInitial={savedItemIds.includes(pro.id)} onToggleSave={onToggleSave} />
        ))}
      </div>
    );
  }
  if (activeTab === "Saved") {
    const savedRequests = requests.filter(r => savedItemIds.includes(r.id));
    const savedProfessionals = professionals.filter(p => savedItemIds.includes(p.id));

    if (savedRequests.length === 0 && savedProfessionals.length === 0) {
      return (
        <div className="text-center py-24 text-muted">
          <Bookmark className="w-12 h-12 mx-auto mb-4 opacity-20" />
          <h3 className="text-lg font-bold text-heading mb-2">No Saved Items</h3>
          <p>You haven't saved any requests or professionals yet.</p>
        </div>
      );
    }

    return (
      <div className="space-y-12">
        {savedRequests.length > 0 && (
          <div>
            <h3 className="font-bold text-heading text-xl mb-6">Saved Requests</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {savedRequests.map(req => (
                <RequestCard key={req.id} request={req} isSavedInitial={true} isApplied={appliedRequestIds.includes(req.id)} onToggleSave={onToggleSave} />
              ))}
            </div>
          </div>
        )}
        {savedProfessionals.length > 0 && (
          <div>
            <h3 className="font-bold text-heading text-xl mb-6">Saved Professionals</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {savedProfessionals.map(pro => (
                <ProfessionalCard key={pro.id} professional={pro} isSavedInitial={true} onToggleSave={onToggleSave} />
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Recommended Tab
  return (
    <div className="space-y-12">

      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
          <h3 className="font-bold text-heading text-xl">Recommended Requests</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {requests.slice(0, 2).map(req => (
            <RequestCard key={req.id} request={req} isSavedInitial={savedItemIds.includes(req.id)} isApplied={appliedRequestIds.includes(req.id)} onToggleSave={onToggleSave} />
          ))}
        </div>
      </div>

      <div className="pt-4 border-t border-border">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
          <h3 className="font-bold text-heading text-xl">Professionals You Might Click With</h3>
        </div>
        {/* Changed to 2 columns max for better spacing */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {professionals.slice(0, 2).map(pro => (
            <ProfessionalCard key={pro.id} professional={pro} isSavedInitial={savedItemIds.includes(pro.id)} onToggleSave={onToggleSave} />
          ))}
        </div>
      </div>
    </div>
  );
}
