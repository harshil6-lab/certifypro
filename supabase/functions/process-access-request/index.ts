// @ts-ignore Supabase Edge Runtime resolves remote ESM import at deploy/runtime.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

declare const Deno: {
  env: {
    get: (key: string) => string | undefined;
  };
  serve: (handler: (request: Request) => Response | Promise<Response>) => void;
};

type AccessRequestRow = {
  id: string;
  full_name: string;
  email: string;
  organization: string;
  linkedin_url: string | null;
  org_document_url: string | null;
  status: string;
  score: number;
};

type ProcessResult = {
  status: "approved" | "hold" | "rejected";
  score: number;
  approvedUserId?: string;
  emailDispatched?: boolean;
  notes: string[];
  requestId?: string;
};

type LogLevel = "info" | "warn" | "error";

const log = (
  level: LogLevel,
  message: string,
  context: Record<string, unknown> = {},
) => {
  const payload = {
    level,
    message,
    ts: new Date().toISOString(),
    ...context,
  };

  if (level === "error") {
    console.error(JSON.stringify(payload));
    return;
  }

  if (level === "warn") {
    console.warn(JSON.stringify(payload));
    return;
  }

  console.log(JSON.stringify(payload));
};

const corporateFreeDomains = new Set([
  "gmail.com",
  "yahoo.com",
  "outlook.com",
  "hotmail.com",
  "live.com",
  "aol.com",
  "proton.me",
  "protonmail.com",
  "icloud.com",
]);

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const serviceRoleKey =
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ??
  Deno.env.get("SERVICE_ROLE_KEY") ??
  "";
const resendApiKey = Deno.env.get("RESEND_API_KEY") ?? "";
const resendFromEmail = Deno.env.get("RESEND_FROM_EMAIL") ?? "no-reply@certifypro.app";
const appLoginUrl = Deno.env.get("APP_LOGIN_URL") ?? "http://localhost:8080/login";

const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const normalizeText = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const getEmailDomain = (email: string): string => {
  const idx = email.lastIndexOf("@");
  return idx > -1 ? email.slice(idx + 1).toLowerCase() : "";
};

const looksCorporateEmail = (email: string): boolean => {
  const domain = getEmailDomain(email);
  return Boolean(domain) && !corporateFreeDomains.has(domain);
};

const organizationMatchesDomain = (organization: string, email: string): boolean => {
  const domain = getEmailDomain(email);
  if (!domain) return false;

  const orgTokens = normalizeText(organization)
    .split(" ")
    .filter((token) => token.length > 2);

  if (orgTokens.length === 0) return false;

  return orgTokens.some((token) => domain.includes(token));
};

const hasValidFormatChecks = (row: AccessRequestRow): boolean => {
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email);
  const linkedInValid =
    !row.linkedin_url ||
    (() => {
      try {
        const url = new URL(row.linkedin_url);
        return url.hostname.includes("linkedin.com");
      } catch {
        return false;
      }
    })();

  const documentValid =
    !row.org_document_url || /\.(pdf|png|jpg|jpeg)$/i.test(row.org_document_url);

  return emailValid && linkedInValid && documentValid;
};

const bucketObjectExists = async (objectPath: string | null): Promise<boolean> => {
  if (!objectPath) return false;

  const normalizedPath = objectPath.startsWith("org-documents/")
    ? objectPath.replace(/^org-documents\//, "")
    : objectPath;

  const { data, error } = await admin.storage
    .from("org-documents")
    .download(normalizedPath);

  if (error || !data) {
    return false;
  }

  return true;
};

const statusFromScore = (score: number): "approved" | "hold" | "rejected" => {
  if (score >= 70) return "approved";
  if (score >= 40) return "hold";
  return "rejected";
};

const generateTemporaryPassword = (): string => {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%^&*";
  const length = 14;
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  let password = "";

  for (let i = 0; i < bytes.length; i += 1) {
    password += alphabet[bytes[i] % alphabet.length];
  }

  return password;
};

const sendWelcomeEmail = async (
  to: string,
  temporaryPassword: string,
  recoveryLink: string,
  traceId: string,
): Promise<boolean> => {
  if (!resendApiKey) {
    log("warn", "RESEND_API_KEY missing; skipping welcome email.", { traceId, to });
    return false;
  }

  const html = `
  <div style="font-family:Arial,sans-serif;max-width:640px;margin:auto;padding:24px;color:#0f172a;">
    <h2 style="margin:0 0 12px;font-size:22px;">Welcome to CertifyPro</h2>
    <p style="margin:0 0 12px;">Your institutional access request has been approved.</p>
    <p style="margin:0 0 12px;"><strong>Login URL:</strong> <a href="${appLoginUrl}">${appLoginUrl}</a></p>
    <p style="margin:0 0 12px;"><strong>Temporary Password:</strong> ${temporaryPassword}</p>
    <p style="margin:0 0 12px;"><strong>Password Reset Link:</strong> <a href="${recoveryLink}">Set your new password</a></p>
    <p style="margin:0;">For security, please reset your password on first login.</p>
  </div>`;

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: resendFromEmail,
        to: [to],
        subject: "Your CertifyPro access is approved",
        html,
      }),
    });

    if (!response.ok) {
      const reason = await response.text();
      log("warn", "Welcome email dispatch failed.", {
        traceId,
        status: response.status,
        reason,
      });
      return false;
    }

    return true;
  } catch (error) {
    log("error", "Welcome email request threw exception.", {
      traceId,
      error: error instanceof Error ? error.message : "Unknown email error",
    });
    return false;
  }
};

