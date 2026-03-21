// Supabase Edge Function: process-access-request

// @ts-ignore Supabase Edge Runtime resolves remote ESM import at deploy/runtime.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import {
  sendEmail,
  buildWelcomeEmailBody,
  buildUnderReviewEmailBody,
  buildRejectionEmailBody,
} from "../_shared/email.ts";

declare const Deno: {
  env: {
    get: (key: string) => string | undefined;
  };
  serve: (handler: (request: Request) => Response | Promise<Response>) => void;
};

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const resetPasswordRedirectUrl = Deno.env.get("APP_RESET_PASSWORD_URL");
const appLoginUrl = Deno.env.get("APP_LOGIN_URL") || "https://certifypro.com/login";

if (!supabaseUrl || !serviceRoleKey) {
  console.error("❌ Missing Supabase secrets");
}

if (!resetPasswordRedirectUrl) {
  console.error("⚠️ Missing APP_RESET_PASSWORD_URL secret for invite redirects");
}

const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

/* ------------------------------------------------ */
/* UTILITIES */
/* ------------------------------------------------ */

const corporateFreeDomains = [
  "gmail.com","yahoo.com","outlook.com","hotmail.com",
  "live.com","icloud.com","protonmail.com"
];

const getDomain = (email:string) =>
  email.split("@")[1]?.toLowerCase() ?? "";

const normalize = (v:string) =>
  v.toLowerCase().replace(/[^a-z0-9]/g,"");

const statusFromScore = (s:number) =>
  s >= 70 ? "approved" : s >= 40 ? "hold" : "rejected";

/* ------------------------------------------------ */
/* STORAGE CHECK */
/* ------------------------------------------------ */

async function documentExists(path:string|null){
  if(!path) return false;

  const clean = path.replace(/^\/+/,"");

  for(const bucket of ["Org_ids","org-documents"]){
    const { data,error } =
      await admin.storage.from(bucket).download(clean);

    if(!error && data) return true;
  }

  return false;
}

/* ------------------------------------------------ */
/* MAIN PROCESS */
/* ------------------------------------------------ */

