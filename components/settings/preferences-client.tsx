"use client";

import { useState } from "react";
import { AutoSaveWrapper } from "./auto-save-wrapper";
import { updateUserProfile } from "@/app/actions/user";

export function PreferencesClient({ user }: { user: any }) {
  const [formData, setFormData] = useState({
    theme: user.preferences?.theme || "system",
    accentColor: user.preferences?.accentColor || "default",
    compactMode: user.preferences?.compactMode ?? false,
    reduceMotion: user.preferences?.reduceMotion ?? false,
    fontSize: user.preferences?.fontSize || "medium",
    dashboardLandingPage: user.preferences?.dashboardLandingPage || "overview",
    defaultMarketplaceView: user.preferences?.defaultMarketplaceView || "requests",
    exchangeView: user.preferences?.exchangeView || "chat_first",
    weekStartsOn: user.preferences?.weekStartsOn || "monday",
    autoSaveDrafts: user.preferences?.autoSaveDrafts ?? true,
    compressImages: user.preferences?.compressImages ?? true,
    
    // Exchange Preferences
    preferredHours: user.preferences?.preferredHours || "flexible",
    maxConcurrentExchanges: user.preferences?.maxConcurrentExchanges || 3,
    openToReciprocalOnly: user.preferences?.openToReciprocalOnly ?? false,
  });

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleToggle = (field: string) => {
    setFormData((prev: any) => ({ ...prev, [field]: !prev[field] }));
  };

  const handleSave = async (data: any) => {
    await updateUserProfile({ preferences: data });
  };

  return (
    <div className="space-y-12">
      <AutoSaveWrapper>
        {({ saveState, handleSave: saveWrapper }) => (
          <div className="space-y-12">
            
            {/* Appearance */}
            <section className="space-y-4">
              <h3 className="text-xl font-bold text-heading">Appearance</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-background border border-border rounded-xl p-4 space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-heading">Theme</label>
                    <select 
                      value={formData.theme}
                      onChange={(e) => {
                        handleChange("theme", e.target.value);
                        saveWrapper(() => handleSave({ ...formData, theme: e.target.value }));
                      }}
                      className="w-full p-3 bg-surface border border-border rounded-lg text-body focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                    >
                      <option value="light">Light</option>
                      <option value="dark">Dark</option>
                      <option value="system">System Default</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-heading">Font Size</label>
                    <select 
                      value={formData.fontSize}
                      onChange={(e) => {
                        handleChange("fontSize", e.target.value);
                        saveWrapper(() => handleSave({ ...formData, fontSize: e.target.value }));
                      }}
                      className="w-full p-3 bg-surface border border-border rounded-lg text-body focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                    >
                      <option value="small">Small</option>
                      <option value="medium">Medium</option>
                      <option value="large">Large</option>
                    </select>
                  </div>
                </div>

                <div className="bg-background border border-border rounded-xl overflow-hidden divide-y divide-border">
                  {[
                    { id: "compactMode", label: "Compact Mode", desc: "Decrease padding to show more content." },
                    { id: "reduceMotion", label: "Reduce Motion", desc: "Disable UI animations." },
                  ].map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-4">
                      <div>
                        <span className="block text-sm font-bold text-heading">{item.label}</span>
                        <span className="block text-xs text-muted">{item.desc}</span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="sr-only peer" 
                          checked={formData[item.id as keyof typeof formData] as boolean}
                          onChange={() => {
                            handleToggle(item.id);
                            saveWrapper(() => handleSave({ ...formData, [item.id]: !formData[item.id as keyof typeof formData] }));
                          }}
                        />
                        <div className="w-11 h-6 bg-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Workspace Preferences */}
            <section className="space-y-4">
              <h3 className="text-xl font-bold text-heading">Workspace Preferences</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-heading">Dashboard Landing Page</label>
                  <select 
                    value={formData.dashboardLandingPage}
                    onChange={(e) => {
                      handleChange("dashboardLandingPage", e.target.value);
                      saveWrapper(() => handleSave({ ...formData, dashboardLandingPage: e.target.value }));
                    }}
                    className="w-full p-3 bg-surface border border-border rounded-lg text-body focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                  >
                    <option value="overview">Overview</option>
                    <option value="marketplace">Marketplace</option>
                    <option value="exchanges">Exchanges</option>
                    <option value="messages">Messages</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-heading">Default Marketplace View</label>
                  <select 
                    value={formData.defaultMarketplaceView}
                    onChange={(e) => {
                      handleChange("defaultMarketplaceView", e.target.value);
                      saveWrapper(() => handleSave({ ...formData, defaultMarketplaceView: e.target.value }));
                    }}
                    className="w-full p-3 bg-surface border border-border rounded-lg text-body focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                  >
                    <option value="requests">Requests</option>
                    <option value="professionals">Professionals</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-heading">Exchange View</label>
                  <select 
                    value={formData.exchangeView}
                    onChange={(e) => {
                      handleChange("exchangeView", e.target.value);
                      saveWrapper(() => handleSave({ ...formData, exchangeView: e.target.value }));
                    }}
                    className="w-full p-3 bg-surface border border-border rounded-lg text-body focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                  >
                    <option value="chat_first">Chat First</option>
                    <option value="milestones_first">Milestones First</option>
                    <option value="activity_first">Activity First</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-heading">Calendar Week Starts On</label>
                  <select 
                    value={formData.weekStartsOn}
                    onChange={(e) => {
                      handleChange("weekStartsOn", e.target.value);
                      saveWrapper(() => handleSave({ ...formData, weekStartsOn: e.target.value }));
                    }}
                    className="w-full p-3 bg-surface border border-border rounded-lg text-body focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                  >
                    <option value="sunday">Sunday</option>
                    <option value="monday">Monday</option>
                  </select>
                </div>
              </div>
            </section>

            {/* Exchange Preferences */}
            <section className="space-y-4">
              <h3 className="text-xl font-bold text-heading">Exchange Preferences</h3>
              <p className="text-sm text-muted">These settings improve marketplace matching behind the scenes without cluttering your public profile.</p>
              <div className="bg-background border border-border rounded-xl p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-heading">Preferred Collaboration Hours</label>
                  <select 
                    value={formData.preferredHours}
                    onChange={(e) => {
                      handleChange("preferredHours", e.target.value);
                      saveWrapper(() => handleSave({ ...formData, preferredHours: e.target.value }));
                    }}
                    className="w-full p-3 bg-surface border border-border rounded-lg text-body focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                  >
                    <option value="flexible">Flexible</option>
                    <option value="weekdays">Weekdays Only</option>
                    <option value="weekends">Weekends Only</option>
                    <option value="evenings">Evenings</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-heading">Max Concurrent Exchanges</label>
                  <input 
                    type="number" 
                    value={formData.maxConcurrentExchanges}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      handleChange("maxConcurrentExchanges", isNaN(val) ? 1 : val);
                    }}
                    onBlur={() => saveWrapper(() => handleSave(formData))}
                    className="w-full p-3 bg-surface border border-border rounded-lg text-body focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                    min="1"
                    max="20"
                  />
                </div>
                <div className="md:col-span-2 pt-4 border-t border-border flex items-center justify-between">
                  <div>
                    <span className="block text-sm font-bold text-heading">Require Reciprocal Exchanges</span>
                    <span className="block text-xs text-muted">Only allow users offering a skill swap to request an exchange. Disables one-way skill sharing.</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={formData.openToReciprocalOnly}
                      onChange={() => {
                        handleToggle("openToReciprocalOnly");
                        saveWrapper(() => handleSave({ ...formData, openToReciprocalOnly: !formData.openToReciprocalOnly }));
                      }}
                    />
                    <div className="w-11 h-6 bg-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>
              </div>
            </section>
            
          </div>
        )}
      </AutoSaveWrapper>
    </div>
  );
}
