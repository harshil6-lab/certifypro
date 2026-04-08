export type GalleryCategory =
  | "Academic"
  | "Corporate"
  | "Internship"
  | "Event"
  | "Compliance"
  | "Training";

export type CertificateStyleType =
  | "academicFormal"
  | "corporateMinimal"
  | "modernGradient"
  | "elegantClassic"
  | "trainingCertification"
  | "eventCertificate";

export type TemplateLayoutConfig = Partial<{
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
}> &
  Record<string, unknown>;

export interface CertificateTemplateMeta {
  id: string;
  category: GalleryCategory;
  title: string;
  image?: string;
  styleType: CertificateStyleType;
  editableFields: string[];
  file_url?: string;
  image_url?: string;
  preview_url?: string;
  layout_config?: TemplateLayoutConfig;
  isBuiltin?: boolean;
}

export interface CertificateDraft {
  recipientName: string;
  certificateTitle: string;
  description: string;
  issuerSignatureText?: string;
  issuerName: string;
  authoritySignatureText?: string;
  authorityName: string;
  issuedDate: string;
  logoName: string;
  logoPreviewUrl?: string;
}
