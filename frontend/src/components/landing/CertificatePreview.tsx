import { cn } from "@/lib/utils";
import { CertificateTemplate } from "@/components/certificates/CertificateTemplate";
import type { CertificateDraft, CertificateStyleType } from "@/components/certificates/types";

/**
 * Sample certificate data used for marketing previews on the public landing
 * page. Mirrors the sample draft shipped with the in-product template gallery
 * (BuiltinTemplateGallery) so previews on the landing page match what admins
 * actually see inside the product — no fabricated visuals.
 */
export const sampleCertificateDraft: CertificateDraft = {
  recipientName: "Alex Morgan",
  certificateTitle: "Certificate of Completion",
  description: "For successful completion of the designated certification program.",
  issuerSignatureText: "",
  issuerName: "CertifyPro Institution",
  authoritySignatureText: "",
  authorityName: "Program Authority",
  issuedDate: new Date().toLocaleDateString(),
  logoName: "",
  logoPreviewUrl: "",
};

interface CertificatePreviewProps {
  styleType: CertificateStyleType;
  organizationName: string;
  draft?: CertificateDraft;
  /** Height of the preview viewport. Defaults to a compact thumbnail. */
  heightClass?: string;
  className?: string;
}

/**
 * Renders a real `CertificateTemplate` scaled down into a fixed-height preview
 * viewport, reusing the proven scale-embed technique from BuiltinTemplateGallery.
 * The certificate is genuine product output, so landing-page previews stay
 * accurate without any hand-built mockups.
 */
export function CertificatePreview({
  styleType,
  organizationName,
  draft = sampleCertificateDraft,
  heightClass = "h-[220px]",
  className,
}: CertificatePreviewProps) {
  return (
    <div className={cn("relative w-full overflow-hidden bg-white", heightClass, className)}>
      <div
        className="absolute left-1/2 top-1/2 origin-top-left"
        style={{ transform: "translate(-50%, -50%) scale(0.34)", width: "900px" }}
      >
        <CertificateTemplate
          styleType={styleType}
          draft={draft}
          organizationName={organizationName}
          previewScale="sm"
        />
      </div>
    </div>
  );
}
