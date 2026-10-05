"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { blockMember } from "@/app/actions/settings";
export function MemberActions({ memberId }: { memberId: string }) {
  const [confirming, setConfirming] = useState(false),
    [reason, setReason] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const router = useRouter();
  return (
    <div className="mt-12 border-t border-border pt-6 text-sm">
      {!confirming ? (
        <button onClick={() => setConfirming(true)} className="text-error">
          Block member
        </button>
      ) : (
        <div className="space-y-3">
          <p>
            Blocking hides your profiles from each other and stops messages and
            new requests.
          </p>
          <label className="block">
            Reason (optional)
            <input
              maxLength={500}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="mt-2 block w-full rounded-lg border border-border bg-surface p-3"
            />
          </label>
          <button
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              const result = await blockMember(memberId, reason);
              if (result.success) router.push("/settings/blocked");
              else {
                setError(result.error || "Could not block member");
                setBusy(false);
              }
            }}
            className="mr-4 rounded-lg bg-error px-4 py-2 text-white"
          >
            Confirm block
          </button>
          <button onClick={() => setConfirming(false)}>Cancel</button>
          {error && (
            <p role="alert" className="text-error">
              {error}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
