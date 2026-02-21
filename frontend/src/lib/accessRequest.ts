import { isSupabaseConfigured, supabase } from "@/lib/supabaseClient";

export type AccessRequestInput = {
  fullName: string;
  email: string;
  organization: string;
  linkedinUrl?: string;
  reasonForAccess?: string;
  organizationDocument: File;
};

export type AccessRequestResult = {
  success: boolean;
  requestId?: string;
  status?: "pending" | "approved" | "hold" | "rejected";
  score?: number;
  error?: string;
};

const allowedExtensions = ["pdf", "png", "jpg", "jpeg"];

const sanitizeFileName = (name: string): string =>
  name
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9._-]/g, "");

const getFileExtension = (name: string): string => {
  const extension = name.split(".").pop();
  return extension ? extension.toLowerCase() : "";
};

const createSafeRandomId = (): string => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    const bytes = crypto.getRandomValues(new Uint8Array(16));
    return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  }

  return `fallback-${Date.now()}-${Math.floor(Math.random() * 1_000_000_000)}`;
};

const uploadOrganizationDocument = async (file: File): Promise<string> => {
  if (!supabase) {
    throw new Error("Supabase client is unavailable.");
  }

  const extension = getFileExtension(file.name);
  if (!allowedExtensions.includes(extension)) {
    throw new Error("Invalid document format. Allowed: PDF, PNG, JPG.");
  }

  const randomId = createSafeRandomId();
  const path = `requests/${Date.now()}-${randomId}-${sanitizeFileName(file.name)}`;

  const candidateBuckets = ["Org_ids", "org-documents"];
  let uploadError: string | null = null;

  for (const bucket of candidateBuckets) {
    const { error } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type || "application/octet-stream",
      });

    if (!error) {
      return `${bucket}/${path}`;
    }

    uploadError = error.message || "Document upload failed.";
  }

  throw new Error(uploadError || "Document upload failed.");
};

export async function submitAccessRequest(
  input: AccessRequestInput,
): Promise<AccessRequestResult> {
  if (!isSupabaseConfigured || !supabase) {
    return {
      success: false,
      error: "Request Access is not configured. Please contact support.",
    };
  }

  try {
    const orgDocumentPath = await uploadOrganizationDocument(input.organizationDocument);

    const { data: requestRow, error: insertError } = await supabase
      .from("access_requests")
      .insert({
        full_name: input.fullName.trim(),
        email: input.email.trim().toLowerCase(),
        organization: input.organization.trim(),
        linkedin_url: input.linkedinUrl?.trim() || null,
        org_document_url: orgDocumentPath,
        reason_for_access: input.reasonForAccess?.trim() || null,
        status: "pending",
        score: 0,
      })
      .select("id, status, score")
      .single();

    if (insertError || !requestRow?.id) {
      return {
        success: false,
        error: insertError?.message || "Failed to save access request.",
      };
    }

    let processResult: { status?: "pending" | "approved" | "hold" | "rejected"; score?: number } | null = null;

    try {
      const { data, error: invokeError } = await supabase.functions.invoke(
        "process-access-request",
        {
          body: { request_id: requestRow.id },
        },
      );

      if (invokeError) {
        console.error("Edge function invoke failed:", invokeError);
      } else {
        processResult = data as { status?: "pending" | "approved" | "hold" | "rejected"; score?: number };
      }
    } catch (error) {
      console.error("Edge function invoke failed:", error);
    }

    return {
      success: true,
      requestId: requestRow.id,
      status: processResult?.status ?? requestRow.status,
      score: processResult?.score ?? requestRow.score,
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Unable to submit request. Please try again.",
    };
  }
}
