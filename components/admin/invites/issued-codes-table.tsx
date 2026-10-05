"use client";
import { useState, useRef } from "react";
import {
  createInviteCode,
  revokeInviteCode,
  extendInviteCode,
  resendInviteEmail,
} from "@/app/actions/admin/invite-codes";
import toast from "react-hot-toast";
interface Invite {
  id: string;
  code: string;
  email: string;
  status: string;
  expiresAt: string | null;
  signupUrl?: string;
}
function effectiveStatus(item: Invite) {
  return item.status === "pending" &&
    item.expiresAt &&
    new Date(item.expiresAt).getTime() <= Date.now()
    ? "expired"
    : item.status;
}
export default function IssuedCodesTable({
  initialData,
}: {
  initialData: Invite[];
}) {
  const [data, setData] = useState(initialData),
    [search, setSearch] = useState(""),
    [status, setStatus] = useState("all"),
    [email, setEmail] = useState(""),
    [busy, setBusy] = useState(false);
  const pending = useRef(false);
  const run = async (operation: () => Promise<void>) => {
    if (pending.current) return;
    pending.current = true;
    setBusy(true);
    try {
      await operation();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Request failed. Retry.");
    } finally {
      pending.current = false;
      setBusy(false);
    }
  };
  const update = (invite: Invite) =>
    setData((rows) => rows.map((row) => (row.id === invite.id ? invite : row)));
  const filtered = data.filter(
    (row) =>
      (status === "all" || effectiveStatus(row) === status) &&
      (row.email + " " + row.code).toLowerCase().includes(search.toLowerCase()),
  );
  return (
    <div className="space-y-6">
      <form
        className="flex flex-wrap items-end gap-3 bg-surface border border-border p-4 rounded-[var(--radius-card)]"
        onSubmit={(e) => {
          e.preventDefault();
          void run(async () => {
            const result = await createInviteCode(email, 7);
            if (!result.success || !result.invite)
              throw new Error(result.error || "Could not create invite");
            setData((rows) => [result.invite!, ...rows]);
            setEmail("");
            toast.success(
              "Invite created. Copy its link or send its email below.",
            );
          });
        }}
      >
        <label className="flex-1 text-sm">
          Invite a member directly
          <input
            required
            type="email"
            maxLength={320}
            value={email}
            disabled={busy}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="member@example.com"
            className="block w-full mt-2 p-2 bg-background border border-border rounded"
          />
        </label>
        <button
          disabled={busy}
          className="p-2 bg-primary text-primary-foreground rounded disabled:opacity-50"
        >
          Create 7-day invite
        </button>
      </form>
      <div className="flex flex-wrap gap-3">
        <input
          aria-label="Search invite codes"
          placeholder="Search code or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 p-3 bg-surface border border-border rounded"
        />
        <select
          aria-label="Invite status"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="p-3 bg-surface border border-border rounded"
        >
          {["all", "pending", "used", "expired", "revoked"].map((value) => (
            <option key={value} value={value}>
              {value === "all" ? "All statuses" : value}
            </option>
          ))}
        </select>
      </div>
      <div className="overflow-x-auto bg-surface border border-border rounded-[var(--radius-card)]">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr>
              {[
                "Invite code",
                "Issued to",
                "Status",
                "Expires at",
                "Actions",
              ].map((t) => (
                <th className="p-4" key={t}>
                  {t}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length ? (
              filtered.map((row) => (
                <tr key={row.id} className="border-t border-border">
                  <td className="p-4 font-mono whitespace-nowrap">
                    {row.code}
                  </td>
                  <td className="p-4">{row.email}</td>
                  <td className="p-4 capitalize">{effectiveStatus(row)}</td>
                  <td className="p-4">
                    {row.expiresAt
                      ? new Date(row.expiresAt).toLocaleString()
                      : "Never"}
                  </td>
                  <td className="p-4">
                    <div className="flex gap-3 whitespace-nowrap">
                      <button
                        disabled={busy}
                        onClick={() =>
                          void run(async () => {
                            await navigator.clipboard.writeText(
                              row.signupUrl ||
                                window.location.origin +
                                  "/signup?invite=" +
                                  encodeURIComponent(row.code),
                            );
                            toast.success("Invite link copied");
                          })
                        }
                      >
                        Copy link
                      </button>
                      <button
                        disabled={busy || effectiveStatus(row) !== "pending"}
                        onClick={() =>
                          void run(async () => {
                            const result = await resendInviteEmail(row.id);
                            if (!result.success) throw new Error(result.error);
                            toast.success("Invite email sent");
                          })
                        }
                      >
                        Resend
                      </button>
                      <button
                        disabled={
                          busy || ["used", "revoked"].includes(row.status)
                        }
                        onClick={() =>
                          void run(async () => {
                            const result = await extendInviteCode(row.id, 7);
                            if (!result.success || !result.invite)
                              throw new Error(result.error);
                            update(result.invite);
                            toast.success("Invite extended by 7 days");
                          })
                        }
                      >
                        Extend
                      </button>
                      <button
                        disabled={
                          busy || ["used", "revoked"].includes(row.status)
                        }
                        onClick={() =>
                          void run(async () => {
                            if (!confirm("Revoke this invitation?")) return;
                            const result = await revokeInviteCode(row.id);
                            if (!result.success || !result.invite)
                              throw new Error(result.error);
                            update(result.invite);
                            toast.success("Invite revoked");
                          })
                        }
                      >
                        Revoke
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="p-12 text-center text-muted">
                  No issued invite codes found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
