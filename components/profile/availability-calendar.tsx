"use client";

import { useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, Lock, Check } from "lucide-react";
import { User } from "@/types";
import ExchangeRequestModal from "./exchange-request-modal";
import toast from "react-hot-toast";
import { useRouter, usePathname } from "next/navigation";

interface AvailabilityCalendarProps {
  user: User;
  currentUserId?: string | null;
}

export default function AvailabilityCalendar({ user, currentUserId }: AvailabilityCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  const router = useRouter();
  const pathname = usePathname();

  const isOwner = currentUserId === user.uid;

  // Calendar generation
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  
  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };
  
  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };
  
  const isDateAvailable = (dayNum: number) => {
    if (!user.schedule) return false;
    
    // Check if it's in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(year, month, dayNum);
    if (checkDate < today) return false;
    
    // Format YYYY-MM-DD
    const y = checkDate.getFullYear();
    const m = String(checkDate.getMonth() + 1).padStart(2, "0");
    const d = String(checkDate.getDate()).padStart(2, "0");
    const dateStr = `${y}-${m}-${d}`;
    
    if (user.schedule.blockedDates.includes(dateStr)) return false;
    
    const dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
    const dayName = dayNames[checkDate.getDay()];
    
    const daySchedule = user.schedule.weeklySchedule[dayName as keyof typeof user.schedule.weeklySchedule];
    return daySchedule?.active ?? false;
  };

  const toggleDate = (dayNum: number) => {
    if (!currentUserId) {
      router.push(`/login?next=${encodeURIComponent(pathname)}`);
      return;
    }
    if (isOwner) return; // Owner can't book themselves
    
    const y = year;
    const m = String(month + 1).padStart(2, "0");
    const d = String(dayNum).padStart(2, "0");
    const dateStr = `${y}-${m}-${d}`;
    
    setSelectedDates(prev => 
      prev.includes(dateStr) 
        ? prev.filter(dt => dt !== dateStr)
        : [...prev, dateStr]
    );
  };
  
  const handleSuccess = () => {
    setShowModal(false);
    setSelectedDates([]);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 5000);
  };
  
  // Render logic
  const calendarCells = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarCells.push(<div key={`empty-${i}`} className="w-full aspect-square" />);
  }
  
  for (let d = 1; d <= daysInMonth; d++) {
    const available = isDateAvailable(d);
    
    const y = year;
    const m = String(month + 1).padStart(2, "0");
    const dayStr = String(d).padStart(2, "0");
    const dateStr = `${y}-${m}-${dayStr}`;
    const isSelected = selectedDates.includes(dateStr);
    
    calendarCells.push(
      <button 
        key={d} 
        disabled={!available || isOwner}
        onClick={() => toggleDate(d)}
        className={`
          w-full aspect-square flex items-center justify-center text-xs rounded-md transition-colors font-medium
          ${!available ? "text-border cursor-not-allowed" : ""}
          ${available && !isSelected ? "bg-primary/10 text-primary hover:bg-primary/20" : ""}
          ${isSelected ? "bg-primary text-surface shadow-subtle" : ""}
        `}
      >
        {d}
      </button>
    );
  }

  const monthName = currentDate.toLocaleString('default', { month: 'long' });

  return (
    <div id="availability-calendar" className="bg-background border border-border rounded-[var(--radius-card)] shadow-subtle overflow-hidden relative flex flex-col">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarDays className="w-5 h-5 text-heading" />
          <h2 className="text-lg font-bold text-heading">Availability</h2>
        </div>
        {!user.schedule && (
          <span className="text-[10px] uppercase font-bold text-muted bg-surface-secondary px-1.5 py-0.5 rounded">Not Configured</span>
        )}
      </div>
      
      {showSuccess ? (
        <div className="p-8 flex flex-col items-center justify-center text-center flex-1 bg-surface-secondary/50">
          <div className="w-12 h-12 bg-success/20 rounded-full flex items-center justify-center mb-4">
            <Check className="w-6 h-6 text-success" />
          </div>
          <h3 className="font-bold text-heading mb-2">Request Sent!</h3>
          <p className="text-sm text-muted">The user will be notified and can accept, review, or decline your request.</p>
        </div>
      ) : (
        <div className="p-4 relative flex-1 flex flex-col">
          {!user.schedule && (
            <div className="absolute inset-0 bg-surface/60 backdrop-blur-[2px] flex flex-col items-center justify-center z-10 text-center px-4">
              <Lock className="w-8 h-8 text-muted mb-2" />
              <h3 className="font-bold text-sm text-heading mb-1">Calendar Unavailable</h3>
              <p className="text-xs text-muted max-w-[200px]">
                {isOwner ? "Configure your schedule in Edit Profile to start receiving requests." : `${user.fullName.split(" ")[0]} has not configured their availability yet.`}
              </p>
            </div>
          )}

          <div className={`transition-opacity flex-1 ${!user.schedule ? "opacity-30 pointer-events-none select-none" : ""}`}>
            <div className="flex items-center justify-between mb-4">
              <span className="font-bold text-sm text-heading">{monthName} {year}</span>
              <div className="flex items-center gap-2">
                <button onClick={prevMonth} className="p-1 hover:bg-surface-secondary rounded transition-colors text-muted hover:text-heading">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button onClick={nextMonth} className="p-1 hover:bg-surface-secondary rounded transition-colors text-muted hover:text-heading">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-7 gap-1 text-center mb-2">
              {days.map(day => (
                <div key={day} className="text-[10px] font-bold text-muted uppercase tracking-wider">{day.charAt(0)}</div>
              ))}
            </div>
            
            <div className="grid grid-cols-7 gap-1 text-center">
              {calendarCells}
            </div>
          </div>
        </div>
      )}
      
      {/* Booking Footer Action */}
      {selectedDates.length > 0 && !showSuccess && (
        <div className="p-4 border-t border-border bg-surface-secondary flex items-center justify-between">
          <span className="text-xs font-bold text-primary">{selectedDates.length} day{selectedDates.length > 1 ? "s" : ""} selected</span>
          <button 
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-primary text-surface text-sm font-bold rounded-[var(--radius-button)] shadow-subtle hover:bg-primary-hover transition-colors"
          >
            Request Exchange
          </button>
        </div>
      )}
      
      {showModal && currentUserId && (
        <ExchangeRequestModal 
          owner={user}
          senderId={currentUserId}
          selectedDates={selectedDates}
          onClose={() => setShowModal(false)}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  );
}
