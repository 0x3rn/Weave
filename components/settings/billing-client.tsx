"use client";

import { CreditCard, Download, ShieldCheck, History } from "lucide-react";

export function BillingClient({ user }: { user: any }) {
  const isVerified = user.subscriptionTier === "verified";

  return (
    <div className="space-y-12">
      {/* Current Plan */}
      <section className="space-y-4">
        <h3 className="text-xl font-bold text-heading">Current Plan</h3>
        <div className="bg-gradient-to-br from-surface-secondary to-surface border border-border rounded-xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl font-black text-heading">
                {isVerified ? "Verified Plan" : "Free Plan"}
              </span>
              {isVerified && <ShieldCheck className="w-6 h-6 text-primary" />}
            </div>
            <p className="text-body text-sm max-w-md">
              {isVerified 
                ? "You have access to all premium features, unlimited skill hours, and enhanced visibility in the marketplace." 
                : "You are currently on the free plan with basic marketplace access and standard exchange limits."}
            </p>
          </div>
          <div className="shrink-0 flex flex-col items-start md:items-end gap-3">
            <span className="text-lg font-bold text-heading">
              {isVerified ? "$19 / month" : "$0 / month"}
            </span>
            <div className="flex gap-3">
              {isVerified ? (
                <button className="px-4 py-2 bg-background border border-border hover:bg-surface-secondary text-heading text-sm font-bold rounded-lg transition-colors shadow-sm">
                  Manage Subscription
                </button>
              ) : (
                <button className="px-4 py-2 bg-primary hover:bg-primary-hover text-background text-sm font-bold rounded-lg transition-colors shadow-[0_0_15px_rgba(88,199,109,0.3)]">
                  Upgrade Plan
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Payment Method */}
      <section className="space-y-4">
        <h3 className="text-xl font-bold text-heading">Payment Method</h3>
        <div className="bg-background border border-border rounded-xl p-6">
          {isVerified ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-8 bg-surface-secondary border border-border rounded flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-muted" />
                </div>
                <div>
                  <div className="text-sm font-bold text-heading">Visa ending in 4242</div>
                  <div className="text-xs text-muted">Expires 12/28</div>
                </div>
              </div>
              <button className="text-sm font-bold text-muted hover:text-heading transition-colors">
                Update
              </button>
            </div>
          ) : (
            <div className="text-center py-6">
              <CreditCard className="w-8 h-8 text-muted mx-auto mb-3" />
              <p className="text-muted text-sm mb-4">No active payment methods found.</p>
              <button className="px-4 py-2 bg-background border border-border hover:bg-surface-secondary text-heading text-sm font-bold rounded-lg transition-colors shadow-sm">
                Add Payment Method
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Billing History */}
      <section className="space-y-4">
        <h3 className="text-xl font-bold text-heading">Billing History</h3>
        <div className="bg-background border border-border rounded-xl overflow-hidden">
          <div className="p-16 text-center">
            <History className="w-8 h-8 text-muted mx-auto mb-3" />
            <p className="text-muted text-sm font-medium">No previous billing history.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
