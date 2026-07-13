"use client";

import { ReactNode, useState } from "react";
import { Check, AlertCircle, Loader2 } from "lucide-react";

interface AutoSaveWrapperProps {
  children: (props: {
    isSaving: boolean;
    saveState: "idle" | "saved" | "error";
    handleSave: (saveFn: () => Promise<any>) => Promise<void>;
  }) => ReactNode;
}

export function AutoSaveWrapper({ children }: AutoSaveWrapperProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [saveState, setSaveState] = useState<"idle" | "saved" | "error">("idle");

  const handleSave = async (saveFn: () => Promise<any>) => {
    setIsSaving(true);
    setSaveState("idle");
    try {
      await saveFn();
      setSaveState("saved");
      setTimeout(() => setSaveState("idle"), 3000);
    } catch (error) {
      console.error(error);
      setSaveState("error");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="relative">
      {children({ isSaving, saveState, handleSave })}
      
      {/* Absolute positioned indicator, usually goes top right of a section or next to the section title */}
      <div className="absolute -top-1 right-0 flex items-center justify-end">
        {isSaving && (
          <span className="flex items-center gap-1.5 text-xs font-medium text-muted">
            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving...
          </span>
        )}
        {saveState === "saved" && !isSaving && (
          <span className="flex items-center gap-1.5 text-xs font-bold text-success animate-in fade-in zoom-in duration-300">
            <Check className="w-3.5 h-3.5" /> Changes saved automatically
          </span>
        )}
        {saveState === "error" && !isSaving && (
          <span className="flex items-center gap-1.5 text-xs font-bold text-error animate-in fade-in zoom-in duration-300">
            <AlertCircle className="w-3.5 h-3.5" /> Couldn't save changes
          </span>
        )}
      </div>
    </div>
  );
}
