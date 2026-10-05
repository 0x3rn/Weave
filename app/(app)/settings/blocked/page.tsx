import { getBlockedMembers } from "@/app/actions/settings";
import { BlockedClient } from "@/components/settings/blocked-client";
export const metadata = { title: "Blocked Members - Weave" };
export default async function Page() {
  const rows = await getBlockedMembers();
  const initial = rows.map((row) => ({
    id: String(row.id),
    full_name: String(row.full_name || ""),
    username: String(row.username || ""),
    reason: String(row.reason || ""),
    created_at: new Date(row.created_at).toISOString(),
  }));
  return (
    <div className="p-4 sm:p-8">
      <h2 className="mb-2 text-2xl font-bold text-heading">Blocked Members</h2>
      <p className="mb-6 text-muted">Manage members you have blocked.</p>
      <BlockedClient initial={initial} />
    </div>
  );
}
