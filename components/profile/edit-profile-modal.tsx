"use client";

import { useState } from "react";
import { User } from "@/types";
import { X, Pencil } from "lucide-react";
import EditProfileForm from "./edit-profile-form";

interface EditProfileModalProps {
  user: User;
}

export default function EditProfileModal({ user }: EditProfileModalProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-2 text-sm font-semibold text-surface bg-primary px-4 py-2 rounded-[var(--radius-button)] hover:bg-primary-hover transition-colors shadow-sm whitespace-nowrap shrink-0"
      >
        <Pencil className="w-4 h-4" />
        Edit Profile
      </button>
    );
  }

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-2 text-sm font-semibold text-surface bg-primary px-4 py-2 rounded-[var(--radius-button)] hover:bg-primary-hover transition-colors shadow-sm whitespace-nowrap shrink-0"
      >
        <Pencil className="w-4 h-4" />
        Edit Profile
      </button>

      {/* Modal Overlay */}
      <div className="fixed inset-0 z-[100] bg-heading/50 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        
        {/* Modal Content */}
        <div className="bg-surface rounded-2xl shadow-xl w-full max-w-4xl relative max-h-[90vh] flex flex-col my-auto border border-border overflow-hidden">
          
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border bg-surface sticky top-0 z-10 shrink-0">
            <div>
              <h2 className="text-2xl font-bold text-heading">Edit Profile</h2>
              <p className="text-body text-sm mt-1">Make changes to your public profile.</p>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="p-2 text-muted hover:text-heading hover:bg-surface-secondary rounded-full transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Scrollable Body */}
          <div className="p-6 overflow-y-auto flex-1">
            <EditProfileForm user={user} onSuccess={() => setIsOpen(false)} />
          </div>
        </div>
      </div>
    </>
  );
}
