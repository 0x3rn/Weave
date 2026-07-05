"use client";

import { useState } from "react";
import { User, UserSchedule, DaySchedule } from "@/types";

interface ScheduleSettingsProps {
  user: User;
  value: UserSchedule | undefined;
  onChange: (schedule: UserSchedule) => void;
}

const defaultSchedule: UserSchedule = {
  timezone: "UTC",
  weeklySchedule: {
    monday: { active: true, start: "09:00", end: "17:00" },
    tuesday: { active: true, start: "09:00", end: "17:00" },
    wednesday: { active: true, start: "09:00", end: "17:00" },
    thursday: { active: true, start: "09:00", end: "17:00" },
    friday: { active: true, start: "09:00", end: "17:00" },
    saturday: { active: false, start: "09:00", end: "17:00" },
    sunday: { active: false, start: "09:00", end: "17:00" },
  },
  blockedDates: []
};

const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const;

export default function ScheduleSettings({ user, value, onChange }: ScheduleSettingsProps) {
  const [schedule, setSchedule] = useState<UserSchedule>(() => {
    if (value) return value;
    return {
      ...defaultSchedule,
      timezone: user.timeZone || "UTC"
    };
  });
  
  const [newBlockedDate, setNewBlockedDate] = useState("");

  const updateDay = (day: string, updates: Partial<DaySchedule>) => {
    const newSchedule = {
      ...schedule,
      weeklySchedule: {
        ...schedule.weeklySchedule,
        [day]: { ...schedule.weeklySchedule[day as keyof typeof schedule.weeklySchedule], ...updates }
      }
    };
    setSchedule(newSchedule);
    onChange(newSchedule);
  };

  const addBlockedDate = () => {
    if (!newBlockedDate || schedule.blockedDates.includes(newBlockedDate)) return;
    const newSchedule = {
      ...schedule,
      blockedDates: [...schedule.blockedDates, newBlockedDate].sort()
    };
    setSchedule(newSchedule);
    onChange(newSchedule);
    setNewBlockedDate("");
  };

  const removeBlockedDate = (date: string) => {
    const newSchedule = {
      ...schedule,
      blockedDates: schedule.blockedDates.filter(d => d !== date)
    };
    setSchedule(newSchedule);
    onChange(newSchedule);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-heading">Weekly Working Hours</h3>
        <div className="space-y-3">
          {DAYS.map(day => {
            const dayData = schedule.weeklySchedule[day];
            return (
              <div key={day} className="flex items-center justify-between gap-4 p-3 bg-background border border-border rounded-[var(--radius-button)]">
                <div className="flex items-center gap-3 w-32">
                  <input 
                    type="checkbox" 
                    checked={dayData.active}
                    onChange={(e) => updateDay(day, { active: e.target.checked })}
                    className="w-4 h-4 accent-primary rounded border-border"
                  />
                  <span className="text-sm font-medium text-heading capitalize">{day}</span>
                </div>
                
                {dayData.active ? (
                  <div className="flex items-center gap-2 flex-1">
                    <input 
                      type="time" 
                      value={dayData.start}
                      onChange={(e) => updateDay(day, { start: e.target.value })}
                      className="bg-surface border border-border rounded px-2 py-1 text-sm text-body focus:outline-none focus:border-primary"
                    />
                    <span className="text-muted text-sm">to</span>
                    <input 
                      type="time" 
                      value={dayData.end}
                      onChange={(e) => updateDay(day, { end: e.target.value })}
                      className="bg-surface border border-border rounded px-2 py-1 text-sm text-body focus:outline-none focus:border-primary"
                    />
                  </div>
                ) : (
                  <span className="text-sm text-muted italic flex-1">Unavailable</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
      
      <div className="space-y-4 pt-4 border-t border-border">
        <h3 className="text-sm font-bold text-heading">Blocked Dates</h3>
        <p className="text-xs text-muted">Add specific dates where you are unavailable (e.g., vacations, holidays).</p>
        
        <div className="flex items-center gap-2">
          <input 
            type="date" 
            value={newBlockedDate}
            onChange={(e) => setNewBlockedDate(e.target.value)}
            className="bg-background border border-border rounded-[var(--radius-button)] px-4 py-2 text-sm text-body focus:outline-none focus:border-primary"
          />
          <button 
            type="button"
            onClick={addBlockedDate}
            disabled={!newBlockedDate}
            className="px-4 py-2 bg-surface-secondary hover:bg-border text-heading text-sm font-bold rounded-[var(--radius-button)] transition-colors disabled:opacity-50"
          >
            Add
          </button>
        </div>
        
        {schedule.blockedDates.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {schedule.blockedDates.map(date => (
              <span key={date} className="bg-surface-secondary border border-border px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-2">
                {date}
                <button type="button" onClick={() => removeBlockedDate(date)} className="text-muted hover:text-error transition-colors">
                  &times;
                </button>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
