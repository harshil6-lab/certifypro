import { CertificateStyleType } from "@/components/certificates/types";

export interface CertificateStylePreset {
  frameClass: string;
  innerFrameClass: string;
  surfaceClass: string;
  headerBandClass: string;
  watermarkClass: string;
  ornamentClass: string;
  accentLineClass: string;
  titleClass: string;
  subtitleClass: string;
  bodyClass: string;
  recipientClass: string;
  signatureClass: string;
  signatureLineClass: string;
  datePanelClass: string;
  sealClass: string;
  qrClass: string;
}

export const certificateStylePresets: Record<CertificateStyleType, CertificateStylePreset> = {
  academicFormal: {
    frameClass: "border-2 border-[#D7B87A]/70 shadow-[0_18px_40px_rgba(31,42,68,0.10)]",
    innerFrameClass: "border border-[#D7B87A]/55 rounded-[16px]",
    surfaceClass: "bg-[linear-gradient(180deg,#FDFBF5_0%,#F8F4E8_100%)]",
    headerBandClass: "bg-[linear-gradient(90deg,rgba(215,184,122,0.14),rgba(255,255,255,0.1),rgba(215,184,122,0.14))]",
    watermarkClass: "bg-[radial-gradient(circle_at_50%_35%,rgba(31,42,68,0.06),transparent_68%),repeating-linear-gradient(45deg,rgba(31,42,68,0.025)_0,rgba(31,42,68,0.025)_2px,transparent_2px,transparent_10px)]",
    ornamentClass: "before:absolute before:inset-2 before:rounded-[14px] before:border before:border-[#D7B87A]/45 before:content-[''] after:absolute after:inset-4 after:rounded-[12px] after:border after:border-[#1F2A44]/18 after:content-['']",
    accentLineClass: "bg-[#D7B87A]/80",
    titleClass: "text-[#1F2A44] tracking-[0.08em]",
    subtitleClass: "text-[#6B7280]",
    bodyClass: "text-[#4B5563]",
    recipientClass: "text-[#1F2A44]",
    signatureClass: "text-[#555555]",
    signatureLineClass: "bg-[#1F2A44]/30",
    datePanelClass: "bg-[#FFFFFF]/52 border border-[#D7B87A]/35",
    sealClass: "border-[#D7B87A]/70 bg-[#D7B87A]/12",
    qrClass: "border-[#D7B87A]/75 bg-[#D7B87A]/10",
  },
  corporateMinimal: {
    frameClass: "border border-[#1F2A44]/35 shadow-[0_18px_40px_rgba(17,24,39,0.12)]",
    innerFrameClass: "border border-[#1F2A44]/20 rounded-[14px]",
    surfaceClass: "bg-[linear-gradient(180deg,#FBFCFE_0%,#F4F6FA_100%)]",
    headerBandClass: "bg-[linear-gradient(90deg,rgba(31,42,68,0.18),rgba(31,42,68,0.08),rgba(212,175,55,0.12))]",
    watermarkClass: "bg-[linear-gradient(135deg,rgba(31,42,68,0.07),transparent_45%),radial-gradient(circle_at_88%_14%,rgba(212,175,55,0.08),transparent_58%)]",
    ornamentClass: "before:absolute before:inset-3 before:rounded-[12px] before:border before:border-[#1F2A44]/18 before:content-[''] after:absolute after:left-4 after:right-4 after:top-16 after:h-px after:bg-[#D4AF37]/50 after:content-['']",
    accentLineClass: "bg-[#D4AF37]/80",
    titleClass: "text-[#111827] tracking-[0.07em]",
    subtitleClass: "text-[#4B5563]",
    bodyClass: "text-[#4B5563]",
    recipientClass: "text-[#1F2A44]",
    signatureClass: "text-[#555555]",
    signatureLineClass: "bg-[#1F2A44]/36",
    datePanelClass: "bg-[#FFFFFF]/65 border border-[#1F2A44]/22",
    sealClass: "border-[#D4AF37]/70 bg-[#D4AF37]/12",
    qrClass: "border-[#1F2A44]/45 bg-[#EEF2F8]",
  },
  modernGradient: {
    frameClass: "border border-[#1F2A44]/24 shadow-[0_16px_36px_rgba(31,42,68,0.10)]",
    innerFrameClass: "border border-[#1F2A44]/14 rounded-[14px]",
    surfaceClass: "bg-[linear-gradient(160deg,#F8FBFF_0%,#F5F9FF_35%,#FFF8EC_100%)]",
    headerBandClass: "bg-[linear-gradient(90deg,rgba(31,42,68,0.12),rgba(255,255,255,0.18),rgba(227,176,75,0.20))]",
    watermarkClass: "bg-[radial-gradient(circle_at_15%_20%,rgba(31,42,68,0.08),transparent_45%),radial-gradient(circle_at_86%_18%,rgba(227,176,75,0.17),transparent_52%)]",
    ornamentClass: "before:absolute before:inset-3 before:rounded-[14px] before:border before:border-[#1F2A44]/14 before:content-[''] after:absolute after:right-6 after:top-6 after:h-16 after:w-16 after:rounded-full after:border after:border-[#E3B04B]/40 after:content-['']",
    accentLineClass: "bg-[#E3B04B]/72",
    titleClass: "text-[#1F2A44] tracking-[0.06em]",
    subtitleClass: "text-[#64748B]",
    bodyClass: "text-[#475569]",
    recipientClass: "text-[#1F2A44]",
    signatureClass: "text-[#555555]",
    signatureLineClass: "bg-[#1F2A44]/28",
    datePanelClass: "bg-[#FFFFFF]/62 border border-[#1F2A44]/18",
    sealClass: "border-[#E3B04B]/72 bg-[#E3B04B]/14",
    qrClass: "border-[#E3B04B]/72 bg-[#E3B04B]/16",
  },
  elegantClassic: {
    frameClass: "border-2 border-[#CFAE72]/78 shadow-[0_20px_44px_rgba(31,42,68,0.11)]",
    innerFrameClass: "border border-[#CFAE72]/58 rounded-[16px]",
    surfaceClass: "bg-[linear-gradient(180deg,#FCF8EE_0%,#F8F1E4_100%)]",
    headerBandClass: "bg-[linear-gradient(90deg,rgba(207,174,114,0.18),rgba(255,255,255,0.1),rgba(207,174,114,0.18))]",
    watermarkClass: "bg-[radial-gradient(circle_at_50%_35%,rgba(207,174,114,0.15),transparent_63%),repeating-linear-gradient(0deg,rgba(207,174,114,0.04)_0,rgba(207,174,114,0.04)_1px,transparent_1px,transparent_9px)]",
    ornamentClass: "before:absolute before:inset-2 before:rounded-[14px] before:border before:border-[#CFAE72]/58 before:content-[''] after:absolute after:inset-5 after:rounded-[10px] after:border after:border-[#1F2A44]/15 after:content-['']",
    accentLineClass: "bg-[#CFAE72]/85",
    titleClass: "text-[#1F2A44] tracking-[0.08em]",
    subtitleClass: "text-[#6B7280]",
    bodyClass: "text-[#4B5563]",
    recipientClass: "text-[#1F2A44]",
    signatureClass: "text-[#555555]",
    signatureLineClass: "bg-[#1F2A44]/28",
    datePanelClass: "bg-[#FFFFFF]/56 border border-[#CFAE72]/40",
    sealClass: "border-[#CFAE72]/75 bg-[#CFAE72]/14",
    qrClass: "border-[#CFAE72]/74 bg-[#CFAE72]/10",
  },
  trainingCertification: {
    frameClass: "border border-[#0F4C5C]/28 shadow-[0_16px_34px_rgba(15,76,92,0.12)]",
    innerFrameClass: "border border-[#0F4C5C]/16 rounded-[14px]",
    surfaceClass: "bg-[linear-gradient(180deg,#F9FCFD_0%,#F2F8FA_100%)]",
    headerBandClass: "bg-[linear-gradient(90deg,rgba(15,76,92,0.16),rgba(255,255,255,0.14),rgba(227,176,75,0.16))]",
    watermarkClass: "bg-[radial-gradient(circle_at_15%_20%,rgba(15,76,92,0.08),transparent_52%),linear-gradient(135deg,rgba(15,76,92,0.03),transparent_55%)]",
    ornamentClass: "before:absolute before:inset-3 before:rounded-[14px] before:border before:border-[#0F4C5C]/18 before:content-[''] after:absolute after:left-4 after:right-4 after:top-20 after:h-px after:bg-[#E3B04B]/52 after:content-['']",
    accentLineClass: "bg-[#0F4C5C]/60",
    titleClass: "text-[#0F4C5C] tracking-[0.06em]",
    subtitleClass: "text-[#475569]",
    bodyClass: "text-[#475569]",
    recipientClass: "text-[#1F2A44]",
    signatureClass: "text-[#555555]",
    signatureLineClass: "bg-[#0F4C5C]/35",
    datePanelClass: "bg-[#FFFFFF]/65 border border-[#0F4C5C]/18",
    sealClass: "border-[#0F4C5C]/55 bg-[#0F4C5C]/10",
    qrClass: "border-[#0F4C5C]/42 bg-[#EAF5F8]",
  },
  eventCertificate: {
    frameClass: "border border-[#7C3AED]/28 shadow-[0_18px_38px_rgba(124,58,237,0.12)]",
    innerFrameClass: "border border-[#7C3AED]/16 rounded-[14px]",
    surfaceClass: "bg-[linear-gradient(160deg,#FBF8FF_0%,#F4F7FF_55%,#FFF7ED_100%)]",
    headerBandClass: "bg-[linear-gradient(90deg,rgba(124,58,237,0.16),rgba(255,255,255,0.15),rgba(227,176,75,0.2))]",
    watermarkClass: "bg-[radial-gradient(circle_at_12%_16%,rgba(124,58,237,0.12),transparent_50%),radial-gradient(circle_at_86%_14%,rgba(227,176,75,0.16),transparent_48%)]",
    ornamentClass: "before:absolute before:inset-3 before:rounded-[14px] before:border before:border-[#7C3AED]/18 before:content-[''] after:absolute after:right-5 after:bottom-5 after:h-20 after:w-20 after:rounded-full after:border after:border-[#E3B04B]/48 after:content-['']",
    accentLineClass: "bg-[#7C3AED]/55",
    titleClass: "text-[#5B21B6] tracking-[0.06em]",
    subtitleClass: "text-[#6B7280]",
    bodyClass: "text-[#4B5563]",
    recipientClass: "text-[#1F2A44]",
    signatureClass: "text-[#555555]",
    signatureLineClass: "bg-[#5B21B6]/30",
    datePanelClass: "bg-[#FFFFFF]/65 border border-[#7C3AED]/18",
    sealClass: "border-[#E3B04B]/70 bg-[#E3B04B]/16",
    qrClass: "border-[#7C3AED]/42 bg-[#F2EBFF]",
  },
};
