import { SettingsPageContent } from "@/components/settings/settings-page";
import { SETTINGS_SECTIONS } from "@/lib/settings";
export const metadata = { title: "Profile Sync - Weave" };
export default function Page() {
  return (
    <SettingsPageContent
      title="Profile Sync"
      description="Choose what your public profile receives from your private account."
      group="profileSync"
      sections={SETTINGS_SECTIONS.profileSync}
    />
  );
}
