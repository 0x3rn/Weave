export const metadata = { title: "Danger Zone - Weave" };

export default function DangerSettingsPage() {
  return (
    <div className="p-8">
      <div className="border-b border-border pb-6 mb-8">
        <h2 className="text-2xl font-black text-error mb-2">Danger Zone</h2>
        <p className="text-muted">Irreversible and high-impact account actions.</p>
      </div>

      <div className="space-y-6">
        <div className="bg-background border border-error/20 rounded-xl p-6">
          <h3 className="text-lg font-bold text-heading mb-2">Pause Marketplace Activity</h3>
          <p className="text-muted text-sm mb-4">Temporarily stop appearing in search and recommendations without affecting existing exchanges.</p>
          <button className="px-4 py-2 bg-background border border-border hover:bg-surface-secondary text-heading text-sm font-bold rounded-lg transition-colors shadow-sm">
            Pause Activity
          </button>
        </div>

        <div className="bg-background border border-error/20 rounded-xl p-6">
          <h3 className="text-lg font-bold text-heading mb-2">Deactivate Account</h3>
          <p className="text-muted text-sm mb-4">Hide your account and profile while preserving your data for when you return.</p>
          <button className="px-4 py-2 bg-background border border-border hover:bg-surface-secondary text-heading text-sm font-bold rounded-lg transition-colors shadow-sm">
            Deactivate Account
          </button>
        </div>

        <div className="bg-error/5 border border-error/30 rounded-xl p-6">
          <h3 className="text-lg font-bold text-error mb-2">Delete Account</h3>
          <p className="text-muted text-sm mb-4">
            Permanently remove your account and all associated data. This action is irreversible.
            <br/><br/>
            Before deletion:
            <ul className="list-disc ml-5 mt-2 space-y-1">
              <li>Active exchanges must be completed or cancelled.</li>
              <li>Pending disputes must be resolved.</li>
            </ul>
          </p>
          <button className="px-4 py-2 bg-error hover:bg-error/90 text-white text-sm font-bold rounded-lg transition-colors shadow-sm">
            Delete Account
          </button>
        </div>
      </div>
    </div>
  );
}
