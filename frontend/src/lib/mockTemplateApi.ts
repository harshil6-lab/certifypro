import { mockTemplates } from "@/data/mockTemplates";
import type { TemplateItem } from "@/types/template";

let inMemoryTemplates: TemplateItem[] = [...mockTemplates];

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const mockTemplateApi = {
  async getTemplates(): Promise<TemplateItem[]> {
    await delay(220);
    return [...inMemoryTemplates];
  },

  async toggleFavorite(templateId: string): Promise<TemplateItem[]> {
    await delay(120);
    inMemoryTemplates = inMemoryTemplates.map((template) =>
      template.id === templateId
        ? { ...template, isFavorite: !template.isFavorite }
        : template,
    );
    return [...inMemoryTemplates];
  },
};
