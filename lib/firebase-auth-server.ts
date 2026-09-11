import "server-only";

import {
  SignJWT,
  decodeProtectedHeader,
  importPKCS8,
  importSPKI,
  importX509,
  jwtVerify,
  type JWTPayload,
} from "jose";

const OAUTH_TOKEN_URL = "https://oauth2.googleapis.com/token";
const AUTH_API_ORIGIN = "https://identitytoolkit.googleapis.com/v1/projects";
const ID_TOKEN_CERT_URL = "https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com";
const SESSION_COOKIE_CERT_URL = "https://www.googleapis.com/identitytoolkit/v3/relyingparty/publicKeys";
const SERVICE_ACCOUNT_SCOPES = [
  "https://www.googleapis.com/auth/cloud-platform",
  "https://www.googleapis.com/auth/identitytoolkit",
].join(" ");

export type FirebaseClaims = JWTPayload & {
  uid: string;
  sub: string;
  email?: string;
  auth_time?: number;
};

type FirebaseAccount = {
  localId: string;
  email?: string;
  disabled?: boolean;
  validSince?: string;
};

type CertificateCache = {
  certificates: Record<string, string>;
  expiresAt: number;
};

let oauthTokenCache: { token: string; expiresAt: number } | null = null;
const certificateCaches = new Map<string, CertificateCache>();

function requiredEnvironmentVariable(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

function firebaseProjectId(): string {
  return requiredEnvironmentVariable("FIREBASE_PROJECT_ID");
}

function firebasePrivateKey(): string {
  return requiredEnvironmentVariable("FIREBASE_PRIVATE_KEY").replace(/\\n/g, "\n");
}

function responseCacheLifetime(response: Response): number {
  const cacheControl = response.headers.get("cache-control") ?? "";
  const maxAge = /(?:^|,)\s*max-age=(\d+)/i.exec(cacheControl)?.[1];
  return maxAge ? Number(maxAge) * 1000 : 60 * 60 * 1000;
}

async function getServiceAccountAccessToken(): Promise<string> {
  const now = Date.now();
  if (oauthTokenCache && oauthTokenCache.expiresAt > now + 60_000) return oauthTokenCache.token;

  const clientEmail = requiredEnvironmentVariable("FIREBASE_CLIENT_EMAIL");
  const signingKey = await importPKCS8(firebasePrivateKey(), "RS256");
  const issuedAt = Math.floor(now / 1000);
  const assertion = await new SignJWT({ scope: SERVICE_ACCOUNT_SCOPES })
    .setProtectedHeader({ alg: "RS256", typ: "JWT" })
    .setIssuer(clientEmail)
    .setSubject(clientEmail)
    .setAudience(OAUTH_TOKEN_URL)
    .setIssuedAt(issuedAt)
    .setExpirationTime(issuedAt + 3600)
    .sign(signingKey);

  const response = await fetch(OAUTH_TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });
  const data = await response.json() as { access_token?: string; expires_in?: number; error_description?: string };
  if (!response.ok || !data.access_token) {
    throw new Error(data.error_description || `Firebase service-account authentication failed (${response.status})`);
  }

  oauthTokenCache = {
    token: data.access_token,
    expiresAt: now + Math.max(60, Number(data.expires_in ?? 3600)) * 1000,
  };
  return data.access_token;
}

function firebaseErrorMessage(data: unknown, status: number): string {
  if (data && typeof data === "object" && "error" in data) {
    const error = data.error;
    if (error && typeof error === "object" && "message" in error && typeof error.message === "string") {
      return error.message;
    }
  }
  return `Firebase Auth request failed (${status})`;
}

