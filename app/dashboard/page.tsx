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
    <div className="min-h-screen bg-background p-4 md:p-8 flex flex-col items-center justify-center animate-in fade-in duration-1000">
      
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

        {/* Unboxed List */}
        <div className="mt-12 text-left max-w-md mx-auto">
          <h3 className="font-bold text-heading mb-6 flex items-center gap-2 uppercase tracking-wider text-sm">
            Coming Up Next
            <ArrowRight className="w-4 h-4 text-primary" />
          </h3>
          <ul className="text-body space-y-4">
            <li className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="text-primary font-bold text-sm">1</span>
              </div>
              <span className="font-medium text-heading">Complete your public profile and portfolio.</span>
            </li>
            <li className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="text-primary font-bold text-sm">2</span>
              </div>
              <span className="font-medium text-heading">Browse the trusted marketplace for services.</span>
            </li>
            <li className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="text-primary font-bold text-sm">3</span>
              </div>
              <span className="font-medium text-heading">Start exchanging your Skill Hours!</span>
            </li>
          </ul>
        </div>

      </div>
    </div>
  );
}
