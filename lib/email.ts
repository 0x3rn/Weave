import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: process.env.SMTP_PORT === "465" || process.env.SMTP_SECURE === "true",
  requireTLS: true,
  tls: { minVersion: "TLSv1.2", rejectUnauthorized: true },
  connectionTimeout: 15000,
  greetingTimeout: 15000,
  socketTimeout: 30000,
  disableFileAccess: true,
  disableUrlAccess: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailParams) {
  if (
    !process.env.SMTP_HOST ||
    !process.env.SMTP_USER ||
    !process.env.SMTP_PASS
  )
    return { error: "Email delivery is not configured" };
  try {
    const info = await transporter.sendMail({
      from: `"Weave Network" <${process.env.SMTP_FROM || "no-reply@weave.network"}>`,
      to,
      subject,
      html,
    });
    return { success: true, messageId: info.messageId };
  } catch {
    console.error("Email delivery failed; retry required");
    return { error: "Failed to send email" };
  }
}
