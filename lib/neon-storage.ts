import "server-only";

import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

const required = [
  "NEON_STORAGE_ENDPOINT",
  "NEON_STORAGE_REGION",
  "NEON_STORAGE_ACCESS_KEY_ID",
  "NEON_STORAGE_SECRET_ACCESS_KEY",
  "NEON_STORAGE_PRIVATE_BUCKET",
  "NEON_STORAGE_PUBLIC_BUCKET",
] as const;

function requiredValue(name: (typeof required)[number]) {
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
  return /^(avatars|portfolio)\/[A-Za-z0-9_-]+\/[A-Za-z0-9._-]+$/.test(key);
}

export function publicObjectUrl(key: string) {
  if (!isPublicObjectKey(key)) throw new Error("Invalid public object key");
  return `/api/storage/public/${key.split("/").map(encodeURIComponent).join("/")}`;
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
