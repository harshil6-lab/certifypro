import { useEffect, useState, type DragEvent } from "react";
import axios from "axios";
import { Sparkles, WandSparkles, Eye, LayoutGrid, Upload, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { CertificateEditorModal } from "@/components/certificates/CertificateEditorModal";
import { CertificateTemplate } from "@/components/certificates/CertificateTemplate";
import {
  CertificateDraft,
  CertificateTemplateMeta,
  TemplateLayoutConfig,
} from "@/components/certificates/types";
import { LayoutPreview } from "@/components/LayoutPreview";
import { addSessionActivity } from "@/services/sessionActivity";
import { getTemplates } from "@/services/apiService";
import {
  defaultLayoutConfig,
  normalizeLayoutConfig,
} from "@/lib/layoutConfig";

const BUILTIN_TEMPLATES: CertificateTemplateMeta[] = [
  {
    id: "builtin-academic",
    category: "Academic",
    title: "Academic Excellence",
    styleType: "academicFormal",
    editableFields: ["recipientName", "certificateTitle", "description", "issuerName", "authorityName", "issuedDate"],
    image_url: undefined,
    file_url: undefined,
  },
  {
    id: "builtin-corporate",
    category: "Corporate",
    title: "Corporate Achievement",
    styleType: "corporateMinimal",
    editableFields: ["recipientName", "certificateTitle", "description", "issuerName", "authorityName", "issuedDate"],
    image_url: undefined,
    file_url: undefined,
  },
  {
    id: "builtin-internship",
    category: "Internship",
    title: "Internship Completion",
    styleType: "modernGradient",
    editableFields: ["recipientName", "certificateTitle", "description", "issuerName", "authorityName", "issuedDate"],
    image_url: undefined,
    file_url: undefined,
  },
  {
    id: "builtin-event",
    category: "Event",
    title: "Event Participation",
    styleType: "eventCertificate",
    editableFields: ["recipientName", "certificateTitle", "description", "issuerName", "authorityName", "issuedDate"],
    image_url: undefined,
    file_url: undefined,
  },
  {
    id: "builtin-compliance",
    category: "Compliance",
    title: "Compliance Certificate",
    styleType: "elegantClassic",
    editableFields: ["recipientName", "certificateTitle", "description", "issuerName", "authorityName", "issuedDate"],
    image_url: undefined,
    file_url: undefined,
  },
  {
    id: "builtin-training",
    category: "Training",
    title: "Training Certification",
    styleType: "trainingCertification",
    editableFields: ["recipientName", "certificateTitle", "description", "issuerName", "authorityName", "issuedDate"],
    image_url: undefined,
    file_url: undefined,
  },
];

const BUILTIN_PREVIEW_DRAFT: CertificateDraft = {
  recipientName: "Alex Morgan",
  certificateTitle: "Certificate of Excellence",
  description: "For outstanding achievement in the designated program.",
  issuerSignatureText: "",
  issuerName: "CertifyPro Institution",
  authoritySignatureText: "",
  authorityName: "Program Authority",
  issuedDate: new Date().toLocaleDateString(),
  logoName: "",
  logoPreviewUrl: "",
};

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
  image_url?: string | null;
  layout_config?: TemplateLayoutConfig | null;
};

