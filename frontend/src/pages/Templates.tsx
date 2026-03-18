import { useEffect, useMemo, useState, type DragEvent } from "react";
import { Upload, QrCode, Info, Move, Loader2, Sparkles, WandSparkles, Eye, Pencil, ChevronLeft, ChevronRight, LayoutGrid } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useSearchParams } from "react-router-dom";
import { CertificateTemplate } from "@/components/certificates/CertificateTemplate";
import { CertificateEditorModal } from "@/components/certificates/CertificateEditorModal";
import {
  CertificateDraft,
  CertificateTemplateMeta,
  GalleryCategory,
} from "@/components/certificates/types";
import { getTemplates } from "@/services/apiService";

const categories: Array<"All" | GalleryCategory> = ["All", "Academic", "Corporate", "Internship", "Event", "Compliance", "Training"];

// start empty; we'll fetch from backend
const officialTemplatesInit: CertificateTemplateMeta[] = [];

const emptyDraft: CertificateDraft = {
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

const normalizeDraft = (draft: Partial<CertificateDraft>, fallbackTitle: string): CertificateDraft => ({
  recipientName: draft.recipientName ?? emptyDraft.recipientName,
  certificateTitle: draft.certificateTitle ?? fallbackTitle,
  description: draft.description ?? emptyDraft.description,
  issuerSignatureText: draft.issuerSignatureText ?? "",
  issuerName: draft.issuerName ?? emptyDraft.issuerName,
  authoritySignatureText: draft.authoritySignatureText ?? "",
  authorityName: draft.authorityName ?? emptyDraft.authorityName,
  issuedDate: draft.issuedDate ?? emptyDraft.issuedDate,
  logoName: draft.logoName ?? "",
  logoPreviewUrl: draft.logoPreviewUrl ?? "",
});

const Templates = () => {
  const [searchParams] = useSearchParams();
  const [selectedCategory, setSelectedCategory] = useState<"All" | GalleryCategory>("All");
  const [templates, setTemplates] = useState<CertificateTemplateMeta[]>(officialTemplatesInit);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [selectedTemplate, setSelectedTemplate] = useState<CertificateTemplateMeta | null>(null);
  const [modalMode, setModalMode] = useState<"preview" | "edit">("preview");
  const [draftByTemplate, setDraftByTemplate] = useState<Record<string, CertificateDraft>>({});
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  const [dragActive, setDragActive] = useState(false);
  const [uploadedTemplateName, setUploadedTemplateName] = useState("sample-certificate-layout.pdf");
  const [showPlaceholder, setShowPlaceholder] = useState(true);
  const [showQrPlaceholder, setShowQrPlaceholder] = useState(true);
  const [placeholderField, setPlaceholderField] = useState("STUDENT_NAME");
  const [placeholderX, setPlaceholderX] = useState(40);
  const [placeholderY, setPlaceholderY] = useState(36);
  const [qrX, setQrX] = useState(82);
  const [qrY, setQrY] = useState(76);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const raw = localStorage.getItem("certifypro-official-template-drafts");
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

      // fetch templates from backend
      try {
        const t = await getTemplates();
        setTemplates(t as CertificateTemplateMeta[]);
        if (!selectedTemplateId && t?.length) {
          setSelectedTemplateId(t[0].id);
        }
      } catch (err) {
        // keep existing behavior; show empty state
        console.error("Failed to load templates", err);
      }

      setLoading(false);
    };

    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const source = searchParams.get("source");
    const templateId = searchParams.get("templateId");
    const mode = searchParams.get("mode");

    if (source !== "official" || !templateId) {
      return;
    }

    const target = templates.find((template) => template.id === templateId);
    if (!target) {
      return;
    }

    setSelectedTemplateId(target.id);
    setSelectedTemplate(target);
    setModalMode(mode === "edit" ? "edit" : "preview");
  }, [searchParams, templates]);

  const filteredTemplates = useMemo(() => {
    if (selectedCategory === "All") {
      return templates;
    }
    return templates.filter((template) => template.category === selectedCategory);
  }, [selectedCategory, templates]);

  // Reset to page 1 when category changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory]);

  const totalPages = Math.ceil(filteredTemplates.length / itemsPerPage);
  const paginatedTemplates = filteredTemplates.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

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

    const next = {
      ...draftByTemplate,
      [selectedTemplate.id]: currentDraft,
    };

    setDraftByTemplate(next);
    localStorage.setItem("certifypro-official-template-drafts", JSON.stringify(next));
  };

  const openOfficialTemplate = (template: CertificateTemplateMeta, mode: "preview" | "edit") => {
    setSelectedTemplate(template);
    setSelectedTemplateId(template.id);
    setModalMode(mode);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragActive(false);
    const droppedName = event.dataTransfer.files[0]?.name;
    if (droppedName) {
      setUploadedTemplateName(droppedName);
    }
  };

  return (
    <div className="p-8 max-w-[1280px] mx-auto space-y-6 animate-fade-in">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">Template Library & Workspace</h1>
          <p className="text-muted-foreground mt-1">Browse official locked templates and manage custom uploaded layouts in separate workspaces.</p>
        </div>
        <Badge variant="secondary" className="text-xs">Mock API Mode • Backend-ready</Badge>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        <div className="xl:col-span-3 space-y-4">
          <Card className="card-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-heading flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-accent" />
                CertifyPro Official Template Gallery
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Badge className="bg-accent/10 text-accent border border-accent/20">Official Template</Badge>
                <Badge variant="outline">Brand Locked</Badge>
              </div>

              <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <Button
                    key={category}
                    variant={selectedCategory === category ? "default" : "outline"}
                    size="sm"
                    className={`transition-all duration-200 ${selectedCategory === category
                      ? "gold-gradient text-accent-foreground shadow-sm"
                      : "hover:border-accent/50 hover:bg-accent/5"
                      }`}
                    onClick={() => setSelectedCategory(category)}
                  >
                    {category}
                  </Button>
                ))}
              </div>

              <div className="flex items-center justify-between text-xs text-muted-foreground border-b border-border pb-3">
                <p>Showing {paginatedTemplates.length} of {filteredTemplates.length} templates</p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="font-medium text-foreground">
                    Page {currentPage} / {Math.max(1, totalPages)}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages || totalPages === 0}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {loading ? (
                <div className="h-[500px] rounded-lg border border-dashed border-border flex items-center justify-center text-muted-foreground text-sm">
                  <Loader2 className="w-6 h-6 mr-2 animate-spin text-accent" /> Loading template library...
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  {paginatedTemplates.map((template) => (
                    <div
                      key={template.id}
                      className={`rounded-2xl border p-4 flex flex-col transition-all duration-300 cursor-pointer group hover:-translate-y-1 ${selectedTemplateId === template.id
                        ? "border-accent bg-accent/5 shadow-md"
                        : "border-border bg-card hover:border-accent/40 hover:shadow-lg"
                        }`}
                    >
                      <div className="aspect-[1.414/1] rounded-xl border border-border bg-white p-2 relative overflow-hidden group-hover:scale-[1.01] transition-transform duration-300 shadow-inner">
                        <CertificateTemplate
                          styleType={template.styleType}
                          draft={draftByTemplate[template.id] ?? normalizeDraft({}, template.title)}
                          organizationName={template.category === "Corporate" ? "CertifyPro Corporate" : "CertifyPro Institution"}
                          previewScale="sm"
                        />
                      </div>

                      <div className="flex-1 flex flex-col justify-between mt-4">
                        <div className="space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-bold text-foreground line-clamp-1" title={template.title}>{template.title}</p>
                            <Badge variant="outline" className="text-[10px] px-1.5 h-5 shrink-0">{template.category}</Badge>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            <Badge className="bg-accent/10 text-accent border border-accent/20 text-[10px] px-1.5 h-5">Official</Badge>
                            <Badge variant="outline" className="text-[10px] px-1.5 h-5">Locked</Badge>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 mt-4">
                          <Button variant="outline" size="sm" className="h-8 text-xs flex-1 gap-1.5 hover:bg-accent/10 hover:border-accent/50 transition-colors" onClick={() => openOfficialTemplate(template, "preview")}>
                            <Eye className="w-3.5 h-3.5" /> Preview
                          </Button>
                          <Button size="sm" className="h-8 text-xs flex-1 gap-1.5 gold-gradient text-accent-foreground hover:opacity-90 transition-opacity" onClick={() => openOfficialTemplate(template, "edit")}>
                            <Pencil className="w-3.5 h-3.5" /> Edit
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {paginatedTemplates.length === 0 && (
                    <div className="col-span-full h-40 flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed border-border rounded-xl">
                      <LayoutGrid className="w-8 h-8 opacity-20 mb-2" />
                      <p>No templates found in this category.</p>
                    </div>
                  )}
                </div>
              )}

              {/* Pagination Footer */}
              <div className="flex items-center justify-center pt-2 gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-2"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="w-4 h-4" /> Previous
                </Button>
                <div className="flex gap-1.5">
                  {Array.from({ length: totalPages }).map((_, i) => (
                    <button
                      key={i}
                      className={`w-2 h-2 rounded-full transition-all ${currentPage === i + 1 ? "bg-accent w-4" : "bg-muted-foreground/30 hover:bg-muted-foreground/50"}`}
                      onClick={() => setCurrentPage(i + 1)}
                    />
                  ))}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-2"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages || totalPages === 0}
                >
                  Next <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="xl:col-span-2 space-y-4">
          <Card className="card-shadow overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-heading">Template Upload & Live Preview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Badge className="bg-primary/10 text-primary border border-primary/20">Custom Template</Badge>
                <Badge variant="outline">Editable Layout</Badge>
              </div>

              <div
                className={`border-2 border-dashed rounded-lg p-5 text-center transition-colors ${dragActive ? "border-accent bg-accent/10" : "border-border hover:border-accent/50"}`}
                onDragOver={(event) => {
                  event.preventDefault();
                  setDragActive(true);
                }}
                onDragLeave={() => setDragActive(false)}
                onDrop={handleDrop}
              >
                <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm font-medium text-foreground">Drag & drop template file</p>
                <p className="text-xs text-muted-foreground mt-1">PDF, PNG, DOCX • UI simulation only</p>
              </div>

              <div className="rounded-md bg-muted/50 border border-border px-3 py-2 text-xs text-muted-foreground">
                Active uploaded file: <span className="font-medium text-foreground">{uploadedTemplateName}</span>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between rounded-md border border-border bg-muted/30 px-3 py-2">
                  <label className="text-xs text-muted-foreground">Student Name placeholder visibility</label>
                  <input type="checkbox" checked={showPlaceholder} onChange={(event) => setShowPlaceholder(event.target.checked)} />
                </div>

                <div className="flex items-center justify-between rounded-md border border-border bg-muted/30 px-3 py-2">
                  <label className="text-xs text-muted-foreground">QR placeholder visibility</label>
                  <input type="checkbox" checked={showQrPlaceholder} onChange={(event) => setShowQrPlaceholder(event.target.checked)} />
                </div>

                <div>
                  <label className="text-xs text-muted-foreground">Placeholder Label</label>
                  <Input value={placeholderField} onChange={(event) => setPlaceholderField(event.target.value.toUpperCase())} />
                </div>

                <div>
                  <label className="text-xs text-muted-foreground">Placeholder X Position ({placeholderX}%)</label>
                  <input type="range" min={10} max={90} value={placeholderX} onChange={(event) => setPlaceholderX(Number(event.target.value))} className="w-full" />
                </div>

                <div>
                  <label className="text-xs text-muted-foreground">Placeholder Y Position ({placeholderY}%)</label>
                  <input type="range" min={12} max={86} value={placeholderY} onChange={(event) => setPlaceholderY(Number(event.target.value))} className="w-full" />
                </div>

                <div>
                  <label className="text-xs text-muted-foreground">QR X Position ({qrX}%)</label>
                  <input type="range" min={10} max={90} value={qrX} onChange={(event) => setQrX(Number(event.target.value))} className="w-full" />
                </div>

                <div>
                  <label className="text-xs text-muted-foreground">QR Y Position ({qrY}%)</label>
                  <input type="range" min={10} max={90} value={qrY} onChange={(event) => setQrY(Number(event.target.value))} className="w-full" />
                </div>
              </div>

              <div className="aspect-[1.414/1] bg-muted/40 rounded-lg border border-dashed border-border relative overflow-hidden seal-pattern">
                <div className="absolute inset-0 p-4 sm:p-6 flex flex-col justify-between">
                  <div className="text-center space-y-1">
                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Live Preview (Mock Rendering)</p>
                    <p className="font-heading text-base font-bold text-foreground">{selectedTemplate?.title ?? "No Template Selected"}</p>
                  </div>

                  {showPlaceholder && (
                    <div className="absolute" style={{ left: `${placeholderX}%`, top: `${placeholderY}%`, transform: "translate(-50%, -50%)" }}>
                      <span className="text-[10px] px-2 py-1 rounded bg-primary text-primary-foreground shadow">
                        {`{{${placeholderField || "FIELD"}}}`}
                      </span>
                    </div>
                  )}

                  {showQrPlaceholder && (
                    <div
                      className="absolute w-14 h-14 rounded-md border-2 border-dashed border-accent bg-accent/10 flex items-center justify-center"
                      style={{ left: `${qrX}%`, top: `${qrY}%`, transform: "translate(-50%, -50%)" }}
                    >
                      <QrCode className="w-7 h-7 text-accent" />
                      <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-accent flex items-center justify-center">
                        <Move className="w-3 h-3 text-accent-foreground" />
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between items-end text-[10px] text-muted-foreground">
                    <span>Date: {"{{DATE}}"}</span>
                    <span>Signature: Registrar</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button className="flex-1 gold-gradient text-accent-foreground gap-2">
                  <WandSparkles className="w-4 h-4" /> Save Layout
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="card-shadow">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Info className="w-4 h-4 text-accent mt-0.5 shrink-0" />
                <div className="text-xs text-muted-foreground space-y-1">
                  <p className="font-medium text-foreground">Implementation Notes</p>
                  <ul className="space-y-1 list-disc list-inside">
                    <li>Official templates are brand-locked with field-only editing in modal.</li>
                    <li>Custom upload workspace supports placeholder visibility and position controls.</li>
                    <li>Drag-drop and layout save are frontend-only UI simulation.</li>
                    <li>Ready for future backend connection without routing changes.</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <CertificateEditorModal
        open={Boolean(selectedTemplate)}
        template={selectedTemplate}
        draft={currentDraft}
        initialMode={modalMode}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedTemplate(null);
          }
        }}
        onUpdateField={updateDraftField}
        onSave={saveDraft}
      />
    </div>
  );
};

export default Templates;
