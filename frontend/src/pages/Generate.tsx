import { useState, useEffect } from "react";
import axios from "axios";
import {
  CheckCircle2,
  FileText,
  Users,
  Printer,
  Download,
  ArrowRight,
  ArrowLeft,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabaseClient";
import { LayoutPreview } from "@/components/LayoutPreview";

type LayoutConfig = {
  showStudentName: boolean;
  showQR: boolean;
  showID: boolean;
  placeholderField: string;
  placeholderX: number;
  placeholderY: number;
  qrX: number;
  qrY: number;
  idX: number;
  idY: number;
};

type WorkspaceTemplate = {
  template_id: string;
  file_url: string | null;
  layout_config: Partial<LayoutConfig> | null;
};

type WorkspaceTemplateSource = "workspace" | "local-cache" | "template-list" | "none";

type StudentRecord = {
  id: string;
  full_name?: string;
  email?: string;
  external_id?: string;
  certificate_id?: string;
};

const defaultLayoutConfig: LayoutConfig = {
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
};

const WORKSPACE_LAYOUT_KEY = "certifypro_layout_config";

const steps = [
  { id: 1, title: "Select Template", icon: FileText },
  { id: 2, title: "Choose Students", icon: Users },
  { id: 3, title: "Generate", icon: Printer },
];

const Generate = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  
  // State for data loading
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [workspaceTemplate, setWorkspaceTemplate] = useState<WorkspaceTemplate | null>(null);
  const [workspaceTemplateSource, setWorkspaceTemplateSource] = useState<WorkspaceTemplateSource>("none");
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [selectAllStudents, setSelectAllStudents] = useState(false);
  const [zipUrl, setZipUrl] = useState("");
  const [generatedCerts, setGeneratedCerts] = useState<any[]>([]);
  const [generateError, setGenerateError] = useState("");

  const selectedStudentRecords = students.filter((student) => selectedStudentIds.includes(student.id));
  const resolvedLayoutConfig: LayoutConfig = {
    ...defaultLayoutConfig,
    ...(workspaceTemplate?.layout_config ?? {}),
  };

  // Seed template from localStorage immediately (synchronous fallback)
  useEffect(() => {
    const templateId = localStorage.getItem("certifypro_selected_template");
    if (templateId) {
      setSelectedTemplate(templateId);
      setWorkspaceTemplateSource("local-cache");
    }
    try {
      const savedLayout = localStorage.getItem(WORKSPACE_LAYOUT_KEY);
      if (savedLayout) {
        setWorkspaceTemplate((prev) => ({
          template_id: prev?.template_id || templateId || "",
          file_url: prev?.file_url || null,
          layout_config: JSON.parse(savedLayout),
        }));
        setWorkspaceTemplateSource((prev) => (prev === "workspace" ? prev : "local-cache"));
      }
    } catch {
      // Ignore invalid cached layout JSON.
    }
  }, []);

  useEffect(() => {
    const hydrateSelectedTemplate = async () => {
      if (!selectedTemplate) {
        return;
      }
      if (workspaceTemplate?.template_id === selectedTemplate && workspaceTemplate?.file_url) {
        return;
      }

      try {
        const res = await axios.get("http://127.0.0.1:8000/api/templates");
        const templates = Array.isArray(res.data) ? res.data : [];
        const matched = templates.find((template: any) => template.id === selectedTemplate);
        if (!matched) {
          return;
        }

        setWorkspaceTemplate((prev) => ({
          template_id: selectedTemplate,
          file_url: matched.file_url || matched.image_url || prev?.file_url || null,
          layout_config: prev?.layout_config || null,
        }));
        setWorkspaceTemplateSource((prev) => (prev === "workspace" ? prev : "template-list"));
      } catch {
        // Keep local fallback state only.
      }
    };

    hydrateSelectedTemplate();
  }, [selectedTemplate, workspaceTemplate?.file_url, workspaceTemplate?.template_id]);

  // Load workspace template from backend (authoritative source)
  useEffect(() => {
    const loadWorkspaceTemplate = async () => {
      try {
        let authHeader = "";
        if (supabase) {
          const { data } = await supabase.auth.getSession();
          const token = data.session?.access_token;
          if (token) authHeader = `Bearer ${token}`;
        }
        const res = await axios.get("http://127.0.0.1:8000/api/workspace-template", {
          headers: authHeader ? { Authorization: authHeader } : {},
        });
        const templateId = res.data.template_id || res.data.template;
        if (templateId) {
          setSelectedTemplate(templateId);
          setWorkspaceTemplate({
            template_id: templateId,
            file_url: res.data.file_url ?? null,
            layout_config: res.data.layout_config ?? null,
          });
          setWorkspaceTemplateSource("workspace");
        }
      } catch {
        // API unavailable — localStorage value already applied above
      }
    };
    loadWorkspaceTemplate();
  }, []);

  // Load students on mount from dedicated ready-endpoint
  useEffect(() => {
    setLoadingData(true);
    axios
      .get("http://127.0.0.1:8000/api/students-ready")
      .then((res) => setStudents(Array.isArray(res.data) ? res.data : []))
      .catch(() => setStudents([]))
      .finally(() => setLoadingData(false));
  }, []);

  useEffect(() => {
    if (selectAllStudents) {
      setSelectedStudentIds(students.map((student) => student.id));
    }
  }, [students, selectAllStudents]);

  const handleSelectAllStudents = (checked: boolean) => {
    setSelectAllStudents(checked);
    setSelectedStudentIds(checked ? students.map((student) => student.id) : []);
  };

  const handleToggleStudent = (studentId: string, checked: boolean) => {
    setSelectedStudentIds((prev) => {
      const nextIds = checked
        ? Array.from(new Set([...prev, studentId]))
        : prev.filter((id) => id !== studentId);
      setSelectAllStudents(students.length > 0 && nextIds.length === students.length);
      return nextIds;
    });
  };

  const handleGenerate = async () => {
    if (!selectedTemplate) {
      setGenerateError("No template selected. Go to Templates → Workspace and save a layout first.");
      return;
    }
    if (selectedStudentIds.length === 0) {
      setGenerateError("Please select a student.");
      return;
    }
    if (selectedStudentRecords.length === 0) {
      setGenerateError("No students available for generation.");
      return;
    }

    setGenerating(true);
    setProgress(0);
    setZipUrl("");
    setGeneratedCerts([]);
    setGenerateError("");

    let authHeader = "";
    if (supabase) {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (token) authHeader = `Bearer ${token}`;
    }

    try {
      setProgress(30);
      const request = selectAllStudents
        ? axios.post(
            "http://127.0.0.1:8000/api/generate-certificates/all",
            { template_id: selectedTemplate },
            { headers: authHeader ? { Authorization: authHeader } : {} },
          )
        : axios.post(
            "http://127.0.0.1:8000/api/generate-certificates",
            {
              template_id: selectedTemplate,
              students: selectedStudentRecords.map((student) => ({
                student_id: student.id,
                student_name: student.full_name || "",
                email: student.email || "",
                external_id: student.external_id || student.certificate_id || "",
              })),
            },
          );

      const { data } = await request;
      setProgress(100);
      setGeneratedCerts(data.certificates ?? []);
      setZipUrl(data.zip_url ?? "");
    } catch (err: any) {
      console.error("Error generating certificate:", err);
      setGenerateError(
        err?.response?.data?.detail ??
        (err instanceof Error ? err.message : "Certificate generation failed."),
      );
    } finally {
      setGenerating(false);
    }
  };

  const showWorkspaceTemplateFallbackBanner =
    Boolean(selectedTemplate) && workspaceTemplateSource !== "workspace";

  const workspaceTemplateSourceBadge =
    workspaceTemplateSource === "workspace"
      ? { label: "Using workspace template", variant: "secondary" as const }
      : workspaceTemplateSource === "template-list"
        ? { label: "Using template-list fallback", variant: "outline" as const }
        : workspaceTemplateSource === "local-cache"
          ? { label: "Using cached fallback", variant: "outline" as const }
          : null;

  const workspaceTemplateFallbackMessage =
    workspaceTemplateSource === "template-list"
      ? "Preview is using template-list fallback data because no active workspace-template record was returned."
      : "Preview is using cached local layout/template data because no active workspace-template record was returned.";

  return (
    <div className="p-8 max-w-[1200px] mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">Generate Certificates</h1>
          <p className="text-muted-foreground mt-1">Follow the wizard to generate certificates</p>
        </div>
        <Badge variant="secondary" className="text-xs">Connected to backend</Badge>
      </div>

      {/* Step Indicator */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 py-6">
        {steps.map((step, i) => (
          <div key={step.id} className="flex items-center gap-3 flex-1 w-full sm:w-auto">
            <div className={`flex items-center gap-3 px-5 py-3 rounded-xl border-2 transition-all duration-300 flex-1 ${currentStep === step.id
              ? "border-accent bg-accent/5 shadow-md scale-[1.02]"
              : currentStep > step.id
                ? "border-success/30 bg-success/5 opacity-80"
                : "border-border/60 bg-card hover:border-border"
              }`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 shadow-sm ${currentStep > step.id
                ? "bg-success text-success-foreground"
                : currentStep === step.id
                  ? "gold-gradient text-accent-foreground"
                  : "bg-muted text-muted-foreground"
                }`}>
                {currentStep > step.id ? <CheckCircle2 className="w-5 h-5" /> : step.id}
              </div>
              <span className={`text-base font-semibold whitespace-nowrap ${currentStep === step.id ? "text-foreground" : "text-muted-foreground"}`}>
                {step.title}
              </span>
            </div>
            {i < steps.length - 1 && <ArrowRight className="hidden sm:block w-5 h-5 text-muted-foreground/30 shrink-0" />}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <Card className="card-shadow border-t-4 border-t-accent min-h-[400px]">
        <CardContent className="p-8">
          {currentStep === 1 && (
            <div className="space-y-6 max-w-2xl">
              <div>
                <h3 className="text-2xl font-heading font-bold text-foreground">Select Certificate Template</h3>
                <p className="text-base text-muted-foreground mt-2">
                  Template is pre-selected from your workspace.
                </p>
              </div>

              {selectedTemplate ? (
                <div className="space-y-4">
                  <div className="rounded-xl border border-accent/30 bg-accent/5 p-4 flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-accent shrink-0" />
                    <div>
                      <p className="font-medium text-foreground">Template loaded from workspace</p>
                      <p className="text-xs text-muted-foreground font-mono mt-0.5">{workspaceTemplate?.template_id || selectedTemplate}</p>
                    </div>
                    {workspaceTemplateSourceBadge && (
                      <Badge variant={workspaceTemplateSourceBadge.variant} className="ml-auto">
                        {workspaceTemplateSourceBadge.label}
                      </Badge>
                    )}
                  </div>

                  {showWorkspaceTemplateFallbackBanner && (
                    <div className="rounded-xl border border-amber-300/40 bg-amber-50/40 p-4 flex items-start gap-3 text-sm text-amber-800 dark:text-amber-300">
                      <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium">Fallback preview in use</p>
                          {workspaceTemplateSourceBadge && (
                            <Badge variant={workspaceTemplateSourceBadge.variant}>
                              {workspaceTemplateSourceBadge.label}
                            </Badge>
                          )}
                        </div>
                        <p>{workspaceTemplateFallbackMessage}</p>
                      </div>
                    </div>
                  )}

                  <div className="space-y-3">
                    <p className="text-sm font-medium text-foreground">Workspace Template Preview</p>
                    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px] items-start">
                      <LayoutPreview
                        templateUrl={workspaceTemplate?.file_url ?? null}
                        templateTitle="workspace template"
                        layoutConfig={resolvedLayoutConfig}
                      />
                      <div className="rounded-xl border border-border/60 bg-card p-4 space-y-4">
                        <div>
                          <p className="text-sm font-semibold text-foreground">Saved Layout Coordinates</p>
                          <p className="text-xs text-muted-foreground mt-1">Verify the workspace layout values before generating certificates.</p>
                        </div>

                        <div className="space-y-3 text-sm">
                          <div className="rounded-lg bg-muted/30 border border-border/50 p-3 space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-foreground">student_name</span>
                              <Badge variant={resolvedLayoutConfig.showStudentName ? "secondary" : "outline"}>
                                {resolvedLayoutConfig.showStudentName ? "Visible" : "Hidden"}
                              </Badge>
                            </div>
                            <p className="text-muted-foreground">Field: {resolvedLayoutConfig.placeholderField}</p>
                            <p className="text-muted-foreground">X: {resolvedLayoutConfig.placeholderX}%</p>
                            <p className="text-muted-foreground">Y: {resolvedLayoutConfig.placeholderY}%</p>
                          </div>

                          <div className="rounded-lg bg-muted/30 border border-border/50 p-3 space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-foreground">certificate_id</span>
                              <Badge variant={resolvedLayoutConfig.showID ? "secondary" : "outline"}>
                                {resolvedLayoutConfig.showID ? "Visible" : "Hidden"}
                              </Badge>
                            </div>
                            <p className="text-muted-foreground">X: {resolvedLayoutConfig.idX}%</p>
                            <p className="text-muted-foreground">Y: {resolvedLayoutConfig.idY}%</p>
                          </div>

                          <div className="rounded-lg bg-muted/30 border border-border/50 p-3 space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-foreground">qr</span>
                              <Badge variant={resolvedLayoutConfig.showQR ? "secondary" : "outline"}>
                                {resolvedLayoutConfig.showQR ? "Visible" : "Hidden"}
                              </Badge>
                            </div>
                            <p className="text-muted-foreground">X: {resolvedLayoutConfig.qrX}%</p>
                            <p className="text-muted-foreground">Y: {resolvedLayoutConfig.qrY}%</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="rounded-lg border border-border/60 bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
                      Preview includes placeholder overlays for <strong>student_name</strong>, <strong>certificate_id</strong>, and <strong>qr</strong> using the saved workspace layout.
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-amber-300/40 bg-amber-50/30 p-4 text-sm text-amber-700 dark:text-amber-400">
                  No template selected. Go to <strong>Templates → Workspace</strong>, select a gallery template,
                  then click <strong>Save Layout</strong>.
                </div>
              )}
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6 max-w-2xl">
              <div>
                <h3 className="text-2xl font-heading font-bold text-foreground">Choose Student</h3>
                <p className="text-base text-muted-foreground mt-2">
                  Select one student or generate certificates for the full imported list.
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3 rounded-lg border border-border/50 bg-muted/20 px-4 py-3">
                  <Checkbox
                    id="select-all-students"
                    checked={selectAllStudents}
                    onCheckedChange={(checked) => {
                      handleSelectAllStudents(checked === true);
                    }}
                  />
                  <label htmlFor="select-all-students" className="text-sm font-medium text-foreground cursor-pointer">
                    Select All Students
                  </label>
                  <Badge variant="outline" className="ml-auto">
                    {selectedStudentIds.length} selected
                  </Badge>
                </div>
                <label className="text-sm font-medium text-foreground px-1">Available Students</label>
                {loadingData ? (
                  <div className="flex items-center gap-2 p-3 text-sm text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Loading students...
                  </div>
                ) : (
                  <div className="max-h-[320px] overflow-y-auto rounded-xl border border-border/60 bg-background/70 divide-y divide-border/60">
                    {students.length > 0 ? (
                      students.map((student) => {
                        const isChecked = selectedStudentIds.includes(student.id);
                        return (
                          <label
                            key={student.id}
                            htmlFor={`student-${student.id}`}
                            className="flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-accent/5 transition-colors"
                          >
                            <Checkbox
                              id={`student-${student.id}`}
                              checked={isChecked}
                              onCheckedChange={(checked) => handleToggleStudent(student.id, checked === true)}
                            />
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-foreground truncate">
                                {student.full_name || student.email || `Student ${student.id.slice(0, 8)}`}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">
                                {student.email || student.external_id || student.id}
                              </p>
                            </div>
                            {student.external_id ? (
                              <Badge variant="outline" className="text-[10px] font-mono">
                                {student.external_id}
                              </Badge>
                            ) : null}
                          </label>
                        );
                      })
                    ) : (
                      <div className="p-4 text-sm text-muted-foreground">No students available</div>
                    )}
                  </div>
                )}
                <div className="flex items-center gap-2 px-1 text-sm text-muted-foreground bg-muted/30 p-3 rounded-lg border border-border/50">
                  <Users className="w-4 h-4 text-accent" />
                  <span>
                    {selectAllStudents
                      ? `All ${students.length} imported students will receive certificates with the chosen template.`
                      : `${selectedStudentIds.length || "No"} student${selectedStudentIds.length === 1 ? "" : "s"} selected for certificate generation.`}
                  </span>
                </div>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-8 max-w-2xl mx-auto py-4">
              <div className="text-center space-y-2">
                <h3 className="text-2xl font-heading font-bold text-foreground">Review & Generate</h3>
                <p className="text-base text-muted-foreground">
                  Ready to generate {selectedStudentRecords.length} certificate{selectedStudentRecords.length !== 1 ? "s" : ""}.
                </p>
              </div>

              {!generating && progress === 0 && (
                <div className="text-center py-6 space-y-8 border-2 border-dashed border-border/60 rounded-xl bg-muted/20">
                  <div className="w-24 h-24 mx-auto rounded-full bg-accent/10 flex items-center justify-center animate-pulse">
                    <Printer className="w-10 h-10 text-accent" />
                  </div>

                  <div className="space-y-1">
                    <p className="text-xl font-medium text-foreground">Ready to process</p>
                    <p className="text-base text-muted-foreground">Estimated time: {Math.max(5, selectedStudentRecords.length * 2)} seconds</p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 justify-center px-6">
                    <Button
                      variant="outline"
                      size="lg"
                      className="gap-2 h-12 text-base border-foreground/20 hover:bg-background shadow-sm"
                      onClick={() => setCurrentStep(2)}
                    >
                      <ArrowLeft className="w-5 h-5" /> Back
                    </Button>
                    <Button
                      onClick={handleGenerate}
                      disabled={!selectedTemplate || selectedStudentRecords.length === 0}
                      size="lg"
                      className="gold-gradient text-accent-foreground font-bold h-12 text-base px-8 shadow-md hover:shadow-lg hover:brightness-110 transition-all disabled:opacity-50"
                    >
                      <Printer className="w-5 h-5" /> Generate {selectedStudentRecords.length > 1 ? "Certificates" : "Certificate"}
                    </Button>
                  </div>
                </div>
              )}
              {(generating || progress > 0) && (
                <div className="space-y-6 p-6 border rounded-xl bg-card shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-base font-medium text-foreground">
                      {generating ? "Generating Certificate..." : "Generation Complete!"}
                    </span>
                    <span className="font-mono text-lg font-bold text-accent">{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-4 rounded-full bg-muted" />
                  {generating && (
                    <div className="flex items-center gap-3 text-base text-muted-foreground bg-muted/30 p-3 rounded-lg">
                      <Loader2 className="w-5 h-5 animate-spin text-accent" />
                      Processing certificate...
                    </div>
                  )}
                  {generateError && (
                    <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
                      {generateError}
                    </div>
                  )}
                  {progress === 100 && !generateError && (
                    <div className="flex flex-col gap-4">
                      <div className="flex items-center gap-3 text-base text-success font-medium bg-success/10 p-4 rounded-lg border border-success/20">
                        <CheckCircle2 className="w-6 h-6 text-success" />
                        {generatedCerts.length} certificate{generatedCerts.length !== 1 ? "s" : ""} generated successfully!
                      </div>
                      {zipUrl && (
                        <div className="flex justify-center pt-2">
                          <a href={zipUrl} download>
                            <Button className="gold-gradient text-accent-foreground font-bold shadow-md gap-2 h-12 px-8 text-base">
                              <Download className="w-5 h-5" /> Download ZIP
                            </Button>
                          </a>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between mt-8">
        <Button
          variant="outline"
          size="lg"
          onClick={() => setCurrentStep((s) => Math.max(1, s - 1))}
          disabled={currentStep === 1 || generating}
          className="hover:bg-accent/5 transition-colors h-12 px-6 text-base gap-2"
        >
          <ArrowLeft className="w-5 h-5" /> Previous Step
        </Button>
        {currentStep < 3 && (
          <Button
            size="lg"
            onClick={() => setCurrentStep((s) => Math.min(3, s + 1))}
            className="gap-2 gold-gradient text-accent-foreground hover:opacity-90 transition-opacity h-12 px-8 text-base shadow-md"
          >
            Next Step <ArrowRight className="w-5 h-5" />
          </Button>
        )}
      </div>
    </div>
  );
};

export default Generate;
