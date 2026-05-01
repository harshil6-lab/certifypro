import { isSupabaseConfigured, publicSupabase, supabase } from "@/lib/supabaseClient";

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
  status?: "pending" | "approved" | "rejected";
  score?: number;
  rejection_reasons?: string[];
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

const normalizeOrganizationName = (value: string): string =>
  value.trim().replace(/\s+/g, " ");

const uploadOrganizationDocument = async (file: File): Promise<string> => {
  if (!publicSupabase) {
    throw new Error("Supabase client is unavailable.");
  }

  const extension = getFileExtension(file.name);
  if (!allowedExtensions.includes(extension)) {
    throw new Error("Invalid document format. Allowed: PDF, PNG, JPG.");
  }

  const randomId = createSafeRandomId();
  const path = `requests/${Date.now()}-${randomId}-${sanitizeFileName(file.name)}`;

  const candidateBuckets = ["org-documents", "org-docs"];
  let uploadError: string | null = null;

  for (const bucket of candidateBuckets) {
    const { error } = await publicSupabase.storage
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

const insertAccessRequest = async (payload: {
  full_name: string;
  email: string;
  organization: string;
  linkedin_url: string | null;
  org_document_url: string;
  reason_for_access: string | null;
  status: "pending";
  score: number;
}) => {
  const client = publicSupabase ?? supabase;
  if (!client) {
    throw new Error("Supabase client is unavailable.");
  }

  return client
    .from("access_requests")
    .insert(payload)
    .select("id, status, score")
    .single();
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
    const normalizedOrganization = normalizeOrganizationName(input.organization);

    const orgDocumentPath = await uploadOrganizationDocument(input.organizationDocument);

    const { data: requestRow, error: insertError } = await insertAccessRequest({
      full_name: input.fullName.trim(),
      email: input.email.trim().toLowerCase(),
      organization: normalizedOrganization,
      linkedin_url: input.linkedinUrl?.trim() || null,
      org_document_url: orgDocumentPath,
      reason_for_access: input.reasonForAccess?.trim() || null,
      status: "pending",
      score: 0,
    });

    if (insertError || !requestRow?.id) {
      return {
        success: false,
        error: insertError?.message || "Failed to save access request.",
      };
    }

    let processResult: { status?: "pending" | "approved" | "rejected"; score?: number; rejection_reasons?: string[] } | null = null;

    try {
      const functionsClient = publicSupabase ?? supabase;
      const { data, error: invokeError } = await functionsClient.functions.invoke(
        "process-access-request",
        {
          body: { request_id: requestRow.id },
        },
      );

      if (invokeError) {
        console.error("Edge function invoke failed:", invokeError);
      } else {
        processResult = data as { status?: "pending" | "approved" | "rejected"; score?: number; rejection_reasons?: string[] };
      }
    } catch (error) {
      console.error("Edge function invoke failed:", error);
    }

    return {
      success: true,
      requestId: requestRow.id,
      status: processResult?.status ?? requestRow.status,
      score: processResult?.score ?? requestRow.score,
      rejection_reasons: processResult?.rejection_reasons,
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
