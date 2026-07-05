"use client";

import { useState, useRef, useCallback } from "react";
import { User, UserSkill } from "@/types";
import { saveProfileSettings, updateUserSchedule } from "@/app/actions/user";
import { useRouter } from "next/navigation";
import { Loader2, Camera, Check, X, Lock } from "lucide-react";
import Cropper from "react-easy-crop";
import { getCroppedImg } from "@/lib/crop-image";
import Image from "next/image";
import Select from "react-select";
import ScheduleSettings from "./schedule-settings";

interface EditProfileFormProps {
  user: User;
}

export default function EditProfileForm({ user }: EditProfileFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Crop states
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [isCropping, setIsCropping] = useState(false);
  
  // Final image states
  const [croppedFile, setCroppedFile] = useState<File | null>(null);
  const [previewURL, setPreviewURL] = useState<string | null>(user.photoURL || (user as any).photoUrl || null);

  // Dropdown states
  const [selectedAvailability, setSelectedAvailability] = useState(user.availability || "");
  const [schedule, setSchedule] = useState(user.schedule);
  
  // Pre-process skills to comma-separated strings
  const initialSkillsOffered = (user.skillsOffered || []).map(skill => {
    return typeof skill === 'string' ? skill : skill.name;
  }).join(", ");
  
  const initialSkillsLookingFor = (user.skillsLookingFor || []).join(", ");

  const onCropComplete = useCallback((croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError("Image must be smaller than 5MB");
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }
      setError(null);
      
      const reader = new FileReader();
      reader.onload = () => {
        setImageSrc(reader.result as string);
        setIsCropping(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleApplyCrop = async () => {
    try {
      if (!imageSrc || !croppedAreaPixels) return;
      
      const croppedImageFile = await getCroppedImg(imageSrc, croppedAreaPixels);
      if (croppedImageFile) {
        setCroppedFile(croppedImageFile);
        setPreviewURL(URL.createObjectURL(croppedImageFile));
        setIsCropping(false);
      }
    } catch (e) {
      console.error(e);
      setError("Failed to crop image.");
    }
  };

  const handleCancelCrop = () => {
    setIsCropping(false);
    setImageSrc(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const formData = new FormData(e.currentTarget);
      
      if (croppedFile) {
        formData.set("photo", croppedFile);
      } else {
        formData.delete("photo");
      }

      const result = await saveProfileSettings(formData);
      
      if (result.success && schedule) {
         // Also update the complex schedule object
         await updateUserSchedule(user.uid, schedule);
      }
      
      if (result.error) {
        throw new Error(result.error);
      }

      router.push(`/u/${user.username}`);
      router.refresh();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to update profile. Please try again.");
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {error && (
        <div className="p-4 bg-error/10 border border-error/20 text-error rounded-xl font-medium">
          {error}
        </div>
      )}

      {isCropping && imageSrc ? (
        <div className="bg-surface border border-border rounded-[var(--radius-card)] p-6 shadow-subtle flex flex-col items-center">
          <h2 className="text-xl font-bold text-heading mb-6 w-full">Crop Profile Picture</h2>
          <div className="relative w-full max-w-md h-[400px] bg-black/10 rounded-xl overflow-hidden mb-6">
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={1} // 1:1 Square aspect ratio
              cropShape="round"
              showGrid={false}
              onCropChange={setCrop}
              onCropComplete={onCropComplete}
              onZoomChange={setZoom}
            />
          </div>
          
          <div className="w-full max-w-md flex items-center gap-4 mb-8">
            <span className="text-xs font-bold text-muted uppercase">Zoom</span>
            <input
              type="range"
              value={zoom}
              min={1}
              max={3}
              step={0.1}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-full accent-primary"
            />
          </div>
          
          <div className="flex w-full max-w-md gap-4">
            <button 
              onClick={handleCancelCrop}
              className="flex-1 py-2.5 text-sm font-bold text-muted bg-surface-secondary rounded-[var(--radius-button)] hover:text-heading transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={handleApplyCrop}
              className="flex-1 py-2.5 bg-primary text-surface font-bold text-sm rounded-[var(--radius-button)] hover:bg-primary-hover transition-colors shadow-subtle flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" />
              Apply
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Section: Profile Picture */}
          <section className="bg-surface border border-border rounded-[var(--radius-card)] p-6 shadow-subtle">
            <h2 className="text-xl font-bold text-heading mb-6 border-b border-border pb-2">Profile Picture</h2>
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div 
                className="relative w-32 h-32 rounded-full border-4 border-surface-secondary bg-surface-secondary flex items-center justify-center overflow-hidden flex-shrink-0 group cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                {previewURL ? (
                  <Image src={previewURL} alt="Avatar Preview" fill className="object-cover" />
                ) : (
                  <span className="text-4xl font-bold text-muted">{user.fullName.charAt(0).toUpperCase()}</span>
                )}
                
                <div className="absolute inset-0 bg-background/0 group-hover:bg-background/50 transition-colors flex flex-col items-center justify-center opacity-0 group-hover:opacity-100">
                  <Camera className="w-6 h-6 text-heading mb-1" />
                  <span className="text-xs font-bold text-heading">Change</span>
                </div>
              </div>
              <div className="text-center sm:text-left">
                <p className="text-sm font-medium text-heading">Upload a professional photo</p>
                <p className="text-xs text-muted mt-1 mb-4">Max size 5MB. JPG, PNG, or WEBP.</p>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 bg-surface-secondary text-heading text-sm font-bold rounded-[var(--radius-button)] hover:bg-border transition-colors border border-border"
                >
                  Choose File
                </button>
                <input 
                  type="file" 
                  accept="image/jpeg,image/png,image/webp" 
                  className="hidden" 
                  ref={fileInputRef}
                  onChange={handleImageChange}
                />
              </div>
            </div>
          </section>

          {/* Section: Basic Info */}
          <section className="bg-surface border border-border rounded-[var(--radius-card)] p-6 shadow-subtle space-y-5">
            <h2 className="text-xl font-bold text-heading border-b border-border pb-2">Basic Info</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label htmlFor="fullName" className="block text-sm font-bold text-heading mb-2">Full Name *</label>
                <input 
                  type="text" 
                  id="fullName" 
                  name="fullName"
                  defaultValue={user.fullName}
                  required 
                  maxLength={50}
                  className="w-full bg-background border border-border rounded-[var(--radius-button)] px-4 py-2.5 text-body focus:outline-none focus:border-primary transition-colors"
                />
              </div>
              <div>
                <label htmlFor="headline" className="block text-sm font-bold text-heading mb-2">Headline</label>
                <input 
                  type="text" 
                  id="headline" 
                  name="headline"
                  defaultValue={user.headline || user.profession}
                  maxLength={60}
                  placeholder="e.g. Senior Frontend Developer"
                  className="w-full bg-background border border-border rounded-[var(--radius-button)] px-4 py-2.5 text-body focus:outline-none focus:border-primary transition-colors"
                />
              </div>
              <div className="z-20">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-bold text-heading">Country / Region</label>
                  <button type="button" onClick={() => alert("Change requests coming soon")} className="text-xs font-bold text-primary hover:text-primary-hover transition-colors">Request Change</button>
                </div>
                <div className="w-full bg-surface-secondary border border-border rounded-[var(--radius-button)] px-4 py-2.5 text-body flex items-center justify-between opacity-80 cursor-not-allowed">
                  <span className="truncate">{user.country || "Not set"}</span>
                  <Lock className="w-4 h-4 text-muted flex-shrink-0 ml-2" />
                </div>
                <p className="text-[10px] text-muted mt-1.5 leading-tight">Country is locked for marketplace security.</p>
              </div>
              <div className="z-10">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-bold text-heading">Time Zone</label>
                  <button type="button" onClick={() => alert("Change requests coming soon")} className="text-xs font-bold text-primary hover:text-primary-hover transition-colors">Request Change</button>
                </div>
                <div className="w-full bg-surface-secondary border border-border rounded-[var(--radius-button)] px-4 py-2.5 text-body flex items-center justify-between opacity-80 cursor-not-allowed">
                  <span className="truncate">{user.timeZone || "Not set"}</span>
                  <Lock className="w-4 h-4 text-muted flex-shrink-0 ml-2" />
                </div>
                <p className="text-[10px] text-muted mt-1.5 leading-tight">Timezone is locked for marketplace security.</p>
              </div>
            </div>
          </section>

          {/* Section: About */}
          <section className="bg-surface border border-border rounded-[var(--radius-card)] p-6 shadow-subtle space-y-5">
            <h2 className="text-xl font-bold text-heading border-b border-border pb-2">About You</h2>
            
            <div>
              <label htmlFor="bio" className="block text-sm font-bold text-heading mb-2">Bio</label>
              <textarea 
                id="bio" 
                name="bio"
                defaultValue={user.bio}
                rows={4}
                maxLength={500}
                placeholder="Tell the community about yourself, your experience, and what you're passionate about..."
                className="w-full bg-background border border-border rounded-xl px-4 py-3 text-body focus:outline-none focus:border-primary transition-colors resize-none"
              />
            </div>
            
            <div className="z-0">
              <label htmlFor="availability" className="block text-sm font-bold text-heading mb-2">Availability (Hours/Week)</label>
              <input type="hidden" name="availability" value={selectedAvailability} />
              <Select
                instanceId="availability-select"
                options={[
                  { value: "Less than 5 hrs/week", label: "Less than 5 hrs/week" },
                  { value: "5–10 hrs/week", label: "5–10 hrs/week" },
                  { value: "10–20 hrs/week", label: "10–20 hrs/week" },
                  { value: "20+ hrs/week", label: "20+ hrs/week" },
                ]}
                value={selectedAvailability ? { value: selectedAvailability, label: selectedAvailability } : null}
                onChange={(option: any) => setSelectedAvailability(option?.value || "")}
                placeholder="How much time can you dedicate?"
                isSearchable={false}
                unstyled
                classNames={{
                  control: (state) => `flex min-h-[42px] w-full bg-background border ${state.isFocused ? 'border-primary' : 'border-border'} rounded-[var(--radius-button)] px-4 py-1 focus:outline-none transition-colors cursor-pointer`,
                  input: () => `text-body`,
                  singleValue: () => `text-body`,
                  placeholder: () => `text-muted`,
                  menu: () => `mt-1 bg-surface border border-border rounded-[var(--radius-input)] shadow-subtle overflow-hidden z-10`,
                  menuList: () => `p-1`,
                  option: (state) => `px-4 py-2 cursor-pointer rounded-md transition-colors ${state.isSelected ? 'bg-primary/10 text-primary font-bold' : state.isFocused ? 'bg-background text-body' : 'bg-transparent text-body'}`,
                  dropdownIndicator: () => `text-muted hover:text-heading cursor-pointer`,
                  indicatorSeparator: () => `hidden`,
                }}
              />
            </div>
          </section>

          {/* Section: Schedule & Availability */}
          <section className="bg-surface border border-border rounded-[var(--radius-card)] p-6 shadow-subtle space-y-5">
            <h2 className="text-xl font-bold text-heading border-b border-border pb-2">Schedule & Availability</h2>
            <ScheduleSettings user={user} value={schedule} onChange={setSchedule} />
          </section>

          {/* Section: Skills */}
          <section className="bg-surface border border-border rounded-[var(--radius-card)] p-6 shadow-subtle space-y-5">
            <h2 className="text-xl font-bold text-heading border-b border-border pb-2">Skills</h2>
            
            <div>
              <label htmlFor="skillsOffered" className="block text-sm font-bold text-heading mb-2">Skills Offered</label>
              <input 
                type="text" 
                id="skillsOffered" 
                name="skillsOffered"
                defaultValue={initialSkillsOffered}
                placeholder="e.g. React, UI Design, Copywriting (comma separated)"
                className="w-full bg-background border border-border rounded-[var(--radius-button)] px-4 py-2.5 text-body focus:outline-none focus:border-primary transition-colors"
              />
              <p className="text-xs text-muted mt-1.5">Skills you are willing to trade. Separate with commas.</p>
            </div>
            
            <div>
              <label htmlFor="skillsLookingFor" className="block text-sm font-bold text-heading mb-2">Skills Looking For</label>
              <input 
                type="text" 
                id="skillsLookingFor" 
                name="skillsLookingFor"
                defaultValue={initialSkillsLookingFor}
                placeholder="e.g. SEO, Legal Advice, Backend Development (comma separated)"
                className="w-full bg-background border border-border rounded-[var(--radius-button)] px-4 py-2.5 text-body focus:outline-none focus:border-primary transition-colors"
              />
              <p className="text-xs text-muted mt-1.5">Skills you need help with. Separate with commas.</p>
            </div>
          </section>

          <div className="flex items-center justify-end gap-4 pt-4">
            <button 
              type="button"
              onClick={() => router.push(`/u/${user.username}`)}
              disabled={isSubmitting}
              className="px-6 py-2.5 text-sm font-bold text-muted hover:text-heading transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={isSubmitting}
              className="px-8 py-2.5 bg-primary text-surface font-bold text-sm rounded-[var(--radius-button)] hover:bg-primary-hover transition-all shadow-subtle disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Save Profile
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
