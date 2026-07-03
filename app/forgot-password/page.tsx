"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Mail, AlertCircle, CheckCircle2 } from "lucide-react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/lib/firebase"; // Client SDK

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setStatus("loading");
    setErrorMessage("");

    try {
      await sendPasswordResetEmail(auth, email);
      setStatus("success");
    } catch (error: any) {
      setStatus("error");
      // Handle common Firebase errors gracefully
      if (error.code === "auth/user-not-found") {
        setErrorMessage("We couldn't find an account with that email address.");
      } else if (error.code === "auth/invalid-email") {
        setErrorMessage("Please enter a valid email address.");
      } else {
        setErrorMessage("An error occurred. Please try again later.");
      }
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* Top Left Back Button */}
      <div className="absolute top-8 left-8">
        <Link href="/login" className="text-muted hover:text-primary transition-colors flex items-center gap-2 text-sm font-medium">
          <ArrowLeft className="w-4 h-4" />
          Back to Login
        </Link>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20">
            <Mail className="w-6 h-6 text-primary" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-heading">
          Reset Password
        </h2>
        <p className="mt-2 text-center text-sm text-body">
          Enter your email address and we'll send you a link to reset your password.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-surface px-4 py-8 shadow-xl border border-border sm:rounded-2xl sm:px-10">
          
          {status === "success" ? (
            <div className="text-center space-y-6">
              <div className="bg-success/10 border border-success/20 rounded-[var(--radius-card)] p-4 flex flex-col items-center gap-3">
                <CheckCircle2 className="w-8 h-8 text-success" />
                <div>
                  <h3 className="font-bold text-success mb-1">Check your inbox</h3>
                  <p className="text-sm text-success/80">
                    We've sent a password reset link to <strong>{email}</strong>.
                  </p>
                </div>
              </div>
              <p className="text-sm text-body">
                Didn't receive the email? Check your spam folder or{" "}
                <button 
                  onClick={() => setStatus("idle")} 
                  className="text-primary hover:underline font-medium"
                >
                  try another email address
                </button>.
              </p>
            </div>
          ) : (
            <form className="space-y-6" onSubmit={handleSubmit}>
              
              {status === "error" && (
                <div className="bg-error/10 border border-error/20 rounded-[var(--radius-input)] p-3 flex items-start gap-2 text-error text-sm">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

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
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="block w-full appearance-none rounded-[var(--radius-input)] border border-border bg-background px-3 py-2 text-body placeholder-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary sm:text-sm transition-colors"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={status === "loading"}
                  className="flex w-full justify-center rounded-[var(--radius-button)] bg-primary py-2.5 px-4 text-sm font-bold text-surface shadow-sm hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-colors disabled:opacity-50"
                >
                  {status === "loading" ? "Sending..." : "Send Reset Link"}
                </button>
              </div>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}
