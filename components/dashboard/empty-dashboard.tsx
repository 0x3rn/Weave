"use client";

import { User } from "@/types";
import { ArrowRight, UserCheck, Search, MessageSquarePlus, RefreshCcw, ShieldCheck, Star, Store } from "lucide-react";
import Link from "next/link";
import WelcomeHeader from "./welcome-header";

export default function EmptyDashboard({ user }: { user: User }) {
  const steps = [
    {
      title: "Complete Profile",
      description: "Add your skills, bio, and portfolio.",
      icon: <UserCheck className="w-5 h-5" />,
      href: "/profile/edit",
      done: user.profileCompletion === 100,
    },
    {
      title: "Browse Marketplace",
      description: "Find members looking for your skills.",
      icon: <Store className="w-5 h-5" />,
      href: "/marketplace",
      done: false,
    },
    {
      title: "Post Your First Request",
      description: "Need help? Request an exchange.",
      icon: <MessageSquarePlus className="w-5 h-5" />,
      href: "/marketplace/create",
      done: false,
    },
    {
      title: "Complete First Exchange",
      description: "Successfully trade your time.",
      icon: <RefreshCcw className="w-5 h-5" />,
      href: "/exchanges",
      done: (user.stats?.exchangesCompleted || 0) > 0,
    },
    {
      title: "Earn First Skill Hour",
      description: "Build your balance.",
      icon: <ShieldCheck className="w-5 h-5" />,
      href: "/wallet",
      done: (user.stats?.skillHoursEarned || 0) > 0,
    },
    {
      title: "Receive First Review",
      description: "Build your Trust Score.",
      icon: <Star className="w-5 h-5" />,
      href: "/profile",
      done: (user.stats?.reviewsCount || 0) > 0,
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-500">
        
        <WelcomeHeader user={user} activeExchangesCount={0} matchesCount={0} />

        <div className="mt-12 max-w-2xl mx-auto text-center">
          <div className="w-24 h-24 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-6 relative shadow-[0_0_30px_rgba(46,125,50,0.15)] dark:shadow-[0_0_30px_rgba(88,199,109,0.15)]">
            <Store className="w-10 h-10 text-primary" />
            <div className="absolute top-0 right-0 w-3 h-3 bg-warning rounded-full blur-[2px]" />
            <div className="absolute bottom-4 left-0 w-2 h-2 bg-success rounded-full blur-[1px]" />
          </div>
          
          <h2 className="text-3xl font-bold text-heading tracking-tight">Welcome to Weave</h2>
          <p className="text-lg text-body mt-4 font-medium">
            You're all set! Here are a few things to get started on building your professional momentum and earning Trust points.
          </p>

          <div className="mt-10 bg-surface border border-border rounded-[var(--radius-card)] p-6 md:p-8 text-left shadow-subtle">
            <h3 className="font-semibold text-heading tracking-tight mb-6 flex items-center gap-2">
              <span className="w-2 h-2 bg-primary rounded-full"></span>
              Getting Started Checklist
            </h3>
            <div className="grid sm:grid-cols-2 gap-4">
              {steps.map((step, i) => (
                <Link 
                  key={i}
                  href={step.href}
                  className={`flex items-start gap-4 p-4 rounded-[var(--radius-card)] border transition-all ${
                    step.done 
                      ? 'bg-success/5 border-success/20 opacity-70' 
                      : 'bg-surface hover:bg-primary/5 border-border hover:border-primary/50 group'
                  }`}
                >
                  <div className={`mt-0.5 shrink-0 ${step.done ? 'text-success' : 'text-primary'}`}>
                    {step.icon}
                  </div>
                  <div>
                    <h4 className={`font-semibold ${step.done ? 'line-through text-muted' : 'text-heading group-hover:text-primary transition-colors'}`}>
                      {step.title}
                    </h4>
                    <p className="text-sm text-muted mt-1">{step.description}</p>
                  </div>
                </Link>
              ))}
            </div>

            <div className="mt-8 pt-6 border-t border-border flex justify-center">
              <Link 
                href="/marketplace"
                className="px-6 py-3 bg-primary text-background font-semibold rounded-[var(--radius-button)] hover:bg-primary-hover transition-all flex items-center gap-2 shadow-subtle hover:shadow-[0_0_15px_rgba(46,125,50,0.3)] dark:hover:shadow-[0_0_15px_rgba(88,199,109,0.3)]"
              >
                Explore Marketplace <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
