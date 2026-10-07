export const metadata = { title: "Admin Help" };
export default function Page() {
  return (
    <article className="max-w-3xl space-y-5">
      <h1 className="text-2xl font-bold">Admin operations guide</h1>
      <p>
        Use global search for a member or record ID. Each section supports
        filters, dated history, record inspection, and exports of the displayed
        page. Access depends on your assigned role.
      </p>
      <h2 className="font-semibold text-lg">Sensitive actions</h2>
      <p>
        Every decision needs a reason and creates an immutable audit record.
        Skill Hour corrections create new ledger transactions. Escrow settlement
        previews show the exact credits; confirm only after reviewing the
        contract and independent decisions. Held cash deposits block Skill Hour
        settlement until their payment disposition is confirmed.
      </p>
      <h2 className="font-semibold text-lg">Private evidence</h2>
      <p>
        Identity document access is restricted and logged. Exchange message
        inspection additionally requires the platform investigation policy.
        Support conversations have member-visible replies and separate internal
        notes.
      </p>
      <h2 className="font-semibold text-lg">Publishing & billing</h2>
      <p>
        Save drafts, preview their contents, or schedule a future publication.
        Published content appears on the public site. Billing controls use the
        provider’s actual plan, currency, and billing interval. Uncertain
        provider operations require reconciliation before another mutation.
      </p>
    </article>
  );
}
