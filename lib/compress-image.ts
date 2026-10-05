"use client";
export async function compressImage(file: File, enabled: boolean) {
  if (
    !enabled ||
    !["image/png", "image/jpeg", "image/webp"].includes(file.type) ||
    file.size < 256 * 1024
  )
    return file;
  try {
    const bitmap = await createImageBitmap(file);
    try {
      const scale = Math.min(1, 2048 / Math.max(bitmap.width, bitmap.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(bitmap.width * scale));
      canvas.height = Math.max(1, Math.round(bitmap.height * scale));
      const context = canvas.getContext("2d");
      if (!context) return file;
      context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/webp", 0.85),
      );
      return blob && blob.size < file.size
        ? new File([blob], file.name.replace(/\.[^.]+$/, "") + ".webp", {
            type: blob.type,
            lastModified: file.lastModified,
          })
        : file;
    } finally {
      bitmap.close();
    }
  } catch {
    return file;
  }
}
