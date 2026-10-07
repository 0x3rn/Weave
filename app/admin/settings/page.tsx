import { platformSettingsData } from "@/app/actions/admin/operations";
import PlatformSettingsClient from "@/components/admin/platform-settings-client";
export const dynamic = "force-dynamic";
export const metadata = { title: "Platform Settings" };
export default async function Page() {
  return <PlatformSettingsClient initial={await platformSettingsData()} />;
}
