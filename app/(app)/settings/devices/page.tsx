import { DevicesClient } from "@/components/settings/devices-client";
import { getUserDevices } from "@/app/actions/devices";

export const metadata = { title: "Devices & Sessions - Weave" };

export default async function DevicesSettingsPage() {
  const { devices, error } = await getUserDevices();

  return (
    <div className="p-8">
      <div className="border-b border-border pb-6 mb-8">
        <h2 className="text-2xl font-black text-heading mb-2">Devices & Sessions</h2>
        <p className="text-muted">Manage your active sessions and devices.</p>
      </div>

      {error ? (
        <div className="p-6 bg-error/10 border border-error/20 rounded-xl text-error">
          {error}
        </div>
      ) : (
        <DevicesClient initialDevices={devices || []} />
      )}
    </div>
  );
}
