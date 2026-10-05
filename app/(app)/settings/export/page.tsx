import { requireAuth } from "@/app/actions/user";
import { getUserById } from "@/lib/users";
import { ExportClient } from "@/components/settings/export-client";
import { SettingsEditor } from "@/components/settings/settings-editor";
import { SETTINGS_SECTIONS } from "@/lib/settings";
export const metadata = { title: "Data & Export - Weave" };
export default async function Page() {
  const { uid } = await requireAuth();
  const user = await getUserById(uid);
  return (
    <div className="space-y-8 p-4 sm:p-8">
      <header>
        <h2 className="mb-2 text-2xl font-bold text-heading">Data & Export</h2>
        <p className="text-muted">
          Download your data and manage archived conversations.
        </p>
      </header>
      <ExportClient />
      <SettingsEditor
        group="dataRetention"
        initial={user?.dataRetention}
        sections={SETTINGS_SECTIONS.dataRetention}
      />
    </div>
  );
}
