import { cn } from "@/lib/utils";
import { Pencil } from "lucide-react";
import type { FocusEvent } from "react";
import { CertificateDraft, CertificateStyleType } from "@/components/certificates/types";
import { certificateStylePresets } from "@/components/certificates/CertificateStyles/styles";

interface CertificateTemplateProps {
  styleType: CertificateStyleType;
  draft: CertificateDraft;
  organizationName: string;
  previewScale?: "sm" | "md";
  highlightEditableZones?: boolean;
  onInlineEdit?: (field: keyof CertificateDraft, value: string) => void;
  className?: string;
}

export function CertificateTemplate({
  styleType,
  draft,
  organizationName,
  previewScale = "md",
  highlightEditableZones = false,
  onInlineEdit,
  className,
}: CertificateTemplateProps) {
  const preset = certificateStylePresets[styleType] ?? certificateStylePresets.academicFormal;
  const compact = previewScale === "sm";
  const interactive = highlightEditableZones && !compact;
  const isAcademicFamily = styleType === "academicFormal" || styleType === "elegantClassic";
  const isCorporateFamily = styleType === "corporateMinimal";
  const isEventFamily = styleType === "eventCertificate" || styleType === "trainingCertification" || styleType === "modernGradient";
  const isTechFamily = styleType === "modernGradient";
  const isCreativeFamily = styleType === "eventCertificate" || styleType === "trainingCertification";

  const updateInlineField = (field: keyof CertificateDraft) => (event: FocusEvent<HTMLElement>) => {
    if (!interactive || !onInlineEdit) {
      return;
    }

    const value = event.currentTarget.textContent?.trim() ?? "";
    if (value) {
      onInlineEdit(field, value);
    }
  };

  return (
    <div className={cn("relative aspect-[1.414/1] w-full min-h-[400px] overflow-hidden rounded-xl bg-white shadow-lg transition-all duration-300", preset.frameClass, preset.surfaceClass, className)}>
      <div className={cn("absolute inset-0", preset.watermarkClass)} />
      <div className="absolute inset-0 bg-[linear-gradient(145deg,rgba(255,255,255,0.42),rgba(255,255,255,0))]" />
      {isEventFamily && <div className="absolute left-0 top-0 h-full w-2 bg-[#E3B04B]/45" />}
      {isCorporateFamily && <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-r from-[#1F2A44]/8 to-transparent" />}
      {isTechFamily && (
        <>
          <div className="absolute right-10 top-12 h-16 w-16 rounded-full border border-[#1F2A44]/10" />
          <div className="absolute right-16 top-18 h-8 w-8 rounded-full bg-[#E3B04B]/14" />
        </>
      )}
      {isCreativeFamily && <div className="absolute right-0 top-0 h-24 w-32 bg-gradient-to-bl from-[#E3B04B]/16 to-transparent" />}

      <div className="relative z-10 flex h-full flex-col justify-between p-4 sm:p-6">
        <header className={cn("rounded-md px-3 py-1.5 sm:px-4 sm:py-2", preset.headerBandClass, interactive && "group/header transition-colors") }>
          <div className={cn("min-h-6 sm:min-h-7", isCorporateFamily ? "flex items-center justify-start" : "flex items-center justify-center")}>
            {draft.logoPreviewUrl ? (
              <div className={cn("rounded border border-transparent", interactive && "group/logo hover:border-accent/35 transition-colors") }>
                <img src={draft.logoPreviewUrl} alt="Uploaded logo" className="h-6 sm:h-8 w-auto max-w-[90px] sm:max-w-[120px] object-contain" />
              </div>
            ) : (
              <div className="h-6 sm:h-8" />
            )}
          </div>
        </header>

        <main className={cn("flex-1 py-4 sm:py-6 flex flex-col justify-center", isCorporateFamily ? "text-left items-start" : "text-center items-center")}>
          <p className={cn("uppercase tracking-[0.22em] text-[#555555]", compact ? "text-[8px]" : "text-[10px]")}>Certificate</p>
          <h3
            className={cn(
              "font-semibold tracking-tight mt-1",
              compact ? "text-sm" : "text-2xl sm:text-[1.75rem]",
              isCorporateFamily || isTechFamily ? "font-body" : "font-heading",
              preset.recipientClass,
              interactive && "group/title rounded-md px-1 hover:bg-white/60 transition-colors",
              isCorporateFamily && "w-full",
            )}
            contentEditable={interactive}
            suppressContentEditableWarning
            onBlur={updateInlineField("certificateTitle")}
          >
            {draft.certificateTitle}
            {interactive && <Pencil className="inline-block ml-1.5 h-3 w-3 text-slate-400 align-middle" />}
          </h3>
          <p className={cn("mt-1 text-[#555555]", compact ? "text-[9px]" : "text-[11px]")}>{organizationName}</p>
          <div className={cn("mt-3 sm:mt-4 h-px", preset.accentLineClass, isCorporateFamily ? "w-full" : "w-2/3")} />

          <p className={cn("mt-3 text-[#555555]", compact ? "text-[10px]" : "text-xs sm:text-sm", isCorporateFamily && "w-full")}>
            This certificate is proudly awarded to
          </p>
          <p
            className={cn(
              "font-semibold tracking-tight mt-1",
              compact ? "text-base" : "text-3xl sm:text-[2.1rem]",
              isCorporateFamily ? "font-body" : "font-heading",
              preset.recipientClass,
              interactive && "rounded-md px-1 hover:bg-white/60 transition-colors",
              isCorporateFamily && "w-full",
            )}
            contentEditable={interactive}
            suppressContentEditableWarning
            onBlur={updateInlineField("recipientName")}
          >
            {draft.recipientName}
            {interactive && <Pencil className="inline-block ml-1.5 h-3 w-3 text-slate-400 align-middle" />}
          </p>
          <p
            className={cn(
              "mt-2 text-[#555555] leading-relaxed",
              compact ? "text-[9px]" : "text-xs sm:text-[13px]",
              interactive && "rounded-md px-1 hover:bg-white/60 transition-colors",
              isCorporateFamily ? "w-full max-w-full" : "mx-auto max-w-[92%]",
            )}
            contentEditable={interactive}
            suppressContentEditableWarning
            onBlur={updateInlineField("description")}
          >
            {draft.description}
            {interactive && <Pencil className="inline-block ml-1.5 h-3 w-3 text-slate-400 align-middle" />}
          </p>
        </main>

        <footer className="space-y-2">
          <div className="grid grid-cols-3 items-end gap-3 sm:gap-4">
          <div className={cn("space-y-1", interactive && "rounded-md px-1 hover:bg-white/60 transition-colors") }>
            <div className={cn("flex items-end justify-center", compact ? "h-6" : "h-9")}>
              {draft.issuerSignaturePreviewUrl ? (
                <img
                  src={draft.issuerSignaturePreviewUrl}
                  alt="Issuer signature"
                  className="max-h-full max-w-full object-contain drop-shadow-sm"
                />
              ) : null}
            </div>
            <div className="h-px w-full bg-slate-300" />
            <p
              className={cn("font-medium", compact ? "text-[9px]" : "text-[11px]", preset.signatureClass)}
              contentEditable={interactive}
              suppressContentEditableWarning
              onBlur={updateInlineField("issuerName")}
            >
              {draft.issuerName}
            </p>
            <p className={cn("text-slate-500", compact ? "text-[8px]" : "text-[10px]")}>Signature 1</p>
            {interactive && <Pencil className="h-3 w-3 text-slate-400" />}
          </div>

          <div className="flex flex-col items-center gap-1">
            <div className={cn("rounded-md border-2 border-dashed", compact ? "h-12 w-12" : "h-16 w-16", preset.qrClass)} />
            <p className={cn("text-slate-500", compact ? "text-[8px]" : "text-[10px]")}>QR Verification Code</p>
          </div>

          <div className={cn("text-right space-y-1", interactive && "rounded-md px-1 hover:bg-white/60 transition-colors") }>
            <div className={cn("flex items-end justify-center", compact ? "h-6" : "h-9")}>
              {draft.authoritySignaturePreviewUrl ? (
                <img
                  src={draft.authoritySignaturePreviewUrl}
                  alt="Authority signature"
                  className="max-h-full max-w-full object-contain drop-shadow-sm"
                />
              ) : null}
            </div>
            <div className="h-px w-full bg-slate-300" />
            <p
              className={cn("font-medium", compact ? "text-[9px]" : "text-[11px]", preset.signatureClass)}
              contentEditable={interactive}
              suppressContentEditableWarning
              onBlur={updateInlineField("authorityName")}
            >
              {draft.authorityName}
            </p>
            <p className={cn("text-slate-500", compact ? "text-[8px]" : "text-[10px]")}>Signature 2</p>
            {interactive && <Pencil className="ml-auto h-3 w-3 text-slate-400" />}
          </div>
          </div>

          <div className={cn("mx-auto text-center rounded-md px-2 py-0.5", interactive && "hover:bg-white/60 transition-colors")}>
            <p className={cn("text-slate-700", compact ? "text-[9px]" : "text-[11px]")}
              contentEditable={interactive}
              suppressContentEditableWarning
              onBlur={updateInlineField("issuedDate")}
            >
              {draft.issuedDate}
            </p>
            <p className={cn("text-slate-500", compact ? "text-[8px]" : "text-[10px]")}>Date Issued</p>
            {interactive && <Pencil className="mx-auto h-3 w-3 text-slate-400" />}
          </div>
        </footer>
      </div>

      <p
        className={cn("absolute text-[#555555] opacity-[0.05] tracking-[0.25em] pointer-events-none", compact ? "text-[8px]" : "text-[11px]")}
        style={{ left: 8, top: "50%", transform: "rotate(-90deg) translateY(-50%)", transformOrigin: "left center" }}
      >
        Generated by CertifyPro
      </p>
    </div>
  );
}
