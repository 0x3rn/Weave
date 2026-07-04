"use client";

import { useState } from "react";
import { OnboardingData } from "../onboarding-wizard";
import { Upload, X, Loader2, File, FileText, Image as ImageIcon } from "lucide-react";
import { uploadFile } from "@/app/actions/upload";
import toast from "react-hot-toast";

interface StepProps {
  data: OnboardingData;
  updateData: (fields: Partial<OnboardingData>) => void;
}

export default function Step4Portfolio({ data, updateData }: StepProps) {
  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setIsUploading(true);
    let successCount = 0;
    const newFiles = [...data.portfolioFiles];

    for (const file of files) {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast.error(`${file.name} is too large (max 10MB)`);
        continue;
      }
      
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "portfolio");

      const result = await uploadFile(formData);
      if (result.success && result.url) {
        newFiles.push(result.url);
        successCount++;
      } else {
        toast.error(`Failed to upload ${file.name}`);
      }
    }

    if (successCount > 0) {
      updateData({ portfolioFiles: newFiles });
      toast.success(`Uploaded ${successCount} file(s)`);
    }
    
    setIsUploading(false);
  };

  const removeFile = (index: number) => {
    const newFiles = [...data.portfolioFiles];
    newFiles.splice(index, 1);
    updateData({ portfolioFiles: newFiles });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="text-center mb-8">
        <h3 className="text-lg font-bold text-heading">Showcase your work</h3>
        <p className="text-body mt-2">Help others trust your expertise by sharing links and samples.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-heading mb-1">Portfolio Website</label>
          <input
            type="url"
            value={data.portfolioWebsite}
            onChange={(e) => updateData({ portfolioWebsite: e.target.value })}
            className="w-full bg-background border border-border rounded-[var(--radius-input)] px-3 py-2 text-sm focus:outline-none focus:border-primary text-body"
            placeholder="https://yourwebsite.com"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-heading mb-1">LinkedIn</label>
          <input
            type="url"
            value={data.linkedIn}
            onChange={(e) => updateData({ linkedIn: e.target.value })}
            className="w-full bg-background border border-border rounded-[var(--radius-input)] px-3 py-2 text-sm focus:outline-none focus:border-primary text-body"
            placeholder="https://linkedin.com/in/username"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-heading mb-1">GitHub</label>
          <input
            type="url"
            value={data.github}
            onChange={(e) => updateData({ github: e.target.value })}
            className="w-full bg-background border border-border rounded-[var(--radius-input)] px-3 py-2 text-sm focus:outline-none focus:border-primary text-body"
            placeholder="https://github.com/username"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-heading mb-1">X (Twitter)</label>
          <input
            type="url"
            value={data.twitter}
            onChange={(e) => updateData({ twitter: e.target.value })}
            className="w-full bg-background border border-border rounded-[var(--radius-input)] px-3 py-2 text-sm focus:outline-none focus:border-primary text-body"
            placeholder="https://x.com/username"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-heading mb-1">Dribbble / Behance</label>
          <input
            type="url"
            value={data.dribbble}
            onChange={(e) => updateData({ dribbble: e.target.value })}
            className="w-full bg-background border border-border rounded-[var(--radius-input)] px-3 py-2 text-sm focus:outline-none focus:border-primary text-body"
            placeholder="https://dribbble.com/username"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-heading mb-1">Other Link</label>
          <input
            type="url"
            value={data.otherLink}
            onChange={(e) => updateData({ otherLink: e.target.value })}
            className="w-full bg-background border border-border rounded-[var(--radius-input)] px-3 py-2 text-sm focus:outline-none focus:border-primary text-body"
            placeholder="https://youtube.com/..."
          />
        </div>
      </div>

      <div className="pt-4 border-t border-border">
        <label className="block text-sm font-medium text-heading mb-3">Upload Portfolio Samples (Optional)</label>
        
        <div className="border-2 border-dashed border-border rounded-[var(--radius-card)] p-8 text-center bg-background relative hover:border-primary/50 transition-colors">
          <input 
            type="file" 
            multiple 
            accept=".pdf,.png,.jpg,.jpeg,.zip" 
            onChange={handleFileUpload}
            disabled={isUploading}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
          />
          <div className="flex flex-col items-center pointer-events-none">
            {isUploading ? (
              <Loader2 className="w-8 h-8 text-primary animate-spin mb-3" />
            ) : (
              <Upload className="w-8 h-8 text-muted mb-3" />
            )}
            <p className="text-sm font-medium text-heading">Click or drag files to upload</p>
            <p className="text-xs text-muted mt-1">Supported: PDF, PNG, JPG, ZIP (Max 10MB)</p>
          </div>
        </div>

        {data.portfolioFiles.length > 0 && (
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
            {data.portfolioFiles.map((url, i) => {
              const isImage = url.match(/\.(jpeg|jpg|gif|png|webp)/i);
              const isPdf = url.match(/\.pdf/i);
              
              return (
                <div key={i} className="relative group rounded-md border border-border overflow-hidden bg-surface flex flex-col items-center justify-center p-3">
                  <button 
                    onClick={() => removeFile(i)}
                    className="absolute top-1 right-1 bg-error/90 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:bg-error"
                  >
                    <X className="w-3 h-3" />
                  </button>
                  {isImage ? (
                    <img src={url} alt={`Sample ${i+1}`} className="w-full h-20 object-cover rounded shadow-sm mb-2" />
                  ) : isPdf ? (
                    <FileText className="w-10 h-10 text-muted mb-2" />
                  ) : (
                    <File className="w-10 h-10 text-muted mb-2" />
                  )}
                  <a href={url} target="_blank" rel="noreferrer" className="text-xs text-primary truncate w-full text-center hover:underline">
                    Sample {i+1}
                  </a>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
