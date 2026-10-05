"use client";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useTheme } from "next-themes";
import { settingsFor, type SettingValue } from "@/lib/settings";
import { usePathname } from "next/navigation";
const PreferencesContext = createContext<Record<string, SettingValue>>(
  settingsFor("preferences", {}),
);
const MemberContext = createContext("");
export function usePreferences() {
  return useContext(PreferencesContext);
}
export function useMemberId() {
  return useContext(MemberContext);
}
export function PreferencesProvider({
  initial,
  language,
  memberId,
  children,
}: {
  initial: unknown;
  language?: string;
  memberId: string;
  children: ReactNode;
}) {
  const [preferences, setPreferences] = useState(() =>
    settingsFor("preferences", initial),
  );
  const { setTheme } = useTheme();
  const pathname = usePathname();
  useEffect(() => {
    setPreferences(settingsFor("preferences", initial));
  }, [initial]);
  useEffect(() => {
    const update = (event: Event) => {
      const detail = (event as CustomEvent).detail;
      if (detail.group === "preferences")
        setPreferences((previous) => ({ ...previous, ...detail.patch }));
    };
    window.addEventListener("weave:settings", update);
    return () => window.removeEventListener("weave:settings", update);
  }, []);
  useEffect(() => {
    const root = document.documentElement;
    setTheme(String(preferences.theme));
    for (const key of [
      "accentColor",
      "fontSize",
      "roundedCorners",
      "compactMode",
      "reduceMotion",
      "highContrast",
      "keyboardNavigation",
      "screenReaderOptimizations",
      "colorBlindLabels",
    ])
      root.dataset[key] = String(preferences[key]);
    root.lang = language || "en";
    return () => {
      for (const key of [
        "accentColor",
        "fontSize",
        "roundedCorners",
        "compactMode",
        "reduceMotion",
        "highContrast",
        "keyboardNavigation",
        "screenReaderOptimizations",
        "colorBlindLabels",
      ])
        delete root.dataset[key];
      root.lang = "en";
    };
  }, [preferences, setTheme, language]);
  return (
    <MemberContext.Provider value={memberId}>
      <PreferencesContext.Provider value={preferences}>
        <a
          href="#workspace-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-surface focus:p-3"
        >
          Skip to content
        </a>
        <span
          className="sr-only"
          role="status"
          aria-live={preferences.screenReaderOptimizations ? "polite" : "off"}
        >
          {pathname.split("/").filter(Boolean).join(" · ") || "Home"}
        </span>
        {children}
      </PreferencesContext.Provider>
    </MemberContext.Provider>
  );
}
