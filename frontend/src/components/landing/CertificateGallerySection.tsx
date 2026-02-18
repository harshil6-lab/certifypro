import { useEffect, useMemo, useState } from "react";
import { Eye, Pencil, Upload } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import templatesData from "@/data/certificateTemplates.json";

type GalleryCategory = "Academic" | "Corporate" | "Internship" | "Event" | "Compliance" | "Training";

interface CertificateTemplate {
  id: string;
  category: GalleryCategory;
  title: string;
  image: string;
  editableFields: string[];
}

interface TemplateDraft {
  recipientName: string;
  certificateTitle: string;
  description: string;
  issuerName: string;
  logoName: string;
}

const categoryOrder: GalleryCategory[] = [
  "Academic",
  "Corporate",
  "Internship",
  "Event",
  "Compliance",
  "Training",
];

const imageModules = import.meta.glob("/src/assets/certificates/**/*.svg", {
  eager: true,
  import: "default",
}) as Record<string, string>;

const templates = templatesData as CertificateTemplate[];

const emptyDraft: TemplateDraft = {
  recipientName: "Alex Morgan",
  certificateTitle: "Certificate of Completion",
  description: "For successful completion of the designated certification program.",
  issuerName: "CertifyPro Institution",
  logoName: "",
};

export function CertificateGallerySection() {
  const [activeCategory, setActiveCategory] = useState<GalleryCategory>("Academic");
  const [selectedTemplate, setSelectedTemplate] = useState<CertificateTemplate | null>(null);
  const [draftByTemplate, setDraftByTemplate] = useState<Record<string, TemplateDraft>>({});

  const templatesByCategory = useMemo(() => {
    return categoryOrder.reduce((acc, category) => {
      acc[category] = templates.filter((template) => template.category === category);
      return acc;
    }, {} as Record<GalleryCategory, CertificateTemplate[]>);
  }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("certifypro-template-drafts");
      if (raw) {
        setDraftByTemplate(JSON.parse(raw) as Record<string, TemplateDraft>);
      }
    } catch {
      setDraftByTemplate({});
    }
  }, []);

  const currentDraft = selectedTemplate
    ? draftByTemplate[selectedTemplate.id] ?? {
        ...emptyDraft,
        certificateTitle: selectedTemplate.title,
      }
    : emptyDraft;

  const updateDraftField = (field: keyof TemplateDraft, value: string) => {
    if (!selectedTemplate) {
      return;
    }

    setDraftByTemplate((prev) => ({
      ...prev,
      [selectedTemplate.id]: {
        ...(prev[selectedTemplate.id] ?? { ...emptyDraft, certificateTitle: selectedTemplate.title }),
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
                const imageSrc = imageModules[template.image];

                return (
                  <article
                    key={template.id}
                    className="group relative overflow-hidden rounded-xl border border-slate-200 bg-slate-50/60 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <div className="relative aspect-[1.414/1] overflow-hidden bg-white">
                      <img
                        src={imageSrc}
                        alt={template.title}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/25 via-slate-900/10 to-transparent opacity-0 backdrop-blur-[1px] transition-opacity duration-300 group-hover:opacity-100" />
                      <div className="absolute inset-x-3 bottom-3 flex items-center gap-2 opacity-0 translate-y-1 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0">
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

      <Dialog open={Boolean(selectedTemplate)} onOpenChange={(open) => !open && setSelectedTemplate(null)}>
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle className="font-semibold tracking-tight">{currentDraft.certificateTitle}</DialogTitle>
            <DialogDescription>
              Preview and edit certificate fields. Changes save locally in this browser.
            </DialogDescription>
          </DialogHeader>

          {selectedTemplate && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="aspect-[1.414/1] rounded-lg overflow-hidden border border-slate-200 relative bg-white">
                  <img
                    src={imageModules[selectedTemplate.image]}
                    alt={selectedTemplate.title}
                    loading="lazy"
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-white/25" />
                  <div className="relative z-10 h-full p-4 sm:p-5 flex flex-col justify-between text-center">
                    <div className="space-y-2">
                      <p className="text-[10px] uppercase tracking-wider text-slate-600">Certificate Preview</p>
                      <h3 className="text-base sm:text-lg font-heading font-semibold tracking-tight text-slate-900 line-clamp-2">
                        {currentDraft.certificateTitle}
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-700 line-clamp-2">Awarded to {currentDraft.recipientName}</p>
                      <p className="text-xs text-slate-600 leading-relaxed px-2 line-clamp-3">{currentDraft.description}</p>
                    </div>
                    <div className="flex items-end justify-between text-[11px] text-slate-700">
                      <span>{currentDraft.logoName || "[Logo Placeholder]"}</span>
                      <span>{currentDraft.issuerName}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Recipient Name</label>
                  <Input
                    value={currentDraft.recipientName}
                    onChange={(event) => updateDraftField("recipientName", event.target.value)}
                    placeholder="Enter recipient name"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Certificate Title</label>
                  <Input
                    value={currentDraft.certificateTitle}
                    onChange={(event) => updateDraftField("certificateTitle", event.target.value)}
                    placeholder="Enter certificate title"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Description</label>
                  <Textarea
                    value={currentDraft.description}
                    onChange={(event) => updateDraftField("description", event.target.value)}
                    rows={4}
                    placeholder="Enter certificate description"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Issuer Name / Signature</label>
                  <Input
                    value={currentDraft.issuerName}
                    onChange={(event) => updateDraftField("issuerName", event.target.value)}
                    placeholder="Enter issuer name"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Logo Replacement</label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="file"
                      accept="image/*"
                      className="h-10"
                      onChange={(event) => {
                        const fileName = event.target.files?.[0]?.name ?? "";
                        updateDraftField("logoName", fileName);
                      }}
                    />
                    <div className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-slate-500">
                      <Upload className="h-4 w-4" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedTemplate(null)}>Close</Button>
            <Button onClick={saveDraft}>Save Preview</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
