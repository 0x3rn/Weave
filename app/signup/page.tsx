import { getInviteDetails } from "@/app/actions/auth";
import SignupForm from "./signup-form";
import Link from "next/link";
import { AlertCircle } from "lucide-react";

export const metadata = {
  title: "Create Your Account | Weave"
};

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ invite?: string }>;
}) {
  const params = await searchParams;
  const inviteCode = params.invite || "";
  
  let inviteDetails = null;
  if (inviteCode) {
    inviteDetails = await getInviteDetails(inviteCode);
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        
        {/* Logo/Header */}
        <div className="text-center">
          <Link href="/" className="inline-block mb-6">
            <span className="font-heading text-3xl font-bold tracking-tight text-primary">
              Weave
            </span>
          </Link>
          <h1 className="text-2xl font-bold text-heading">Create Your Account</h1>
          <p className="text-sm text-body mt-2">
            Weave is currently invite-only. You must have a valid invitation code linked to your approved email address.
          </p>
        </div>

        {/* Error States based on Server check */}
        {inviteCode && !inviteDetails && (
          <div className="bg-error/10 border border-error/20 p-4 rounded-md flex gap-3 text-error text-sm">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <div>
              <p className="font-bold mb-1">Invalid Invite Code</p>
              <p>The invite code provided does not exist.</p>
            </div>
          </div>
        )}

        {inviteDetails && inviteDetails.status !== "pending" && (
          <div className="bg-error/10 border border-error/20 p-4 rounded-md flex gap-3 text-error text-sm">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <div>
              <p className="font-bold mb-1">Invite Unavailable</p>
              <p>
                {inviteDetails.status === "used" && "This invitation has already been used."}
                {inviteDetails.status === "revoked" && "This invitation is no longer valid."}
                {inviteDetails.status === "expired" && "This invitation has expired."}
              </p>
            </div>
          </div>
        )}

        {/* Form */}
        <div className="py-2">
          <SignupForm 
            initialCode={inviteCode} 
            initialEmail={inviteDetails?.email || ""}
            isEmailLocked={!!inviteDetails?.email}
          />
        </div>

        {/* Footer Links */}
        <div className="mt-8 pt-6 border-t border-border flex flex-col gap-3 text-center text-sm text-body">
          <div>
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-primary hover:text-primary-hover transition-colors">
              Log in
            </Link>
          </div>
          <div>
            Don't have an invite?{" "}
            <Link href="/request-invite" className="font-medium text-primary hover:text-primary-hover transition-colors">
              Request an invite
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
