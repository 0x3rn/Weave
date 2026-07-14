"use client";

import { useState, useEffect } from "react";
import { MarketplaceRequest, MarketplaceFilters as MarketplaceFiltersType } from "@/types";
import { MarketplaceFilters } from "./marketplace-filters";
import { MarketplaceFeed } from "./marketplace-feed";
import { Search, Plus, Sparkles, LayoutGrid, Users, Bookmark, Briefcase } from "lucide-react";
import Link from "next/link";
import { getMarketplaceData } from "@/app/actions/marketplace";

interface MarketplaceClientProps {
  initialRequests: MarketplaceRequest[];
  initialProfessionals: any[];
  stats: {
    openRequests: number;
    professionalsAvailable: number;
    newToday: number;
    recommendedMatches: number;
  };
  initialSavedItems?: { id: string; type: string }[];
  appliedRequestIds?: string[];
}

export function MarketplaceClient({ initialRequests, initialProfessionals, stats, initialSavedItems = [], appliedRequestIds = [] }: MarketplaceClientProps) {
  const [activeTab, setActiveTab] = useState("Recommended");
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<Partial<MarketplaceFiltersType>>({});
  const [savedItemIds, setSavedItemIds] = useState<string[]>(initialSavedItems.map(s => s.id));
  const [rawRequests, setRawRequests] = useState(initialRequests);
  const [rawProfessionals, setRawProfessionals] = useState(initialProfessionals);
  const [requests, setRequests] = useState(initialRequests);
  const [professionals, setProfessionals] = useState(initialProfessionals);
  const [isSearching, setIsSearching] = useState(false);

  const handleFilterChange = (key: keyof MarketplaceFiltersType, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleClearFilters = () => {
    setFilters({});
  };

  const handleToggleSave = (id: string, isSaved: boolean) => {
    if (isSaved) {
      setSavedItemIds(prev => [...prev, id]);
    } else {
      setSavedItemIds(prev => prev.filter(item => item !== id));
    }
  };

  // Client-side filtering for near-instant updates
  useEffect(() => {
    let currentRequests = [...rawRequests];
    let currentProfessionals = [...rawProfessionals];

    if (filters.category && filters.category.length > 0) {
      currentRequests = currentRequests.filter(r => filters.category!.includes(r.category));
    }
    
    if (filters.exchangeType && filters.exchangeType !== "All") {
      if (filters.exchangeType === "Mutual") {
        currentRequests = currentRequests.filter(r => !!r.isMutual);
      } else if (filters.exchangeType === "Standard") {
        currentRequests = currentRequests.filter(r => !r.isMutual);
      }
    }

    if (filters.verifiedOnly) {
      currentRequests = currentRequests.filter(r => r.requesterVerification === true);
    }
    
    if (filters.minTrustScore) {
      currentRequests = currentRequests.filter(r => (r.requesterTrustScore || 0) >= filters.minTrustScore!);
      currentProfessionals = currentProfessionals.filter(p => (p.trustScore || 0) >= filters.minTrustScore!);
    }

    if (filters.minRating && filters.minRating !== "Any" && filters.minRating !== "") {
      const minR = parseFloat(filters.minRating);
      currentProfessionals = currentProfessionals.filter(p => (p.rating || 0) >= minR);
    }

    setRequests(currentRequests);
    setProfessionals(currentProfessionals);
  }, [filters, rawRequests, rawProfessionals]);

  const TABS = [
    { id: "Recommended", icon: Sparkles },
    { id: "Requests", icon: Briefcase },
    { id: "Professionals", icon: Users },
    { id: "Saved", icon: Bookmark },
  ];

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSearching(true);
    
    const result = await getMarketplaceData({}, searchQuery); // Always fetch unfiltered base on search
    
    if (result.success) {
      setRawRequests(result.requests || []);
      setRawProfessionals(result.professionals || []);
    }
    
    setIsSearching(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-12">
        <div className="max-w-2xl">
          <h1 className="text-4xl sm:text-5xl font-bold text-heading tracking-tight mb-4">
            Marketplace
          </h1>
          <p className="text-xl text-muted font-medium">
            Discover talented professionals, post collaboration requests, and exchange skills through Skill Hours.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href="/marketplace/create" className="px-6 py-3 bg-primary hover:bg-primary-hover text-background font-bold rounded-[var(--radius-button)] shadow-[0_0_20px_rgba(88,199,109,0.3)] transition-all flex items-center gap-2">
            <Plus className="w-5 h-5" /> Post Request
          </Link>
          <button onClick={() => setActiveTab("Professionals")} className="px-6 py-3 bg-background hover:bg-surface-secondary border border-border text-heading font-bold rounded-[var(--radius-button)] shadow-subtle transition-all">
            Browse Professionals
          </button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {[
          { label: "Open Requests", value: stats.openRequests, desc: "Projects seeking collaborators" },
          { label: "Professionals Available", value: stats.professionalsAvailable, desc: "Members open to exchanges" },
          { label: "New Today", value: stats.newToday, desc: "Requests posted in last 24h" },
          { label: "Recommended Matches", value: stats.recommendedMatches, desc: "Based on your profile" },
        ].map((stat, idx) => (
          <div key={idx} className="bg-background border border-border rounded-[var(--radius-card)] p-5 shadow-subtle flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-muted uppercase tracking-wider">{stat.label}</h3>
              <div className="text-3xl font-black text-primary">{stat.value}</div>
            </div>
            <p className="text-xs text-muted font-medium">{stat.desc}</p>
          </div>
        ))}
      </div>

      {/* Search Bar */}
      <div className="mb-10 relative">
        <form onSubmit={handleSearch} className="relative flex items-center">
          <Search className="absolute left-6 w-6 h-6 text-muted" />
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by skill, project, technology, profession, or keyword..." 
            className="w-full h-16 pl-16 pr-32 bg-background border-2 border-border focus:border-primary rounded-[var(--radius-card)] text-lg text-heading placeholder:text-muted/60 shadow-subtle transition-all outline-none"
          />
          <button 
            type="submit" 
            disabled={isSearching}
            className="absolute right-3 px-6 py-2.5 bg-primary border border-border hover:bg-primary-hover text-surface font-bold rounded-[var(--radius-button)] transition-colors shadow-subtle disabled:opacity-50"
          >
            {isSearching ? "Searching..." : "Search"}
          </button>
        </form>
        <div className="flex gap-2 mt-4 px-2 overflow-x-auto pb-2 scrollbar-none">
          <span className="text-sm font-bold text-muted mr-2 flex items-center shrink-0">Examples:</span>
          {["React", "Logo Design", "Copywriting", "Mobile App", "Brand Identity"].map(tag => (
            <button key={tag} onClick={() => setSearchQuery(tag)} className="px-3 py-1 bg-surface border border-border hover:border-primary text-xs font-bold text-heading rounded-full shrink-0 transition-colors whitespace-nowrap">
              {tag}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        
        {/* Filters Sidebar */}
        <div className="lg:col-span-3 xl:col-span-3">
          <div className="sticky top-6">
            <MarketplaceFilters 
              filters={filters} 
              onChange={handleFilterChange} 
              onClear={handleClearFilters} 
            />
          </div>
        </div>
        
        {/* Main Content Area */}
        <div className="lg:col-span-9 xl:col-span-9">
          
          {/* Tabs */}
          <div className="flex overflow-x-auto scrollbar-none gap-2 mb-8 bg-background p-2 border border-border rounded-xl shadow-subtle">
            {TABS.map(tab => (
              <button 
                key={tab.id} 
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-bold text-sm transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-background shadow text-heading border border-border' : 'text-muted hover:bg-surface-secondary hover:text-heading'}`}
              >
                <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-primary' : ''}`} /> {tab.id}
              </button>
            ))}
          </div>
          
          {/* Feed */}
          <MarketplaceFeed 
            activeTab={activeTab} 
            requests={requests} 
            professionals={professionals} 
            savedItemIds={savedItemIds}
            appliedRequestIds={appliedRequestIds}
            onToggleSave={handleToggleSave}
          />
          
        </div>
      </div>

    </div>
  );
}
