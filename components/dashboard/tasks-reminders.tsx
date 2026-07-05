"use client";

import { CheckSquare, AlertCircle, Clock, Star, ShieldAlert } from "lucide-react";
import Link from "next/link";

export default function TasksReminders({ tasks }: { tasks: any[] }) {
  if (tasks.length === 0) return null;

  const getTaskIcon = (id: string, isUrgent: boolean) => {
    if (isUrgent) return <AlertCircle className="w-5 h-5 text-error" />;
    if (id.includes("profile")) return <CheckSquare className="w-5 h-5 text-primary" />;
    if (id.includes("review")) return <Star className="w-5 h-5 text-warning" />;
    if (id.includes("verifi")) return <ShieldAlert className="w-5 h-5 text-info" />;
    return <Clock className="w-5 h-5 text-muted" />;
  };

  return (
    <div className="bg-surface border border-border rounded-[var(--radius-card)] shadow-subtle overflow-hidden">
      <div className="p-4 border-b border-border bg-background">
        <h3 className="font-semibold text-heading flex items-center gap-2 text-sm tracking-tight">
          <CheckSquare className="w-5 h-5 text-primary" />
          Tasks & Reminders
        </h3>
      </div>
      <div className="divide-y divide-border">
        {tasks.map((task, i) => (
          <div key={i} className={`p-4 flex items-start gap-3 hover:bg-background transition-colors ${task.isUrgent ? 'bg-error/5' : ''}`}>
            <div className="mt-0.5">
              {getTaskIcon(task.id, task.isUrgent)}
            </div>
            <div className="flex-1">
              <p className={`text-sm font-medium ${task.isUrgent ? 'text-error' : 'text-heading'}`}>
                {task.title}
              </p>
              {task.actionText && task.actionUrl && (
                <Link 
                  href={task.actionUrl}
                  className="inline-block mt-2 text-xs font-semibold text-primary hover:underline transition-colors"
                >
                  {task.actionText} →
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
