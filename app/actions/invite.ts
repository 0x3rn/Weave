"use server";

import { sql } from "@/lib/neon";

function stringField(formData: FormData, name: string, max = 5000) {
  const value = String(formData.get(name) ?? "").trim();
  if (value.length > max) throw new Error(`${name} is too long`);
  return value;
}

function stringArray(value: FormDataEntryValue | null) {
  const parsed: unknown = JSON.parse(String(value ?? "[]"));
  if (!Array.isArray(parsed) || parsed.length > 50 || parsed.some(item => typeof item !== "string" || item.length > 500)) throw new Error("Invalid skills");
  return parsed.map(item => item.trim()).filter(Boolean);
}

export async function submitInviteApplication(formData: FormData) {
  try {
    const profession = stringField(formData, formData.get("profession") === "Other" ? "otherProfession" : "profession", 200);
    const application = {
      fullName: stringField(formData, "fullName", 200),
      email: stringField(formData, "email", 320).toLowerCase(),
      country: stringField(formData, "country", 100),
      timeZone: stringField(formData, "timeZone", 100),
      profession,
      experience: stringField(formData, "experience", 200),
      portfolio: stringField(formData, "portfolio", 2000),
      linkedIn: stringField(formData, "linkedIn", 2000),
      github: stringField(formData, "github", 2000),
      skillsOffered: stringArray(formData.get("skillsOffered")),
      skillsLookingFor: stringArray(formData.get("skillsLookingFor")),
      whyJoin: stringField(formData, "whyJoin", 5000),
      heardAboutUs: stringField(formData, "heardAboutUs", 500),
      agreedToTerms: formData.get("agreedToTerms") === "true",
      status: "pending",
      createdAt: new Date().toISOString(),
    };
    if (!application.fullName || !application.email || !/^\S+@\S+\.\S+$/.test(application.email) || !application.country || !application.timeZone || !application.profession || !application.whyJoin || !application.agreedToTerms) {
      return { error: "Please fill out all required fields and accept the terms." };
    }
    const id = crypto.randomUUID();
    await sql.query("insert into invite_applications (id,email,full_name,status,submitted_at,payload) values ($1,$2,$3,'pending',$4,$5::jsonb)", [id, application.email, application.fullName, application.createdAt, JSON.stringify(application)]);
    return { success: true };
  } catch (error) {
    console.error("Error submitting application", error);
    return { error: error instanceof Error ? error.message : "Failed to submit application. Please try again." };
  }
}
