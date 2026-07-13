"use client";

import { useState } from "react";
import { AutoSaveWrapper } from "./auto-save-wrapper";
import { updateUserProfile } from "@/app/actions/user";

export function PrivacyClient({ user }: { user: any }) {
  const [formData, setFormData] = useState({
    profileVisibility: user.privacy?.profileVisibility || "public",
    appearInMarketplace: user.privacy?.appearInMarketplace ?? true,
    appearInSearch: user.privacy?.appearInSearch ?? true,
    allowProfileSharing: user.privacy?.allowProfileSharing ?? true,
    contactPreferences: user.privacy?.contactPreferences || "everyone",
    showLastActive: user.privacy?.showLastActive ?? true,
    showCompletedExchanges: user.privacy?.showCompletedExchanges ?? true,
    showTrustScore: user.privacy?.showTrustScore ?? true,
    showReviews: user.privacy?.showReviews ?? true,
    showSkillHourBalance: user.privacy?.showSkillHourBalance ?? false,
    showPortfolio: user.privacy?.showPortfolio ?? true,
    showBadges: user.privacy?.showBadges ?? true,
  });

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleToggle = (field: string) => {
    setFormData((prev: any) => ({ ...prev, [field]: !prev[field] }));
  };

  const handleSave = async (data: any) => {
    await updateUserProfile({ privacy: data });
  };

  return (
    <div className="space-y-12">
      <AutoSaveWrapper>
        {({ saveState, handleSave: saveWrapper }) => (
          <div className="space-y-12">
            
            {/* Profile Visibility */}
            <section className="space-y-4">
              <h3 className="text-xl font-bold text-heading">Profile Visibility</h3>
              <div className="bg-background border border-border rounded-xl overflow-hidden divide-y divide-border">
                <label className="flex items-center p-4 cursor-pointer hover:bg-surface-secondary transition-colors">
                  <input 
                    type="radio" 
                    name="profileVisibility" 
                    value="public"
                    checked={formData.profileVisibility === "public"}
                    onChange={() => {
                      handleChange("profileVisibility", "public");
                      saveWrapper(() => handleSave({ ...formData, profileVisibility: "public" }));
                    }}
                    className="w-4 h-4 text-primary focus:ring-primary border-border"
                  />
                  <div className="ml-3">
                    <span className="block text-sm font-bold text-heading">Public</span>
                    <span className="block text-sm text-muted">Anyone on the internet can see your profile.</span>
                  </div>
                </label>
                <label className="flex items-center p-4 cursor-pointer hover:bg-surface-secondary transition-colors">
                  <input 
                    type="radio" 
                    name="profileVisibility" 
                    value="members"
                    checked={formData.profileVisibility === "members"}
                    onChange={() => {
                      handleChange("profileVisibility", "members");
                      saveWrapper(() => handleSave({ ...formData, profileVisibility: "members" }));
                    }}
                    className="w-4 h-4 text-primary focus:ring-primary border-border"
                  />
                  <div className="ml-3">
                    <span className="block text-sm font-bold text-heading">Members Only</span>
                    <span className="block text-sm text-muted">Only logged-in Weave members can see your profile.</span>
                  </div>
                </label>
                <label className="flex items-center p-4 cursor-pointer hover:bg-surface-secondary transition-colors">
                  <input 
                    type="radio" 
                    name="profileVisibility" 
                    value="hidden"
                    checked={formData.profileVisibility === "hidden"}
                    onChange={() => {
                      handleChange("profileVisibility", "hidden");
                      saveWrapper(() => handleSave({ ...formData, profileVisibility: "hidden" }));
                    }}
                    className="w-4 h-4 text-primary focus:ring-primary border-border"
                  />
                  <div className="ml-3">
                    <span className="block text-sm font-bold text-heading">Hidden</span>
                    <span className="block text-sm text-muted">Your profile is completely hidden from everyone.</span>
                  </div>
                </label>
              </div>
            </section>

            {/* Search Visibility */}
            <section className="space-y-4">
              <h3 className="text-xl font-bold text-heading">Search Visibility</h3>
              <div className="bg-background border border-border rounded-xl overflow-hidden divide-y divide-border">
                <div className="flex items-center justify-between p-4">
                  <div>
                    <span className="block text-sm font-bold text-heading">Appear in Marketplace</span>
                    <span className="block text-sm text-muted">Allow others to find you when browsing professionals.</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={formData.appearInMarketplace}
                      onChange={() => {
                        handleToggle("appearInMarketplace");
                        saveWrapper(() => handleSave({ ...formData, appearInMarketplace: !formData.appearInMarketplace }));
                      }}
                    />
                    <div className="w-11 h-6 bg-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>
                <div className="flex items-center justify-between p-4">
                  <div>
                    <span className="block text-sm font-bold text-heading">Appear in search</span>
                    <span className="block text-sm text-muted">Allow your profile to show up in general site search.</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={formData.appearInSearch}
                      onChange={() => {
                        handleToggle("appearInSearch");
                        saveWrapper(() => handleSave({ ...formData, appearInSearch: !formData.appearInSearch }));
                      }}
                    />
                    <div className="w-11 h-6 bg-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>
              </div>
            </section>

            {/* Contact Preferences */}
            <section className="space-y-4">
              <h3 className="text-xl font-bold text-heading">Contact Preferences</h3>
              <div className="bg-background border border-border rounded-xl p-4">
                <label className="block text-sm font-bold text-heading mb-2">Allow messages from:</label>
                <select 
                  value={formData.contactPreferences}
                  onChange={(e) => {
                    handleChange("contactPreferences", e.target.value);
                    saveWrapper(() => handleSave({ ...formData, contactPreferences: e.target.value }));
                  }}
                  className="w-full p-3 bg-surface border border-border rounded-lg text-body focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                >
                  <option value="everyone">Everyone</option>
                  <option value="verified">Verified Members</option>
                  <option value="collaborators">Existing Collaborators</option>
                  <option value="nobody">Nobody</option>
                </select>
              </div>
            </section>

            {/* Activity Visibility */}
            <section className="space-y-4">
              <h3 className="text-xl font-bold text-heading">Activity Visibility</h3>
              <p className="text-sm text-muted">Choose whether others can see these details on your profile.</p>
              
              <div className="bg-background border border-border rounded-xl overflow-hidden divide-y divide-border">
                {[
                  { id: "showLastActive", label: "Last Active" },
                  { id: "showCompletedExchanges", label: "Completed Exchanges" },
                  { id: "showTrustScore", label: "Trust Score" },
                  { id: "showReviews", label: "Reviews" },
                  { id: "showSkillHourBalance", label: "Skill Hour Balance", note: "Recommended OFF" },
                  { id: "showPortfolio", label: "Portfolio" },
                  { id: "showBadges", label: "Badges" },
                ].map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-4">
                    <div>
                      <span className="block text-sm font-bold text-heading">
                        {item.label} {item.note && <span className="ml-2 text-[10px] uppercase tracking-wider text-muted border border-border px-1.5 py-0.5 rounded bg-surface-secondary">{item.note}</span>}
                      </span>
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
            </section>
            
          </div>
        )}
      </AutoSaveWrapper>
    </div>
  );
}
