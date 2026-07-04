"use client";

import { useState, useCallback } from "react";
import { OnboardingData } from "../onboarding-wizard";
import { Camera, Loader2, X, Check } from "lucide-react";
import { uploadFile } from "@/app/actions/upload";
import toast from "react-hot-toast";
import Cropper from "react-easy-crop";
import Select from "react-select";
import { getNames } from "country-list";

// Pre-compute formatted timezones with UTC offsets
const timeZonesWithOffsets = Intl.supportedValuesOf('timeZone').map(tz => {
  try {
    const parts = new Intl.DateTimeFormat('en', { timeZone: tz, timeZoneName: 'longOffset' }).formatToParts(new Date());
    const offsetString = parts.find(p => p.type === 'timeZoneName')?.value || 'GMT+00:00';
    const utcOffset = offsetString === 'GMT' ? 'UTC+00:00' : offsetString.replace('GMT', 'UTC');
    return {
      id: tz,
      label: `(${utcOffset}) ${tz.replace(/_/g, ' ')}`
    };
  } catch (e) {
    return { id: tz, label: tz };
  }
}).sort((a, b) => a.label.localeCompare(b.label));

// Title casing utility
const titleCase = (str: string) => {
  return str.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

// Utility to create the cropped image blob
const getCroppedImg = async (imageSrc: string, pixelCrop: any): Promise<Blob | null> => {
  const image = new Image();
  image.src = imageSrc;
  await new Promise((resolve) => (image.onload = resolve));

  const canvas = document.createElement("canvas");
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;
  const ctx = canvas.getContext("2d");

  if (!ctx) return null;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), "image/jpeg", 0.9);
  });
};

interface StepProps {
  data: OnboardingData;
  updateData: (fields: Partial<OnboardingData>) => void;
}

