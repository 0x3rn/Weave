"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { saveSettings } from "@/app/actions/settings";
import { useMemberId } from "@/components/settings/preferences-provider";
import toast from "react-hot-toast";
import { Sun, Moon } from "lucide-react";

export function ThemeToggle() {
  const { theme, setTheme, systemTheme } = useTheme();
  const memberId = useMemberId();
  const [busy, setBusy] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="w-9 h-9" />; // Placeholder to avoid layout shift
  }

  const currentTheme = theme === "system" ? systemTheme : theme;

  return (
    <button
      disabled={busy}
      onClick={async () => {
        const next = currentTheme === "dark" ? "light" : "dark";
        if (!memberId) {
          setTheme(next);
          return;
        }
        setBusy(true);
        try {
          const result = await saveSettings("preferences", { theme: next });
          if (!result.success) throw new Error(result.error);
          window.dispatchEvent(
            new CustomEvent("weave:settings", {
              detail: { group: "preferences", patch: { theme: next } },
            }),
          );
          setTheme(next);
        } catch (cause) {
          toast.error(
            cause instanceof Error ? cause.message : "Could not save theme",
          );
        } finally {
          setBusy(false);
        }
      }}
      className="p-2 text-muted hover:text-primary transition-colors rounded-full hover:bg-surface-secondary"
      aria-label="Toggle theme"
    >
      {currentTheme === "dark" ? (
        <Sun className="w-5 h-5" />
      ) : (
        <Moon className="w-5 h-5" />
      )}
    </button>
  );
}
