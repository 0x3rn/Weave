"use server";

import { privateBucket, publicBucket, publicObjectUrl, putObject } from "@/lib/neon-storage";
import { getCurrentUserId } from "./user";

const extensionByType: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "application/pdf": "pdf",
  "application/zip": "zip",
};

function hasSupportedSignature(bytes: Uint8Array, type: string) {
  const text = new TextDecoder().decode(bytes.slice(0, 12));
  if (type === "image/jpeg") return bytes.length > 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (type === "image/png") return bytes.length > 8 && bytes.slice(0, 8).every((byte, index) => byte === [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a][index]);
  if (type === "image/webp") return text.slice(0, 4) === "RIFF" && text.slice(8, 12) === "WEBP";
  if (type === "application/pdf") return text.slice(0, 5) === "%PDF-";
  return type === "application/zip" && bytes.length > 4 && bytes[0] === 0x50 && bytes[1] === 0x4b && bytes[2] === 0x03 && bytes[3] === 0x04;
}

export async function uploadFile(formData: FormData) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) throw new Error("Not authenticated");
    const file = formData.get("file");
    const folder = formData.get("folder");
    if (!(file instanceof File) || typeof folder !== "string") throw new Error("No file provided");
    if (file.size === 0 || file.size > 5 * 1024 * 1024) throw new Error("File too large. Maximum size is 5MB.");
    if (!(file.type in extensionByType)) throw new Error("Unsupported file type");
    const bytes = new Uint8Array(await file.arrayBuffer());
    if (!hasSupportedSignature(bytes, file.type)) throw new Error("File contents do not match a supported format");

    const extension = extensionByType[file.type];
    const objectId = crypto.randomUUID();
    const publicFolder = folder === "avatars" || folder === "portfolio";
    const exchangeMatch = /^exchanges\/([A-Za-z0-9_-]{1,128})$/.exec(folder);
    if (!publicFolder && !exchangeMatch && folder !== "deliverables" && folder !== "misc") throw new Error("Unsupported file destination");

    const key = publicFolder
      ? `${folder}/${userId}/${objectId}.${extension}`
      : exchangeMatch
        ? `exchanges/${exchangeMatch[1]}/${userId}/${objectId}.${extension}`
        : `private/${userId}/${folder}/${objectId}.${extension}`;
    const bucket = publicFolder ? publicBucket() : privateBucket();
    await putObject({
      bucket,
      key,
      body: bytes,
      contentType: file.type,
      cacheControl: publicFolder ? "public, max-age=31536000, immutable" : "private, no-store",
    });

    const url = publicFolder
      ? publicObjectUrl(key)
      : `/api/storage/private/${key.split("/").map(encodeURIComponent).join("/")}`;
    return { success: true, url };
  } catch (error) {
    console.error("Upload error", error);
    return { success: false, error: error instanceof Error ? error.message : "Upload failed" };
  }
}
