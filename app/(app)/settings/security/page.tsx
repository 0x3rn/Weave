import { getUserDevices } from "@/app/actions/devices";
import { SecurityClient } from "@/components/settings/security-client";
export const metadata = { title: "Security - Weave" };
export default async function Page() {
  const result = await getUserDevices();
  return (
    <div className="p-4 sm:p-8">
      <h2 className="mb-2 text-2xl font-bold text-heading">Security</h2>
      <p className="mb-6 text-muted">
        Manage your password, authentication, and sign-in activity.
      </p>
      {result.error ? (
        <p role="alert" className="text-error">
          {result.error}
        </p>
      ) : (
        <SecurityClient devices={result.devices || []} />
      )}
    </div>
  );
}
