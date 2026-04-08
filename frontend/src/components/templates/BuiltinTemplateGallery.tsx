import { useMemo, useState } from "react";
import { Eye, LayoutGrid, Search } from "lucide-react";
import { BUILTIN_TEMPLATES } from "@/data/builtinTemplates";
import type { CertificateDraft, CertificateTemplateMeta, GalleryCategory } from "@/components/certificates/types";
import { CertificateTemplate } from "@/components/certificates/CertificateTemplate";
import { CertificateEditorModal } from "@/components/certificates/CertificateEditorModal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type BuiltinTemplateGalleryProps = {
  onSelectTemplate: (template: CertificateTemplateMeta) => void;
  selectedId?: string;
};

const categories: Array<"All" | GalleryCategory> = ["All", "Academic", "Corporate", "Internship", "Event", "Compliance", "Training"];

const previewDraft: CertificateDraft = {
  recipientName: "Alex Morgan",
  certificateTitle: "Certificate of Completion",
  description: "For successful completion of the designated certification program.",
  issuerSignatureText: "",
  issuerName: "CertifyPro Institution",
  authoritySignatureText: "",
  authorityName: "Program Authority",
  issuedDate: new Date().toLocaleDateString(),
  logoName: "",
  logoPreviewUrl: "",
};

export function BuiltinTemplateGallery({ onSelectTemplate, selectedId }: BuiltinTemplateGalleryProps) {
  const [activeCategory, setActiveCategory] = useState<(typeof categories)[number]>("All");
  const [query, setQuery] = useState("");

  const [previewTemplate, setPreviewTemplate] = useState<CertificateTemplateMeta | null>(null);
  const [previewMode] = useState<"preview" | "edit">("preview");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return BUILTIN_TEMPLATES.filter((t) => {
      const matchesCategory = activeCategory === "All" ? true : t.category === activeCategory;
      const matchesQuery = !q ? true : t.title.toLowerCase().includes(q);
      return matchesCategory && matchesQuery;
    });
  }, [activeCategory, query]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search templates..." className="pl-9" />
        </div>
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <Button
              key={cat}
              type="button"
              variant={activeCategory === cat ? "default" : "outline"}
              size="sm"
              className={activeCategory === cat ? "gold-gradient text-accent-foreground" : ""}
              onClick={() => setActiveCategory(cat)}
            >
              {cat === "All" ? (
                <span className="inline-flex items-center gap-2">
                  <LayoutGrid className="h-4 w-4" /> All
                </span>
              ) : (
                cat
              )}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((template) => {
          const isSelected = Boolean(selectedId && template.id === selectedId);
          return (
            <Card key={template.id} className={`card-shadow overflow-hidden ${isSelected ? "ring-2 ring-accent/60" : ""}`}>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium text-foreground truncate">{template.title}</p>
                    <div className="mt-1 flex items-center gap-2">
                      <Badge variant="secondary">{template.category}</Badge>
                      {isSelected && <Badge className="bg-accent text-accent-foreground">Selected</Badge>}
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border bg-muted/10 overflow-hidden">
                  <div className="relative h-[200px] w-full overflow-hidden bg-white">
                    <div
                      className="absolute left-1/2 top-1/2 origin-top-left"
                      style={{
                        transform: "translate(-50%, -50%) scale(0.33)",
                        width: "900px",
                      }}
                    >
                      <CertificateTemplate
                        styleType={template.styleType}
                        draft={previewDraft}
                        organizationName={template.category === "Corporate" ? "CertifyPro Corporate" : "CertifyPro Institution"}
                        previewScale="sm"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <Button type="button" variant="outline" size="sm" className="gap-2" onClick={() => setPreviewTemplate(template)}>
                    <Eye className="h-4 w-4" /> Preview
                  </Button>
                  <Button type="button" size="sm" className="gold-gradient text-accent-foreground" onClick={() => onSelectTemplate(template)}>
                    Use This
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <CertificateEditorModal
        open={Boolean(previewTemplate)}
        template={previewTemplate}
        draft={previewDraft}
        initialMode={previewMode}
        readOnly
        onOpenChange={(open) => {
          if (!open) setPreviewTemplate(null);
        }}
        onUpdateField={() => {}}
        onSave={() => {}}
      />
    </div>
  );
}

