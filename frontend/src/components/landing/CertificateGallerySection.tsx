import { useEffect, useMemo, useState } from "react";
import { Eye, Pencil } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { CertificateTemplate } from "@/components/certificates/CertificateTemplate";
import { CertificateEditorModal } from "@/components/certificates/CertificateEditorModal";
import {
  CertificateDraft,
  CertificateTemplateMeta,
  GalleryCategory,
} from "@/components/certificates/types";
import templatesData from "@/data/certificateTemplates.json";

const categoryOrder: GalleryCategory[] = [
  "Academic",
  "Corporate",
  "Internship",
  "Event",
  "Compliance",
  "Training",
];

const templates = templatesData as CertificateTemplateMeta[];

const emptyDraft: CertificateDraft = {
  recipientName: "Alex Morgan",
  certificateTitle: "Certificate of Completion",
  description: "For successful completion of the designated certification program.",
  issuerName: "CertifyPro Institution",
  authorityName: "Program Authority",
  issuedDate: new Date().toLocaleDateString(),
  logoName: "",
  logoPreviewUrl: "",
};

const normalizeDraft = (draft: Partial<CertificateDraft>, fallbackTitle: string): CertificateDraft => ({
  recipientName: draft.recipientName ?? emptyDraft.recipientName,
  certificateTitle: draft.certificateTitle ?? fallbackTitle,
  description: draft.description ?? emptyDraft.description,
  issuerName: draft.issuerName ?? emptyDraft.issuerName,
  authorityName: draft.authorityName ?? emptyDraft.authorityName,
  issuedDate: draft.issuedDate ?? emptyDraft.issuedDate,
  logoName: draft.logoName ?? "",
  logoPreviewUrl: draft.logoPreviewUrl ?? "",
});

export function CertificateGallerySection() {
  const [activeCategory, setActiveCategory] = useState<GalleryCategory>("Academic");
  const [selectedTemplate, setSelectedTemplate] = useState<CertificateTemplateMeta | null>(null);
  const [draftByTemplate, setDraftByTemplate] = useState<Record<string, CertificateDraft>>({});

  const templatesByCategory = useMemo(() => {
    return categoryOrder.reduce((acc, category) => {
      acc[category] = templates.filter((template) => template.category === category);
      return acc;
    }, {} as Record<GalleryCategory, CertificateTemplateMeta[]>);
  }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("certifypro-template-drafts");
      if (raw) {
        const parsed = JSON.parse(raw) as Record<string, Partial<CertificateDraft>>;
        const normalized = Object.entries(parsed).reduce((acc, [templateId, draft]) => {
          const fallbackTitle = templates.find((template) => template.id === templateId)?.title ?? emptyDraft.certificateTitle;
          acc[templateId] = normalizeDraft(draft, fallbackTitle);
          return acc;
        }, {} as Record<string, CertificateDraft>);
        setDraftByTemplate(normalized);
      }
    } catch {
      setDraftByTemplate({});
    }
  }, []);

  const currentDraft = selectedTemplate
    ? draftByTemplate[selectedTemplate.id] ?? normalizeDraft({}, selectedTemplate.title)
    : emptyDraft;

  const updateDraftField = (field: keyof CertificateDraft, value: string) => {
    if (!selectedTemplate) {
      return;
    }

    setDraftByTemplate((prev) => ({
      ...prev,
      [selectedTemplate.id]: {
        ...normalizeDraft(prev[selectedTemplate.id] ?? {}, selectedTemplate.title),
        [field]: value,
      },
    }));
  };

  const saveDraft = () => {
    if (!selectedTemplate) {
      return;
    }

    const nextState = {
      ...draftByTemplate,
      [selectedTemplate.id]: currentDraft,
    };

    setDraftByTemplate(nextState);
    localStorage.setItem("certifypro-template-drafts", JSON.stringify(nextState));
  };

  return (
    <section className="space-y-7 bg-white p-5 sm:p-6 rounded-2xl">
      <div className="space-y-2 max-w-3xl">
        <h2 className="text-2xl md:text-3xl font-heading font-semibold tracking-tight text-foreground">
          Explore Certificate Templates
        </h2>
        <p className="text-slate-600 leading-relaxed">
          Professional templates designed for institutions, corporate training, and certification programs.
        </p>
      </div>

      <Tabs value={activeCategory} onValueChange={(value) => setActiveCategory(value as GalleryCategory)} className="space-y-5">
        <TabsList className="h-auto flex flex-wrap justify-start gap-2 bg-transparent p-0">
          {categoryOrder.map((category) => (
            <TabsTrigger
              key={category}
              value={category}
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 data-[state=active]:border-accent/40 data-[state=active]:bg-accent/10 data-[state=active]:text-foreground data-[state=active]:shadow-none"
            >
              {category}
            </TabsTrigger>
          ))}
        </TabsList>

        {categoryOrder.map((category) => (
          <TabsContent key={category} value={category} className="mt-0 animate-in fade-in duration-300">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
              {templatesByCategory[category].map((template) => {
                const draft = draftByTemplate[template.id] ?? {
                  ...normalizeDraft({}, template.title),
                };

                return (
                  <article
                    key={template.id}
                    className="group relative overflow-hidden rounded-xl border border-slate-200 bg-slate-50/60 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <div className="relative aspect-[1.414/1] overflow-hidden bg-white p-2">
                      <CertificateTemplate
                        styleType={template.styleType}
                        draft={draft}
                        organizationName={template.category === "Corporate" ? "CertifyPro Corporate" : "CertifyPro Institution"}
                        previewScale="sm"
                        className="h-full"
                      />

                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-900/25 via-slate-900/10 to-transparent opacity-0 backdrop-blur-[1px] transition-opacity duration-300 group-hover:opacity-100" />
                      <div className="absolute inset-x-3 bottom-3 z-10 flex items-center gap-2 opacity-100 translate-y-0 sm:opacity-0 sm:translate-y-1 transition-all duration-300 sm:group-hover:opacity-100 sm:group-hover:translate-y-0 pointer-events-auto">
                        <Button size="sm" className="h-8 text-xs gap-1.5" onClick={() => setSelectedTemplate(template)}>
                          <Eye className="h-3.5 w-3.5" /> Preview
                        </Button>
                        <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5 bg-white/90" onClick={() => setSelectedTemplate(template)}>
                          <Pencil className="h-3.5 w-3.5" /> Edit
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-1.5 p-4">
                      <p className="text-sm font-semibold tracking-tight text-foreground line-clamp-1">{template.title}</p>
                      <p className="text-xs text-slate-500">Editable: Recipient, Title, Description, Issuer, Logo</p>
                    </div>
                  </article>
                );
              })}
            </div>
          </TabsContent>
        ))}
      </Tabs>

      <CertificateEditorModal
        open={Boolean(selectedTemplate)}
        template={selectedTemplate}
        draft={currentDraft}
        onOpenChange={(open) => !open && setSelectedTemplate(null)}
        onUpdateField={updateDraftField}
        onSave={saveDraft}
      />
    </section>
  );
}
