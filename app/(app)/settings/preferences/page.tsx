import { SettingsPageContent } from "@/components/settings/settings-page";
import { SETTINGS_SECTIONS } from "@/lib/settings";
export const metadata = { title: "Workspace & Exchange Preferences - Weave" };
export default function Page() {
  return (
    <SettingsPageContent
      title="Workspace & Exchange Preferences"
      description="Make your workspace and collaborations work for you."
      group="preferences"
      sections={SETTINGS_SECTIONS.preferences.slice(2)}
    />
  );
}
