"use client";
import { useState } from "react";
import { submitPlatformReport } from "@/app/actions/member-operations";
export default function PlatformReportForm({
  id,
  type,
}: {
  id: string;
  type: string;
}) {
  const [pending, setPending] = useState(false),
    [message, setMessage] = useState("");
  return (
    <form
      action={async (f) => {
        setPending(true);
        const result = await submitPlatformReport({
          id,
          type,
          category: String(f.get("category")),
          description: String(f.get("description")),
        });
        setMessage(
          result.success
            ? "Report submitted for review."
            : result.error || "Report failed",
        );
        setPending(false);
      }}
      className="max-w-2xl mx-auto p-6 space-y-4"
    >
      <h1 className="text-2xl font-bold">Report {type}</h1>
      <p className="text-sm text-muted">
        Your report is private and reviewed by authorized staff. Resource: {id}
      </p>
      <label className="block">
        Category
        <select
          name="category"
          className="w-full bg-surface border border-border rounded-lg p-3"
        >
          {[
            "abuse",
            "spam",
            "harassment",
            "fraud",
            "misrepresentation",
            "contract_violation",
            "other",
          ].map((v) => (
            <option key={v}>{v}</option>
          ))}
        </select>
      </label>
      <label className="block">
        What happened?
        <textarea
          name="description"
          minLength={10}
          maxLength={5000}
          required
          rows={6}
          className="w-full bg-surface border border-border rounded-lg p-3"
        />
      </label>
      <button
        disabled={pending}
        className="bg-primary text-white rounded-lg px-4 py-2"
      >
        {pending ? "Submitting…" : "Submit report"}
      </button>
      {message && <p role="status">{message}</p>}
    </form>
  );
}
