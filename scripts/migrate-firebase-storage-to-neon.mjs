import { createHash } from "node:crypto";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getStorage } from "firebase-admin/storage";
import { HeadObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { neon } from "@neondatabase/serverless";

const required = [
  "DATABASE_URL",
  "FIREBASE_PROJECT_ID",
  "FIREBASE_CLIENT_EMAIL",
  "FIREBASE_PRIVATE_KEY",
  "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
  "NEON_STORAGE_ENDPOINT",
  "NEON_STORAGE_REGION",
  "NEON_STORAGE_ACCESS_KEY_ID",
  "NEON_STORAGE_SECRET_ACCESS_KEY",
  "NEON_STORAGE_PRIVATE_BUCKET",
  "NEON_STORAGE_PUBLIC_BUCKET",
];
const missing = required.filter(name => !process.env[name]);
if (missing.length) throw new Error(`Missing configuration: ${missing.join(", ")}`);
if (process.env.STORAGE_MIGRATION_APPLY !== "true") throw new Error("Set STORAGE_MIGRATION_APPLY=true to copy objects.");

if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    }),
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  });
}

const source = getStorage().bucket(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET);
const storage = new S3Client({
  endpoint: process.env.NEON_STORAGE_ENDPOINT,
  region: process.env.NEON_STORAGE_REGION,
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.NEON_STORAGE_ACCESS_KEY_ID,
    secretAccessKey: process.env.NEON_STORAGE_SECRET_ACCESS_KEY,
  },
});
const sql = neon(process.env.DATABASE_URL);

function isPublicObject(path) {
  return path.startsWith("portfolio/") || path.includes("/avatars/");
}

async function objectAlreadyMatches(bucket, key, size) {
  try {
    const object = await storage.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
    return Number(object.ContentLength) === size;
  } catch (error) {
    if (error?.name === "NotFound" || error?.$metadata?.httpStatusCode === 404) return false;
    throw error;
  }
}

const [files] = await source.getFiles({ autoPaginate: true });
const results = [];
for (const file of files) {
  const metadata = file.metadata ?? {};
  const targetBucket = isPublicObject(file.name)
    ? process.env.NEON_STORAGE_PUBLIC_BUCKET
    : process.env.NEON_STORAGE_PRIVATE_BUCKET;
  const targetKey = file.name;
  const [content] = await file.download();
  const sourceMd5 = metadata.md5Hash;
  const actualMd5 = createHash("md5").update(content).digest("base64");
  if (sourceMd5 && sourceMd5 !== actualMd5) throw new Error(`Checksum mismatch while reading ${file.name}`);
  const sha256 = createHash("sha256").update(content).digest("hex");
  const exists = await objectAlreadyMatches(targetBucket, targetKey, content.length);
  if (!exists) {
    await storage.send(new PutObjectCommand({
      Bucket: targetBucket,
      Key: targetKey,
      Body: content,
      ContentType: metadata.contentType || "application/octet-stream",
      CacheControl: isPublicObject(file.name) ? "public, max-age=31536000, immutable" : "private, no-store",
      Metadata: { source: "firebase", sha256 },
    }));
  }
  await sql.query(
    "update firebase_storage_objects set target_bucket=$2, target_key=$3, sha256=$4, migrated_at=now() where path=$1",
    [file.name, targetBucket, targetKey, sha256],
  );
  results.push({ source: file.name, bucket: targetBucket, copied: !exists, verified: true });
}

console.table(results.map(({ source, bucket, copied, verified }) => ({ source, bucket, copied, verified })));
console.log(`Migrated and verified ${results.length} objects.`);
