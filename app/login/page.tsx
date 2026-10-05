"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Lock } from "lucide-react";
import {
  signInWithEmailAndPassword,
  getMultiFactorResolver,
  TotpMultiFactorGenerator,
  type MultiFactorResolver,
  type MultiFactorError,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Suspense } from "react";
import { object } from "@/lib/settings";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextUrl = searchParams.get("next") || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [resolver, setResolver] = useState<MultiFactorResolver | null>(null);
  const [mfaCode, setMfaCode] = useState("");
  const [factorId, setFactorId] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      // 1. Authenticate with Firebase Client SDK
      const userCredential = resolver
        ? await resolver.resolveSignIn(
            TotpMultiFactorGenerator.assertionForSignIn(factorId, mfaCode),
          )
        : await signInWithEmailAndPassword(auth, email, password);

      // 2. Get the ID Token
      const idToken = await userCredential.user.getIdToken();

      // 3. Send token to our server API to mint a secure session cookie
      const res = await fetch("/api/auth/session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ idToken, rememberMe }),
      });

      if (!res.ok) {
        const data: unknown = await res.json();
        const message =
          typeof data === "object" &&
          data !== null &&
          "error" in data &&
          typeof data.error === "string"
            ? data.error
            : "Failed to create session";
        throw new Error(message);
      }

      // 4. Redirect to user dashboard or requested URL
      const result = object(await res.json());
      router.push(
        result.recovery
          ? "/account-recovery"
          : searchParams.has("next") && /^\/(?!\/|\\)/.test(nextUrl)
            ? nextUrl
            : typeof result.landing === "string"
              ? result.landing
              : "/dashboard",
      );
      router.refresh();
    } catch (err: any) {
      if (err.code === "auth/multi-factor-auth-required") {
        const next = getMultiFactorResolver(auth, err as MultiFactorError);
        setResolver(next);
        setFactorId(
          next.hints.find(
            (hint) => hint.factorId === TotpMultiFactorGenerator.FACTOR_ID,
          )?.uid || "",
        );
        setError(null);
        return;
      }
      console.error("Login Error:", err);
      if (["auth/invalid-credential","auth/wrong-password","auth/user-not-found"].includes(err.code) && !resolver) {
        void fetch("/api/auth/failed-sign-in",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({email,password})}).catch(()=>{});
      }
      if (err.code === "auth/invalid-credential") {
        setError("Invalid email or password.");
      } else {
        setError(err.message || "An error occurred during login.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (resolver)
    return (
      <div className="mx-auto max-w-md space-y-5 px-4 py-20">
        <h1 className="text-2xl font-bold text-heading">
          Confirm authenticator code
        </h1>
        <p className="text-sm text-muted">
          Enter the code from your authenticator app.
        </p>
        <form onSubmit={handleLogin} className="space-y-4">
          <label className="block text-sm">
            Authenticator
            <select
              value={factorId}
              onChange={(event) => setFactorId(event.target.value)}
              className="mt-1 block w-full rounded-lg border border-border bg-background p-3"
            >
              {resolver.hints
                .filter(
                  (hint) =>
                    hint.factorId === TotpMultiFactorGenerator.FACTOR_ID,
                )
                .map((hint) => (
                  <option key={hint.uid} value={hint.uid}>
                    {hint.displayName || "Authenticator"}
                  </option>
                ))}
            </select>
          </label>
          <label className="block text-sm">
            Verification code
            <input
              required
              inputMode="numeric"
              autoComplete="one-time-code"
              value={mfaCode}
              onChange={(event) => setMfaCode(event.target.value)}
              className="mt-1 block w-full rounded-lg border border-border bg-background p-3"
            />
          </label>
          {error && (
            <p role="alert" className="text-sm text-error">
              {error}
            </p>
          )}
          <button
            disabled={isSubmitting || !factorId}
            className="rounded-lg bg-primary px-4 py-2 font-bold text-white"
          >
            {isSubmitting ? "Verifying…" : "Verify and sign in"}
          </button>
          <button
            type="button"
            onClick={() => {
              setResolver(null);
              setMfaCode("");
            }}
            className="ml-4 text-sm underline"
          >
            Back to sign-in
          </button>
        </form>
      </div>
    );
  return (
    <div className="min-h-screen bg-background flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* Top Left Back Button */}
      <div className="absolute top-8 left-8">
        <Link
          href="/"
          className="text-muted hover:text-primary transition-colors flex items-center gap-2 text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Weave
        </Link>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20">
            <Lock className="w-6 h-6 text-primary" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-heading">
          Welcome back
        </h2>
        <p className="mt-2 text-center text-sm text-body">
          Enter your details below to sign in
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="py-8 px-4 sm:px-10">
          {error && (
            <div className="mb-6 p-3 bg-error/10 border border-error/20 text-error text-sm rounded-[var(--radius-input)]">
              {error}
            </div>
          )}

          <form className="space-y-6" onSubmit={handleLogin}>
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-heading"
              >
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
              <label
                htmlFor="password"
                className="block text-sm font-medium text-heading"
              >
                Password
              </label>
              <div className="mt-2">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="block w-full appearance-none rounded-[var(--radius-input)] border border-border bg-background px-3 py-2 text-body placeholder-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary sm:text-sm transition-colors"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 rounded border-border text-primary focus:ring-primary bg-background"
                />
                <label
                  htmlFor="remember-me"
                  className="ml-2 block text-sm text-body"
                >
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <Link
                  href="/forgot-password"
                  className="font-medium text-primary hover:text-primary-hover transition-colors"
                >
                  Forgot your password?
                </Link>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex w-full justify-center rounded-[var(--radius-button)] bg-primary py-2.5 px-4 text-sm font-bold text-surface shadow-sm hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-colors disabled:opacity-50"
              >
                {isSubmitting ? "Signing In..." : "Sign In"}
              </button>
            </div>
          </form>

          {/* Footer Links */}
          <div className="mt-8 pt-6 border-t border-border flex flex-col gap-3 text-center text-sm text-body">
            <div>
              Don't have an account?{" "}
              <Link
                href="/request-invite"
                className="font-medium text-primary hover:text-primary-hover transition-colors"
              >
                Request an invite
              </Link>
            </div>
            <div>
              Have an invite code?{" "}
              <Link
                href="/signup"
                className="font-medium text-primary hover:text-primary-hover transition-colors"
              >
                Sign up here
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Login() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          Loading...
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
