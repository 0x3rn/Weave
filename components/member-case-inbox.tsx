"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  submitMemberCase,
  respondToMemberCase,
  type getMemberCaseInbox,
} from "@/app/actions/member-operations";
import { readable } from "@/lib/admin-ops-types";
const control = "w-full rounded-lg bg-background border border-border p-3";
export default function MemberCaseInbox({
  kind,
  initial,
}: {
  kind: "verification" | "support";
  initial: Awaited<ReturnType<typeof getMemberCaseInbox>>;
}) {
  const router = useRouter(),
    [pending, setPending] = useState(false),
    [message, setMessage] = useState("");
  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <h1 className="text-3xl font-bold">
        {kind === "verification" ? "Identity Verification" : "Support Inbox"}
      </h1>
      <p className="text-muted">
        {kind === "verification"
          ? "Submit your information for a private verification review. Documents are restricted to authorized reviewers."
          : "Contact the Weave team and follow your support conversations here."}
      </p>
      <form
        action={async (form) => {
          setPending(true);
          const result = await submitMemberCase(kind, form);
          setMessage(
            result.success
              ? "Request submitted."
              : result.error || "Submission failed",
          );
          setPending(false);
          router.refresh();
        }}
        className="rounded-xl border border-border bg-surface p-5 space-y-4"
      >
        <h2 className="text-lg font-semibold">
          New{" "}
          {kind === "verification" ? "verification request" : "support ticket"}
        </h2>
        <label className="block text-sm">
          Subject
          <input
            required
            minLength={3}
            maxLength={200}
            name="title"
            className={control}
          />
        </label>
        <label className="block text-sm">
          {kind === "verification" ? "Verification type" : "Category"}
          <select name="category" className={control}>
            {(kind === "verification"
              ? ["identity", "professional", "trust"]
              : [
                  "account",
                  "verification",
                  "marketplace",
                  "exchange",
                  "escrow",
                  "skill_hours",
                  "billing",
                  "technical",
                  "report",
                  "dispute",
                  "other",
                ]
            ).map((c) => (
              <option key={c} value={c}>
                {readable(c)}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          Details
          <textarea
            required
            name="message"
            minLength={10}
            maxLength={5000}
            rows={5}
            className={control}
          />
        </label>
        <label className="block text-sm">
          {kind === "verification"
            ? "Identity document"
            : "Attachment (optional)"}
          <input
            name="file"
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.webp"
            className={control}
          />
          <span className="text-xs text-muted">
            PDF, JPEG, PNG or WebP, up to 5 MB.
          </span>
        </label>
        <button
          disabled={pending}
          className="rounded-lg bg-primary text-white px-4 py-2"
        >
          {pending ? "Submitting…" : "Submit request"}
        </button>
      </form>
      {message && (
        <p role="status" className="rounded-lg border border-border p-3">
          {message}
        </p>
      )}
      <h2 className="text-xl font-semibold">Your requests</h2>
      {!initial.length && (
        <p className="text-muted">You have no requests yet.</p>
      )}
      {initial.map((item) => (
        <article
          key={item.id}
          className="rounded-xl border border-border bg-surface p-5 space-y-3"
        >
          <div className="flex justify-between gap-2">
            <h3 className="font-semibold">{item.title}</h3>
            <span className="text-sm">{readable(item.status)}</span>
          </div>
          <p className="text-xs text-muted">
            {new Date(item.createdAt).toLocaleString()} · {item.id}
          </p>
          {item.reason && <p className="whitespace-pre-wrap">{item.reason}</p>}
          <ol className="space-y-3">
            {item.events.map((e) => (
              <li key={e.id} className="border-l border-border pl-3">
                <p className="text-xs text-muted">
                  {readable(e.type)} · {new Date(e.date).toLocaleString()}
                </p>
                <p className="whitespace-pre-wrap">{e.message}</p>
                {e.attachments.map((file) => (
                  <a
                    key={file.href}
                    href={file.href}
                    className="block text-primary text-sm underline"
                  >
                    Download {file.name}
                  </a>
                ))}
              </li>
            ))}
          </ol>
          {(kind === "verification"
            ? item.status === "needs_information"
            : !["closed", "resolved"].includes(item.status)) && (
            <form
              action={async (f) => {
                setPending(true);
                const r = await respondToMemberCase(kind, item.id, f);
                setMessage(
                  r.success
                    ? "Response sent."
                    : r.error || "Could not send response",
                );
                setPending(false);
                router.refresh();
              }}
              className="space-y-2"
            >
              <label className="block text-sm">
                {kind === "verification" ? "Additional information" : "Reply"}
                <textarea
                  name="response"
                  required
                  minLength={3}
                  maxLength={5000}
                  className={control}
                />
              </label>
              <label className="block text-sm">
                Attach updated document / evidence
                <input
                  type="file"
                  name="file"
                  accept=".pdf,.jpg,.jpeg,.png,.webp"
                  className={control}
                />
              </label>
              <button
                disabled={pending}
                className="border border-border rounded-lg px-4 py-2"
              >
                Send response
              </button>
            </form>
          )}
        </article>
      ))}
    </div>
  );
}
