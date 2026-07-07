import { MarketplaceClient } from "@/components/marketplace/marketplace-client";
import { getMarketplaceData } from "@/app/actions/marketplace";

export const metadata = {
  title: "Marketplace - Weave",
  description: "Discover talented professionals and exchange skills.",
};

export default async function MarketplacePage() {
  const result = await getMarketplaceData();
  
  if (!result.success) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center text-red-500 font-bold p-6 bg-red-500/10 rounded-xl">
          Error loading marketplace data: {result.error}
        </div>
      </div>
    );
  }

  return (
    <MarketplaceClient 
      initialRequests={result.requests || []} 
      initialProfessionals={result.professionals || []} 
      stats={result.stats || {
        openRequests: 0,
        professionalsAvailable: 0,
        newToday: 0,
        recommendedMatches: 0
      }} 
    />
  );
}
