"use server";

import { payload, sql } from "@/lib/neon";
import { deleteObject, publicBucket, publicObjectKeyFromUrl, storeUpload } from "@/lib/neon-storage";
import { revalidatePath } from "next/cache";
import { getCurrentUserId } from "./user";

async function revalidateUserProfile(userId: string) {
  const [user] = await sql.query("select username from users where id=$1", [userId]);
  if (user?.username) revalidatePath(`/u/${user.username}`);
}

export async function addPortfolioItem(formData: FormData) {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error("Unauthorized");
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const link = String(formData.get("link") ?? "").trim();
  if (!title || title.length > 200 || !description || description.length > 5000) throw new Error("Invalid portfolio item");
  if (link) {
    const parsed = new URL(link);
    if (parsed.protocol !== "https:") throw new Error("Portfolio links must use HTTPS");
  }
  const technologies = String(formData.get("technologies") ?? "")
    .split(",").map(value => value.trim()).filter(Boolean).slice(0, 30);
  const image = formData.get("image");
  let imageURL: string | null = null;
  if (image instanceof File && image.size > 0) {
    if (!["image/jpeg", "image/png", "image/webp"].includes(image.type)) throw new Error("Portfolio images must be JPEG, PNG, or WebP");
    imageURL = await storeUpload(userId, image, "portfolio");
  }
  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  const item = { userId, title, description, link: link || null, technologies, imageURL, createdAt };
  await sql.transaction(tx => [
    tx.query(
      "insert into portfolio_items (id,user_id,title,description,image_url,link,technologies,created_at,payload) values ($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb)",
      [id, userId, title, description, imageURL, link || null, technologies, createdAt, JSON.stringify(item)],
    ),
    tx.query(
      "update users set updated_at=now(),payload=jsonb_set(jsonb_set(payload,'{hasPortfolio}','true'::jsonb,true),'{updatedAt}',to_jsonb($2::text),true) where id=$1",
      [userId, createdAt],
    ),
  ]);
  await revalidateUserProfile(userId);
  return { success: true, id };
}

export async function deletePortfolioItem(portfolioId: string, _legacyImageUrl?: string) {
  void _legacyImageUrl;
  const userId = await getCurrentUserId();
  if (!userId) throw new Error("Unauthorized");
  const [deleted] = await sql.query(
    "delete from portfolio_items where id=$1 and user_id=$2 returning image_url,payload",
    [portfolioId, userId],
  );
  if (!deleted) throw new Error("Portfolio item not found");
  const data = payload<Record<string, unknown>>(deleted.payload);
  const imageURL = typeof deleted.image_url === "string" ? deleted.image_url : typeof data.imageURL === "string" ? data.imageURL : null;
  const objectKey = imageURL ? publicObjectKeyFromUrl(imageURL) : null;
  if (objectKey?.startsWith(`portfolio/${userId}/`)) {
    try {
      await deleteObject(publicBucket(), objectKey);
    } catch (error) {
      console.error("Failed to remove portfolio object", error);
    }
  }
  await revalidateUserProfile(userId);
  return { success: true };
}
