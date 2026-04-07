import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { CertificateTemplate } from "@/components/certificates/CertificateTemplate";
import type { CertificateDraft, CertificateStyleType } from "@/components/certificates/types";

const emptyDraft: CertificateDraft = {
  recipientName: "",
  certificateTitle: "Certificate",
  description: "",
  issuerSignatureText: "",
  issuerName: "CertifyPro",
  authoritySignatureText: "",
  authorityName: "",
  issuedDate: new Date().toLocaleDateString(),
  logoName: "",
  logoPreviewUrl: "",
};

type LayoutConfig = {
  showStudentName: boolean;
  showQR: boolean;
  showID: boolean;
  placeholderField: string;
  placeholderX: number;
  placeholderY: number;
  qrX: number;
  qrY: number;
  idX: number;
  idY: number;
};

const defaultLayout: LayoutConfig = {
  showStudentName: true,
  showQR: true,
  showID: true,
  placeholderField: "STUDENT_NAME",
  placeholderX: 40,
  placeholderY: 36,
  qrX: 82,
  qrY: 76,
  idX: 10,
  idY: 88,
};

function decodeLayoutParam(value: string | null): LayoutConfig {
  if (!value) return defaultLayout;
  try {
    const json = atob(value.replace(/-/g, "+").replace(/_/g, "/"));
    const parsed = JSON.parse(json) as Partial<LayoutConfig>;
    return { ...defaultLayout, ...parsed };
  } catch {
    return defaultLayout;
  }
}

export default function RenderCertificate() {
  const [params] = useSearchParams();
  const styleType = (params.get("styleType") || "academicFormal") as CertificateStyleType;
  const studentName = params.get("studentName") || "";
  const certId = params.get("certId") || "";
  const layout = useMemo(() => decodeLayoutParam(params.get("layout")), [params]);
  const qrDataUrl = params.get("qr") ? `data:image/png;base64,${params.get("qr")}` : "";

  const draft = useMemo(() => {
    // Keep base template design; name/id/qr are overlaid using saved layout.
    return {
      ...emptyDraft,
      certificateTitle: params.get("title") || emptyDraft.certificateTitle,
      issuerName: params.get("issuer") || emptyDraft.issuerName,
    };
  }, [params]);

  return (
    <div
      className="min-h-screen bg-white flex items-center justify-center"
      style={{ padding: 0, margin: 0 }}
    >
      <div id="render-root" className="relative w-[1600px]" style={{ aspectRatio: "1.414 / 1" }}>
        <div id="certificate-root" className="w-[1600px]">
          <CertificateTemplate
            styleType={styleType}
            draft={draft}
            organizationName="CertifyPro"
            previewScale="md"
            highlightEditableZones={false}
          />
        </div>

        {/* Overlays: these must match the workspace LayoutPreview logic */}
        {layout.showStudentName && studentName && (
          <div
            className="absolute text-[#111827] font-semibold"
            style={{
              left: `${layout.placeholderX}%`,
              top: `${layout.placeholderY}%`,
              transform: "translate(-50%, -50%)",
              zIndex: 20,
              fontSize: 42,
              lineHeight: 1.1,
              whiteSpace: "nowrap",
            }}
          >
            {studentName}
          </div>
        )}

        {layout.showID && certId && (
          <div
            className="absolute text-[#111827]"
            style={{
              left: `${layout.idX}%`,
              top: `${layout.idY}%`,
              transform: "translate(-50%, -50%)",
              zIndex: 20,
              fontSize: 18,
              whiteSpace: "nowrap",
            }}
          >
            ID: {certId}
          </div>
        )}

        {layout.showQR && qrDataUrl && (
          <img
            src={qrDataUrl}
            alt="QR"
            className="absolute"
            style={{
              left: `${layout.qrX}%`,
              top: `${layout.qrY}%`,
              transform: "translate(-50%, -50%)",
              zIndex: 20,
              width: 170,
              height: 170,
            }}
          />
        )}
      </div>
    </div>
  );
}

