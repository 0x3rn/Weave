"use client";

import { useState, useRef, useEffect } from "react";
import { addPortfolioItem } from "@/app/actions/portfolio";
import { X, Upload, Loader2, Image as ImageIcon } from "lucide-react";

interface PortfolioModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PortfolioModal({ isOpen, onClose }: PortfolioModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewURL, setPreviewURL] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
      // Reset state
      setPreviewURL(null);
      setError(null);
    }
    return () => { document.body.style.overflow = "auto"; };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError("Image must be smaller than 5MB");
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }
      setError(null);
      const url = URL.createObjectURL(file);
      setPreviewURL(url);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const formData = new FormData(e.currentTarget);
      await addPortfolioItem(formData);
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to upload portfolio item. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <div 
        className="bg-surface w-full max-w-xl rounded-[var(--radius-card)] border border-border shadow-strong flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200"
      >
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="text-xl font-bold text-heading">Add Portfolio Project</h2>
          <button 
            onClick={onClose}
            className="text-muted hover:text-heading transition-colors rounded-full p-1 hover:bg-surface-secondary"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto p-5">
          {error && (
            <div className="mb-4 p-3 bg-error/10 border border-error/20 text-error text-sm rounded-md">
              {error}
            </div>
          )}

          <form id="portfolio-form" onSubmit={handleSubmit} className="space-y-5">
            {/* Image Upload */}
            <div>
              <label className="block text-sm font-bold text-heading mb-2">Project Image</label>
              <div 
                className="w-full aspect-video border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center bg-surface-secondary relative overflow-hidden cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                {previewURL ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={previewURL} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center text-muted">
                    <ImageIcon className="w-8 h-8 mb-2 opacity-50" />
                    <span className="text-sm font-medium">Click to upload an image</span>
                    <span className="text-xs opacity-75 mt-1">Recommended: 16:9 ratio, max 5MB</span>
                  </div>
                )}
                <input 
                  type="file" 
                  name="image" 
                  accept="image/jpeg,image/png,image/webp" 
                  className="hidden" 
                  ref={fileInputRef}
                  onChange={handleImageChange}
                />
              </div>
            </div>

            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-bold text-heading mb-2">Project Title *</label>
              <input 
                type="text" 
                id="title" 
                name="title" 
                required 
                maxLength={60}
                placeholder="e.g. E-Commerce Dashboard Design"
                className="w-full bg-background border border-border rounded-[var(--radius-button)] px-4 py-2.5 text-body focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
              />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-bold text-heading mb-2">Description *</label>
              <textarea 
                id="description" 
                name="description" 
                required 
                rows={3}
                maxLength={300}
                placeholder="Briefly describe what you built and your specific role..."
                className="w-full bg-background border border-border rounded-xl px-4 py-3 text-body focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors resize-none"
              />
            </div>

            {/* Technologies */}
            <div>
              <label htmlFor="technologies" className="block text-sm font-bold text-heading mb-2">Technologies Used</label>
              <input 
                type="text" 
                id="technologies" 
                name="technologies" 
                placeholder="e.g. React, Next.js, Figma (comma separated)"
                className="w-full bg-background border border-border rounded-[var(--radius-button)] px-4 py-2.5 text-body focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
              />
              <p className="text-xs text-muted mt-1.5">We'll automatically match these to icons if available.</p>
            </div>

            {/* Link */}
            <div>
              <label htmlFor="link" className="block text-sm font-bold text-heading mb-2">Live Link (Optional)</label>
              <input 
                type="url" 
                id="link" 
                name="link" 
                placeholder="https://..."
                className="w-full bg-background border border-border rounded-[var(--radius-button)] px-4 py-2.5 text-body focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
              />
            </div>
          </form>
        </div>

        <div className="p-5 border-t border-border flex items-center justify-end gap-3 bg-surface-secondary/50 rounded-b-[var(--radius-card)]">
          <button 
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-bold text-muted hover:text-heading transition-colors"
          >
            Cancel
          </button>
          <button 
            form="portfolio-form"
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2 bg-primary text-surface font-bold text-sm rounded-[var(--radius-button)] hover:bg-primary-hover transition-all shadow-subtle disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                Save Project
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
