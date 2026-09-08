"use server";

import { storeUpload } from "@/lib/neon-storage";
import { getCurrentUserId } from "./user";

export async function uploadFile(formData: FormData) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) throw new Error("Not authenticated");
    const file = formData.get("file");
    const folder = formData.get("folder");
    if (!(file instanceof File) || typeof folder !== "string") throw new Error("No file provided");
    return { success: true, url: await storeUpload(userId, file, folder) };
  } catch (error) {
    console.error("Upload error", error);
    return { success: false, error: error instanceof Error ? error.message : "Upload failed" };
  }
}
