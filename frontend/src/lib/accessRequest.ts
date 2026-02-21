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

const uploadOrganizationDocument = async (file: File): Promise<string> => {
  if (!supabase) {
    throw new Error("Supabase client is unavailable.");
  }

  const extension = getFileExtension(file.name);
  if (!allowedExtensions.includes(extension)) {
    throw new Error("Invalid document format. Allowed: PDF, PNG, JPG.");
  }

  const randomId = crypto.randomUUID();
  const path = `requests/${Date.now()}-${randomId}-${sanitizeFileName(file.name)}`;

  const { error } = await supabase.storage
    .from("org-documents")
    .upload(path, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type || "application/octet-stream",
    });

  if (error) {
    throw new Error(error.message || "Document upload failed.");
  }

  return path;
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

    const { data: processResult, error: invokeError } = await supabase.functions.invoke(
      "process-access-request",
      {
        body: { requestId: requestRow.id },
      },
    );

    if (invokeError) {
      return {
        success: true,
        requestId: requestRow.id,
        status: "pending",
        score: requestRow.score ?? 0,
      };
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
