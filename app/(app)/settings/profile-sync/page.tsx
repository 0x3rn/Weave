export const metadata = { title: "Profile Sync - Weave" };

export default function ProfileSyncSettingsPage() {
  return (
    <div className="p-8">
      <div className="border-b border-border pb-6 mb-8">
        <h2 className="text-2xl font-black text-heading mb-2">Profile Sync</h2>
        <p className="text-muted">Control what information from your account syncs to your public profile.</p>
      </div>

      <div className="bg-surface-secondary border border-border rounded-xl p-12 text-center">
        <h3 className="text-lg font-bold text-heading mb-2">Coming Soon</h3>
        <p className="text-muted text-sm">Profile Sync features are under development.</p>
      </div>
    </div>
  );
}
