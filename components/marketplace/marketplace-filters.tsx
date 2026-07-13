"use client";

import { useState } from "react";
import { Filter, Star, ShieldCheck, ChevronDown, ChevronUp } from "lucide-react";

import { MarketplaceFilters as MarketplaceFiltersType } from "@/types";

interface MarketplaceFiltersProps {
  filters: Partial<MarketplaceFiltersType>;
  onChange: (key: keyof MarketplaceFiltersType, value: any) => void;
  onClear: () => void;
}

export function MarketplaceFilters({ filters, onChange, onClear }: MarketplaceFiltersProps) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    category: true,
    skills: true,
    trustScore: true,
  });

  const toggleSection = (section: string) => {
    setExpanded(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const CATEGORIES = ["Development", "Design", "Marketing", "Writing", "Video", "Product", "Business", "Data", "AI", "Other"];

  return (
    <div className="bg-background border border-border rounded-[var(--radius-card)] shadow-subtle overflow-hidden">
      <div className="p-4 border-b border-border bg-background flex items-center justify-between">
        <h3 className="font-bold text-heading flex items-center gap-2">
          <Filter className="w-4 h-4" /> Filters
        </h3>
        <button onClick={onClear} className="text-xs font-bold text-primary hover:underline">Clear All</button>
      </div>

      <div className="divide-y divide-border">
        
        {/* Exchange Type */}
        <div className="p-5">
          <h4 className="font-bold text-heading text-sm mb-3">Exchange Type</h4>
          <div className="flex gap-2">
            {[
              { label: "All", val: "All" },
              { label: "Mutual", val: "Mutual" },
              { label: "Standard", val: "Standard" }
            ].map(type => (
              <button 
                key={type.label} 
                onClick={() => onChange("exchangeType", type.val)}
                className={`flex flex-1 items-center justify-center gap-0.5 py-1.5 border rounded-md text-xs font-bold transition-colors ${filters.exchangeType === type.val || (!filters.exchangeType && type.val === "All") ? "border-primary text-primary bg-primary/5" : "border-border text-heading bg-background hover:border-primary hover:text-primary"}`}
              >
                {type.label}
              </button>
            ))}
          </div>
        </div>

        {/* Verification & Trust */}
        <div className="p-5">
          <label className="flex items-center gap-3 cursor-pointer group">
            <div className="relative flex items-center justify-center">
              <input 
                type="checkbox" 
                checked={!!filters.verifiedOnly}
                onChange={(e) => onChange("verifiedOnly", e.target.checked)}
                className="peer appearance-none w-5 h-5 border-2 border-border rounded bg-background checked:bg-primary checked:border-primary transition-colors cursor-pointer" 
              />
              <ShieldCheck className="w-3.5 h-3.5 text-background absolute opacity-0 peer-checked:opacity-100 pointer-events-none" />
            </div>
            <span className="text-sm font-semibold text-heading group-hover:text-primary transition-colors">Verified Members Only</span>
          </label>
        </div>

        {/* Category */}
        <div className="p-5">
          <button onClick={() => toggleSection("category")} className="flex items-center justify-between w-full mb-3 group">
            <h4 className="font-bold text-heading text-sm group-hover:text-primary transition-colors">Category</h4>
            {expanded.category ? <ChevronUp className="w-4 h-4 text-muted" /> : <ChevronDown className="w-4 h-4 text-muted" />}
          </button>
          
          {expanded.category && (
            <div className="space-y-2.5">
              {CATEGORIES.map(cat => (
                <label key={cat} className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative flex items-center justify-center shrink-0">
                    <input 
                      type="checkbox" 
                      checked={(filters.category || []).includes(cat)}
                      onChange={(e) => {
                        const current = filters.category || [];
                        if (e.target.checked) {
                          onChange("category", [...current, cat]);
                        } else {
                          onChange("category", current.filter(c => c !== cat));
                        }
                      }}
                      className="peer appearance-none w-4 h-4 border-2 border-border rounded bg-background checked:bg-primary checked:border-primary transition-colors cursor-pointer" 
                    />
                    <svg className="w-2.5 h-2.5 text-background absolute opacity-0 peer-checked:opacity-100 pointer-events-none" viewBox="0 0 14 14" fill="none">
                      <path d="M2.5 7.5L5.5 10.5L11.5 3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-body group-hover:text-heading transition-colors">{cat}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Trust Score */}
        <div className="p-5">
          <button onClick={() => toggleSection("trustScore")} className="flex items-center justify-between w-full mb-4 group">
            <h4 className="font-bold text-heading text-sm group-hover:text-primary transition-colors">Min. Trust Score</h4>
            {expanded.trustScore ? <ChevronUp className="w-4 h-4 text-muted" /> : <ChevronDown className="w-4 h-4 text-muted" />}
          </button>
          
          {expanded.trustScore && (
            <div className="px-2 pb-2">
              <input 
                type="range" 
                min="50" max="100" 
                value={filters.minTrustScore || 50} 
                onChange={(e) => onChange("minTrustScore", parseInt(e.target.value))}
                className="w-full accent-primary" 
              />
              <div className="flex justify-between text-xs font-bold text-muted mt-2">
                <span>50</span>
                <span className="text-primary">{filters.minTrustScore || 50}</span>
                <span>100</span>
              </div>
            </div>
          )}
        </div>

        {/* Rating */}
        <div className="p-5">
          <h4 className="font-bold text-heading text-sm mb-3">Minimum Rating</h4>
          <div className="flex gap-2">
            {[
              { label: "Any", val: "" },
              { label: "4", val: "4" },
              { label: "4.5", val: "4.5" },
              { label: "5", val: "5" }
            ].map(rating => (
              <button 
                key={rating.label} 
                onClick={() => onChange("minRating", rating.val)}
                className={`flex flex-1 items-center justify-center gap-0.5 py-1.5 border rounded-md text-xs font-bold transition-colors ${filters.minRating === rating.val ? "border-primary text-primary bg-primary/5" : "border-border text-heading bg-background hover:border-primary hover:text-primary"}`}
              >
                {rating.label} {rating.val !== "" && <Star className="w-3 h-3 fill-warning text-warning" />}
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
