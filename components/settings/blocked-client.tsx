"use client";
import { useState } from "react";
import { unblockMember } from "@/app/actions/settings";
export function BlockedClient({
  initial,
}: {
  initial: {
    id: string;
    full_name: string;
    username: string;
    reason: string;
    created_at: string;
  }[];
}) {
  const [members, setMembers] = useState(initial),
    [query, setQuery] = useState(""),
    [busy, setBusy] = useState(""),
    [error, setError] = useState("");
  const filtered = members.filter((member) =>
    `${member.full_name} ${member.username} ${member.reason}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  return (
    <div className="space-y-5">
      <label htmlFor="blocked-search" className="text-sm font-bold">
        Search blocked members
      </label>
      <input
        id="blocked-search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        className="w-full rounded-lg border border-border bg-background p-3"
        placeholder="Name or username"
      />
      {error && (
        <p role="alert" className="text-error">
          {error}
        </p>
      )}
      {filtered.length ? (
        filtered.map((member) => (
          <article
            key={member.id}
            className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border p-4"
          >
            <div>
              <p className="font-bold text-heading">
                {member.full_name || member.username}
              </p>
              <p className="text-sm text-muted">
                @{member.username} · Blocked{" "}
                {new Date(member.created_at).toLocaleDateString()}
              </p>
              <p className="mt-1 text-sm text-muted">
                {member.reason || "No reason provided"}
              </p>
            </div>
            <button
              disabled={!!busy}
              onClick={async () => {
                setBusy(member.id);
                setError("");
                try {
                  const result = await unblockMember(member.id);
                  if (!result.success) throw new Error(result.error);
                  setMembers((current) =>
                    current.filter((item) => item.id !== member.id),
                  );
                } catch (cause) {
                  setError(
                    cause instanceof Error
                      ? cause.message
                      : "Could not unblock member",
                  );
                } finally {
                  setBusy("");
                }
              }}
              className="rounded-lg border border-border px-4 py-2 text-sm font-bold disabled:opacity-50"
            >
              {busy === member.id ? "Unblocking…" : "Unblock"}
            </button>
          </article>
        ))
      ) : (
        <p className="rounded-xl border border-border bg-surface-secondary p-6 text-sm text-muted">
          {query
            ? "No members match your search."
            : "You have no blocked members."}
        </p>
      )}
    </div>
  );
}
