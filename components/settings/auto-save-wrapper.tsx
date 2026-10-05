"use client";

import { ReactNode, useState } from "react";
import { usePreferences } from "./preferences-provider";
import { SaveQueue } from "@/lib/save-queue";
import { Check, AlertCircle, Loader2 } from "lucide-react";

interface AutoSaveWrapperProps {
  children: (props: {
    isSaving: boolean;
    saveState: "idle" | "saved" | "error";
    handleSave: (saveFn: () => Promise<unknown>) => Promise<void>;
  }) => ReactNode;
}

export function AutoSaveWrapper({ children }: AutoSaveWrapperProps) {
  const preferences = usePreferences();
  const [isSaving, setIsSaving] = useState(false);
  const [saveState, setSaveState] = useState<"idle" | "saved" | "error">(
    "idle",
  );
  const [error, setError] = useState("");
  const [queue] = useState(() => new SaveQueue());
  const handleSave = async (saveFn: () => Promise<unknown>) => {
    setIsSaving(true);
    if (!queue.hasFailures) setSaveState("idle");
    await queue.save(saveFn);
    setIsSaving(queue.pending > 0);
    setSaveState(queue.hasFailures ? "error" : "saved");
    setError(queue.error);
  };

  return (
    <div className="relative pt-10">
      {children({ isSaving, saveState, handleSave })}

      {/* Absolute positioned indicator, usually goes top right of a section or next to the section title */}
      <div
        className="absolute top-0 left-0 right-0 flex flex-wrap items-center gap-2"
        role="status"
        aria-live={preferences.screenReaderOptimizations ? "polite" : "off"}
      >
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
            <AlertCircle className="w-3.5 h-3.5" /> Couldn't save changes.{" "}
            {error}
          </span>
        )}
        {saveState === "error" && !isSaving && (
          <button
            type="button"
            className="text-xs font-bold underline"
            onClick={async () => {
              const retries = queue.takeFailures();
              for (const save of retries) await handleSave(save);
            }}
          >
            Retry
          </button>
        )}
      </div>
    </div>
  );
}
