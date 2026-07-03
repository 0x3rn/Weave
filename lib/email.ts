import nodemailer from 'nodemailer';

// Configure the email transporter using environment variables
// Ensure these variables are added to your .env.local file
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.example.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_PORT === '465' || process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER || 'user@example.com',
    pass: process.env.SMTP_PASS || 'password',
  },
});

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailParams) {
  try {
    const info = await transporter.sendMail({
      from: `"Weave Network" <${process.env.SMTP_FROM || 'no-reply@weave.network'}>`,
      to,
      subject,
      html,
    });
    console.log("Email sent:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Error sending email:", error);
    // For now, in development without valid SMTP credentials, this will likely fail.
    // We swallow the error so it doesn't break the app flow, but log it.
    return { error: 'Failed to send email' };
  }
}
