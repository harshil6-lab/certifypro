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

export interface CertificateTemplateMeta {
  id: string;
  category: GalleryCategory;
  title: string;
  image?: string;
  styleType: CertificateStyleType;
  editableFields: string[];
}

export interface CertificateDraft {
  recipientName: string;
  certificateTitle: string;
  description: string;
  issuerName: string;
  logoName: string;
  logoPreviewUrl?: string;
}
