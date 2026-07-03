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
  searchParams: { invite?: string };
}) {
  const inviteCode = searchParams.invite || "";
  
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
        <div className="bg-surface border border-border rounded-xl p-6 shadow-xl">
          <SignupForm 
            initialCode={inviteCode} 
            initialEmail={inviteDetails?.email || ""}
            isEmailLocked={!!inviteDetails?.email}
          />
        </div>

        {/* Footer Links */}
        <div className="text-center space-y-4 pt-4 border-t border-border">
          <p className="text-sm text-muted">Don't have an invite?</p>
          <div className="flex justify-center gap-4">
            <Link href="/request-invite" className="text-sm font-medium text-primary hover:underline">
              Request an Invite
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
