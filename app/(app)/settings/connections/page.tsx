export const metadata = { title: "Integrations - Weave" };

export default function IntegrationsSettingsPage() {
  return (
    <div className="p-8">
      <div className="border-b border-border pb-6 mb-8">
        <h2 className="text-2xl font-black text-heading mb-2">Integrations</h2>
        <p className="text-muted">Connect your third-party accounts and manage API keys.</p>
      </div>

      <div className="bg-surface-secondary border border-border rounded-xl p-12 text-center">
        <h3 className="text-lg font-bold text-heading mb-2">Coming Soon</h3>
        <p className="text-muted text-sm">We are working on bringing Notion, GitHub, and Figma integrations to Weave.</p>
      </div>
    </div>
  );
}
