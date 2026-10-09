"use client";

import { useSyncExternalStore } from "react";

const confirmedEvent = "weave:connection-confirmed";
let confirmedOnline: boolean | undefined;

function subscribe(callback: () => void) {
  const update = () => {
    confirmedOnline = undefined;
    callback();
  };
  window.addEventListener("online", update);
  window.addEventListener("offline", update);
  window.addEventListener(confirmedEvent, callback);
  return () => {
    window.removeEventListener("online", update);
    window.removeEventListener("offline", update);
    window.removeEventListener(confirmedEvent, callback);
  };
}

export function confirmConnection() {
  confirmedOnline = true;
  window.dispatchEvent(new Event(confirmedEvent));
}

export function useOnlineStatus() {
  return useSyncExternalStore(
    subscribe,
    () => confirmedOnline ?? navigator.onLine,
    () => true,
  );
}
