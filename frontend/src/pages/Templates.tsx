import { useEffect, useState, type DragEvent } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Upload, Loader2, Sparkles, WandSparkles, Eye, Pencil, ChevronLeft, ChevronRight, LayoutGrid } from "lucide-react";
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
import { API_BASE, getTemplates } from "@/services/apiService";
import { LayoutPreview } from "@/components/LayoutPreview";

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

type WorkspaceTemplateState = {
  id: string;
  file_url: string | null;
  title?: string;
  is_custom?: boolean;
};

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
  const templatesPerPage = 4;

  const [dragActive, setDragActive] = useState(false);
  const [uploadedTemplateName, setUploadedTemplateName] = useState("sample-certificate-layout.pdf");
  const [layoutSaveStatus, setLayoutSaveStatus] = useState("Ready");

  // Unified layout configuration state
  const [layoutConfig, setLayoutConfig] = useState({
    showStudentName: true,
    showQR: true,
    showID: true,
    placeholderField: "STUDENT_NAME",
    placeholderX: 40,
    placeholderY: 36,
    qrX: 82,
    qrY: 76,
    idX: 10,
    idY: 88,
  });

  // Workspace preview state
  const [workspaceTemplate, setWorkspaceTemplate] = useState<WorkspaceTemplateState | null>(null);
  const [isGallerySelected, setIsGallerySelected] = useState(false);

  // Load saved layout config from localStorage on mount
  useEffect(() => {
    try {
      const savedLayout = localStorage.getItem("certifypro_layout_config");
      if (savedLayout) {
        setLayoutConfig((prev) => ({ ...prev, ...JSON.parse(savedLayout) }));
      }
    } catch {
      // ignore corrupt data
    }
  }, []);

  useEffect(() => {
    const loadDrafts = async () => {
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
    };

    loadDrafts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const loadWorkspaceTemplate = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        const token = data.session?.access_token;
        if (!token) {
          return;
        }

        const res = await fetch(`${API_BASE}/api/workspace-template`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          return;
        }

        const payload = await res.json();
        if (!payload?.template_id) {
          return;
        }

        setWorkspaceTemplate({
          id: payload.template_id,
          file_url: payload.file_url ?? payload.template_url ?? null,
          title: payload.title ?? "Workspace Template",
          is_custom: payload.is_official === false,
        });
        setSelectedTemplateId(payload.template_id);
        setIsGallerySelected(payload.is_official === true);
        if (payload.title && payload.is_official === false) {
          setUploadedTemplateName(payload.title);
        }
        if (payload.layout_config) {
          setLayoutConfig((prev) => ({ ...prev, ...payload.layout_config }));
        }
      } catch {
        // Ignore workspace preload failures and fall back to localStorage state.
      }
    };

    loadWorkspaceTemplate();
  }, []);

  useEffect(() => {
    const loadTemplates = async () => {
      setLoading(true);
      try {
        const params = selectedCategory === "All" ? { official: true } : { official: true, category: selectedCategory };
        const t = await getTemplates(params);
        setTemplates(t as CertificateTemplateMeta[]);
        console.log("Templates loaded:", t?.length);
        if (!selectedTemplateId && t?.length) {
          setSelectedTemplateId(t[0].id);
        }
      } catch (err) {
        console.error("Failed to load templates", err);
      } finally {
        setLoading(false);
      }
    };

    loadTemplates();
  }, [selectedCategory]);

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

  // Reset to page 1 when category changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory]);

  const filteredTemplates =
    selectedCategory === "All"
      ? templates
      : templates.filter(
          template => template.category === selectedCategory
        );

  const indexOfLastTemplate =
    currentPage * templatesPerPage;

  const indexOfFirstTemplate =
    indexOfLastTemplate - templatesPerPage;

  const paginatedTemplates =
    filteredTemplates.slice(
      indexOfFirstTemplate,
      indexOfLastTemplate
    );

  const totalPages = Math.ceil(filteredTemplates.length / templatesPerPage);

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

  const saveLayout = async () => {
    if (!workspaceTemplate?.id) {
      setLayoutSaveStatus("Select a gallery template preview or upload a custom certificate before saving.");
      return;
    }

    setLayoutSaveStatus("Saving layout...");

    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) {
        setLayoutSaveStatus("You must be signed in to save the workspace layout.");
        return;
      }

      const res = await fetch(`${API_BASE}/api/save-layout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          template_id: workspaceTemplate.id,
          layout_config: layoutConfig,
          custom_template_url: workspaceTemplate.is_custom ? workspaceTemplate.file_url : null,
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || "Failed to save workspace layout.");
      }

      localStorage.setItem("certifypro_layout_config", JSON.stringify(layoutConfig));
      localStorage.setItem("certifypro_selected_template", workspaceTemplate.id);
      setLayoutSaveStatus("Layout saved successfully");
    } catch (error) {
      setLayoutSaveStatus(`Save error: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const openOfficialTemplate = (template: CertificateTemplateMeta, mode: "preview" | "edit") => {
    setSelectedTemplate({
      id: template.id,
      file_url: (template as any).file_url,
      image_url: (template as any).image_url,
      title: template.title,
      category: template.category,
      styleType: template.styleType,
      editableFields: template.editableFields,
    } as CertificateTemplateMeta);
    setSelectedTemplateId(template.id);
    setModalMode(mode);

    // If template has saved layout, apply to preview controls
    try {
      const cfg = (template as any).layout_config;
      if (cfg) {
        setLayoutConfig((prev) => ({
          ...prev,
          ...(cfg.student_name && {
            placeholderX: cfg.student_name.x ?? prev.placeholderX,
            placeholderY: cfg.student_name.y ?? prev.placeholderY,
            showStudentName: cfg.student_name.visible ?? prev.showStudentName,
          }),
          ...(cfg.qr_code && {
            qrX: cfg.qr_code.x ?? prev.qrX,
            qrY: cfg.qr_code.y ?? prev.qrY,
            showQR: cfg.qr_code.visible ?? prev.showQR,
          }),
          ...(cfg.certificate_id && {
            showID: cfg.certificate_id.visible ?? prev.showID,
          }),
        }));
      }
    } catch (err) {
      // ignore
    }
  };

  const handleWorkspacePreview = (template: CertificateTemplateMeta) => {
    setWorkspaceTemplate({
      file_url: (template as any).file_url || (template as any).image_url,
      title: template.title,
      id: template.id,
      is_custom: false,
    });
    setIsGallerySelected(true);
  };

  const uploadTemplate = async (file: File) => {
    try {
      const formData = new FormData();
      formData.append("file", file);
      let authHeaders: HeadersInit | undefined;
      // include current user id when available
      try {
        if (supabase) {
          const sessionRes: any = await supabase.auth.getSession();
          const userId = sessionRes?.data?.session?.user?.id ?? sessionRes?.data?.user?.id ?? null;
          const token = sessionRes?.data?.session?.access_token ?? null;
          if (userId) formData.append("user_id", userId);
          if (token) {
            authHeaders = { Authorization: `Bearer ${token}` };
          }
        }
      } catch (_) {
        // ignore
      }

      const res = await fetch("http://127.0.0.1:8000/api/templates/upload", {
        method: "POST",
        headers: authHeaders,
        body: formData,
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Upload failed: ${res.status} ${errText}`);
      }

      const data = await res.json();
      setUploadedTemplateName(file.name);
      setLayoutSaveStatus("Template uploaded successfully. Save Layout to make it the active workspace template.");

      setWorkspaceTemplate({
        id: data.template_id ?? data.template?.id,
        title: data.template?.title ?? file.name,
        file_url: data.preview_url ?? data.template?.image_url ?? data.file_url,
        is_custom: true,
      });
      setIsGallerySelected(false);
    } catch (error) {
      console.error("Template upload failed:", error);
      setLayoutSaveStatus(`Upload error: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const handleDrop = async (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragActive(false);
    const file = event.dataTransfer.files[0];
    if (file) {
      await uploadTemplate(file);
    }
  };

  return (
    <div className="p-8 max-w-[1280px] mx-auto space-y-6 animate-fade-in">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">Template Library & Workspace</h1>
          <p className="text-muted-foreground mt-1">Browse official locked templates and manage custom uploaded layouts in separate workspaces.</p>
        </div>
        <Badge variant="secondary" className="text-xs">Connected to backend</Badge>
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
                          <Button variant="outline" size="sm" className="h-8 text-xs flex-1 gap-1.5 hover:bg-accent/10 hover:border-accent/50 transition-colors" onClick={() => handleWorkspacePreview(template)}>
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
              <div className="flex justify-center gap-4 mt-6">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => prev - 1)}
                  className="px-4 py-2 text-sm border border-border rounded-md hover:bg-accent/10 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="px-4 py-2 text-sm font-medium">
                  Page {currentPage}
                </span>
                <button
                  disabled={indexOfLastTemplate >= filteredTemplates.length}
                  onClick={() => setCurrentPage(prev => prev + 1)}
                  className="px-4 py-2 text-sm border border-border rounded-md hover:bg-accent/10 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
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
              {!isGallerySelected && (
                <>
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
                <p className="text-xs text-muted-foreground mt-1">PDF, PNG, DOCX</p>
                <input
                  type="file"
                  accept=".pdf,image/*,.docx"
                  className="mt-3"
                  onChange={async (event) => {
                    const file = event.target.files?.[0];
                    if (file) {
                      await uploadTemplate(file);
                    }
                  }}
                />
              </div>

              <div className="rounded-md bg-muted/50 border border-border px-3 py-2 text-xs text-muted-foreground">
                Active uploaded file: <span className="font-medium text-foreground">{uploadedTemplateName}</span>
              </div>
                </>
              )}

              {isGallerySelected && workspaceTemplate && (
                <div className="rounded-md bg-accent/10 border border-accent/20 px-3 py-2 text-xs text-accent-foreground">
                  Gallery template selected: <span className="font-medium">{workspaceTemplate.title || "Official Template"}</span>
                  <Button variant="ghost" size="sm" className="ml-2 h-5 text-[10px] px-1" onClick={() => { setIsGallerySelected(false); setWorkspaceTemplate(null); }}>Clear</Button>
                </div>
              )}

              {!isGallerySelected && workspaceTemplate && (
                <div className="rounded-md bg-primary/10 border border-primary/20 px-3 py-2 text-xs text-primary">
                  Custom workspace template selected: <span className="font-medium">{workspaceTemplate.title || uploadedTemplateName}</span>
                </div>
              )}

              <div className="space-y-3">
                <div className="flex items-center justify-between rounded-md border border-border bg-muted/30 px-3 py-2">
                  <label className="text-xs text-muted-foreground">Student Name placeholder visibility</label>
                  <input type="checkbox" checked={layoutConfig.showStudentName} onChange={(event) => setLayoutConfig((prev) => ({ ...prev, showStudentName: event.target.checked }))} />
                </div>

                <div className="flex items-center justify-between rounded-md border border-border bg-muted/30 px-3 py-2">
                  <label className="text-xs text-muted-foreground">QR placeholder visibility</label>
                  <input type="checkbox" checked={layoutConfig.showQR} onChange={(event) => setLayoutConfig((prev) => ({ ...prev, showQR: event.target.checked }))} />
                </div>

                <div className="flex items-center justify-between rounded-md border border-border bg-muted/30 px-3 py-2">
                  <label className="text-xs text-muted-foreground">Certificate ID visibility</label>
                  <input type="checkbox" checked={layoutConfig.showID} onChange={(event) => setLayoutConfig((prev) => ({ ...prev, showID: event.target.checked }))} />
                </div>

                <div>
                  <label className="text-xs text-muted-foreground">Placeholder Label</label>
                  <Input value={layoutConfig.placeholderField} onChange={(event) => setLayoutConfig((prev) => ({ ...prev, placeholderField: event.target.value.toUpperCase() }))} />
                </div>

                <div>
                  <label className="text-xs text-muted-foreground">Placeholder X Position ({layoutConfig.placeholderX}%)</label>
                  <input type="range" min={10} max={90} value={layoutConfig.placeholderX} onChange={(event) => setLayoutConfig((prev) => ({ ...prev, placeholderX: Number(event.target.value) }))} className="w-full" />
                </div>

                <div>
                  <label className="text-xs text-muted-foreground">Placeholder Y Position ({layoutConfig.placeholderY}%)</label>
                  <input type="range" min={12} max={86} value={layoutConfig.placeholderY} onChange={(event) => setLayoutConfig((prev) => ({ ...prev, placeholderY: Number(event.target.value) }))} className="w-full" />
                </div>

                <div>
                  <label className="text-xs text-muted-foreground">QR X Position ({layoutConfig.qrX}%)</label>
                  <input type="range" min={10} max={90} value={layoutConfig.qrX} onChange={(event) => setLayoutConfig((prev) => ({ ...prev, qrX: Number(event.target.value) }))} className="w-full" />
                </div>

                <div>
                  <label className="text-xs text-muted-foreground">QR Y Position ({layoutConfig.qrY}%)</label>
                  <input type="range" min={10} max={90} value={layoutConfig.qrY} onChange={(event) => setLayoutConfig((prev) => ({ ...prev, qrY: Number(event.target.value) }))} className="w-full" />
                </div>

                <div>
                  <label className="text-xs text-muted-foreground">ID X Position ({layoutConfig.idX}%)</label>
                  <input type="range" min={5} max={90} value={layoutConfig.idX} onChange={(event) => setLayoutConfig((prev) => ({ ...prev, idX: Number(event.target.value) }))} className="w-full" />
                </div>

                <div>
                  <label className="text-xs text-muted-foreground">ID Y Position ({layoutConfig.idY}%)</label>
                  <input type="range" min={5} max={95} value={layoutConfig.idY} onChange={(event) => setLayoutConfig((prev) => ({ ...prev, idY: Number(event.target.value) }))} className="w-full" />
                </div>
              </div>

              <LayoutPreview
                templateUrl={workspaceTemplate?.file_url ?? null}
                templateTitle={workspaceTemplate?.title}
                layoutConfig={layoutConfig}
              />

              <div className="flex flex-col gap-2">
                <Button className="flex-1 gold-gradient text-accent-foreground gap-2" onClick={saveLayout}>
                  <WandSparkles className="w-4 h-4" /> Save Layout
                </Button>
                <p className="text-xs text-muted-foreground">{layoutSaveStatus}</p>
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
