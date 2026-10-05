"use client";
import { compressImage } from "@/lib/compress-image";
import { usePreferences } from "@/components/settings/preferences-provider";

import { useState, useRef } from "react";
import { EmailChange } from "./email-change";
import { AutoSaveWrapper } from "./auto-save-wrapper";
import {
  BadgeCheck,
  Calendar,
  Shield,
  Activity,
  Camera,
  Loader2,
} from "lucide-react";
import { updateUserProfile } from "@/app/actions/user";
import { uploadFile } from "@/app/actions/upload";
import { getNames as getCountryNames } from "country-list";
import { calculateTrustScore } from "@/lib/user-metrics";

export function AccountClient({ user }: { user: any }) {
  const preferences = usePreferences();
  const [formData, setFormData] = useState({
    displayName: user.displayName || user.fullName || "",
    username: user.username || "",
    email: user.email || "",
    phone: user.phone || "",
    country: user.country || "",
    timeZone: user.timeZone || user.timezone || "",
    language: user.language || "en",
  });

  const current = useRef(formData);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const countries = getCountryNames().sort();

  let timezones: string[] = [];
  try {
    timezones = ["UTC", ...Intl.supportedValuesOf("timeZone")];
  } catch (e) {
    // Fallback for older browsers
    timezones = [
      "UTC",
      "America/New_York",
      "America/Chicago",
      "America/Denver",
      "America/Los_Angeles",
      "Europe/London",
      "Europe/Paris",
      "Asia/Tokyo",
    ];
  }

  const handleChange = (field: string, value: string) => {
    current.current = { ...current.current, [field]: value };
    setFormData(current.current);
  };

  const saveField = (field: keyof typeof formData) =>
    updateUserProfile({ [field]: current.current[field] });

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const form = new FormData();
    form.append(
      "file",
      await compressImage(file, preferences.compressImages === true),
    );
    form.append("folder", "avatars");

    try {
      const res = await uploadFile(form);
      if (res.success && res.url) {
        const result = await updateUserProfile({ photoURL: res.url });
        if (result.error) throw new Error(result.error);
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
    const result = await updateUserProfile({ photoURL: "" });
    if (result.error) {
      alert(result.error);
      return;
    }
    window.location.reload();
  };

  return (
    <div className="space-y-10">
      <AutoSaveWrapper>
        {({ saveState, handleSave: saveWrapper }) => (
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-heading">
                Personal Information
              </h3>
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
                ) : user.photoURL || user.photoUrl ? (
                  <img
                    src={user.photoURL || user.photoUrl}
                    alt={user.displayName}
                    className="w-full h-full object-cover"
                  />
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
                <p className="text-sm text-muted mb-2">
                  Upload a professional photo to build trust.
                </p>
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
                <label
                  htmlFor="account-displayName"
                  className="text-sm font-bold text-heading"
                >
                  Display Name
                </label>
                <input
                  type="text"
                  id="account-displayName"
                  value={formData.displayName}
                  onChange={(e) => handleChange("displayName", e.target.value)}
                  onBlur={() => saveWrapper(() => saveField("displayName"))}
                  className="w-full p-3 bg-background border border-border rounded-lg text-body focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                />
              </div>
              <div className="space-y-2">
                <label
                  htmlFor="account-username"
                  className="text-sm font-bold text-heading"
                >
                  Username
                </label>
                <input
                  type="text"
                  id="account-username"
                  value={formData.username}
                  onChange={(e) => handleChange("username", e.target.value)}
                  onBlur={() => saveWrapper(() => saveField("username"))}
                  className="w-full p-3 bg-background border border-border rounded-lg text-body focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                />
              </div>
              <div className="space-y-2">
                <label
                  htmlFor="account-email"
                  className="text-sm font-bold text-heading"
                >
                  Email Address
                </label>
                <input
                  type="email"
                  id="account-email"
                  value={formData.email}
                  disabled
                  className="w-full p-3 bg-surface border border-border rounded-lg text-muted cursor-not-allowed"
                />
              </div>
              <div className="space-y-2">
                <label
                  htmlFor="account-phone"
                  className="text-sm font-bold text-heading"
                >
                  Phone Number (Optional)
                </label>
                <input
                  type="tel"
                  id="account-phone"
                  value={formData.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  onBlur={() => saveWrapper(() => saveField("phone"))}
                  className="w-full p-3 bg-background border border-border rounded-lg text-body focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                />
              </div>
              <div className="space-y-2">
                <label
                  htmlFor="account-country"
                  className="text-sm font-bold text-heading"
                >
                  Country
                </label>
                <select
                  id="account-country"
                  value={formData.country}
                  onChange={(e) => {
                    handleChange("country", e.target.value);
                    saveWrapper(() => saveField("country"));
                  }}
                  className="w-full p-3 bg-background border border-border rounded-lg text-body focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                >
                  <option value="">Select Country</option>
                  {countries.map((country) => (
                    <option key={country} value={country}>
                      {country}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label
                  htmlFor="account-timeZone"
                  className="text-sm font-bold text-heading"
                >
                  Time Zone
                </label>
                <select
                  id="account-timeZone"
                  value={formData.timeZone}
                  onChange={(e) => {
                    handleChange("timeZone", e.target.value);
                    saveWrapper(() => saveField("timeZone"));
                  }}
                  className="w-full p-3 bg-background border border-border rounded-lg text-body focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                >
                  <option value="">Select Time Zone</option>
                  {timezones.map((tz) => (
                    <option key={tz} value={tz}>
                      {tz}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label
                  htmlFor="account-language"
                  className="text-sm font-bold text-heading"
                >
                  Preferred language
                </label>
                <select
                  id="account-language"
                  value={formData.language}
                  onChange={(event) => {
                    handleChange("language", event.target.value);
                    void saveWrapper(() => saveField("language"));
                  }}
                  className="w-full rounded-lg border border-border bg-background p-3 text-body"
                >
                  <option value="en">English</option>
                  <option value="fr">Français</option>
                  <option value="es">Español</option>
                  <option value="pt">Português</option>
                  <option value="ar">العربية</option>
                </select>
                <p className="text-xs text-muted">
                  Used for your account locale. Interface translations will be
                  added as they become available.
                </p>
              </div>
            </div>
          </section>
        )}
      </AutoSaveWrapper>

      <EmailChange />
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
              <span className="font-bold text-heading text-sm">
                Member Since
              </span>
            </div>
            <div className="text-lg font-black text-heading">
              {user.createdAt
                ? new Date(user.createdAt).toLocaleDateString(undefined, {
                    month: "long",
                    year: "numeric",
                  })
                : "Just Joined"}
            </div>
          </div>

          <div className="p-4 bg-background border border-border rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-5 h-5 text-warning" />
              <span className="font-bold text-heading text-sm">
                Current Plan
              </span>
            </div>
            <div className="text-lg font-black text-heading">
              {user.subscriptionTier === "verified" ? "Verified" : "Free"}
            </div>
          </div>

          <div className="p-4 bg-background border border-border rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-5 h-5 text-success" />
              <span className="font-bold text-heading text-sm">
                Trust Score
              </span>
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
