"use server";

import { db } from "@/lib/firebase-admin";

export async function submitInviteApplication(formData: FormData) {
  if (!db) {
    return { error: "Database connection not initialized. Please configure Firebase." };
  }

  try {
    const rawData = {
      fullName: formData.get("fullName"),
      email: formData.get("email"),
      country: formData.get("country"),
      timeZone: formData.get("timeZone"),
      profession: formData.get("profession") === "Other" ? formData.get("otherProfession") : formData.get("profession"),
      experience: formData.get("experience"),
      portfolio: formData.get("portfolio"),
      linkedIn: formData.get("linkedIn"),
      github: formData.get("github"),
      skillsOffered: JSON.parse(formData.get("skillsOffered") as string || "[]"),
      skillsLookingFor: JSON.parse(formData.get("skillsLookingFor") as string || "[]"),
      whyJoin: formData.get("whyJoin"),
      heardAboutUs: formData.get("heardAboutUs"),
      agreedToTerms: formData.get("agreedToTerms") === "true",
      status: "pending",
      createdAt: new Date().toISOString(),
    };

    // Basic validation
    if (!rawData.fullName || !rawData.email || !rawData.country || !rawData.timeZone || !rawData.profession || !rawData.whyJoin) {
      return { error: "Please fill out all required fields." };
    }

    await db.collection("invite_applications").add(rawData);

    return { success: true };
  } catch (error: any) {
    console.error("Error submitting application:", error);
    return { error: error.message || "Failed to submit application. Please try again." };
  }
}
