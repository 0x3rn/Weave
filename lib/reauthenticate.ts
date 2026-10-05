"use client";
import { auth } from "./firebase";
import {
  EmailAuthProvider,
  GoogleAuthProvider,
  GithubAuthProvider,
  OAuthProvider,
  reauthenticateWithCredential,
  reauthenticateWithPopup,
  getMultiFactorResolver,
  TotpMultiFactorGenerator,
  type MultiFactorError,
} from "firebase/auth";
export async function freshIdentity(password: string, code?: string) {
  await auth.authStateReady();
  const user = auth.currentUser;
  if (!user)
    throw new Error("Sign out and sign in again to confirm your identity.");
  try {
    if (
      user.providerData.some((provider) => provider.providerId === "password")
    ) {
      if (!password || !user.email)
        throw new Error("Enter your current password.");
      await reauthenticateWithCredential(
        user,
        EmailAuthProvider.credential(user.email, password),
      );
    } else {
      const provider = user.providerData[0]?.providerId;
      if (!provider) throw new Error("Sign in again to confirm your identity.");
      await reauthenticateWithPopup(
        user,
        provider === "google.com"
          ? new GoogleAuthProvider()
          : provider === "github.com"
            ? new GithubAuthProvider()
            : new OAuthProvider(provider),
      );
    }
  } catch (error) {
    if ((error as { code?: string }).code !== "auth/multi-factor-auth-required")
      throw error;
    const resolver = getMultiFactorResolver(auth, error as MultiFactorError);
    const factor = resolver.hints.find(
      (item) => item.factorId === TotpMultiFactorGenerator.FACTOR_ID,
    );
    if (!factor || !code)
      throw new Error(
        "Enter the code from your authenticator app to confirm your identity.",
      );
    await resolver.resolveSignIn(
      TotpMultiFactorGenerator.assertionForSignIn(factor.uid, code),
    );
  }
  return user.getIdToken(true);
}
