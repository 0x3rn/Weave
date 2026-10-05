import { requireAuth } from "@/app/actions/user";
import { getUserById } from "@/lib/users";
import { SettingsEditor } from "./settings-editor";
import { type SettingsGroup, type SettingSection } from "@/lib/settings";
export async function SettingsPageContent({
  title,
  description,
  group,
  sections,
}: {
  title: string;
  description: string;
  group: SettingsGroup;
  sections: SettingSection[];
}) {
  const { uid } = await requireAuth();
  const user = await getUserById(uid);
  return (
    <div className="p-4 sm:p-8">
      <header className="mb-6 border-b border-border pb-6">
        <h2 className="text-2xl font-bold text-heading">{title}</h2>
        <p className="mt-2 text-muted">{description}</p>
      </header>
      <SettingsEditor
        group={group}
        initial={user?.[group]}
        sections={sections}
      />
    </div>
  );
}
