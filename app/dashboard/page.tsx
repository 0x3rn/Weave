"use client";

import { useState } from "react";
import { LogOut, Construction, ArrowRight } from "lucide-react";
import { auth } from "@/lib/firebase"; // Client SDK
import { signOut } from "firebase/auth";

export default function DashboardPlaceholder() {
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      // 1. Sign out from Firebase Client
      await signOut(auth);
      
      // 2. Call our API to destroy the secure HTTP-only cookie
      await fetch("/api/auth/logout", {
        method: "POST",
      });

      // 3. Force a hard navigation to clear all client-side cache and hit the middleware
      window.location.href = "/login";
    } catch (error) {
      console.error("Logout failed:", error);
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-secondary p-4 md:p-8 flex flex-col items-center justify-center">
      
      {/* Top Right Logout Button */}
      <div className="absolute top-4 right-4 md:top-8 md:right-8">
        <button 
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="flex items-center gap-2 px-4 py-2 bg-surface border border-border rounded-[var(--radius-button)] text-sm font-medium text-muted hover:text-heading hover:border-primary transition-all shadow-subtle disabled:opacity-50"
        >
          <LogOut className="w-4 h-4" />
          {isLoggingOut ? "Logging out..." : "Log out"}
        </button>
      </div>

      <div className="max-w-2xl w-full text-center space-y-8">
        
        {/* Construction Icon */}
        <div className="flex justify-center">
          <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center border-4 border-surface shadow-xl relative animate-pulse-slow">
            <Construction className="w-10 h-10 text-primary" />
            
            {/* Decorative Sparkles */}
            <div className="absolute top-0 right-0 w-3 h-3 bg-warning rounded-full blur-[2px]" />
            <div className="absolute bottom-4 left-0 w-2 h-2 bg-success rounded-full blur-[1px]" />
          </div>
        </div>

        {/* Text Content */}
        <div className="space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-heading">
            Welcome to Weave
          </h1>
          <h2 className="text-xl md:text-2xl font-medium text-primary">
            Your Profile is Under Construction
          </h2>
          <p className="text-lg text-body max-w-xl mx-auto leading-relaxed">
            We are currently building the ultimate onboarding experience and marketplace for professional skill exchanges. Check back soon!
          </p>
        </div>

        {/* Fancy Card */}
        <div className="mt-12 bg-surface border border-border p-6 rounded-[var(--radius-card)] shadow-subtle text-left max-w-md mx-auto relative overflow-hidden group">
          {/* Decorative background gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          
          <h3 className="font-bold text-heading mb-2 flex items-center justify-between">
            Coming Up Next
            <ArrowRight className="w-4 h-4 text-primary group-hover:translate-x-1 transition-transform" />
          </h3>
          <ul className="text-sm text-body space-y-3 relative z-10">
            <li className="flex items-start gap-2">
              <span className="text-primary font-bold">&bull;</span>
              Complete your public profile and portfolio.
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary font-bold">&bull;</span>
              Browse the trusted marketplace for services.
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary font-bold">&bull;</span>
              Start exchanging your Skill Hours!
            </li>
          </ul>
        </div>

      </div>
    </div>
  );
}
