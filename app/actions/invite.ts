"use server";

import { sql } from "@/lib/neon";
import { sendEmail } from "@/lib/email";

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

    // INVITE_CONFIRMATION_EMAIL
    // The application is saved before attempting email delivery.
    // Email failures must not turn a successful submission into a failed one.
    const firstName = application.fullName.trim().split(/\\s+/)[0] || "there";

    const escapeHtml = (value: string) =>
      value.replace(/[&<>"']/g, (character) => {
        const entities: Record<string, string> = {
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        };
        return entities[character];
      });

    try {
      const emailResult = await sendEmail({
        to: application.email,
        subject: "We've received your Weave invite request",
        html: `
          <div style="margin:0;padding:40px 16px;background:#f5f7f5;font-family:Arial,Helvetica,sans-serif;color:#202720;">
            <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e3e9e3;border-radius:12px;overflow:hidden;">
              <div style="padding:24px 32px;border-bottom:1px solid #e3e9e3;">
                <span style="font-size:25px;font-weight:700;letter-spacing:-0.8px;color:#17251d;">Weave</span>
              </div>
              <div style="padding:32px;">
                <p style="margin:0 0 12px;font-size:15px;line-height:1.7;">Hi ${escapeHtml(firstName)},</p>
                <h1 style="margin:0 0 20px;font-size:25px;line-height:1.3;letter-spacing:-0.5px;color:#17251d;">We've received your invite request.</h1>
                <p style="margin:0 0 16px;font-size:15px;line-height:1.8;color:#48534b;">
                  Thanks for your interest in joining Weave.
                </p>
                <p style="margin:0 0 16px;font-size:15px;line-height:1.8;color:#48534b;">
                  Your invite request has been received and is now <strong style="color:#17251d;">under review</strong>. We'll reach out by email when there's an update on your application.
                </p>
                <p style="margin:0;font-size:15px;line-height:1.8;color:#48534b;">
                  We appreciate your patience and look forward to having you in the community.
                </p>
                <p style="margin:28px 0 0;font-size:15px;line-height:1.8;color:#17251d;">
                  The Weave Team
                </p>
              </div>
              <div style="padding:18px 32px;background:#f8faf8;border-top:1px solid #e3e9e3;">
                <p style="margin:0;font-size:12px;line-height:1.7;color:#758078;">
                  This is an automated confirmation that we received your invite request.
                </p>
              </div>
            </div>
          </div>
        `,
      });

      if (!emailResult.success) {
        console.error(
          "Invite confirmation email was not sent:",
          emailResult.error || "Unknown email delivery error"
        );
      }
    } catch (emailError) {
      console.error(
        "Invite confirmation email failed:",
        emailError instanceof Error ? emailError.message : "Unknown error"
      );
    }

    return { success: true };
  } catch (error) {
    console.error("Error submitting application", error);
    return { error: error instanceof Error ? error.message : "Failed to submit application. Please try again." };
  }
}
