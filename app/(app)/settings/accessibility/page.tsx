import { SettingsPageContent } from "@/components/settings/settings-page";
import { ACCESSIBILITY } from "@/lib/settings";
export const metadata = { title: "Accessibility - Weave" };
export default function Page() {
  return (
    <>
      <SettingsPageContent
        title="Accessibility"
        description="Make Weave easier to read and navigate."
        group="preferences"
        sections={[ACCESSIBILITY]}
      />
      <p className="px-4 pb-8 text-sm text-muted sm:px-8">
        Dyslexic-friendly fonts are planned for a future update.
      </p>
    </>
  );
}
