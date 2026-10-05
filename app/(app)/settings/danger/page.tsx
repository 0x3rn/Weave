import { requireAuth } from "@/app/actions/user";
import { getUserById } from "@/lib/users";
import { DangerClient } from "@/components/settings/danger-client";
export const metadata = { title: "Danger Zone - Weave" };
export default async function Page() {
  const { uid } = await requireAuth();
  const user = await getUserById(uid);
  return (
    <div className="p-4 sm:p-8">
      <h2 className="mb-2 text-2xl font-bold text-error">Danger Zone</h2>
      <p className="mb-6 text-muted">
        Manage marketplace activity and account lifecycle.
      </p>
      <DangerClient initialPaused={user?.marketplacePaused === true} />
    </div>
  );
}
