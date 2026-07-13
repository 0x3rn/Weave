"use client";

import { useState, useRef } from "react";
import { AutoSaveWrapper } from "./auto-save-wrapper";
import { BadgeCheck, Calendar, Shield, Activity, Camera, Loader2 } from "lucide-react";
import { updateUserProfile } from "@/app/actions/user";
import { uploadFile } from "@/app/actions/upload";
import { getNames as getCountryNames } from "country-list";
import { calculateTrustScore } from "@/lib/user-metrics";

export function AccountClient({ user }: { user: any }) {
  const [formData, setFormData] = useState({
    displayName: user.displayName || "",
    username: user.username || "",
    email: user.email || "",
    phone: user.phone || "",
    country: user.country || "",
    timeZone: user.timeZone || user.timezone || "",
    language: user.language || "English",
  });
  
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const countries = getCountryNames().sort();
  
  let timezones: string[] = [];
  try {
    timezones = Intl.supportedValuesOf('timeZone');
  } catch (e) {
    // Fallback for older browsers
    timezones = ["UTC", "America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles", "Europe/London", "Europe/Paris", "Asia/Tokyo"];
  }

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    await updateUserProfile(formData);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const form = new FormData();
    form.append("file", file);
    form.append("folder", "avatars");

    try {
      const res = await uploadFile(form);
      if (res.success && res.url) {
        await updateUserProfile({ photoURL: res.url });
        // Force a page reload to show new avatar everywhere, or rely on state if we passed it up.
        // Easiest is just window.location.reload() since it's a global user object.
        window.location.reload();
      } else {
        alert(res.error || "Failed to upload photo");
      }
    } catch (error) {
      console.error(error);
      alert("An error occurred during upload.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemovePhoto = async () => {
    if (!confirm("Are you sure you want to remove your photo?")) return;
    await updateUserProfile({ photoURL: "" });
    window.location.reload();
  };

  return (
    <div className="space-y-10">
      <AutoSaveWrapper>
        {({ saveState, handleSave: saveWrapper }) => (
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-heading">Personal Information</h3>
            </div>

            <div className="flex items-center gap-6">
              <div 
                className="relative w-24 h-24 rounded-full bg-surface-secondary border-2 border-border overflow-hidden shrink-0 group cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                {isUploading ? (
                  <div className="w-full h-full flex items-center justify-center bg-surface">
                    <Loader2 className="w-8 h-8 text-primary animate-spin" />
                  </div>
                ) : (user.photoURL || user.photoUrl) ? (
                  <img src={user.photoURL || user.photoUrl} alt={user.displayName} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-muted">
                    {user.displayName?.charAt(0) || "U"}
                  </div>
                )}
                {!isUploading && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera className="w-6 h-6 text-white" />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted mb-2">Upload a professional photo to build trust.</p>
                <input 
                  type="file" 
                  accept="image/png, image/jpeg, image/webp" 
                  className="hidden" 
                  ref={fileInputRef}
                  onChange={handlePhotoUpload}
                />
                <div className="flex gap-3">
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="px-4 py-2 bg-secondary hover:bg-secondary/80 text-heading text-sm font-bold rounded-md transition-colors disabled:opacity-50"
                  >
                    {isUploading ? "Uploading..." : "Upload Photo"}
                  </button>
                  {user.photoURL || user.photoUrl ? (
                    <button 
                      onClick={handleRemovePhoto}
                      disabled={isUploading}
                      className="px-4 py-2 bg-transparent text-muted hover:text-error text-sm font-bold transition-colors disabled:opacity-50"
                    >
                      Remove
                    </button>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-heading">Display Name</label>
                <input 
                  type="text" 
                  value={formData.displayName}
                  onChange={(e) => handleChange("displayName", e.target.value)}
                  onBlur={() => saveWrapper(handleSave)}
                  className="w-full p-3 bg-background border border-border rounded-lg text-body focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-heading">Username</label>
                <input 
                  type="text" 
                  value={formData.username}
                  onChange={(e) => handleChange("username", e.target.value)}
                  onBlur={() => saveWrapper(handleSave)}
                  className="w-full p-3 bg-background border border-border rounded-lg text-body focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-heading">Email Address</label>
                <input 
                  type="email" 
                  value={formData.email}
                  disabled
                  className="w-full p-3 bg-surface border border-border rounded-lg text-muted cursor-not-allowed"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-heading">Phone Number (Optional)</label>
                <input 
                  type="tel" 
                  value={formData.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  onBlur={() => saveWrapper(handleSave)}
                  className="w-full p-3 bg-background border border-border rounded-lg text-body focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-heading">Country</label>
                <select 
                  value={formData.country}
                  onChange={(e) => {
                    handleChange("country", e.target.value);
                    saveWrapper(() => updateUserProfile({ ...formData, country: e.target.value }));
                  }}
                  className="w-full p-3 bg-background border border-border rounded-lg text-body focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                >
                  <option value="">Select Country</option>
                  {countries.map(country => (
                    <option key={country} value={country}>{country}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-heading">Time Zone</label>
                <select 
                  value={formData.timeZone}
                  onChange={(e) => {
                    handleChange("timeZone", e.target.value);
                    saveWrapper(() => updateUserProfile({ ...formData, timeZone: e.target.value }));
                  }}
                  className="w-full p-3 bg-background border border-border rounded-lg text-body focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                >
                  <option value="">Select Time Zone</option>
                  {timezones.map(tz => (
                    <option key={tz} value={tz}>{tz}</option>
                  ))}
                </select>
              </div>
            </div>
          </section>
        )}
      </AutoSaveWrapper>

      <div className="h-px bg-border my-8" />

      <section>
        <h3 className="text-xl font-bold text-heading mb-6">Account Status</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 bg-background border border-border rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <BadgeCheck className="w-5 h-5 text-primary" />
              <span className="font-bold text-heading text-sm">Status</span>
            </div>
            <div className="text-lg font-black text-heading">
              {user.isVerified ? "Verified Member" : "Standard Member"}
            </div>
          </div>
          
          <div className="p-4 bg-background border border-border rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-5 h-5 text-muted" />
              <span className="font-bold text-heading text-sm">Member Since</span>
            </div>
            <div className="text-lg font-black text-heading">
              {user.createdAt ? new Date(user.createdAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' }) : "Just Joined"}
            </div>
          </div>

          <div className="p-4 bg-background border border-border rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-5 h-5 text-warning" />
              <span className="font-bold text-heading text-sm">Current Plan</span>
            </div>
            <div className="text-lg font-black text-heading">
              {user.subscriptionTier === "verified" ? "Verified" : "Free"}
            </div>
          </div>

          <div className="p-4 bg-background border border-border rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-5 h-5 text-success" />
              <span className="font-bold text-heading text-sm">Trust Score</span>
            </div>
            <div className="text-lg font-black text-success">
              {calculateTrustScore(user)} / 100
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