async function processRequest(requestId: string) {
  console.log("==================================================");
  console.log("🚀 [START] process-access-request for requestId:", requestId);
  console.log("==================================================");

  /* STEP 1: FETCH REQUEST */
  console.log("📖 [STEP 1] Fetching access request from database...");

  let row;
  try {
    const { data: fetchedRow, error } = await admin
      .from("access_requests")
      .select("*")
      .eq("id", requestId)
      .single();

    if (error || !fetchedRow) {
      throw new Error(`Request not found: ${error?.message || "Unknown error"}`);
    }

    row = fetchedRow;
    console.log("✅ [STEP 1 OK] Request fetched", {
      requestId: row.id,
      email: row.email,
      organization: row.organization,
      status: row.status,
    });
  } catch (err) {
    console.error("❌ [STEP 1 FAILED]", {
      error: err instanceof Error ? err.message : String(err),
    });
    throw err;
  }

  /* STEP 2: SCORING */
  console.log("📊 [STEP 2] Computing access request score...");

  let score = 0;
  const notes: string[] = [];

  try {
    /* EMAIL CHECK */
    const domain = getDomain(row.email);
    if (domain && !corporateFreeDomains.includes(domain)) {
      score += 25;
      console.log("  ✓ Corporate email domain detected (+25)");
    } else {
      notes.push("Free email domain");
      console.log("  ⚠ Free email domain detected (no points)");
    }

    /* ORG MATCH */
    if (normalize(domain).includes(normalize(row.organization))) {
      score += 20;
      console.log("  ✓ Organization domain matches (+20)");
    } else {
      notes.push("Org mismatch");
      console.log("  ⚠ Organization domain mismatch");
    }

    /* DOCUMENT */
    try {
      if (await documentExists(row.org_document_url)) {
        score += 20;
        console.log("  ✓ Document exists and is accessible (+20)");
      } else {
        notes.push("Document missing or inaccessible");
        console.log("  ⚠ Document missing or inaccessible");
      }
    } catch (docErr) {
      notes.push(
        `Document check failed: ${docErr instanceof Error ? docErr.message : String(docErr)}`
      );
      console.log(
        "  ❌ Document check error:",
        docErr instanceof Error ? docErr.message : String(docErr)
      );
    }

    /* LINKEDIN */
    if (row.linkedin_url) {
      score += 10;
      console.log("  ✓ LinkedIn profile provided (+10)");
    } else {
      console.log("  ⚠ No LinkedIn profile provided");
    }

    /* BASIC FORMAT */
    if (row.email.includes("@")) {
      score += 15;
      console.log("  ✓ Valid email format (+15)");
    } else {
      notes.push("Invalid email format");
      console.log("  ⚠ Invalid email format");
    }

    /* OCR placeholder */
    if (row.org_document_url) {
      score += 10;
      console.log("  ✓ Document provided - OCR check placeholder (+10)");
    }

    console.log(`✅ [STEP 2 OK] Score calculated: ${score}`);
  } catch (scoringErr) {
    console.error("❌ [STEP 2 WARNING] Scoring had an error", {
      error: scoringErr instanceof Error ? scoringErr.message : String(scoringErr),
    });
    notes.push(
      `Scoring error: ${scoringErr instanceof Error ? scoringErr.message : String(scoringErr)}`
    );
  }

  /* STEP 3: DETERMINE STATUS */
  console.log("📋 [STEP 3] Determining status from score...");

  const status = statusFromScore(score);
  console.log(`✅ [STEP 3 OK] Status: ${status} (score: ${score})`);

  /* STEP 4: CREATE USER IF APPROVED */
  console.log("👤 [STEP 4] Processing approval (create user if needed)...");

  let approvedUserId: string | null = null;
  let emailSent = false;

  if (status === "approved") {
    console.log("  🔧 Processing APPROVED status for:", row.email);

    try {
      console.log("  📧 Creating user via Supabase Auth...");

      const { data: inviteData, error: inviteError } = await admin.auth.admin
        .inviteUserByEmail(row.email, {
          redirectTo: resetPasswordRedirectUrl,
          data: {
            first_login: true,
            access_request_id: row.id,
          },
        });

      if (inviteError) {
        throw new Error(
          `Supabase Auth invite failed: ${inviteError.message}`
        );
      }

      if (inviteData?.user) {
        approvedUserId = inviteData.user.id;
        console.log("✅ User created in Supabase Auth", {
          userId: approvedUserId,
          email: row.email,
        });

        notes.push("User successfully invited via Supabase Auth");

        /* CREATE PROFILE ENTRY */
        console.log("  📝 Creating user profile...");

        try {
          const { error: profileError } = await admin
            .from("profiles")
            .insert({
              id: approvedUserId,
              email: row.email,
              organization: row.organization,
              role: "admin",
              first_login_required: true,
            });

          if (profileError) {
            throw new Error(`Profile creation failed: ${profileError.message}`);
          }

          console.log("✅ User profile created successfully", {
            userId: approvedUserId,
            organization: row.organization,
            role: "admin",
          });

          notes.push("User profile created successfully");
        } catch (profileErr) {
          const profileErrMsg =
            profileErr instanceof Error ? profileErr.message : String(profileErr);
          console.error("❌ Profile creation failed:", profileErrMsg);
          notes.push(`Profile creation failed: ${profileErrMsg}`);
        }

        /* CREATE APP_USERS ENTRY */
        console.log("  📝 Creating app_users entry...");

        try {
          const { error: appUserError } = await admin
            .from("app_users")
            .insert({
              auth_uid: approvedUserId,
              email: row.email,
              role: "admin",
              full_name: row.full_name ?? "Organization Admin",
              metadata: {
                source: "access_request",
                request_id: row.id
              }
            });

          if (appUserError) {
            throw new Error(`App users creation failed: ${appUserError.message}`);
          }

          console.log("✅ App_users entry created successfully", {
            userId: approvedUserId,
            email: row.email,
            role: "admin",
          });

          notes.push("App_users entry created successfully");
        } catch (appUserErr) {
          const appUserErrMsg =
            appUserErr instanceof Error ? appUserErr.message : String(appUserErr);
          console.error("❌ App_users creation failed:", appUserErrMsg);
          notes.push(`App_users creation failed: ${appUserErrMsg}`);
        }
      } else {
        throw new Error("User created but no ID returned");
      }
    } catch (inviteErr) {
      const errMsg = inviteErr instanceof Error ? inviteErr.message : String(inviteErr);
      console.error("❌ User creation failed:", errMsg);
      notes.push(`User invite failed: ${errMsg}`);
    }
  } else {
    console.log(`  ℹ Status is "${status}" - no user creation needed`);
  }

  console.log(
    `✅ [STEP 4 OK] Approval processing complete. User ID: ${approvedUserId || "none"}`
  );

  /* STEP 5: SEND EMAIL */
  console.log("📧 [STEP 5] Sending status email...");

  try {
    let emailSubject = "";
    let emailBody = "";

    if (status === "approved") {
      emailSubject = `Welcome to CertifyPro - Access Approved`;
      emailBody = buildWelcomeEmailBody(
        "temporary-password",
        appLoginUrl,
        row.organization
      );
    } else if (status === "hold") {
      emailSubject = `CertifyPro Access Request - Under Review`;
      emailBody = buildUnderReviewEmailBody(row.organization);
    } else if (status === "rejected") {
      emailSubject = `CertifyPro Access Request - Decision`;
      emailBody = buildRejectionEmailBody();
    } else {
      emailSubject = `CertifyPro Access Request - Pending Review`;
      emailBody = `Your access request is pending review. Request ID: ${row.id}`;
    }

    console.log(`  📮 Sending email to ${row.email}...`);

    const emailResult = await sendEmail({
      to: row.email,
      subject: emailSubject,
      body: emailBody,
    });

    if (emailResult.success) {
      emailSent = true;
      console.log("✅ Email sent successfully", {
        to: row.email,
        subject: emailSubject,
      });
      notes.push(`Email sent: ${emailSubject}`);
    } else {
      console.error("❌ Email send failed", {
        to: row.email,
        error: emailResult.error,
      });
      notes.push(`Email failed: ${emailResult.error || "Unknown error"}`);
    }
  } catch (emailErr) {
    const errMsg = emailErr instanceof Error ? emailErr.message : String(emailErr);
    console.error("❌ Email sending error:", errMsg);
    notes.push(`Email error: ${errMsg}`);
  }

  console.log(`✅ [STEP 5 OK] Email processing complete`);

  /* STEP 6: UPDATE DATABASE */
  console.log("💾 [STEP 6] Updating access request in database...");

  try {
    const validationNotes = notes.join(" | ");

    const { error: updateError } = await admin
      .from("access_requests")
      .update({
        score,
        status,
        approved_user_id: approvedUserId,
        validation_notes: validationNotes,
      })
      .eq("id", row.id);

    if (updateError) {
      throw new Error(updateError.message);
    }

    console.log("✅ [STEP 6 OK] Database updated successfully", {
      requestId: row.id,
      score,
      status,
      approvedUserId,
    });
  } catch (updateErr) {
    const errMsg = updateErr instanceof Error ? updateErr.message : String(updateErr);
    console.error("❌ [STEP 6 FAILED] Database update failed:", errMsg);
    throw updateErr;
  }

  /* FINAL RESULT */
  console.log("==================================================");
  console.log("✅ [COMPLETE] Access request processed successfully");
  console.log("==================================================");

  return {
    success: true,
    score,
    status,
    approvedUserId,
    emailSent,
    validationNotes: notes.join(" | "),
  };
}

/* ------------------------------------------------ */
/* EDGE HANDLER */
/* ------------------------------------------------ */

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS")
    return new Response("ok", { headers: corsHeaders });

  try {
    console.log("📨 [REQUEST] Received invoke request");

    const body = await req.json();
    const requestId = body.request_id || body.requestId;

    console.log("📋 [BODY] Request ID extracted:", requestId);

    if (!requestId) {
      console.error("❌ [ERROR] No requestId provided in request body");
      return new Response(
        JSON.stringify({
          success: false,
          error: "requestId required",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("🔄 [PROCESSING] Starting request processing...");

    const result = await processRequest(requestId);

    console.log("✅ [RESPONSE] Sending success response");

    return new Response(
      JSON.stringify({
        success: true,
        score: result.score,
        status: result.status,
        approvedUserId: result.approvedUserId,
        emailSent: result.emailSent,
        validationNotes: result.validationNotes,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    const errorMessage =
      err instanceof Error ? err.message : String(err);
    const errorStack = err instanceof Error ? err.stack : undefined;

    console.error("❌ [ERROR] Unhandled exception", {
      message: errorMessage,
      stack: errorStack,
    });

    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
        details: errorStack,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});