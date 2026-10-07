"use client";
import { useEffect } from "react";
export default function ContentView({ id }: { id: string }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      fetch("/api/content/view", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id }),
        keepalive: true,
      }).catch(() => {});
    }, 1000);
    return () => clearTimeout(timer);
  }, [id]);
  return null;
}