const Templates = () => {
  const [searchParams] = useSearchParams();
  const [templates, setTemplates] = useState<CertificateTemplateMeta[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [selectedTemplate, setSelectedTemplate] = useState<CertificateTemplateMeta | null>(null);
  const [modalMode, setModalMode] = useState<"preview" | "edit">("preview");
  const [draftByTemplate, setDraftByTemplate] = useState<Record<string, CertificateDraft>>({});
  const [isDraggingUpload, setIsDraggingUpload] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("Upload custom background image");

  const [layoutSaveStatus, setLayoutSaveStatus] = useState("Ready");

  const [layoutConfig, setLayoutConfig] = useState(defaultLayoutConfig);

  const [workspaceTemplate, setWorkspaceTemplate] = useState<WorkspaceTemplateState | null>(null);
  const [isGallerySelected, setIsGallerySelected] = useState(false);

  useEffect(() => {
    const loadOfficialTemplates = async () => {
      setLoadingTemplates(true);
      try {
        const result = await getTemplates({ official: true });
        setTemplates(Array.isArray(result) ? result : []);
      } catch {
        setTemplates([]);
      } finally {
        setLoadingTemplates(false);
      }
    };

    void loadOfficialTemplates();
  }, []);

  useEffect(() => {
    const loadWorkspaceTemplate = async () => {
      try {
        let authHeader = "";
        if (supabase) {
          const { data } = await supabase.auth.getSession();
          const token = data.session?.access_token;
          if (token) authHeader = `Bearer ${token}`;
        }

        const { data } = await axios.get("http://127.0.0.1:8000/api/workspace-template", {
          headers: authHeader ? { Authorization: authHeader } : {},
        });

        if (!data?.template_id) {
          return;
        }

        setWorkspaceTemplate({
          id: data.template_id,
          file_url: data.file_url ?? data.template_url ?? null,
          image_url: data.file_url ?? data.template_url ?? null,
          title: data.title,
          is_custom: !data.is_official,
          layout_config: data.layout_config ?? null,
        });
        setSelectedTemplateId(data.template_id);
        setIsGallerySelected(true);
        if (data.layout_config) {
          setLayoutConfig(normalizeLayoutConfig(data.layout_config));
        }
      } catch {
        // keep page functional without workspace template
      }
    };

    void loadWorkspaceTemplate();
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

  const saveLayout = () => {
    if (!workspaceTemplate?.id) {
      setLayoutSaveStatus("Please , Select or Uplaod template");
      return;
    }

    const save = async () => {
      try {
        const normalizedLayout = normalizeLayoutConfig(layoutConfig);
        let authHeader = "";
        if (supabase) {
          const { data } = await supabase.auth.getSession();
          const token = data.session?.access_token;
          if (token) authHeader = `Bearer ${token}`;
        }

        await axios.post(
          "http://127.0.0.1:8000/api/save-layout",
          {
            template_id: workspaceTemplate.id,
            layout_config: normalizedLayout,
            custom_template_url: workspaceTemplate.is_custom ? workspaceTemplate.file_url : null,
          },
          { headers: authHeader ? { Authorization: authHeader } : {} },
        );

        setLayoutSaveStatus("Layout saved to workspace");
        addSessionActivity(
          "workspace_layout_saved",
          `${workspaceTemplate.title ?? "Workspace template"} layout saved`,
          { templateId: workspaceTemplate.id },
        );
      } catch (err: unknown) {
        const detail =
          typeof err === "object" && err && "response" in err
            ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (err as any)?.response?.data?.detail
            : null;
        setLayoutSaveStatus(typeof detail === "string" ? detail : "Failed to save layout");
      }
    };

    void save();
  };

  const openOfficialTemplate = (template: CertificateTemplateMeta, mode: "preview" | "edit") => {
    setSelectedTemplate({
      id: template.id,
      file_url: template.file_url ?? template.image_url,
      image_url: template.image_url ?? template.file_url,
      title: template.title,
      category: template.category,
      styleType: template.styleType,
      editableFields: template.editableFields,
    } as CertificateTemplateMeta);
    setSelectedTemplateId(template.id);
    setModalMode(mode);

    // If template has saved layout, apply to preview controls
    try {
      if (template.layout_config) {
        setLayoutConfig((prev) => ({ ...prev, ...normalizeLayoutConfig(template.layout_config) }));
      }
    } catch {
      // ignore
    }
  };

  const handleSelectBuiltinTemplate = (template: CertificateTemplateMeta) => {
    // 1. Set the workspace template state (for layout editor on the right side)
    setWorkspaceTemplate({
      id: template.id,
      file_url: null,
      image_url: null,
      title: template.title,
      is_custom: false,
      layout_config: null,
    });
    setIsGallerySelected(true);

    // 2. Set selectedTemplate — THIS is what opens the modal
    setSelectedTemplate({
      id: template.id,
      file_url: null,
      image_url: null,
      title: template.title,
      category: template.category,
      styleType: template.styleType,
      editableFields: template.editableFields,
    } as CertificateTemplateMeta);

    // 3. Set selected ID (for the card ring highlight)
    setSelectedTemplateId(template.id);

    // 4. Open in edit mode so the user can customize immediately
    setModalMode("edit");
  };

  const handleWorkspacePreview = (template: CertificateTemplateMeta) => {
    const nextTemplate = {
      file_url: template.file_url ?? template.image_url ?? null,
      image_url: template.image_url ?? template.file_url ?? null,
      title: template.title,
      id: template.id,
      is_custom: false,
      layout_config: template.layout_config,
    };
    setWorkspaceTemplate(nextTemplate);
    setIsGallerySelected(true);
    // Ensure modal opens when user selects from gallery
    setSelectedTemplate({
      id: template.id,
      file_url: template.file_url ?? template.image_url ?? null,
      image_url: template.image_url ?? template.file_url ?? null,
      title: template.title,
      category: template.category,
      styleType: template.styleType,
      editableFields: template.editableFields,
    } as CertificateTemplateMeta);
    setSelectedTemplateId(template.id);
    setModalMode("edit");
    if (template.layout_config) {
      setLayoutConfig(normalizeLayoutConfig(template.layout_config));
    }
  };

  const uploadTemplate = async (file: File) => {
    setUploadStatus("Uploading template...");
    try {
      const formData = new FormData();
      formData.append("file", file);

      let authHeader = "";
      if (supabase) {
        const { data } = await supabase.auth.getSession();
        const token = data.session?.access_token;
        if (token) authHeader = `Bearer ${token}`;
      }

      const { data } = await axios.post("http://127.0.0.1:8000/api/templates/upload", formData, {
        headers: {
          ...(authHeader ? { Authorization: authHeader } : {}),
          "Content-Type": "multipart/form-data",
        },
      });

      const nextTemplate = {
        id: data.template_id,
        file_url: data.file_url ?? data.preview_url ?? null,
        image_url: data.preview_url ?? data.file_url ?? null,
        title: data.template?.title ?? file.name,
        is_custom: true,
      };

      setWorkspaceTemplate(nextTemplate);
      setSelectedTemplateId(nextTemplate.id);
      setIsGallerySelected(false);
      setUploadStatus("Template uploaded and selected");
      addSessionActivity("template_uploaded", `${nextTemplate.title} uploaded`, { templateId: nextTemplate.id });
    } catch (err: unknown) {
      const detail =
        typeof err === "object" && err && "response" in err
          ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (err as any)?.response?.data?.detail
          : null;
      setUploadStatus(typeof detail === "string" ? detail : "Upload failed");
    }
  };

  const onUploadFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    void uploadTemplate(file);
    event.currentTarget.value = "";
  };

  const onDropUpload = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDraggingUpload(false);
    const file = event.dataTransfer.files?.[0];
    if (!file) {
      return;
    }
    void uploadTemplate(file);
  };

  return (
    <div className="p-8 max-w-[1280px] mx-auto space-y-6 animate-fade-in">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">Template Library & Workspace</h1>
          <p className="text-muted-foreground mt-1">Browse official templates, preview them, and save your workspace layout for generation.</p>
        </div>
        <Button size="sm" className="gold-gradient text-accent-foreground gap-2" onClick={() => (window.location.href = "/generate") }>
          Generate Certificates <ArrowRight className="w-4 h-4" />
        </Button>
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
              <div className="space-y-4">
                <div className="space-y-1">
                  <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                    <LayoutGrid className="w-5 h-5 text-accent" />
                    CertifyPro Template Library
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Pick a professionally designed template and customize it to your needs.
                  </p>
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {BUILTIN_TEMPLATES.map((template) => (
                    <div key={template.id} className={`rounded-xl ${selectedTemplateId === template.id ? "ring-2 ring-accent" : ""}`}>
                      <Card className="card-shadow h-full">
                        <CardContent className="p-4 space-y-3">
                          <div
                            className="relative w-full overflow-hidden rounded-lg border border-border bg-muted/20"
                            style={{ aspectRatio: "1.414 / 1" }}
                          >
                            <div
                              className="absolute origin-top-left"
                              style={{
                                width: "300%",
                                transform: "scale(0.333)",
                                transformOrigin: "top left",
                                pointerEvents: "none",
                              }}
                            >
                              <CertificateTemplate
                                styleType={template.styleType}
                                draft={BUILTIN_PREVIEW_DRAFT}
                                organizationName="CertifyPro"
                                previewScale="md"
                                highlightEditableZones={false}
                              />
                            </div>
                          </div>

                          <div className="space-y-1">
                            <p className="text-sm font-semibold text-foreground">{template.title}</p>
                            <Badge variant="outline">{template.category}</Badge>
                          </div>

                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-2"
                              onClick={() => openOfficialTemplate(template, "preview")}
                            >
                              <Eye className="h-4 w-4" /> Preview
                            </Button>
                            <Button
                              size="sm"
                              className="gold-gradient text-accent-foreground"
                              onClick={() => handleSelectBuiltinTemplate(template)}
                            >
                              Use This
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="xl:col-span-2 space-y-4">
          <Card className="card-shadow overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-heading">Template Live Preview & Layout Editor</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isGallerySelected && workspaceTemplate && (
                <div className="rounded-md bg-accent/10 border border-accent/20 px-3 py-2 text-xs text-accent-foreground">
                  Gallery template selected: <span className="font-medium">{workspaceTemplate.title || "Official Template"}</span>
                  <Button variant="ghost" size="sm" className="ml-2 h-5 text-[10px] px-1" onClick={() => { setIsGallerySelected(false); setWorkspaceTemplate(null); }}>Clear</Button>
                </div>
              )}

              {!workspaceTemplate && (
                <div className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                  Please , Select or Uplaod template
                </div>
              )}

              <div
                onDragOver={(event) => {
                  event.preventDefault();
                  setIsDraggingUpload(true);
                }}
                onDragLeave={() => setIsDraggingUpload(false)}
                onDrop={onDropUpload}
                className={`rounded-xl border-2 border-dashed px-4 py-5 text-center transition-colors ${isDraggingUpload ? "border-accent bg-accent/5" : "border-border bg-muted/20"}`}
              >
                <Upload className="w-5 h-5 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-foreground">Upload custom template image</p>
                <p className="text-xs text-muted-foreground mt-1">PNG/JPG supported. This becomes your workspace template.</p>
                <label className="inline-block mt-3">
                  <input type="file" accept="image/*" className="hidden" onChange={onUploadFileChange} />
                  <span className="inline-flex items-center rounded-md border border-input bg-background px-3 py-1.5 text-xs hover:bg-accent/5 cursor-pointer">
                    Choose file
                  </span>
                </label>
                <p className="text-xs text-muted-foreground mt-2">{uploadStatus}</p>
              </div>

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
