"use client";

import { useState } from "react";
import { NotificationPreferences } from "@/types";
import { updateNotificationPreferences } from "@/app/actions/notifications";
import toast from "react-hot-toast";
import { Loader2 } from "lucide-react";

interface Props {
  initialPreferences: NotificationPreferences | null;
}

const DEFAULT_PREFS: NotificationPreferences = {
  exchangeActivity: true,
  marketplace: true,
  messages: true,
  reviews: true,
  community: true,
  security: true, // Always true
  deliveryMethod: {
    inApp: true,
    email: true,
  }
};

export default function NotificationPreferencesClient({ initialPreferences }: Props) {
  const [prefs, setPrefs] = useState<NotificationPreferences>(initialPreferences || DEFAULT_PREFS);
  const [isSaving, setIsSaving] = useState(false);

  const toggle = (field: keyof Omit<NotificationPreferences, "deliveryMethod" | "security">) => {
    setPrefs(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const toggleDelivery = (method: keyof NotificationPreferences["deliveryMethod"]) => {
    setPrefs(prev => ({
      ...prev,
      deliveryMethod: {
        ...prev.deliveryMethod,
        [method]: !prev.deliveryMethod[method]
      }
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    const result = await updateNotificationPreferences(prefs);
    setIsSaving(false);
    
    if (result.success) {
      toast.success("Preferences saved successfully!");
    } else {
      toast.error(result.error || "Failed to save preferences.");
    }
  };

  return (
    <div className="space-y-8">
      {/* Category Preferences */}
      <div className="bg-surface border border-border rounded-[var(--radius-card)] overflow-hidden">
        <div className="px-6 py-4 border-b border-border bg-surface-secondary">
          <h2 className="text-lg font-bold text-heading">Categories</h2>
          <p className="text-sm text-muted">Select which types of notifications you want to receive.</p>
        </div>
        
        <div className="divide-y divide-border">
          <ToggleRow 
            title="Exchange Activity" 
            description="Applications received, proposals accepted, milestones completed, and files uploaded."
            checked={prefs.exchangeActivity}
            onChange={() => toggle("exchangeActivity")}
          />
          <ToggleRow 
            title="Marketplace" 
            description="Recommended opportunities, updates on your saved requests, and new professionals."
            checked={prefs.marketplace}
            onChange={() => toggle("marketplace")}
          />
          <ToggleRow 
            title="Messages" 
            description="Direct messages from other users."
            checked={prefs.messages}
            onChange={() => toggle("messages")}
          />
          <ToggleRow 
            title="Reviews & Trust Score" 
            description="New reviews, skill endorsements, and Trust Score updates."
            checked={prefs.reviews}
            onChange={() => toggle("reviews")}
          />
          <ToggleRow 
            title="Community" 
            description="Announcements, upcoming events, and newsletters."
            checked={prefs.community}
            onChange={() => toggle("community")}
          />
          <ToggleRow 
            title="Security" 
            description="New logins, password changes, and security alerts."
            checked={true}
            disabled={true}
            onChange={() => {}}
          />
        </div>
      </div>

      {/* Delivery Methods */}
      <div className="bg-surface border border-border rounded-[var(--radius-card)] overflow-hidden">
        <div className="px-6 py-4 border-b border-border bg-surface-secondary">
          <h2 className="text-lg font-bold text-heading">Delivery Methods</h2>
          <p className="text-sm text-muted">How would you like to receive your notifications?</p>
        </div>
        
        <div className="divide-y divide-border">
          <ToggleRow 
            title="In-App Notifications" 
            description="Receive notifications inside the Weave application."
            checked={prefs.deliveryMethod.inApp}
            onChange={() => toggleDelivery("inApp")}
          />
          <ToggleRow 
            title="Email" 
            description="Receive an email digest for important updates."
            checked={prefs.deliveryMethod.email}
            onChange={() => toggleDelivery("email")}
          />
          <ToggleRow 
            title="Push Notifications" 
            description="Receive push notifications on your mobile device."
            checked={false}
            disabled={true}
            onChange={() => {}}
            badge="Coming Soon"
          />
          <ToggleRow 
            title="SMS" 
            description="Receive text messages for critical alerts."
            checked={false}
            disabled={true}
            onChange={() => {}}
            badge="Coming Soon"
          />
        </div>
      </div>

      <div className="flex justify-end">
        <button 
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 px-6 py-3 bg-primary text-surface font-bold rounded-[var(--radius-button)] hover:bg-primary-hover transition-colors disabled:opacity-50"
        >
          {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
          Save Preferences
        </button>
      </div>
    </div>
  );
}

function ToggleRow({ 
  title, 
  description, 
  checked, 
  onChange, 
  disabled = false,
  badge
}: { 
  title: string; 
  description: string; 
  checked: boolean; 
  onChange: () => void;
  disabled?: boolean;
  badge?: string;
}) {
  return (
    <div className={`p-6 flex items-start justify-between gap-4 ${disabled ? "opacity-60" : ""}`}>
      <div>
        <div className="flex items-center gap-2">
          <h3 className="font-bold text-heading">{title}</h3>
          {badge && <span className="px-2 py-0.5 text-[10px] uppercase font-bold bg-surface-secondary text-muted rounded-full">{badge}</span>}
        </div>
        <p className="text-sm text-muted mt-1">{description}</p>
      </div>
      
      <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
        <input 
          type="checkbox" 
          className="sr-only peer" 
          checked={checked} 
          onChange={onChange}
          disabled={disabled}
        />
        <div className="w-11 h-6 bg-surface-secondary peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
      </label>
    </div>
  );
}
