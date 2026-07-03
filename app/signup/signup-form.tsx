"use client";

import { useState } from "react";
import { registerWithInvite } from "@/app/actions/auth";
import { useRouter } from "next/navigation";
import { CheckCircle2, Lock } from "lucide-react";

export default function SignupForm({ 
  initialCode, 
  initialEmail, 
  isEmailLocked 
}: { 
  initialCode: string; 
  initialEmail: string;
  isEmailLocked: boolean;
}) {
  const router = useRouter();
  
  const [code, setCode] = useState(initialCode);
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setIsSubmitting(true);
    
    // Call server action to securely register the user
    const result = await registerWithInvite(code, email, password);
    
    setIsSubmitting(false);

    if (result.error) {
      setError(result.error);
    } else {
      setSuccess(true);
      // Wait a moment then redirect to login
      setTimeout(() => {
        router.push("/login?registered=true");
      }, 2000);
    }
  };

  if (success) {
    return (
      <div className="text-center py-8 space-y-4">
        <div className="flex justify-center">
          <CheckCircle2 className="w-16 h-16 text-success" />
        </div>
        <h2 className="text-xl font-bold text-heading">Account Created!</h2>
        <p className="text-sm text-body">
          Your invite has been successfully redeemed. Redirecting you to login...
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-error/10 border border-error/20 text-error text-sm rounded-md">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-heading mb-1">Invite Code</label>
        <input 
          type="text" 
          value={code}
          onChange={(e) => setCode(e.target.value)}
          required
          readOnly={!!initialCode} // Lock if passed via URL
          className={`w-full bg-background border border-border rounded-md px-4 py-2 text-sm text-body focus:outline-none focus:border-primary ${initialCode ? 'opacity-70 cursor-not-allowed font-mono' : ''}`}
          placeholder="WV-XXXX-XXXX"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-heading mb-1 flex items-center justify-between">
          Email Address
          {isEmailLocked && (
            <span title="Locked to approved email">
              <Lock className="w-3 h-3 text-muted" />
            </span>
          )}
        </label>
        <input 
          type="email" 
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          readOnly={isEmailLocked}
          className={`w-full bg-background border border-border rounded-md px-4 py-2 text-sm text-body focus:outline-none focus:border-primary ${isEmailLocked ? 'opacity-70 cursor-not-allowed' : ''}`}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-heading mb-1">Password</label>
        <input 
          type="password" 
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full bg-background border border-border rounded-md px-4 py-2 text-sm text-body focus:outline-none focus:border-primary"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-heading mb-1">Confirm Password</label>
        <input 
          type="password" 
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          className="w-full bg-background border border-border rounded-md px-4 py-2 text-sm text-body focus:outline-none focus:border-primary"
        />
      </div>

      <button 
        type="submit" 
        disabled={isSubmitting}
        className="w-full bg-primary text-surface font-medium rounded-md py-2.5 hover:bg-primary-hover transition-colors disabled:opacity-50 mt-4"
      >
        {isSubmitting ? "Creating Account..." : "Create Account"}
      </button>
    </form>
  );
}
