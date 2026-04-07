import { useEffect, useState, type DragEvent } from "react";
import axios from "axios";
import { Sparkles, WandSparkles, Upload, ArrowRight, Loader2 } from "lucide-react";
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
  TemplateLayoutConfig,
} from "@/components/certificates/types";
import { LayoutPreview } from "@/components/LayoutPreview";
import { addSessionActivity } from "@/services/sessionActivity";
import { getTemplates } from "@/services/apiService";
import {
  defaultLayoutConfig,
  normalizeLayoutConfig,
} from "@/lib/layoutConfig";
import { openAdobeTemplateEditor } from "@/services/adobeExpress";

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
  const [isOpeningAdobe, setIsOpeningAdobe] = useState(false);
  const [adobeError, setAdobeError] = useState<string | null>(null);

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

        const { data } = await axios.get("/api/workspace-template", {
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
          "/api/save-layout",
          {
            template_id: workspaceTemplate.id,
            layout_config: normalizedLayout,
            custom_template_url: workspaceTemplate.is_custom ? workspaceTemplate.file_url : null,
            is_builtin: isGallerySelected && !workspaceTemplate.is_custom,
            builtin_style: isGallerySelected && !workspaceTemplate.is_custom ? selectedBuiltinStyleType : null,
            title: workspaceTemplate.title ?? null,
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

  const openAdobeDesigner = async () => {
    setAdobeError(null);
    setIsOpeningAdobe(true);
    try {
      await openAdobeTemplateEditor(async (imageUrl: string, title: string) => {
        try {
          const { data: sessionData } = await supabase.auth.getSession();
          let token = sessionData.session?.access_token;
          if (!token) {
            await supabase.auth.refreshSession();
            const { data: refreshed } = await supabase.auth.getSession();
            token = refreshed.session?.access_token;
          }
          if (!token) {
            throw new Error("You are not signed in. Please sign in again and retry.");
          }

          const { data } = await axios.post(
            "/api/templates/from-url",
            { image_url: imageUrl, title, category: "Custom" },
            { withCredentials: true, headers: { Authorization: `Bearer ${token}` } },
          );

          const nextTemplate = {
            id: data.template_id,
            file_url: data.file_url ?? data.preview_url ?? imageUrl ?? null,
            image_url: data.preview_url ?? data.file_url ?? imageUrl ?? null,
            title: data.template?.title ?? title ?? "Adobe Certificate",
            is_custom: true,
          };

          setWorkspaceTemplate(nextTemplate);
          setSelectedTemplateId(nextTemplate.id);
          setIsGallerySelected(false);
          setUploadStatus("Adobe template imported and selected");
          addSessionActivity("template_uploaded", `${nextTemplate.title} imported`, { templateId: nextTemplate.id });
        } catch (err: unknown) {
          if (err instanceof Error && err.message.includes("not signed in")) {
            setUploadStatus(err.message);
          } else {
            setUploadStatus("Failed to import Adobe template");
          }
        }
      });
    } catch (err: unknown) {
      setAdobeError(err instanceof Error ? err.message : "Failed to open Adobe Express.");
    } finally {
      setIsOpeningAdobe(false);
    }
  };

  const uploadTemplate = async (file: File) => {
    setUploadStatus("Uploading template...");
    try {
      const formData = new FormData();
      formData.append("file", file);

      const { data: sessionData } = await supabase.auth.getSession();
      let token = sessionData.session?.access_token;
      if (!token) {
        await supabase.auth.refreshSession();
        const { data: refreshed } = await supabase.auth.getSession();
        token = refreshed.session?.access_token;
      }
      if (!token) {
        throw new Error("You are not signed in. Please sign in again and retry.");
      }
      console.log("Upload token:", token);

      const { data } = await axios.post("/api/templates/upload", formData, {
        withCredentials: true,
        headers: {
          Authorization: `Bearer ${token}`,
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
      if (err instanceof Error && err.message.includes("not signed in")) {
        setUploadStatus(err.message);
        return;
      }
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

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="xl:col-span-1 space-y-4">
          <Card className="card-shadow h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-heading flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-accent" />
                Adobe Express Template Library
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center gap-6 py-12 text-center">
              <p className="text-sm text-muted-foreground max-w-lg">
                Design your certificate using Adobe Express — thousands of professional templates, fully customizable.
              </p>

              <div className="flex flex-col items-center gap-3">
                <Button
                  size="lg"
                  className="gold-gradient text-accent-foreground gap-2 px-8"
                  onClick={openAdobeDesigner}
                  disabled={isOpeningAdobe}
                >
                  {isOpeningAdobe ? <Loader2 className="w-4 h-4 animate-spin" /> : <WandSparkles className="w-4 h-4" />}
                  Open Adobe Express Designer
                </Button>
                <p className="text-xs text-muted-foreground">
                  Your designed template will be automatically imported and selected as your workspace template.
                </p>
                {adobeError ? <p className="text-xs text-destructive">{adobeError}</p> : null}
                {isOpeningAdobe ? <p className="text-xs text-muted-foreground">Opening Adobe Express...</p> : null}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="xl:col-span-1 space-y-4">
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
