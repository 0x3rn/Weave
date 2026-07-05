"use client";

import { PortfolioItem } from "@/types";
import { ExternalLink, Image as ImageIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface PortfolioGridProps {
  portfolio: PortfolioItem[];
  isOwner: boolean;
}

export default function PortfolioGrid({ portfolio, isOwner }: PortfolioGridProps) {
  return (
    <section>
      <div className="flex items-center justify-between mb-6 border-b border-border pb-2">
        <h2 className="text-2xl font-bold text-heading">Portfolio</h2>
        {isOwner && (
          <button className="text-sm font-bold text-primary hover:text-primary-hover transition-colors">
            + Add Project
          </button>
        )}
      </div>

      {portfolio.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {portfolio.map((item) => (
            <div key={item.id} className="bg-surface border border-border rounded-[var(--radius-card)] overflow-hidden group shadow-subtle flex flex-col">
              {/* Image Container */}
              <div className="relative w-full aspect-video bg-surface-secondary border-b border-border flex items-center justify-center overflow-hidden">
                {item.imageURL ? (
                  <Image 
                    src={item.imageURL} 
                    alt={item.title} 
                    fill 
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <ImageIcon className="w-10 h-10 text-muted/50" />
                )}
                
                {/* Overlay Link */}
                {item.link && (
                  <a 
                    href={item.link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="absolute inset-0 bg-background/0 group-hover:bg-background/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100"
                  >
                    <span className="flex items-center gap-2 bg-surface text-heading text-sm font-bold px-4 py-2 rounded-full shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-all">
                      Open Project <ExternalLink className="w-4 h-4" />
                    </span>
                  </a>
                )}
              </div>

              {/* Content */}
              <div className="p-5 flex-1 flex flex-col">
                <h3 className="font-bold text-heading text-lg mb-2">{item.title}</h3>
                <p className="text-sm text-body line-clamp-2 mb-4 flex-1">{item.description}</p>
                
                <div className="flex flex-wrap gap-2 mt-auto">
                  {item.technologies.map(tech => (
                    <span key={tech} className="text-xs font-medium text-muted bg-surface-secondary px-2 py-1 rounded-[var(--radius-badge)] border border-border">
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-surface-secondary border border-dashed border-border rounded-[var(--radius-card)] p-12 text-center flex flex-col items-center justify-center">
          <ImageIcon className="w-12 h-12 text-muted mb-4" />
          <h3 className="text-lg font-bold text-heading mb-2">No Portfolio</h3>
          <p className="text-body text-sm max-w-md mx-auto mb-6">
            {isOwner 
              ? "Showcase your best work to build trust with potential collaborators." 
              : "This user hasn't uploaded any portfolio projects yet."}
          </p>
          {isOwner && (
            <button className="px-6 py-2.5 bg-primary text-surface font-bold text-sm rounded-[var(--radius-button)] hover:bg-primary-hover transition-colors shadow-subtle">
              Upload Project
            </button>
          )}
        </div>
      )}
    </section>
  );
}
