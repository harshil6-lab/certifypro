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
    frameClass: "border border-[#d9a938]/55",
    surfaceClass: "bg-gradient-to-b from-[#fffefb] to-[#f8fafc]",
    headerBandClass: "bg-[#0d1b3a]/7",
    watermarkClass: "bg-[radial-gradient(circle_at_center,rgba(13,27,58,0.045),transparent_65%)]",
    accentLineClass: "bg-[#d9a938]/45",
    recipientClass: "text-[#0d1b3a]",
    signatureClass: "text-slate-700",
    qrClass: "border-[#d9a938]/70 bg-[#d9a938]/10",
  },
  corporateMinimal: {
    frameClass: "border border-[#0d1b3a]/20",
    surfaceClass: "bg-gradient-to-b from-white to-[#f8fafc]",
    headerBandClass: "bg-[#0d1b3a]/92",
    watermarkClass: "bg-[linear-gradient(120deg,rgba(13,27,58,0.045),transparent_55%)]",
    accentLineClass: "bg-[#0d1b3a]/25",
    recipientClass: "text-[#0d1b3a]",
    signatureClass: "text-slate-700",
    qrClass: "border-[#0d1b3a]/40 bg-slate-100",
  },
  modernGradient: {
    frameClass: "border border-[#0d1b3a]/18",
    surfaceClass: "bg-gradient-to-br from-white via-[#f8fafc] to-[#fff9eb]",
    headerBandClass: "bg-gradient-to-r from-[#0d1b3a] to-[#1b315f]",
    watermarkClass: "bg-[radial-gradient(circle_at_80%_20%,rgba(217,169,56,0.16),transparent_55%)]",
    accentLineClass: "bg-[#d9a938]/50",
    recipientClass: "text-[#0d1b3a]",
    signatureClass: "text-slate-700",
    qrClass: "border-[#d9a938]/70 bg-[#d9a938]/15",
  },
  elegantClassic: {
    frameClass: "border border-[#d9a938]/55",
    surfaceClass: "bg-gradient-to-b from-[#fffefb] to-[#f8f7f2]",
    headerBandClass: "bg-[#0d1b3a]/9",
    watermarkClass: "bg-[radial-gradient(circle_at_center,rgba(217,169,56,0.10),transparent_60%)]",
    accentLineClass: "bg-[#d9a938]/55",
    recipientClass: "text-[#1f2e4f]",
    signatureClass: "text-slate-700",
    qrClass: "border-[#d9a938]/70 bg-[#d9a938]/10",
  },
  trainingCertification: {
    frameClass: "border border-[#d9a938]/58",
    surfaceClass: "bg-gradient-to-b from-white to-[#fff9eb]",
    headerBandClass: "bg-[#d9a938]/20",
    watermarkClass: "bg-[linear-gradient(135deg,rgba(217,169,56,0.10),transparent_50%)]",
    accentLineClass: "bg-[#d9a938]/55",
    recipientClass: "text-[#0d1b3a]",
    signatureClass: "text-slate-700",
    qrClass: "border-[#d9a938]/68 bg-[#d9a938]/13",
  },
  eventCertificate: {
    frameClass: "border border-[#0d1b3a]/22",
    surfaceClass: "bg-gradient-to-br from-white to-[#f3f7fc]",
    headerBandClass: "bg-[#0d1b3a]/12",
    watermarkClass: "bg-[radial-gradient(circle_at_20%_10%,rgba(13,27,58,0.07),transparent_55%)]",
    accentLineClass: "bg-[#0d1b3a]/32",
    recipientClass: "text-[#0d1b3a]",
    signatureClass: "text-slate-700",
    qrClass: "border-[#0d1b3a]/45 bg-slate-100",
  },
};