async function firebaseAuthRequest<T>(path: string, body: Record<string, unknown>): Promise<T> {
  const accessToken = await getServiceAccountAccessToken();
  const response = await fetch(`${AUTH_API_ORIGIN}/${encodeURIComponent(firebaseProjectId())}${path}`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${accessToken}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const data: unknown = await response.json().catch(() => null);
  if (!response.ok) throw new Error(firebaseErrorMessage(data, response.status));
  return data as T;
}

async function fetchCertificates(url: string, forceRefresh = false): Promise<Record<string, string>> {
  const cached = certificateCaches.get(url);
  if (!forceRefresh && cached && cached.expiresAt > Date.now()) return cached.certificates;

  const response = await fetch(url, { headers: { accept: "application/json" } });
  if (!response.ok) throw new Error(`Unable to load Firebase signing certificates (${response.status})`);
  const certificates = await response.json() as Record<string, string>;
  certificateCaches.set(url, {
    certificates,
    expiresAt: Date.now() + responseCacheLifetime(response),
  });
  return certificates;
}

async function signingCertificate(url: string, kid: string): Promise<string> {
  const certificates = await fetchCertificates(url);
  if (certificates[kid]) return certificates[kid];
  const refreshed = await fetchCertificates(url, true);
  if (!refreshed[kid]) throw new Error("Firebase token uses an unknown signing key");
  return refreshed[kid];
}

async function verifyFirebaseToken(token: string, kind: "id" | "session"): Promise<FirebaseClaims> {
  if (!token) throw new Error("Missing Firebase token");
  const header = decodeProtectedHeader(token);
  if (header.alg !== "RS256" || !header.kid) throw new Error("Invalid Firebase token header");

  const projectId = firebaseProjectId();
  const certificateUrl = kind === "id" ? ID_TOKEN_CERT_URL : SESSION_COOKIE_CERT_URL;
  const issuer = kind === "id"
    ? `https://securetoken.google.com/${projectId}`
    : `https://session.firebase.google.com/${projectId}`;
  const certificate = await signingCertificate(certificateUrl, header.kid);
  const key = certificate.includes("BEGIN CERTIFICATE")
    ? await importX509(certificate, "RS256")
    : await importSPKI(certificate, "RS256");
  const { payload } = await jwtVerify(token, key, {
    algorithms: ["RS256"],
    audience: projectId,
    issuer,
  });

  if (typeof payload.sub !== "string" || payload.sub.length === 0 || payload.sub.length > 128) {
    throw new Error("Invalid Firebase token subject");
  }
  return { ...payload, uid: payload.sub, sub: payload.sub } as FirebaseClaims;
}

async function lookupFirebaseAccounts(identifier: { localId?: string[]; email?: string[] }): Promise<FirebaseAccount[]> {
  const response = await firebaseAuthRequest<{ users?: FirebaseAccount[] }>("/accounts:lookup", identifier);
  return response.users ?? [];
}

export async function verifyFirebaseIdToken(idToken: string): Promise<FirebaseClaims> {
  return verifyFirebaseToken(idToken, "id");
}

export async function createFirebaseSessionCookie(idToken: string, expiresIn: number): Promise<string> {
  if (!Number.isFinite(expiresIn) || expiresIn < 5 * 60 * 1000 || expiresIn > 14 * 24 * 60 * 60 * 1000) {
    throw new Error("Invalid Firebase session duration");
  }
  const response = await firebaseAuthRequest<{ sessionCookie?: string }>(":createSessionCookie", {
    idToken,
    validDuration: Math.floor(expiresIn / 1000),
  });
  if (!response.sessionCookie) throw new Error("Firebase did not return a session cookie");
  return response.sessionCookie;
}

export async function verifyFirebaseSessionCookie(sessionCookie: string, checkRevoked = true): Promise<FirebaseClaims> {
  const claims = await verifyFirebaseToken(sessionCookie, "session");
  if (!checkRevoked) return claims;

  const [account] = await lookupFirebaseAccounts({ localId: [claims.uid] });
  if (!account || account.disabled) throw new Error("Firebase user is unavailable or disabled");
  const validSince = Number(account.validSince ?? 0);
  const authenticatedAt = Number(claims.auth_time ?? 0);
  if (validSince && (!authenticatedAt || authenticatedAt < validSince)) {
    throw new Error("Firebase session has been revoked");
  }
  return claims;
}

export async function getFirebaseUserByEmail(email: string): Promise<FirebaseAccount | null> {
  const [account] = await lookupFirebaseAccounts({ email: [email] });
  return account ?? null;
}

export async function createFirebaseUser(input: { email: string; password: string; emailVerified: boolean }): Promise<{ uid: string }> {
  const response = await firebaseAuthRequest<{ localId?: string }>("/accounts", input);
  if (!response.localId) throw new Error("Firebase did not return a user ID");
  return { uid: response.localId };
}

export async function deleteFirebaseUser(uid: string): Promise<void> {
  await firebaseAuthRequest("/accounts:delete", { localId: uid });
}

export async function revokeFirebaseRefreshTokens(uid: string): Promise<void> {
  await firebaseAuthRequest("/accounts:update", {
    localId: uid,
    validSince: Math.floor(Date.now() / 1000),
  });
}
