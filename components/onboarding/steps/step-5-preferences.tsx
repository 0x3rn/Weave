"use client";

import { OnboardingData } from "../onboarding-wizard";

interface StepProps {
  data: OnboardingData;
  updateData: (fields: Partial<OnboardingData>) => void;
}

export default function Step5Preferences({ data, updateData }: StepProps) {

  const handleNotificationToggle = (val: string) => {
    const current = data.notifications;
    if (current.includes(val)) {
      updateData({ notifications: current.filter(c => c !== val) });
    } else {
      updateData({ notifications: [...current, val] });
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-8">
      <div className="text-center mb-8">
        <h3 className="text-lg font-bold text-heading">Customize your experience</h3>
        <p className="text-body mt-2">Set your visibility and notification preferences.</p>
      </div>

      <div className="space-y-8">
        
        {/* Marketplace Visibility */}
        <div>
          <label className="block text-sm font-medium text-heading mb-3">Marketplace Visibility</label>
          <div className="space-y-3">
            {[
              { id: "everyone", label: "Everyone (Recommended)" },
              { id: "verified", label: "Verified Members Only" },
              { id: "hidden", label: "Hidden (You can still browse others)" },
            ].map((option) => (
              <label key={option.id} className="flex items-center group cursor-pointer bg-background border border-border p-3 rounded-[var(--radius-input)] hover:border-primary transition-colors">
                <input
                  type="radio"
                  name="visibility"
                  checked={data.visibility === option.id}
                  onChange={() => updateData({ visibility: option.id })}
                  className="w-4 h-4 text-primary focus:ring-primary border-border bg-background"
                />
                <span className="ml-3 text-sm font-medium text-body group-hover:text-heading transition-colors">{option.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Preferred Communication */}
        <div>
          <label className="block text-sm font-medium text-heading mb-3">Preferred Communication</label>
          <div className="space-y-3">
            {[
              { id: "platform", label: "Platform Messages Only" },
              { id: "email", label: "Email Only" },
              { id: "both", label: "Either" },
            ].map((option) => (
              <label key={option.id} className="flex items-center group cursor-pointer bg-background border border-border p-3 rounded-[var(--radius-input)] hover:border-primary transition-colors">
                <input
                  type="radio"
                  name="communication"
                  checked={data.communication === option.id}
                  onChange={() => updateData({ communication: option.id })}
                  className="w-4 h-4 text-primary focus:ring-primary border-border bg-background"
                />
                <span className="ml-3 text-sm font-medium text-body group-hover:text-heading transition-colors">{option.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Notifications */}
        <div>
          <label className="block text-sm font-medium text-heading mb-3">Notifications</label>
          <div className="bg-background border border-border rounded-[var(--radius-card)] divide-y divide-border overflow-hidden">
            {[
              { id: "requests", label: "New exchange requests" },
              { id: "messages", label: "Messages from other members" },
              { id: "recommendations", label: "Marketplace recommendations" },
              { id: "updates", label: "Product updates & News" },
            ].map((option) => (
              <label key={option.id} className="flex items-center justify-between p-4 cursor-pointer hover:bg-surface-secondary transition-colors">
                <span className="text-sm font-medium text-body">{option.label}</span>
                <input
                  type="checkbox"
                  checked={data.notifications.includes(option.id)}
                  onChange={() => handleNotificationToggle(option.id)}
                  className="w-4 h-4 rounded border-border text-primary focus:ring-primary bg-background"
                />
              </label>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
