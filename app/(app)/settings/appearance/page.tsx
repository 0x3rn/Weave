import { SettingsPageContent } from "@/components/settings/settings-page";
import { APPEARANCE } from "@/lib/settings";
export const metadata = { title: "Appearance - Weave" };
export default function Page() {
  return (
    <SettingsPageContent
      title="Appearance"
      description="Choose how Weave looks and feels."
      group="preferences"
      sections={[APPEARANCE]}
    />
  );
}
