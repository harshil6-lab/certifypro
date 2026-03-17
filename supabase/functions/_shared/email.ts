// Email sending utility using SMTP (Edge Function Safe)
// @ts-ignore: Deno URL imports are resolved by the Supabase Edge runtime.
import { SmtpClient } from "https://deno.land/x/smtp@v0.7.0/mod.ts";

interface EmailOptions {
  to: string;
  subject: string;
  body: string;
}

type RuntimeEnv = { get: (key: string) => string | undefined };

function getRuntimeEnv(): RuntimeEnv | undefined {
  const runtime = globalThis as typeof globalThis & {
    Deno?: { env?: RuntimeEnv };
    process?: { env?: Record<string, string | undefined> };
  };

  if (runtime.Deno?.env) {
    return runtime.Deno.env;
  }

  if (runtime.process?.env) {
    return {
      get: (key: string) => runtime.process?.env?.[key],
    };
  }

  return undefined;
}

export async function sendEmail(
  options: EmailOptions
): Promise<{ success: boolean; error?: string }> {
  const env = getRuntimeEnv();
  const smtpHost = env?.get("SMTP_HOST");
  const smtpPort = env?.get("SMTP_PORT");
  const smtpUser = env?.get("SMTP_USER");
  const smtpPassword = env?.get("SMTP_PASSWORD");
  const smtpFrom = env?.get("SMTP_FROM_EMAIL");

  // Validate SMTP configuration before attempting to send
  if (!smtpHost || !smtpPort || !smtpUser || !smtpPassword || !smtpFrom) {
    console.error("❌ SMTP configuration incomplete", {
      smtpHost: !!smtpHost,
      smtpPort: !!smtpPort,
      smtpUser: !!smtpUser,
      smtpPassword: !!smtpPassword,
      smtpFrom: !!smtpFrom,
    });
    return { success: false, error: "SMTP secrets not configured in Supabase Edge Function" };
  }

  console.info("📧 Preparing to send email via SMTP", {
    to: options.to,
    subject: options.subject,
    smtpHost,
    smtpPort,
  });

  const client = new SmtpClient();

  try {
    console.info("🔌 Connecting to SMTP server...");
    await client.connect({
      hostname: smtpHost,
      port: Number(smtpPort),
      username: smtpUser,
      password: smtpPassword,
      tls: false, // Required for port 587 (STARTTLS)
    });

    console.info("📤 Sending email...");
    await client.send({
      from: smtpFrom,
      to: options.to,
      subject: options.subject,
      html: options.body,
    });

    await client.close();

    console.info("✅ SMTP email sent successfully", {
      to: options.to,
      subject: options.subject,
    });

    return { success: true };
  } catch (err) {
    console.error("❌ SMTP send failed", {
      to: options.to,
      subject: options.subject,
      error: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined,
    });
    return { 
      success: false, 
      error: `SMTP send failed: ${err instanceof Error ? err.message : String(err)}` 
    };
  }
}

/**
 * Build welcome email body for approved institutional access requests.
 */
