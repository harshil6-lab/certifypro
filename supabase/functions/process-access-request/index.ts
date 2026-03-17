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

async function processRequest(requestId:string){

  const { data:row, error } = await admin
    .from("access_requests")
    .select("*")
    .eq("id",requestId)
    .single();

  if(error || !row) throw new Error("Request not found");

  let score = 0;
  const notes:string[] = [];

  /* EMAIL CHECK */
  const domain = getDomain(row.email);
  if(domain && !corporateFreeDomains.includes(domain))
    score += 25;
  else notes.push("Free email domain");

  /* ORG MATCH */
  if(normalize(domain).includes(normalize(row.organization)))
    score += 20;
  else notes.push("Org mismatch");

  /* DOCUMENT */
  if(await documentExists(row.org_document_url))
    score += 20;
  else notes.push("Document missing");

  /* LINKEDIN */
  if(row.linkedin_url) score += 10;

  /* BASIC FORMAT */
  if(row.email.includes("@")) score += 15;

  /* OCR placeholder */
  if(row.org_document_url) score += 10;

  const status = statusFromScore(score);

  let approvedUserId = null;
  let emailSent = false;

  const loginUrl = resetPasswordRedirectUrl || "";

  /**
   * Send notification email via SMTP (if configured)
   */
  const sendStatusEmail = async (status: string) => {
    let subject = "";
    let body = "";

    if (status === "approved") {
      subject = "Your CertifyPro access request has been approved";
      body = buildWelcomeEmailBody(null, loginUrl, row.organization);
    } else if (status === "hold") {
      subject = "Your CertifyPro access request is under review";
      body = buildUnderReviewEmailBody(row.organization);
    } else {
      subject = "Your CertifyPro access request decision";
      body = buildRejectionEmailBody();
    }

    const { success, error } = await sendEmail({
      to: row.email,
      subject,
      body,
    });

    if (!success) {
      console.warn("⚠️ SMTP email send failed", { requestId: row.id, error });
    }

    return success;
  };

  /* APPROVED: Invite user via Supabase Auth */
  if (status === "approved") {

    console.info("✅ Inviting approved user", {
      requestId: row.id,
      email: row.email,
      score,
    });

    try {
      const { data: inviteData, error: inviteError } = await admin.auth.admin.inviteUserByEmail(
        row.email,
        {
          redirectTo: resetPasswordRedirectUrl,
          data: {
            first_login: true,
            access_request_id: row.id,
          },
        }
      );

      if (inviteError) {
        throw inviteError;
      }

      if (inviteData?.user) {
        approvedUserId = inviteData.user.id;
        emailSent = true;
        console.info("✅ User invited successfully, Invite email sent via Supabase Auth", {
          requestId: row.id,
          userId: approvedUserId,
          email: row.email,
        });
      }
    } catch (inviteError) {
      emailSent = false;
      notes.push("User invite failed");
      console.error("❌ User invite failed", {
        requestId: row.id,
        error: inviteError instanceof Error ? inviteError.message : String(inviteError),
      });
    }
  }

  // Attempt to send an SMTP email regardless of invite results
  // This provides a fallback when Supabase invite email fails or isn't configured.
  emailSent = (await sendStatusEmail(status)) || emailSent;

  /* UPDATE REQUEST */

  const { error:updateError } =
    await admin.from("access_requests")
    .update({
      score,
      status,
      approved_user_id:approvedUserId,
      validation_notes:notes.join(", ")
    })
    .eq("id",row.id);

  if(updateError){
    console.error("Update failed:",updateError);
    throw updateError;
  }

  return { score,status,approvedUserId,emailSent };
}

/* ------------------------------------------------ */
/* EDGE HANDLER */
/* ------------------------------------------------ */

Deno.serve(async(req: Request)=>{

  if(req.method==="OPTIONS")
    return new Response("ok",{headers:corsHeaders});

  try{

    const body=await req.json();
    const requestId=body.request_id||body.requestId;

    if(!requestId)
      return new Response(JSON.stringify({error:"requestId required"}),{
        status:400,headers:{...corsHeaders,"Content-Type":"application/json"}
      });

    const result=await processRequest(requestId);

    return new Response(JSON.stringify({
      success:true,
      ...result
    }),{
      headers:{...corsHeaders,"Content-Type":"application/json"}
    });

  }catch(err){

    console.error(err);

    return new Response(JSON.stringify({
      success:false,
      error:String(err)
    }),{
      status:500,
      headers:{...corsHeaders,"Content-Type":"application/json"}
    });
  }
});