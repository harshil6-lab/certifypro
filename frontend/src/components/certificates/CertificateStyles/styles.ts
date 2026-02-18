import { CertificateStyleType } from "@/components/certificates/types";

export interface CertificateStylePreset {
  frameClass: string;
  surfaceClass: string;
  headerBandClass: string;
  watermarkClass: string;
  accentLineClass: string;
  recipientClass: string;
  signatureClass: string;
  qrClass: string;
}

export const certificateStylePresets: Record<CertificateStyleType, CertificateStylePreset> = {
  academicFormal: {
    frameClass: "border border-[#E3B04B]/55",
    surfaceClass: "bg-gradient-to-b from-[#FAFAF7] to-[#F6F7F4]",
    headerBandClass: "bg-white/30",
    watermarkClass: "bg-[radial-gradient(circle_at_center,rgba(31,42,68,0.05),transparent_65%)]",
    accentLineClass: "bg-[#E3B04B]/55",
    recipientClass: "text-[#1F2A44]",
    signatureClass: "text-[#555555]",
    qrClass: "border-[#E3B04B]/70 bg-[#E3B04B]/12",
  },
  corporateMinimal: {
    frameClass: "border border-[#1F2A44]/24",
    surfaceClass: "bg-gradient-to-b from-[#FAFAF7] to-[#F8FAFC]",
    headerBandClass: "bg-white/25",
    watermarkClass: "bg-[linear-gradient(120deg,rgba(31,42,68,0.05),transparent_55%)]",
    accentLineClass: "bg-[#1F2A44]/30",
    recipientClass: "text-[#1F2A44]",
    signatureClass: "text-[#555555]",
    qrClass: "border-[#1F2A44]/42 bg-[#F3F5F8]",
  },
  modernGradient: {
    frameClass: "border border-[#1F2A44]/20",
    surfaceClass: "bg-gradient-to-br from-[#FAFAF7] via-[#F8FAFC] to-[#FFF7E9]",
    headerBandClass: "bg-white/20",
    watermarkClass: "bg-[radial-gradient(circle_at_80%_20%,rgba(227,176,75,0.15),transparent_55%)]",
    accentLineClass: "bg-[#E3B04B]/60",
    recipientClass: "text-[#1F2A44]",
    signatureClass: "text-[#555555]",
    qrClass: "border-[#E3B04B]/70 bg-[#E3B04B]/15",
  },
  elegantClassic: {
    frameClass: "border border-[#E3B04B]/58",
    surfaceClass: "bg-gradient-to-b from-[#FAFAF7] to-[#F9F5ED]",
    headerBandClass: "bg-white/30",
    watermarkClass: "bg-[radial-gradient(circle_at_center,rgba(227,176,75,0.11),transparent_60%)]",
    accentLineClass: "bg-[#E3B04B]/58",
    recipientClass: "text-[#1F2A44]",
    signatureClass: "text-[#555555]",
    qrClass: "border-[#E3B04B]/70 bg-[#E3B04B]/10",
  },
  trainingCertification: {
    frameClass: "border border-[#E3B04B]/60",
    surfaceClass: "bg-gradient-to-b from-[#FAFAF7] to-[#FFF8E8]",
    headerBandClass: "bg-white/30",
    watermarkClass: "bg-[linear-gradient(135deg,rgba(227,176,75,0.11),transparent_50%)]",
    accentLineClass: "bg-[#E3B04B]/58",
    recipientClass: "text-[#1F2A44]",
    signatureClass: "text-[#555555]",
    qrClass: "border-[#E3B04B]/70 bg-[#E3B04B]/12",
  },
  eventCertificate: {
    frameClass: "border border-[#1F2A44]/24",
    surfaceClass: "bg-gradient-to-br from-[#FAFAF7] to-[#F3F7FC]",
    headerBandClass: "bg-white/25",
    watermarkClass: "bg-[radial-gradient(circle_at_20%_10%,rgba(31,42,68,0.07),transparent_55%)]",
    accentLineClass: "bg-[#1F2A44]/34",
    recipientClass: "text-[#1F2A44]",
    signatureClass: "text-[#555555]",
    qrClass: "border-[#1F2A44]/45 bg-[#F3F5F8]",
  },
};
