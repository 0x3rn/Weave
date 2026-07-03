"use server";

import { db } from "@/lib/firebase-admin";

export async function submitWaitlist(formData: FormData) {
  if (!db) {
    return { error: "Database connection not initialized. Please configure Firebase." };
  }

  try {
    const rawData = {
      firstName: formData.get("firstName"),
      lastName: formData.get("lastName"),
      email: formData.get("email"),
      skill: formData.get("skill") === "Other" ? formData.get("otherSkill") : formData.get("skill"),
      experience: formData.get("experience"),
      portfolio: formData.get("portfolio") || "",
      heardAboutUs: formData.get("heardAboutUs"),
      status: "pending",
      createdAt: new Date().toISOString(),
    };

    // Basic validation
    if (!rawData.firstName || !rawData.lastName || !rawData.email || !rawData.skill || !rawData.experience || !rawData.heardAboutUs) {
      return { error: "Please fill out all required fields." };
    }

    await db.collection("waitlist_applications").add(rawData);

    return { success: true };
  } catch (error: any) {
    console.error("Error submitting waitlist:", error);
    return { error: error.message || "Failed to submit waitlist application. Please try again." };
  }
}
