// Supabase Edge Function: process-access-request

// @ts-ignore Supabase Edge Runtime resolves remote ESM import at deploy/runtime.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

declare const Deno: {
  env: {
    get: (key: string) => string | undefined;
  };
  serve: (handler: (request: Request) => Response | Promise<Response>) => void;
};

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const resetPasswordRedirectUrl =
  Deno.env.get("APP_RESET_PASSWORD_URL") ??
  Deno.env.get("APP_LOGIN_URL") ??
  "http://localhost:8080/reset-password";

if (!supabaseUrl || !serviceRoleKey) {
  console.error("❌ Missing Supabase secrets");
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

const tempPassword = () =>
  crypto.randomUUID().slice(0,14)+"!A";

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

  let approvedUserId=null;
  let emailSent=false;

  if(status==="approved"){

    const password=tempPassword();

    const { data:user,error:createErr } =
      await admin.auth.admin.createUser({
        email:row.email,
        password,
        email_confirm:true,
        user_metadata:{
          first_login_required:true,
          access_request_id:row.id
        }
      });

    if(!createErr && user?.user){

      approvedUserId=user.user.id;

      try {
        const { error:generateLinkError } =
          await admin.auth.admin.generateLink({
            type:"recovery",
            email:row.email,
            options: {
              redirectTo: resetPasswordRedirectUrl,
            },
          });

        if (generateLinkError) {
          throw generateLinkError;
        }

        emailSent = true;
        console.info("Supabase recovery email triggered", {
          requestId: row.id,
          status,
          userId: approvedUserId,
          email: row.email,
        });
      } catch (emailError) {
        emailSent = false;
        notes.push("Recovery email trigger failed");
        console.warn("Recovery email trigger failed", {
          requestId: row.id,
          status,
          reason: emailError instanceof Error ? emailError.message : String(emailError),
        });
      }

    } else {
      notes.push("User creation failed");
      console.error("User creation failed for approved request", {
        requestId: row.id,
        status,
        createError: createErr?.message || "unknown error",
      });
    }
  }

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