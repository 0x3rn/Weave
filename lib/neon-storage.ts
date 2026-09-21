import "server-only";

import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

type RequiredStorageName =
  | "NEON_STORAGE_ENDPOINT"
  | "NEON_STORAGE_REGION"
  | "NEON_STORAGE_ACCESS_KEY_ID"
  | "NEON_STORAGE_SECRET_ACCESS_KEY"
  | "NEON_STORAGE_PRIVATE_BUCKET"
  | "NEON_STORAGE_PUBLIC_BUCKET";

function requiredValue(name: RequiredStorageName) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not configured`);
  return value;
}

let client: S3Client | undefined;

export function neonStorage() {
  client ??= new S3Client({
    endpoint: requiredValue("NEON_STORAGE_ENDPOINT"),
    region: requiredValue("NEON_STORAGE_REGION"),
    forcePathStyle: true,
    credentials: {
      accessKeyId: requiredValue("NEON_STORAGE_ACCESS_KEY_ID"),
      secretAccessKey: requiredValue("NEON_STORAGE_SECRET_ACCESS_KEY"),
    },
  });
  return client;
}

export function publicBucket() {
  return requiredValue("NEON_STORAGE_PUBLIC_BUCKET");
}

export function privateBucket() {
  return requiredValue("NEON_STORAGE_PRIVATE_BUCKET");
}

export function isPublicObjectKey(key: string) {
  return /^(?:(?:avatars|portfolio)\/[A-Za-z0-9_-]+\/[A-Za-z0-9._-]+|[A-Za-z0-9_-]+\/avatars\/[A-Za-z0-9._-]+)$/.test(key);
}

export function publicObjectUrl(key: string) {
  if (!isPublicObjectKey(key)) throw new Error("Invalid public object key");
  return `/api/storage/public/${key.split("/").map(encodeURIComponent).join("/")}`;
}

export function publicObjectKeyFromUrl(url: string) {
  const prefix = "/api/storage/public/";
  if (!url.startsWith(prefix)) return null;
  const key = url.slice(prefix.length).split("/").map(segment => decodeURIComponent(segment)).join("/");
  return isPublicObjectKey(key) ? key : null;
}

export async function putObject(input: {
  bucket: string;
  key: string;
  body: Uint8Array;
  contentType: string;
  cacheControl: string;
}) {
  await neonStorage().send(new PutObjectCommand({
    Bucket: input.bucket,
    Key: input.key,
    Body: input.body,
    ContentType: input.contentType,
    CacheControl: input.cacheControl,
  }));
}

export async function deleteObject(bucket: string, key: string) {
  await neonStorage().send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
}

export async function getPublicObject(key: string) {
  if (!isPublicObjectKey(key)) return null;
  return neonStorage().send(new GetObjectCommand({ Bucket: publicBucket(), Key: key }));
}

const extensionByType: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "application/pdf": "pdf",
  "application/zip": "zip",
  "text/plain": "txt",
  "text/markdown": "md",
  "application/json": "json",
  "text/css": "css",
  "text/javascript": "js",
  "application/javascript": "js",
  "text/typescript": "ts",
  "application/typescript": "ts",
};

const typeByExtension: Record<string, string> = {
  txt: "text/plain", md: "text/markdown", json: "application/json", css: "text/css", js: "text/javascript", jsx: "text/javascript", ts: "text/typescript", tsx: "text/typescript",
};

function hasSupportedSignature(bytes: Uint8Array, type: string) {
  const text = new TextDecoder().decode(bytes.slice(0, 12));
  if (type === "image/jpeg") return bytes.length > 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (type === "image/png") return bytes.length > 8 && bytes.slice(0, 8).every((byte, index) => byte === [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a][index]);
  if (type === "image/webp") return text.slice(0, 4) === "RIFF" && text.slice(8, 12) === "WEBP";
  if (type === "application/pdf") return text.slice(0, 5) === "%PDF-";
  if (type === "application/zip") return bytes.length > 4 && bytes[0] === 0x50 && bytes[1] === 0x4b && bytes[2] === 0x03 && bytes[3] === 0x04;
  if (type.startsWith("text/") || type === "application/json" || type === "application/javascript" || type === "application/typescript") {
    if (bytes.includes(0)) return false;
    try { new TextDecoder("utf-8", { fatal: true }).decode(bytes); return true; } catch { return false; }
  }
  return false;
}

export async function storeUpload(userId: string, file: File, folder: string) {
  if (!userId || !(file instanceof File)) throw new Error("Invalid upload");
  if (file.size === 0 || file.size > 5 * 1024 * 1024) throw new Error("File too large. Maximum size is 5MB.");
  const suppliedType = file.type.toLowerCase();
  const originalExtension = file.name.split(".").at(-1)?.toLowerCase() || "";
  const contentType = suppliedType in extensionByType ? suppliedType : typeByExtension[originalExtension];
  if (!contentType || !(contentType in extensionByType)) throw new Error("Unsupported file type");
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!hasSupportedSignature(bytes, contentType)) throw new Error("File contents do not match a supported format");

  const publicFolder = folder === "avatars" || folder === "portfolio";
  const exchangeMatch = /^exchanges\/([A-Za-z0-9_-]{1,128})$/.exec(folder);
  if (!publicFolder && !exchangeMatch && folder !== "deliverables" && folder !== "misc") throw new Error("Unsupported file destination");
  const filename = `${crypto.randomUUID()}.${extensionByType[contentType]}`;
  const key = publicFolder
    ? `${folder}/${userId}/${filename}`
    : exchangeMatch
      ? `exchanges/${exchangeMatch[1]}/${userId}/${filename}`
      : `private/${userId}/${folder}/${filename}`;
  await putObject({
    bucket: publicFolder ? publicBucket() : privateBucket(),
    key,
    body: bytes,
    contentType,
    cacheControl: publicFolder ? "public, max-age=31536000, immutable" : "private, no-store",
  });
  return publicFolder ? publicObjectUrl(key) : `/api/storage/private/${key.split("/").map(encodeURIComponent).join("/")}`;
}

export async function storeMessageAttachment(userId: string, conversationId: string, file: File) {
  if (!/^[A-Za-z0-9_-]{1,128}$/.test(conversationId)) throw new Error("Invalid conversation");
  if (!(file instanceof File) || file.size === 0 || file.size > 5 * 1024 * 1024) throw new Error("File too large. Maximum size is 5MB.");
  const suppliedType = file.type.toLowerCase();
  const originalExtension = file.name.split(".").at(-1)?.toLowerCase() || "";
  const contentType = suppliedType in extensionByType ? suppliedType : typeByExtension[originalExtension];
  if (!contentType || !(contentType in extensionByType)) throw new Error("Unsupported file type");
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!hasSupportedSignature(bytes, contentType)) throw new Error("File contents do not match a supported format");
  const filename = `${crypto.randomUUID()}.${extensionByType[contentType]}`;
  const key = `messages/${conversationId}/${userId}/${filename}`;
  await putObject({ bucket: privateBucket(), key, body: bytes, contentType, cacheControl: "private, no-store" });
  return { key, contentType, sizeBytes: file.size };
}