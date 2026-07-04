"use client";

import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";

export default function Step7Success() {
  const router = useRouter();

  return (
    <div className="text-center max-w-3xl mx-auto mt-6 sm:mt-10 animate-in fade-in slide-in-from-bottom-8 duration-1000">
      <div className="w-20 h-20 bg-success/10 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-sm">
        <CheckCircle2 className="w-10 h-10 text-success" />
      </div>
      
      <h1 className="text-4xl sm:text-5xl font-extrabold text-heading mb-6 tracking-tight">You're all set!</h1>
      <p className="text-muted text-xl mb-12 max-w-2xl mx-auto leading-relaxed">
        Your profile is live. You're ready to start exploring the marketplace and exchanging skills.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto mb-12 text-left">
        <div className="bg-surface-secondary/50 p-4 rounded-2xl flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <span className="text-primary font-bold">1</span>
          </div>
          <span className="text-sm font-medium text-heading">Browse the marketplace</span>
        </div>
        <div className="bg-surface-secondary/50 p-4 rounded-2xl flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <span className="text-primary font-bold">2</span>
          </div>
          <span className="text-sm font-medium text-heading">Request Skill Exchanges</span>
        </div>
        <div className="bg-surface-secondary/50 p-4 rounded-2xl flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <span className="text-primary font-bold">3</span>
          </div>
          <span className="text-sm font-medium text-heading">Earn Skill Hours</span>
        </div>
        <div className="bg-surface-secondary/50 p-4 rounded-2xl flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <span className="text-primary font-bold">4</span>
          </div>
          <span className="text-sm font-medium text-heading">Build your reputation</span>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
        <button 
          onClick={() => router.push("/dashboard")}
          className="w-full sm:w-auto bg-primary text-surface px-8 py-3 rounded-2xl font-bold shadow-sm hover:bg-primary-hover transition-colors flex items-center justify-center gap-2"
        >
          Go to Dashboard
        </button>
        <button 
          onClick={() => router.push("/marketplace")}
          className="w-full sm:w-auto bg-surface text-heading px-8 py-3 rounded-2xl font-bold hover:bg-surface-secondary transition-colors"
        >
          Explore Marketplace
        </button>
      </div>
    </div>
  );
}
