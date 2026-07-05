"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { updateUserProfile, checkUsernameAvailability } from "@/app/actions/user";
import { Loader2, AlertCircle, Check } from "lucide-react";

export default function SetUsernameClient() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [isValidatingUsername, setIsValidatingUsername] = useState(false);

  // Debounced username validation
  useEffect(() => {
    if (!username) {
      setUsernameError(null);
      return;
    }

    const timer = setTimeout(async () => {
      setIsValidatingUsername(true);
      const result = await checkUsernameAvailability(username);
      setIsValidatingUsername(false);
      
      if (!result.available && result.error) {
        setUsernameError(result.error);
      } else {
        setUsernameError(null);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [username]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username || username.trim() === "") {
      toast.error("Please enter a username");
      return;
    }
    
    if (usernameError) {
      toast.error(usernameError);
      return;
    }

    setIsSaving(true);
    const result = await updateUserProfile({ username: username.toLowerCase().replace(/[^a-z0-9_-]/g, "") });
    setIsSaving(false);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Username set successfully!");
      // Force a full refresh so the layout catches the new username and redirects correctly
      window.location.href = `/u/${username.toLowerCase().replace(/[^a-z0-9_]/g, "")}`;
    }
  };

  return (
    <div className="w-full max-w-md bg-surface border border-border p-8 rounded-[var(--radius-card)] shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-heading mb-2">Claim Your Username</h1>
        <p className="text-muted text-sm">
          You need a unique username for your public profile. This is how others will find you on Weave.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-heading mb-1">Username</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-sm font-medium">weave.com/u/</span>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ""))}
              className={`w-full bg-background border rounded-[var(--radius-input)] pl-[105px] pr-10 py-3 text-sm focus:outline-none focus:border-primary text-body transition-colors ${usernameError ? "border-error focus:border-error" : "border-border"}`}
              placeholder="username"
              required
              autoFocus
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center">
              {isValidatingUsername && <Loader2 className="w-4 h-4 text-muted animate-spin" />}
              {!isValidatingUsername && usernameError && <AlertCircle className="w-4 h-4 text-error" />}
              {!isValidatingUsername && !usernameError && username && <Check className="w-4 h-4 text-success" />}
            </div>
          </div>
          {usernameError ? (
            <p className="text-xs text-error mt-2 font-medium text-center">{usernameError}</p>
          ) : (
            <p className="text-xs text-muted mt-2 text-center">Letters (a-z), numbers (0-9), and symbols (- or _) only.</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSaving || !username || !!usernameError || isValidatingUsername}
          className="w-full bg-primary text-surface py-3 rounded-[var(--radius-button)] font-bold shadow-sm hover:bg-primary-hover transition-all disabled:opacity-50 disabled:hover:scale-100 active:scale-95"
        >
          {isSaving ? "Saving..." : "Set Username"}
        </button>
      </form>
    </div>
  );
}
