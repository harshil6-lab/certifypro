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
    frameClass: "border-2 border-[#d7b14f]/70",
    surfaceClass: "bg-gradient-to-b from-white to-slate-50",
    headerBandClass: "bg-[#0d1b3a]/6",
    watermarkClass: "bg-[radial-gradient(circle_at_center,rgba(13,27,58,0.06),transparent_65%)]",
    accentLineClass: "bg-[#d7b14f]/40",
    recipientClass: "text-[#0d1b3a]",
    signatureClass: "text-slate-700",
    qrClass: "border-[#d7b14f]/70 bg-[#d7b14f]/10",
  },
  corporateMinimal: {
    frameClass: "border border-slate-300",
    surfaceClass: "bg-white",
    headerBandClass: "bg-slate-900/90",
    watermarkClass: "bg-[linear-gradient(120deg,rgba(15,23,42,0.06),transparent_55%)]",
    accentLineClass: "bg-slate-300",
    recipientClass: "text-slate-900",
    signatureClass: "text-slate-700",
    qrClass: "border-slate-400 bg-slate-100",
  },
  modernGradient: {
    frameClass: "border border-slate-200",
    surfaceClass: "bg-gradient-to-br from-white via-slate-50 to-amber-50/60",
    headerBandClass: "bg-gradient-to-r from-slate-900 to-slate-700",
    watermarkClass: "bg-[radial-gradient(circle_at_80%_20%,rgba(217,169,56,0.2),transparent_55%)]",
    accentLineClass: "bg-amber-300/70",
    recipientClass: "text-slate-900",
    signatureClass: "text-slate-700",
    qrClass: "border-amber-400/70 bg-amber-100/60",
  },
  elegantClassic: {
    frameClass: "border-2 border-[#b48a2d]/60",
    surfaceClass: "bg-gradient-to-b from-[#fffdfa] to-[#f8f4ea]",
    headerBandClass: "bg-[#0d1b3a]/10",
    watermarkClass: "bg-[radial-gradient(circle_at_center,rgba(180,138,45,0.12),transparent_60%)]",
    accentLineClass: "bg-[#b48a2d]/60",
    recipientClass: "text-[#1f2e4f]",
    signatureClass: "text-slate-700",
    qrClass: "border-[#b48a2d]/70 bg-[#b48a2d]/10",
  },
  trainingCertification: {
    frameClass: "border border-[#d9a938]/60",
    surfaceClass: "bg-gradient-to-b from-white to-amber-50/50",
    headerBandClass: "bg-amber-100/80",
    watermarkClass: "bg-[linear-gradient(135deg,rgba(217,169,56,0.12),transparent_50%)]",
    accentLineClass: "bg-amber-300/70",
    recipientClass: "text-slate-900",
    signatureClass: "text-slate-700",
    qrClass: "border-amber-500/60 bg-amber-100/60",
  },
  eventCertificate: {
    frameClass: "border border-slate-300",
    surfaceClass: "bg-gradient-to-br from-white to-slate-100/80",
    headerBandClass: "bg-[#0d1b3a]/12",
    watermarkClass: "bg-[radial-gradient(circle_at_20%_10%,rgba(13,27,58,0.09),transparent_55%)]",
    accentLineClass: "bg-slate-400/55",
    recipientClass: "text-slate-900",
    signatureClass: "text-slate-700",
    qrClass: "border-slate-500/60 bg-slate-100",
  },
};
