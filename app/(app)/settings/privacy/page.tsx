import { SettingsPageContent } from "@/components/settings/settings-page";
import { SETTINGS_SECTIONS } from "@/lib/settings";
export const metadata = { title: "Privacy - Weave" };
export default function Page() {
  return (
    <SettingsPageContent
      title="Privacy"
      description="Control who can discover, view, and contact you."
      group="privacy"
      sections={SETTINGS_SECTIONS.privacy}
    />
  );
}
