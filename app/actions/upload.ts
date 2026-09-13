"use server";

import { storeUpload } from "@/lib/neon-storage";
import { sql } from "@/lib/neon";
import { getCurrentUserId } from "./user";

export async function uploadFile(formData: FormData) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) throw new Error("Not authenticated");
    const file = formData.get("file");
    const folder = formData.get("folder");
    if (!(file instanceof File) || typeof folder !== "string") throw new Error("No file provided");
    const exchangeMatch = /^exchanges\/([A-Za-z0-9_-]{1,128})$/.exec(folder);
    if (exchangeMatch) {
      const [exchange] = await sql.query(
        `select id from exchanges where id=$1 and $2 in(requester_id,provider_id) and status in('in_progress','revision_requested')
         and (is_mutual or provider_id=$2) and (payload->'pendingSubmissions' is null or payload->'pendingSubmissions' ? $2)`,
        [exchangeMatch[1], userId],
      );
      if (!exchange) throw new Error("This exchange is not accepting a submission from you");
    }
    return { success: true, url: await storeUpload(userId, file, folder) };
  } catch (error) {
    console.error("Upload error", error);
    return { success: false, error: error instanceof Error ? error.message : "Upload failed" };
  }
}
