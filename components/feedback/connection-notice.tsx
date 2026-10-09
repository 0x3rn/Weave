"use client";

import { useEffect, useRef, useState } from "react";
import { Check, RotateCcw, WifiOff } from "lucide-react";
import { confirmConnection, useOnlineStatus } from "./use-online-status";
import styles from "./unavailable.module.css";

export default function ConnectionNotice() {
  const online = useOnlineStatus();
  const [checking, setChecking] = useState(false);
  const [checkError, setCheckError] = useState(false);
  const [restored, setRestored] = useState(false);
  const pending = useRef(false);
  const controller = useRef<AbortController | null>(null);

  useEffect(() => {
    const recovered = () => {
      setRestored(true);
      setCheckError(false);
    };
    window.addEventListener("online", recovered);
    return () => {
      window.removeEventListener("online", recovered);
      controller.current?.abort();
      controller.current = null;
    };
  }, []);
  useEffect(() => {
    if (!restored) return;
    const timer = window.setTimeout(() => setRestored(false), 4000);
    return () => window.clearTimeout(timer);
  }, [restored]);

  const checkConnection = async () => {
    if (pending.current) return;
    pending.current = true;
    setChecking(true);
    setCheckError(false);
    const request = new AbortController();
    controller.current = request;
    const timer = window.setTimeout(() => request.abort(), 8000);
    try {
      // Any HTTP response proves network reachability, even a server error.
      // Probe a public static file without auth or repeating a member action.
      await fetch("/connection-check.txt", {
        method: "HEAD",
        cache: "no-store",
        credentials: "omit",
        signal: request.signal,
      });
      if (controller.current !== request) return;
      confirmConnection();
      setRestored(true);
    } catch {
      if (controller.current === request) setCheckError(true);
    } finally {
      window.clearTimeout(timer);
      if (controller.current === request) {
        controller.current = null;
        pending.current = false;
        setChecking(false);
      }
    }
  };

  if (online && !restored) return null;
  const recovered = online && restored;
  return (
    <aside
      className={`${styles.notice} ${recovered ? styles.restored : ""}`}
      role="status"
      aria-live="polite"
      aria-atomic="true"
      aria-label="Connection status"
    >
      <div className={styles.noticeIcon} aria-hidden="true">
        {recovered ? <Check size={20} /> : <WifiOff size={20} />}
      </div>
      <div className={styles.noticeContent}>
        <h2>{recovered ? "You’re back online" : "You’re offline"}</h2>
        <p>
          {recovered
            ? "Your connection is back. You can continue where you left off."
            : "New changes may not save until you reconnect. Keep this page open."}
        </p>
        {!recovered && (
          <div className={styles.noticeActions}>
            <button type="button" onClick={checkConnection} disabled={checking}>
              <RotateCcw size={12} aria-hidden="true" />
              {checking ? "Checking…" : "Check connection"}
            </button>
            <span>Waiting to reconnect</span>
          </div>
        )}
        {!recovered && checkError && (
          <p className={styles.checkError}>
            Still unable to connect. Check your Wi-Fi or mobile data.
          </p>
        )}
      </div>
    </aside>
  );
}
