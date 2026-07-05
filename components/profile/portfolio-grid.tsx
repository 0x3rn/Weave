"use client";

import { PortfolioItem } from "@/types";
import { ExternalLink, Image as ImageIcon, Trash2, Loader2 } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { deletePortfolioItem } from "@/app/actions/portfolio";
import PortfolioModal from "./portfolio-modal";
import { SkillIcon } from "./skill-icon";

interface PortfolioGridProps {
  portfolio: PortfolioItem[];
  isOwner: boolean;
}

export default function PortfolioGrid({ portfolio, isOwner }: PortfolioGridProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [viewProject, setViewProject] = useState<PortfolioItem | null>(null);

  const handleDelete = async (id: string, imageURL?: string) => {
    if (!confirm("Are you sure you want to delete this project?")) return;
    
    try {
      setDeletingId(id);
      await deletePortfolioItem(id, imageURL);
    } catch (err) {
      console.error(err);
      alert("Failed to delete project.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <section>
      <div className="flex items-center justify-between mb-6 border-b border-border pb-2">
        <h2 className="text-2xl font-bold text-heading">Portfolio</h2>
        {isOwner && (
          <button 
            onClick={() => setIsModalOpen(true)}
            className="text-sm font-bold text-primary hover:text-primary-hover transition-colors"
          >
            + Add Project
          </button>
        )}
      </div>

      {portfolio.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {portfolio.map((item) => (
            <div key={item.id} className="bg-background border border-border rounded-[var(--radius-card)] overflow-hidden group shadow-subtle flex flex-col relative">
              
              {/* Owner Actions */}
              {isOwner && (
                <button 
                  onClick={() => handleDelete(item.id, item.imageURL)}
                  disabled={deletingId === item.id}
                  className="absolute top-2 right-2 z-20 bg-background/80 backdrop-blur text-muted hover:text-error hover:bg-error/10 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all disabled:opacity-50"
                  title="Delete Project"
                >
                  {deletingId === item.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </button>
              )}

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
                
                <div className="flex flex-wrap gap-2 mb-5">
                  {item.technologies.map(tech => (
                    <span key={tech} className="text-xs font-medium text-muted bg-surface-secondary px-2 py-1 rounded-[var(--radius-badge)] border border-border flex items-center gap-1.5">
                      <SkillIcon skill={tech} className="w-3 h-3 text-muted" />
                      {tech}
                    </span>
                  ))}
                </div>

                <div className="mt-auto pt-4 border-t border-border flex flex-wrap items-center gap-3">
                  <button 
                    onClick={() => setViewProject(item)}
                    className="flex-1 text-center py-2 bg-surface-secondary hover:bg-border text-heading text-sm font-bold rounded-[var(--radius-button)] transition-colors"
                  >
                    View Details
                  </button>
                  {item.link && (
                    <a 
                      href={item.link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex-1 text-center py-2 bg-primary text-surface text-sm font-bold rounded-[var(--radius-button)] hover:bg-primary-hover transition-colors"
                    >
                      Visit Site
                    </a>
                  )}
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
            <button 
              onClick={() => setIsModalOpen(true)}
              className="px-6 py-2.5 bg-primary text-surface font-bold text-sm rounded-[var(--radius-button)] hover:bg-primary-hover transition-colors shadow-subtle"
            >
              Upload Project
            </button>
          )}
        </div>
      )}

      {/* Add Project Modal */}
      {isOwner && (
        <PortfolioModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
        />
      )}

      {/* View Details Modal */}
      {viewProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-surface border border-border rounded-[var(--radius-card)] w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <button 
              onClick={() => setViewProject(null)}
              className="absolute top-4 right-4 z-10 bg-background/80 backdrop-blur text-muted hover:text-heading p-2 rounded-full transition-colors"
            >
              <Trash2 className="w-5 h-5 hidden" /> {/* Dummy to keep imports clean */}
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
            
            <div className="w-full aspect-video bg-surface-secondary relative flex items-center justify-center border-b border-border">
              {viewProject.imageURL ? (
                <Image 
                  src={viewProject.imageURL} 
                  alt={viewProject.title} 
                  fill 
                  className="object-contain"
                />
              ) : (
                <ImageIcon className="w-16 h-16 text-muted/50" />
              )}
            </div>
            
            <div className="p-6 sm:p-8 space-y-6">
              <div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-heading mb-2">{viewProject.title}</h2>
                <div className="flex flex-wrap gap-2 mb-6">
                  {viewProject.technologies.map(tech => (
                    <span key={tech} className="text-xs font-medium text-muted bg-surface-secondary px-2.5 py-1 rounded-[var(--radius-badge)] border border-border flex items-center gap-1.5">
                      <SkillIcon skill={tech} className="w-3.5 h-3.5 text-muted" />
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-bold text-heading uppercase tracking-wider mb-2">About Project</h3>
                <p className="text-body whitespace-pre-wrap leading-relaxed">{viewProject.description}</p>
              </div>
              
              {viewProject.link && (
                <div className="pt-6 border-t border-border">
                  <a 
                    href={viewProject.link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-primary text-surface font-bold rounded-[var(--radius-button)] hover:bg-primary-hover transition-colors shadow-subtle w-full sm:w-auto"
                  >
                    Visit Live Site <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
