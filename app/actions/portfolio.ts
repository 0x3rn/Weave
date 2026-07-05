"use server";

import { db, storage } from "@/lib/firebase-admin";
import { getCurrentUserId } from "./user";
import { revalidatePath } from "next/cache";

/**
 * Add a new portfolio item, optionally uploading an image.
 */
export async function addPortfolioItem(formData: FormData) {
  const userId = await getCurrentUserId();
  if (!userId) {
    throw new Error("Unauthorized");
  }

  if (!db || !storage) {
    throw new Error("Firebase Admin not initialized");
  }

  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const link = formData.get("link") as string | null;
  const technologiesRaw = formData.get("technologies") as string;
  const imageFile = formData.get("image") as File | null;

  if (!title || !description) {
    throw new Error("Missing required fields");
  }

  // Parse technologies (comma separated)
  const technologies = technologiesRaw
    .split(",")
    .map(t => t.trim())
    .filter(t => t.length > 0);

  let imageURL: string | null = null;

  // Handle Image Upload to Firebase Storage
  if (imageFile && imageFile.size > 0) {
    const bucket = storage.bucket();
    const extension = imageFile.name.split('.').pop();
    const filename = `portfolio/${userId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${extension}`;
    const fileRef = bucket.file(filename);
    
    // Convert File to Buffer
    const buffer = Buffer.from(await imageFile.arrayBuffer());
    
    await fileRef.save(buffer, {
      metadata: {
        contentType: imageFile.type,
      },
    });

    // Make the file publicly accessible
    await fileRef.makePublic();

    // Construct the public URL (Google Cloud Storage format)
    imageURL = `https://storage.googleapis.com/${bucket.name}/${filename}`;
  }

  // Save to Firestore
  const portfolioRef = db.collection("users").doc(userId).collection("portfolio").doc();
  
  const portfolioData = {
    userId,
    title,
    description,
    link: link || null,
    technologies,
    imageURL,
    createdAt: new Date().toISOString(),
  };

  await portfolioRef.set(portfolioData);

  // Get the user's username to revalidate their profile page
  const userDoc = await db.collection("users").doc(userId).get();
  if (userDoc.exists) {
    const username = userDoc.data()?.username;
    if (username) {
      revalidatePath(`/u/${username}`);
    }
  }

  return { success: true, id: portfolioRef.id };
}

/**
 * Delete a portfolio item.
 */
export async function deletePortfolioItem(portfolioId: string, imageURL?: string) {
  const userId = await getCurrentUserId();
  if (!userId) {
    throw new Error("Unauthorized");
  }

  if (!db) {
    throw new Error("Firebase Admin not initialized");
  }

  const portfolioRef = db.collection("users").doc(userId).collection("portfolio").doc(portfolioId);
  
  // Verify ownership before deleting
  const docSnap = await portfolioRef.get();
  if (!docSnap.exists) {
    throw new Error("Portfolio item not found");
  }

  const data = docSnap.data();
  if (data?.userId !== userId) {
    throw new Error("Unauthorized to delete this item");
  }

  await portfolioRef.delete();

  // Attempt to delete the image from storage if it exists
  if (imageURL && storage) {
    try {
      const bucket = storage.bucket();
      // Extract the object path from the public URL
      // URL format: https://storage.googleapis.com/{bucket_name}/{path/to/file}
      const bucketPrefix = `https://storage.googleapis.com/${bucket.name}/`;
      if (imageURL.startsWith(bucketPrefix)) {
        const filePath = imageURL.replace(bucketPrefix, "");
        await bucket.file(filePath).delete();
      }
    } catch (error) {
      console.error("Failed to delete image from storage:", error);
      // We don't throw here because the DB record is already deleted
    }
  }

  // Get the user's username to revalidate their profile page
  const userDoc = await db.collection("users").doc(userId).get();
  if (userDoc.exists) {
    const username = userDoc.data()?.username;
    if (username) {
      revalidatePath(`/u/${username}`);
    }
  }

  return { success: true };
}
