"use server";

import { storage } from "@/lib/firebase-admin";
import { auth } from "@/lib/firebase-admin-auth";
import { cookies } from "next/headers";

export async function uploadFile(formData: FormData) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session")?.value;
    
    if (!sessionCookie || !auth || !storage) {
      throw new Error("Not authenticated or storage not initialized");
    }

    const claims = await auth.verifySessionCookie(sessionCookie, true);
    
    const file = formData.get("file") as File;
    const folder = formData.get("folder") as string || "misc";
    
    if (!file) {
      throw new Error("No file provided");
    }

    // 4.5MB limit on Vercel Serverless bodies, but we can enforce a limit here as well
    if (file.size > 5 * 1024 * 1024) {
      throw new Error("File too large. Maximum size is 5MB.");
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Create a unique file name
    const ext = file.name.split('.').pop();
    const uniqueFileName = `${claims.uid}/${folder}/${Date.now()}-${Math.round(Math.random() * 10000)}.${ext}`;
    
    const bucketName = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
    if (!bucketName) {
      throw new Error("Storage bucket not configured in environment variables");
    }
    
    const bucket = storage.bucket(bucketName);
    const fileRef = bucket.file(uniqueFileName);
    
    await fileRef.save(buffer, {
      metadata: {
        contentType: file.type,
      },
    });

    // We return the standard Google Cloud Storage public URL.
    // This requires the bucket to have 'allUsers' granted the 'Storage Object Viewer' role via IAM.
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${uniqueFileName}`;
    
    return { success: true, url: publicUrl };
  } catch (error: any) {
    console.error("Upload error:", error);
    return { error: error.message };
  }
}
