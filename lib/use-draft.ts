"use client";
import { useEffect, useState, type SetStateAction } from "react";
import {
  usePreferences,
  useMemberId,
} from "@/components/settings/preferences-provider";

// Drafts belong to one member and one browser tab; attachments are never stored here.
export function useDraft<T>(name: string, initial: T) {
  const memberId = useMemberId(),
    preferences = usePreferences();
  const key = `weave:draft:${memberId}:${name}`;
  const [defaults] = useState(() => initial);
  const [snapshot, setSnapshot] = useState({ key: "", value: initial });
  useEffect(() => {
    let value = defaults;
    try {
      const stored =
        preferences.autoSaveDrafts && memberId
          ? sessionStorage.getItem(key)
          : null;
      if (stored) value = JSON.parse(stored) as T;
      else sessionStorage.removeItem(key);
    } catch {
      /* Storage may be disabled. */
    }
    setSnapshot((previous) =>
      previous.key === key ? previous : { key, value },
    );
  }, [key, memberId, preferences.autoSaveDrafts, defaults]);
  useEffect(() => {
    if (snapshot.key !== key || !memberId) return;
    const timer = setTimeout(() => {
      try {
        if (preferences.autoSaveDrafts)
          sessionStorage.setItem(key, JSON.stringify(snapshot.value));
        else sessionStorage.removeItem(key);
      } catch {
        /* Keep editing when storage is full. */
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [snapshot, key, memberId, preferences.autoSaveDrafts]);
  const value = snapshot.key === key ? snapshot.value : defaults;
  const setValue = (update: SetStateAction<T>) =>
    setSnapshot((current) => ({
      key,
      value:
        typeof update === "function"
          ? (update as (previous: T) => T)(
              current.key === key ? current.value : defaults,
            )
          : update,
    }));
  return [value, setValue] as const;
}
