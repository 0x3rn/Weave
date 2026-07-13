export const metadata = { title: "Accessibility - Weave" };

export default function AccessibilitySettingsPage() {
  return (
    <div className="p-8">
      <div className="border-b border-border pb-6 mb-8">
        <h2 className="text-2xl font-black text-heading mb-2">Accessibility</h2>
        <p className="text-muted">Manage settings to make Weave easier to use.</p>
      </div>

      <div className="bg-surface-secondary border border-border rounded-xl p-12 text-center">
        <h3 className="text-lg font-bold text-heading mb-2">Coming Soon</h3>
        <p className="text-muted text-sm">Advanced accessibility options are coming soon.</p>
      </div>
    </div>
  );
}
