interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
}

interface ResendResponse {
  id?: string;
  message?: string;
  name?: string;
}

export async function sendEmail({
  to,
  subject,
  html,
}: SendEmailParams) {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.error("Email delivery is not configured", {
      hasResendApiKey: false,
    });

    return { error: "Email delivery is not configured" };
  }

  const configuredFrom =
    process.env.RESEND_FROM ||
    process.env.SMTP_FROM ||
    "no-reply@weave.network";

  const from = configuredFrom.includes("<")
    ? configuredFrom
    : `Weave Network <${configuredFrom}>`;

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject,
        html,
      }),
    });

    const result = (await response.json().catch(() => ({}))) as ResendResponse;

    if (!response.ok) {
      console.error("Resend API rejected the email", {
        status: response.status,
        name: result.name,
        message: result.message,
      });

      return {
        error: result.message || `Resend API returned HTTP ${response.status}`,
      };
    }

    console.log("Resend accepted email", {
      messageId: result.id,
    });

    return {
      success: true,
      messageId: result.id,
    };
  } catch (error) {
    console.error("Resend API request failed", {
      message: error instanceof Error ? error.message : String(error),
    });

    return { error: "Failed to send email" };
  }
}