const processAccessRequest = async (requestId: string, traceId: string): Promise<ProcessResult> => {
  const notes: string[] = [];

  log("info", "Starting access request processing.", { traceId, requestId });

  const { data: requestRow, error: fetchError } = await admin
    .from("access_requests")
    .select("id, full_name, email, organization, linkedin_url, org_document_url, status, score")
    .eq("id", requestId)
    .single<AccessRequestRow>();

  if (fetchError || !requestRow) {
    log("error", "Failed to fetch access request row.", {
      traceId,
      requestId,
      error: fetchError?.message ?? "not found",
    });
    throw new Error("Access request not found.");
  }

  let score = 0;

  if (looksCorporateEmail(requestRow.email)) {
    score += 25;
  } else {
    notes.push("Non-corporate email domain detected.");
  }

  if (organizationMatchesDomain(requestRow.organization, requestRow.email)) {
    score += 25;
  } else {
    notes.push("Organization name does not strongly match email domain.");
  }

  const documentExists = await bucketObjectExists(requestRow.org_document_url);
  if (documentExists) {
    score += 20;
  } else {
    notes.push("Organization document is missing or inaccessible.");
  }

  if (requestRow.linkedin_url && requestRow.linkedin_url.trim().length > 0) {
    score += 10;
  }

  if (hasValidFormatChecks(requestRow)) {
    score += 20;
  } else {
    notes.push("One or more format checks failed.");
  }

  let status = statusFromScore(score);
  let approvedUserId: string | undefined;
  let emailDispatched = false;

  log("info", "Validation scoring completed.", {
    traceId,
    requestId,
    score,
    status,
  });

  if (status === "approved") {
    const temporaryPassword = generateTemporaryPassword();

    const { data: createdUser, error: createUserError } = await admin.auth.admin.createUser({
      email: requestRow.email,
      password: temporaryPassword,
      email_confirm: true,
      user_metadata: {
        first_login_required: true,
        access_request_id: requestRow.id,
        organization: requestRow.organization,
      },
    });

    if (createUserError || !createdUser?.user?.id) {
      notes.push(`User auto-creation failed: ${createUserError?.message ?? "unknown error"}`);
      status = "hold";
      log("warn", "Auto user creation failed; moved to hold.", {
        traceId,
        requestId,
        reason: createUserError?.message ?? "unknown",
      });
    } else {
      approvedUserId = createdUser.user.id;

      const { data: recoveryLinkData, error: recoveryLinkError } = await admin.auth.admin.generateLink({
        type: "recovery",
        email: requestRow.email,
      });

      if (recoveryLinkError) {
        notes.push(`Password reset link generation failed: ${recoveryLinkError.message}`);
        log("warn", "Recovery link generation failed.", {
          traceId,
          requestId,
          reason: recoveryLinkError.message,
        });
      }

      const recoveryLink = recoveryLinkData?.properties?.action_link ?? appLoginUrl;
      emailDispatched = await sendWelcomeEmail(
        requestRow.email,
        temporaryPassword,
        recoveryLink,
        traceId,
      );

      if (!emailDispatched) {
        notes.push("Welcome email was not sent (missing or invalid email provider settings).");
      }
    }
  }

  const { error: updateError } = await admin
    .from("access_requests")
    .update({
      status,
      score,
      approved_user_id: approvedUserId ?? null,
      validation_notes: notes.length ? notes.join(" ") : "Auto validation completed successfully.",
    })
    .eq("id", requestRow.id);

  if (updateError) {
    log("error", "Failed to update access request status.", {
      traceId,
      requestId,
      error: updateError.message,
    });
    throw new Error(updateError.message);
  }

  log("info", "Access request processing completed.", {
    traceId,
    requestId,
    score,
    status,
    approvedUserId: approvedUserId ?? null,
    emailDispatched,
  });

  return {
    status,
    score,
    approvedUserId,
    emailDispatched,
    notes,
    requestId,
  };
};

Deno.serve(async (request: Request) => {
  const traceId = crypto.randomUUID();
  console.log("Service key exists:", !!Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"));

  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    log("info", "Incoming process-access-request invocation.", {
      traceId,
      method: request.method,
      hasSupabaseUrl: Boolean(supabaseUrl),
      hasServiceRoleKey: Boolean(serviceRoleKey),
      hasResendKey: Boolean(resendApiKey),
    });

    if (!supabaseUrl || !serviceRoleKey) {
      log("error", "Missing required Supabase server secrets.", {
        traceId,
        hasSupabaseUrl: Boolean(supabaseUrl),
        hasServiceRoleKey: Boolean(serviceRoleKey),
      });
      return new Response(
        JSON.stringify({ error: "Supabase server configuration missing." }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    let body: { requestId?: unknown } = {};
    try {
      body = (await request.json()) as { requestId?: unknown };
    } catch {
      log("warn", "Invalid JSON body in request.", { traceId });
      return new Response(JSON.stringify({ error: "Invalid JSON body." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const requestId = typeof body.requestId === "string" ? body.requestId : "";

    if (!requestId) {
      log("warn", "requestId missing in request body.", { traceId });
      return new Response(JSON.stringify({ error: "requestId is required." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = await processAccessRequest(requestId, traceId);

    return new Response(JSON.stringify({
      success: true,
      status: result.status,
      score: result.score,
      requestId: result.requestId,
      approvedUserId: result.approvedUserId ?? null,
      emailDispatched: result.emailDispatched ?? false,
      notes: result.notes,
      traceId,
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    log("error", "Unhandled function exception.", {
      traceId,
      error: error instanceof Error ? error.message : "Unknown runtime error",
    });
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unexpected processing error.",
        traceId,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
