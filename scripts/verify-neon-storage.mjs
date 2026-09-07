import { HeadBucketCommand, ListObjectsV2Command, S3Client } from "@aws-sdk/client-s3";

const required = [
  "NEON_STORAGE_ENDPOINT",
  "NEON_STORAGE_REGION",
  "NEON_STORAGE_ACCESS_KEY_ID",
  "NEON_STORAGE_SECRET_ACCESS_KEY",
  "NEON_STORAGE_PRIVATE_BUCKET",
  "NEON_STORAGE_PUBLIC_BUCKET",
];

const missing = required.filter(name => !process.env[name]);
if (missing.length) throw new Error(`Missing storage configuration: ${missing.join(", ")}`);

const storage = new S3Client({
  endpoint: process.env.NEON_STORAGE_ENDPOINT,
  region: process.env.NEON_STORAGE_REGION,
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.NEON_STORAGE_ACCESS_KEY_ID,
    secretAccessKey: process.env.NEON_STORAGE_SECRET_ACCESS_KEY,
  },
});

const buckets = [process.env.NEON_STORAGE_PRIVATE_BUCKET, process.env.NEON_STORAGE_PUBLIC_BUCKET];
const checks = await Promise.all(buckets.map(async bucket => {
  await storage.send(new HeadBucketCommand({ Bucket: bucket }));
  const response = await storage.send(new ListObjectsV2Command({ Bucket: bucket, MaxKeys: 1 }));
  return { bucket, accessible: true, hasObjects: (response.KeyCount ?? 0) > 0 };
}));

console.table(checks);
