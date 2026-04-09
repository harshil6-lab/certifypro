import { useEffect, useState, type DragEvent } from "react";
import axios from "axios";
import { Sparkles, WandSparkles, Eye, Pencil, LayoutGrid, Upload, ArrowRight, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { CertificateEditorModal } from "@/components/certificates/CertificateEditorModal";
import {
  CertificateDraft,
  CertificateTemplateMeta,
} from "@/components/certificates/types";
import { LayoutPreview } from "@/components/LayoutPreview";
import { addSessionActivity } from "@/services/sessionActivity";
import { getTemplates } from "@/services/apiService";
import {
  defaultLayoutConfig,
  normalizeLayoutConfig,
} from "@/lib/layoutConfig";

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
  layout_config?: any;
};

const upcomingLibraryCertificates = [
  { title: "Academic Excellence", imageUrl: "/assets/CERT1.png.png" },
  { title: "Professional Achievement", imageUrl: "/assets/CERT2.png.png" },
  { title: "Internship Completion", imageUrl: "/assets/CERT3.png.png" },
  { title: "Training Programs", imageUrl: "/assets/CERT4.png.png" },
  { title: "Events & Summits", imageUrl: "/assets/CERT5.png.png" },
  { title: "Compliance & Skills", imageUrl: "/assets/CERT6.png.png" },
];

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
          is_custom: !Boolean(data.is_official),
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
      } catch (err: any) {
        setLayoutSaveStatus(err?.response?.data?.detail ?? "Failed to save layout");
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
      const cfg = (template as any).layout_config;
      if (cfg) {
        setLayoutConfig((prev) => ({ ...prev, ...normalizeLayoutConfig(cfg) }));
      }
    } catch {
      // ignore
    }
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
    } catch (err: any) {
      setUploadStatus(err?.response?.data?.detail ?? "Upload failed");
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
              <div className="relative overflow-hidden rounded-[28px] border border-[#b88a56]/20 bg-[linear-gradient(135deg,#fff9f1_0%,#f4e4ce_42%,#e3ccb2_100%)] px-6 py-12 shadow-[0_24px_60px_rgba(113,74,39,0.14)]">
                <div className="pointer-events-none absolute inset-0">
                  <div className="absolute inset-x-10 top-6 h-px bg-gradient-to-r from-transparent via-[#b88a56]/45 to-transparent animate-[galleryShimmer_6s_linear_infinite]" />
                  <div className="absolute inset-y-0 left-[-10%] w-32 bg-[radial-gradient(circle,rgba(184,138,86,0.14),transparent_70%)] blur-3xl animate-[galleryGlow_7.6s_ease-in-out_infinite]" />
                  <div className="absolute right-10 top-10 h-24 w-24 rounded-full bg-[radial-gradient(circle,rgba(255,248,236,0.9),rgba(226,197,160,0.18))] blur-2xl" />
                </div>

                <div className="relative z-10 flex min-h-[320px] items-center justify-center rounded-[22px] border border-white/55 bg-white/30 px-6 py-10 text-center backdrop-blur-md">
                  <h2 className="bg-gradient-to-r from-[#7a5330] via-[#b1824f] to-[#d8b38a] bg-clip-text text-5xl font-heading font-bold tracking-[0.12em] text-transparent drop-shadow-[0_10px_24px_rgba(122,83,48,0.12)] md:text-6xl animate-[galleryBounce_3.6s_ease-in-out_infinite]">
                    Coming Soon
                  </h2>
                </div>

                <style>{`
                  @keyframes galleryBounce {
                    0%, 100% { transform: translateY(0px) scale(1); }
                    50% { transform: translateY(-8px) scale(1.015); }
                  }

                  @keyframes galleryShimmer {
                    0% { transform: translateX(-35%); opacity: 0; }
                    22% { opacity: 0.45; }
                    50% { opacity: 0.8; }
                    100% { transform: translateX(135%); opacity: 0; }
                  }

                  @keyframes galleryGlow {
                    0%, 100% { transform: translate3d(0, 0, 0) scale(1); opacity: 0.35; }
                    50% { transform: translate3d(12%, -5%, 0) scale(1.18); opacity: 0.58; }
                  }
                `}</style>
              </div>

              <div className="rounded-[28px] border border-[#d9c0a2] bg-[linear-gradient(180deg,rgba(255,251,245,0.96)_0%,rgba(250,241,229,0.98)_100%)] p-5 shadow-[0_18px_40px_rgba(113,74,39,0.08)]">
                <div className="mb-5 flex items-end justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#b1824f]">Our upcoming Certificate Library</p>
                    <h3 className="mt-2 text-2xl font-heading font-semibold text-[#684422]">Preview the style of certificate collections customers will see</h3>
                  </div>

                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {upcomingLibraryCertificates.map((item) => (
                    <div
                      key={item.title}
                      className="group overflow-hidden rounded-[22px] border border-[#e0c6a8] bg-white shadow-[0_16px_36px_rgba(113,74,39,0.12)] transition-transform duration-500 hover:-translate-y-1"
                    >
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        className="w-full object-contain"
                        loading="lazy"
                      />
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

              <Card className="card-shadow">
  <CardHeader className="pb-2">
    <CardTitle className="text-sm font-heading flex items-center gap-2">
      <ExternalLink className="w-4 h-4 text-blue-500" />
      External Template Library
      <Badge variant="outline" className="ml-auto text-xs">External</Badge>
    </CardTitle>
  </CardHeader>
  <CardContent className="space-y-3">
    <p className="text-xs text-muted-foreground">
      Design your certificate in IMG.LY's free editor. Export as PNG or JPG, then upload it using the upload area below.
    </p>
    <Button
      variant="outline"
      className="w-full gap-2 border-blue-200 text-blue-700 hover:bg-blue-50 dark:border-blue-800 dark:text-blue-400 dark:hover:bg-blue-950"
      onClick={() => window.open("https://img.ly/design", "_blank", "noopener,noreferrer")}
    >
      <ExternalLink className="w-4 h-4" />
      Open IMG.LY Design Editor
    </Button>
  </CardContent>
</Card>

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