export default function Step1About({ data, updateData }: StepProps) {
  const [isUploading, setIsUploading] = useState(false);
  
  // Cropper State
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  // Profession State
  const predefinedProfessions = [
    "Frontend Developer", "Backend Developer", "Fullstack Developer", "Mobile Developer", 
    "Game Developer", "DevOps Engineer", "Data Scientist", "Data Analyst", 
    "AI / Machine Learning", "Cyber Security", "UI Designer", "UX Designer", 
    "Product Designer", "Graphic Designer", "Motion Designer", "3D Artist", 
    "Illustrator", "Video Editor", "Audio Engineer", "Copywriter", "Technical Writer", 
    "Content Creator", "Digital Marketer", "SEO Specialist", "Social Media Manager", 
    "Product Manager", "Project Manager", "No-Code Developer", "Founder / Entrepreneur"
  ];
  const isCustomProfession = data.headline && !predefinedProfessions.includes(data.headline);
  const [professionSelect, setProfessionSelect] = useState(isCustomProfession ? "Other" : data.headline);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setImageToCrop(reader.result as string);
    };
    reader.readAsDataURL(file);
    e.target.value = ""; // reset input
  };

  const onCropComplete = useCallback((croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleUploadCropped = async () => {
    if (!imageToCrop || !croppedAreaPixels) return;

    setIsUploading(true);
    try {
      const croppedBlob = await getCroppedImg(imageToCrop, croppedAreaPixels);
      if (!croppedBlob) throw new Error("Failed to crop image");

      const file = new File([croppedBlob], `avatar-${Date.now()}.jpg`, { type: "image/jpeg" });

      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "avatars");

      const result = await uploadFile(formData);

      if (result.success && result.url) {
        updateData({ photoUrl: result.url });
        toast.success("Profile photo uploaded!");
        setImageToCrop(null); // close modal
      } else {
        toast.error(result.error || "Failed to upload photo");
      }
    } catch (err: any) {
      toast.error(err.message || "An error occurred during upload");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="text-center mb-8">
        <p className="text-body mb-2">This information helps other members get to know you.</p>
      </div>

      {/* Profile Photo */}
      <div className="flex flex-col items-center sm:flex-row sm:items-start gap-6">
        <div className="relative group">
          <div className="w-24 h-24 rounded-full overflow-hidden bg-background border border-border flex items-center justify-center shadow-sm">
            {data.photoUrl ? (
              <img src={data.photoUrl} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <Camera className="w-8 h-8 text-muted" />
            )}
          </div>
          
          <label className="absolute inset-0 flex items-center justify-center bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
            {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <span className="text-xs font-medium">Upload</span>}
            <input 
              type="file" 
              accept="image/jpeg,image/png,image/webp" 
              className="hidden" 
              onChange={handleFileSelect}
              disabled={isUploading}
            />
          </label>
        </div>
        <div className="text-center sm:text-left pt-2">
          <h3 className="font-medium text-heading">Profile Photo</h3>
          <p className="text-xs text-muted mt-1">Recommended: Square, at least 500x500px.</p>
          <p className="text-xs text-muted">Max size: 5MB.</p>
        </div>
      </div>

      {/* Cropper Modal */}
      {imageToCrop && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-surface border border-border rounded-[var(--radius-card)] overflow-hidden w-full max-w-md shadow-lg flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-border bg-background">
              <h3 className="font-bold text-heading">Crop Photo</h3>
              <button 
                onClick={() => setImageToCrop(null)}
                disabled={isUploading}
                className="text-muted hover:text-heading"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="relative h-80 bg-black/90">
              <Cropper
                image={imageToCrop}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
              />
            </div>
            
            <div className="p-4 bg-background border-t border-border space-y-4">
              <div className="flex items-center gap-4">
                <span className="text-xs font-medium text-muted">Zoom</span>
                <input
                  type="range"
                  value={zoom}
                  min={1}
                  max={3}
                  step={0.1}
                  aria-labelledby="Zoom"
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="w-full accent-primary"
                />
              </div>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setImageToCrop(null)}
                  disabled={isUploading}
                  className="px-4 py-2 text-sm font-medium text-body hover:text-heading transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUploadCropped}
                  disabled={isUploading}
                  className="px-6 py-2 bg-primary text-surface font-bold text-sm rounded-[var(--radius-button)] shadow-sm hover:bg-primary-hover transition-colors flex items-center gap-2"
                >
                  {isUploading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {isUploading ? "Uploading..." : "Save & Upload"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {/* Full Name */}
        <div>
          <label className="block text-sm font-medium text-heading mb-1">Full Name</label>
          <input
            type="text"
            value={data.fullName}
            onChange={(e) => updateData({ fullName: e.target.value })}
            className="w-full bg-background border border-border rounded-[var(--radius-input)] px-3 py-2 text-sm focus:outline-none focus:border-primary text-body"
            placeholder="Jane Doe"
          />
        </div>

        {/* Profession */}
        <div>
          <label className="block text-sm font-medium text-heading mb-1">Primary Profession</label>
          <select 
            value={professionSelect} 
            onChange={(e) => {
              const val = e.target.value;
              setProfessionSelect(val);
              if (val !== "Other") {
                updateData({ headline: val });
              } else {
                updateData({ headline: "" });
              }
            }} 
            className="w-full bg-background border border-border rounded-[var(--radius-input)] px-3 py-2 text-sm focus:outline-none focus:border-primary text-body appearance-none"
          >
            <option value="" disabled>Select a profession...</option>
            {predefinedProfessions.map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
            <option value="Other">Other</option>
          </select>
          {professionSelect === "Other" && (
            <input 
              type="text" 
              value={data.headline}
              onChange={(e) => updateData({ headline: titleCase(e.target.value) })}
              placeholder="Please specify your profession..." 
              className="w-full mt-2 bg-background border border-border rounded-[var(--radius-input)] px-3 py-2 text-sm focus:outline-none focus:border-primary text-body" 
            />
          )}
        </div>

        {/* Bio */}
        <div>
          <label className="block text-sm font-medium text-heading mb-1">Short Bio</label>
          <textarea
            value={data.bio}
            onChange={(e) => updateData({ bio: e.target.value })}
            maxLength={300}
            rows={4}
            className="w-full bg-background border border-border rounded-[var(--radius-input)] px-3 py-2 text-sm focus:outline-none focus:border-primary text-body resize-none"
            placeholder="Tell the community about yourself, your experience, and what you enjoy working on."
          />
          <div className="text-right text-xs text-muted mt-1">
            {data.bio.length} / 300
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Country */}
          <div className="z-20">
            <label className="block text-sm font-medium text-heading mb-1">Country</label>
            <Select 
              instanceId="country-select"
              options={getNames().map(c => ({ value: c, label: c }))}
              value={data.country ? { value: data.country, label: data.country } : null}
              onChange={(option: any) => updateData({ country: option?.value || "" })}
              placeholder="e.g. United States"
              unstyled
              classNames={{
                control: (state) => `flex min-h-[38px] w-full bg-background border ${state.isFocused ? 'border-primary' : 'border-border'} rounded-[var(--radius-input)] px-3 py-0.5 focus:outline-none transition-colors cursor-pointer`,
                input: () => `text-body text-sm`,
                singleValue: () => `text-body text-sm`,
                placeholder: () => `text-muted text-sm`,
                menu: () => `mt-1 bg-surface border border-border rounded-[var(--radius-input)] shadow-subtle overflow-hidden z-50`,
                menuList: () => `p-1 max-h-48 overflow-y-auto`,
                option: (state) => `px-3 py-1.5 cursor-pointer rounded-md transition-colors text-sm ${state.isSelected ? 'bg-primary/10 text-primary font-medium' : state.isFocused ? 'bg-background text-body' : 'bg-transparent text-body'}`,
                dropdownIndicator: () => `text-muted hover:text-heading cursor-pointer`,
                indicatorSeparator: () => `hidden`,
              }}
            />
          </div>

          {/* Time Zone */}
          <div className="z-10">
            <label className="block text-sm font-medium text-heading mb-1">Time Zone</label>
            <Select 
              instanceId="timezone-select"
              options={timeZonesWithOffsets.map(tz => ({ value: tz.label, label: tz.label }))}
              value={data.timeZone ? { value: data.timeZone, label: data.timeZone } : null}
              onChange={(option: any) => updateData({ timeZone: option?.value || "" })}
              placeholder="e.g. (UTC-05:00) America/New York"
              unstyled
              classNames={{
                control: (state) => `flex min-h-[38px] w-full bg-background border ${state.isFocused ? 'border-primary' : 'border-border'} rounded-[var(--radius-input)] px-3 py-0.5 focus:outline-none transition-colors cursor-pointer`,
                input: () => `text-body text-sm`,
                singleValue: () => `text-body text-sm truncate max-w-[90%]`,
                placeholder: () => `text-muted text-sm`,
                menu: () => `mt-1 bg-surface border border-border rounded-[var(--radius-input)] shadow-subtle overflow-hidden z-50`,
                menuList: () => `p-1 max-h-48 overflow-y-auto`,
                option: (state) => `px-3 py-1.5 cursor-pointer rounded-md transition-colors text-sm ${state.isSelected ? 'bg-primary/10 text-primary font-medium' : state.isFocused ? 'bg-background text-body' : 'bg-transparent text-body'}`,
                dropdownIndicator: () => `text-muted hover:text-heading cursor-pointer`,
                indicatorSeparator: () => `hidden`,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
