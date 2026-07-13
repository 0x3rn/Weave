export const metadata = { title: "Security - Weave" };

export default function SecuritySettingsPage() {
  return (
    <div className="p-8">
      <div className="border-b border-border pb-6 mb-8">
        <h2 className="text-2xl font-black text-heading mb-2">Security</h2>
        <p className="text-muted">Manage your password, two-factor authentication, and active sessions.</p>
      </div>

      <div className="space-y-6">
        <div className="bg-background border border-border rounded-xl p-6">
          <h3 className="text-lg font-bold text-heading mb-4">Password</h3>
          <p className="text-sm text-muted mb-4">We are using Google Authentication and email link sign-in, so password management is handled externally. Native password support is coming soon.</p>
        </div>

        <div className="bg-background border border-border rounded-xl p-6">
          <h3 className="text-lg font-bold text-heading mb-4">Two-Factor Authentication</h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-heading">Status: <span className="text-muted font-medium">Disabled</span></p>
            </div>
            <button className="px-4 py-2 bg-background border border-border hover:bg-surface-secondary text-heading text-sm font-bold rounded-lg transition-colors shadow-sm">
              Enable 2FA
            </button>
          </div>
        </div>

        <div className="bg-background border border-border rounded-xl p-6">
          <h3 className="text-lg font-bold text-heading mb-4">Login Activity</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-muted">
                  <th className="pb-3 font-medium">Device</th>
                  <th className="pb-3 font-medium">Location</th>
                  <th className="pb-3 font-medium">Date</th>
                  <th className="pb-3 font-medium text-right">Status</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="py-4 text-heading font-medium">Current Session</td>
                  <td className="py-4 text-muted">Unknown</td>
                  <td className="py-4 text-muted">Now</td>
                  <td className="py-4 text-right">
                    <span className="text-success text-xs font-bold bg-success/10 px-2 py-1 rounded">Active</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