export function buildWelcomeEmailBody(
  tempPassword: string | null,
  loginUrl: string,
  organizationName: string
): string {
  const passwordSection = tempPassword
    ? `
      <h3>Your Temporary Password</h3>
      <div class="warning">
        <strong>Temporary Password:</strong> <code>${tempPassword}</code>
        <p><strong>⚠️ Important:</strong> This password expires after your first login. You will be required to set a new password.</p>
      </div>
    `
    : "";

  const passwordInstructions = tempPassword
    ? `
      <li>Use your email address and the temporary password provided</li>
      <li>You will be prompted to create a new password on first login</li>
    `
    : `
      <li>Use your email address and set your password on first login</li>
    `;

  return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #4CAF50; color: white; padding: 20px; border-radius: 5px; }
    .content { padding: 20px; background: #f9f9f9; margin-top: 20px; border-radius: 5px; }
    .cta { display: inline-block; background: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 10px 0; }
    .warning { background: #fff3cd; padding: 10px; border-left: 4px solid #ffc107; margin: 10px 0; font-size: 12px; }
    .footer { margin-top: 20px; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Welcome to CertifyPro</h1>
    </div>
    <div class="content">
      <p>Hello,</p>
      <p>Your institutional access request for <strong>${organizationName}</strong> has been <strong style="color: #4CAF50;">approved</strong>!</p>
      <p>Your account is now ready to use. Please log in using the link below.</p>
      ${passwordSection}
      <p>
        <a href="${loginUrl}" class="cta">Log In to CertifyPro</a>
      </p>
      <h3>Next Steps</h3>
      <ol>
        <li>Click the login link above or visit ${loginUrl}</li>
        ${passwordInstructions}
        <li>Complete your profile setup to start using CertifyPro</li>
      </ol>
      <p>If you have any questions or need assistance, please contact our support team.</p>
    </div>
    <div class="footer">
      <p>© 2024 CertifyPro. All rights reserved.</p>
      <p>This is an automated message. Please do not reply to this email.</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Build under-review email body for hold decisions.
 */
export function buildUnderReviewEmailBody(organizationName: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #FFC107; color: #333; padding: 20px; border-radius: 5px; }
    .content { padding: 20px; background: #f9f9f9; margin-top: 20px; border-radius: 5px; }
    .info-box { background: #e3f2fd; padding: 15px; border-left: 4px solid #2196F3; margin: 10px 0; }
    .footer { margin-top: 20px; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Institutional Access Request Under Review</h1>
    </div>
    <div class="content">
      <p>Hello,</p>
      <p>Thank you for submitting your institutional access request for <strong>${organizationName}</strong>.</p>
      <p>Your request is currently <strong style="color: #FFC107;">under review</strong>. Our verification team is evaluating your application and supporting documentation.</p>
      <div class="info-box">
        <strong>What's Next?</strong>
        <p>We typically review access requests within 2-5 business days. You will receive an email with the outcome of your request shortly.</p>
      </div>
      <h3>What You Can Do</h3>
      <ul>
        <li>Ensure all submitted documents are clear and complete</li>
        <li>Check that your organizational email matches your institution</li>
        <li>Review your LinkedIn profile for accuracy</li>
      </ul>
      <p>If you have any questions about the status of your request, please contact our support team.</p>
    </div>
    <div class="footer">
      <p>© 2024 CertifyPro. All rights reserved.</p>
      <p>This is an automated message. Please do not reply to this email.</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Build rejection email body for rejected decisions.
 */
export function buildRejectionEmailBody(): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #f44336; color: white; padding: 20px; border-radius: 5px; }
    .content { padding: 20px; background: #f9f9f9; margin-top: 20px; border-radius: 5px; }
    .reason-box { background: #ffebee; padding: 15px; border-left: 4px solid #f44336; margin: 10px 0; }
    .footer { margin-top: 20px; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Access Request Decision</h1>
    </div>
    <div class="content">
      <p>Hello,</p>
      <p>Thank you for your interest in CertifyPro and your institutional access request.</p>
      <div class="reason-box">
        <strong>Decision: Not Approved</strong>
        <p>Unfortunately, your institutional access request could not be approved due to insufficient verification data.</p>
      </div>
      <h3>Why Your Request Was Not Approved</h3>
      <p>To ensure the integrity and security of our platform, we verify institutional credentials through multiple criteria including:</p>
      <ul>
        <li>Institutional email domain verification</li>
        <li>Organization documentation and validation</li>
        <li>Professional profile integrity</li>
        <li>Supporting institutional references</li>
      </ul>
      <h3>What You Can Do</h3>
      <p>If you believe this decision was made in error or if you have additional documentation to support your request, please contact our support team with:</p>
      <ul>
        <li>Your original request ID</li>
        <li>Additional institutional documents (official letterhead, employee ID, etc.)</li>
        <li>A brief explanation of your use case</li>
      </ul>
      <p>We may be able to reconsider your application with additional supporting evidence.</p>
    </div>
    <div class="footer">
      <p>© 2024 CertifyPro. All rights reserved.</p>
      <p>This is an automated message. Please do not reply to this email.</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}