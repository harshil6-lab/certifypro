export type TemplateCategory =
  | "Academic"
  | "Corporate"
  | "Event"
  | "Compliance"
  | "Training";

export interface TemplateItem {
  id: string;
  title: string;
  description: string;
  category: TemplateCategory;
  aspectRatio: "A4" | "Landscape";
  previewLabel: string;
  placeholders: string[];
  isFavorite: boolean;
}

export interface TemplateSelection {
  templateId: string;
  selectedAt: string;
}
