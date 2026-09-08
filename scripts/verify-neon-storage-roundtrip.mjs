import { DeleteObjectCommand, GetObjectCommand, HeadObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

const required = ["NEON_STORAGE_ENDPOINT", "NEON_STORAGE_REGION", "NEON_STORAGE_ACCESS_KEY_ID", "NEON_STORAGE_SECRET_ACCESS_KEY", "NEON_STORAGE_PRIVATE_BUCKET", "NEON_STORAGE_PUBLIC_BUCKET"];
const missing = required.filter(name => !process.env[name]);
if (missing.length) throw new Error(`Missing storage configuration: ${missing.join(", ")}`);
if (process.env.STORAGE_ROUNDTRIP_APPLY !== "true") throw new Error("Set STORAGE_ROUNDTRIP_APPLY=true to run temporary object checks.");

const client = new S3Client({
  endpoint: process.env.NEON_STORAGE_ENDPOINT,
  region: process.env.NEON_STORAGE_REGION,
  forcePathStyle: true,
  credentials: { accessKeyId: process.env.NEON_STORAGE_ACCESS_KEY_ID, secretAccessKey: process.env.NEON_STORAGE_SECRET_ACCESS_KEY },
});
const body = new TextEncoder().encode(`weave-storage-check:${crypto.randomUUID()}`);
const results = [];
for (const bucket of [process.env.NEON_STORAGE_PUBLIC_BUCKET, process.env.NEON_STORAGE_PRIVATE_BUCKET]) {
  const key = `_verification/${crypto.randomUUID()}.txt`;
  try {
    await client.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: body, ContentType: "text/plain", CacheControl: "no-store" }));
    const head = await client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
    const object = await client.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
    const downloaded = await object.Body.transformToByteArray();
    const matches = downloaded.length === body.length && downloaded.every((byte, index) => byte === body[index]);
    if (!matches || Number(head.ContentLength) !== body.length) throw new Error(`Round-trip mismatch in ${bucket}`);
    results.push({ bucket, put: true, head: true, get: true, bytesMatch: true });
  } finally {
    await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
  }
}
console.table(results);
