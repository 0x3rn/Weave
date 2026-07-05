"use client";

import { CalendarDays, ChevronLeft, ChevronRight, Lock } from "lucide-react";
import { User } from "@/types";

interface AvailabilityCalendarProps {
  user: User;
}

export default function AvailabilityCalendar({ user }: AvailabilityCalendarProps) {
  // Generate a mock calendar grid
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const dates = Array.from({ length: 35 }, (_, i) => i - 2); // Start a bit before the 1st
  
  return (
    <div className="bg-surface border border-border rounded-[var(--radius-card)] shadow-subtle overflow-hidden">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarDays className="w-5 h-5 text-heading" />
          <h2 className="text-lg font-bold text-heading">Availability</h2>
        </div>
        <span className="text-[10px] uppercase font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded">Coming Soon</span>
      </div>
      
      <div className="p-4 relative">
        {/* Placeholder overlay */}
        <div className="absolute inset-0 bg-surface/60 backdrop-blur-[2px] flex flex-col items-center justify-center z-10 text-center px-4">
          <Lock className="w-8 h-8 text-muted mb-2" />
          <h3 className="font-bold text-sm text-heading mb-1">Calendar Syncing</h3>
          <p className="text-xs text-muted max-w-[200px]">
            Soon you'll be able to see {user.fullName.split(" ")[0]}'s real-time availability and book exchanges instantly.
          </p>
        </div>

        {/* Faded mockup of a calendar */}
        <div className="opacity-30 pointer-events-none select-none">
          <div className="flex items-center justify-between mb-4">
            <span className="font-bold text-sm">October 2026</span>
            <div className="flex items-center gap-2">
              <ChevronLeft className="w-4 h-4 text-muted" />
              <ChevronRight className="w-4 h-4 text-muted" />
            </div>
          </div>
          
          <div className="grid grid-cols-7 gap-1 text-center mb-2">
            {days.map(day => (
              <div key={day} className="text-[10px] font-bold text-muted uppercase tracking-wider">{day.charAt(0)}</div>
            ))}
          </div>
          
          <div className="grid grid-cols-7 gap-1 text-center">
            {dates.map((date, idx) => {
              const isCurrentMonth = date > 0 && date <= 31;
              const hasAvailability = isCurrentMonth && (date % 3 === 0 || date % 5 === 0);
              
              return (
                <div 
                  key={idx} 
                  className={`
                    w-full aspect-square flex items-center justify-center text-xs rounded-md
                    ${!isCurrentMonth ? "text-border" : "text-heading"}
                    ${hasAvailability ? "bg-primary/20 text-primary font-bold" : ""}
                  `}
                >
                  {date > 0 && date <= 31 ? date : date <= 0 ? 30 + date : date - 31}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
