import { cn } from "@/lib/utils";
import { CertificateDraft, CertificateStyleType } from "@/components/certificates/types";
import { certificateStylePresets } from "@/components/certificates/CertificateStyles/styles";

interface CertificateTemplateProps {
  styleType: CertificateStyleType;
  draft: CertificateDraft;
  organizationName: string;
  previewScale?: "sm" | "md";
  className?: string;
}

export function CertificateTemplate({
  styleType,
  draft,
  organizationName,
  previewScale = "md",
  className,
}: CertificateTemplateProps) {
  const preset = certificateStylePresets[styleType];
  const compact = previewScale === "sm";

  return (
    <div className={cn("relative aspect-[1.414/1] w-full overflow-hidden rounded-xl", preset.frameClass, preset.surfaceClass, className)}>
      <div className={cn("absolute inset-0", preset.watermarkClass)} />

      <div className="relative z-10 flex h-full flex-col justify-between p-4 sm:p-6">
        <header className={cn("rounded-md px-3 py-2 sm:px-4 sm:py-3", preset.headerBandClass)}>
          <div className="flex items-center justify-between gap-3">
            <div className="inline-flex items-center gap-2">
              <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-white/80 border border-slate-200 flex items-center justify-center text-[9px] sm:text-[10px] text-slate-600 font-semibold">
                CP
              </div>
              <p className={cn("font-medium text-slate-700", compact ? "text-[10px]" : "text-[11px]")}>{organizationName}</p>
            </div>
            {draft.logoPreviewUrl ? (
              <img src={draft.logoPreviewUrl} alt="Uploaded logo" className="h-6 sm:h-8 w-auto max-w-[72px] sm:max-w-[96px] object-contain" />
            ) : (
              <div className="h-6 sm:h-8 min-w-[72px] sm:min-w-[96px] rounded border border-dashed border-slate-300 bg-white/65 px-2 text-[9px] sm:text-[10px] text-slate-500 flex items-center justify-center">
                Logo
              </div>
            )}
          </div>
        </header>

        <main className="flex-1 py-4 sm:py-6 text-center flex flex-col justify-center">
          <p className={cn("uppercase tracking-[0.22em] text-slate-500", compact ? "text-[8px]" : "text-[10px]")}>Certificate</p>
          <h3 className={cn("font-heading font-semibold tracking-tight mt-1", compact ? "text-sm" : "text-xl sm:text-2xl", preset.recipientClass)}>
            {draft.certificateTitle}
          </h3>
          <div className={cn("mx-auto mt-3 sm:mt-4 h-px w-2/3", preset.accentLineClass)} />

          <p className={cn("mt-3 text-slate-600", compact ? "text-[10px]" : "text-xs sm:text-sm")}>
            This certificate is proudly awarded to
          </p>
          <p className={cn("font-heading font-semibold tracking-tight mt-1", compact ? "text-base" : "text-2xl sm:text-3xl", preset.recipientClass)}>
            {draft.recipientName}
          </p>
          <p className={cn("mt-2 text-slate-600 leading-relaxed mx-auto max-w-[92%]", compact ? "text-[9px]" : "text-[11px] sm:text-xs")}>
            {draft.description}
          </p>
        </main>

        <footer className="grid grid-cols-3 items-end gap-3 sm:gap-4">
          <div className="space-y-1">
            <div className="h-px w-full bg-slate-300" />
            <p className={cn("font-medium", compact ? "text-[9px]" : "text-[11px]", preset.signatureClass)}>{draft.issuerName}</p>
            <p className={cn("text-slate-500", compact ? "text-[8px]" : "text-[10px]")}>Issuer Signature</p>
          </div>

          <div className="flex justify-center">
            <div className={cn("rounded-md border-2 border-dashed", compact ? "h-12 w-12" : "h-16 w-16", preset.qrClass)} />
          </div>

          <div className="text-right space-y-1">
            <div className="h-px w-full bg-slate-300" />
            <p className={cn("text-slate-700", compact ? "text-[9px]" : "text-[11px]")}>{new Date().toLocaleDateString()}</p>
            <p className={cn("text-slate-500", compact ? "text-[8px]" : "text-[10px]")}>Date Issued</p>
          </div>
        </footer>
      </div>
    </div>
  );
}
