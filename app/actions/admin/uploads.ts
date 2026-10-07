"use server";
import { adminSession } from "@/lib/admin-ops-access";
import { storeUpload } from "@/lib/neon-storage";
export async function uploadAdminAsset(
  area: "support" | "cms" | "blog",
  form: FormData,
) {
  const session = await adminSession(area + ".write");
  const file = form.get("file");
  if (!(file instanceof File) || !file.size) throw new Error("Choose a file");
  if (
    area !== "support" &&
    !["image/jpeg", "image/png", "image/webp"].includes(file.type)
  )
    throw new Error("Choose a JPEG, PNG, or WebP image");
  const url = await storeUpload(
    session.uid,
    file,
    area === "support" ? "misc" : "portfolio",
  );
  return { name: file.name.slice(0, 200), url };
}
