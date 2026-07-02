import Link from "next/link";
import { ArrowLeft, CheckCircle2, ShieldCheck } from "lucide-react";

export const metadata = {
  title: "Create an Account",
};

export default function Register() {
  return (
    <div className="min-h-screen bg-background flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* Top Left Back Button */}
      <div className="absolute top-8 left-8">
        <Link href="/" className="text-muted hover:text-primary transition-colors flex items-center gap-2 text-sm font-medium">
          <ArrowLeft className="w-4 h-4" />
          Back to Weave
        </Link>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20">
            <ShieldCheck className="w-6 h-6 text-primary" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-heading">
          Join the Network
        </h2>
        <p className="mt-2 text-center text-sm text-body">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-primary hover:text-primary-hover transition-colors">
            Sign in
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-surface py-8 px-4 shadow-subtle sm:rounded-[var(--radius-card)] sm:px-10 border border-border">
          
          <div className="mb-8 p-4 bg-primary/10 border border-primary/20 rounded-[var(--radius-card)]">
            <h3 className="text-sm font-bold text-primary mb-2 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Invite-Only Access
            </h3>
            <p className="text-xs text-body leading-relaxed">
              Weave requires an approved invitation to register. If you haven't received an invite token yet, please <Link href="/request-invite" className="font-bold underline hover:text-primary">request an invite</Link>.
            </p>
          </div>

          <form className="space-y-6">
            <div>
              <label htmlFor="token" className="block text-sm font-medium text-heading">
                Invite Token
              </label>
              <div className="mt-2">
                <input
                  id="token"
                  name="token"
                  type="text"
                  required
                  className="block w-full appearance-none rounded-[var(--radius-input)] border border-border bg-background px-3 py-2 text-body placeholder-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary sm:text-sm font-mono tracking-widest uppercase transition-colors"
                  placeholder="e.g. WX-9942-AZ"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-heading">
                Email address
              </label>
              <div className="mt-2">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="block w-full appearance-none rounded-[var(--radius-input)] border border-border bg-background px-3 py-2 text-body placeholder-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary sm:text-sm transition-colors"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-heading">
                Password
              </label>
              <div className="mt-2">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  className="block w-full appearance-none rounded-[var(--radius-input)] border border-border bg-background px-3 py-2 text-body placeholder-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary sm:text-sm transition-colors"
                />
              </div>
            </div>

            <div className="flex items-center">
              <input
                id="terms"
                name="terms"
                type="checkbox"
                required
                className="h-4 w-4 rounded border-border text-primary focus:ring-primary bg-background"
              />
              <label htmlFor="terms" className="ml-2 block text-xs text-body">
                I agree to the <Link href="/legal/terms" className="text-primary hover:underline">Terms</Link> and <Link href="/legal/privacy" className="text-primary hover:underline">Privacy Policy</Link>.
              </label>
            </div>

            <div>
              <button
                type="submit"
                className="flex w-full justify-center rounded-[var(--radius-button)] bg-primary py-2.5 px-4 text-sm font-bold text-surface shadow-sm hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-colors"
              >
                Create Account
              </button>
            </div>
          </form>

        </div>
      </div>
    </div>
  );
}