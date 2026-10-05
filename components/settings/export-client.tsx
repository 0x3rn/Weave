"use client";
import { useState } from "react";
import { object } from "@/lib/settings";
export function ExportClient() {
  const [busy, setBusy] = useState(""),
    [error, setError] = useState("");
  const download = async (kind: string) => {
    setBusy(kind);
    setError("");
    try {
      const response = await fetch(`/api/settings/export?kind=${kind}`, {
        cache: "no-store",
      });
      if (!response.ok) {
        const result = object(await response.json());
        throw new Error(
          typeof result.error === "string"
            ? result.error
            : "Could not export data",
        );
      }
      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement("a");
      link.href = url;
      link.download = `weave-${kind}-${new Date().toISOString().slice(0, 10)}.${kind === "backup" ? "json.gz" : "json"}`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Export failed");
    } finally {
      setBusy("");
    }
  };
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">
        Download your data as JSON. Backups are compressed JSON archives and
        include data and attachment references. File contents remain available
        through their original authorized links.
      </p>
      {error && (
        <p role="alert" className="text-sm text-error">
          {error}
        </p>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        {[
          "profile",
          "ledger",
          "reviews",
          "messages",
          "portfolio",
          "everything",
          "backup",
        ].map((kind) => (
          <button
            key={kind}
            disabled={!!busy}
            onClick={() => void download(kind)}
            className="rounded-lg border border-border bg-background px-4 py-3 text-left text-sm font-bold capitalize disabled:opacity-50"
          >
            {busy === kind
              ? "Preparing download…"
              : kind === "backup"
                ? "Generate backup archive"
                : `Download ${kind}`}
          </button>
        ))}
      </div>
    </div>
  );
}
