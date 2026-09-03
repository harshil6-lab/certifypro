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
} from "lucide-react";
import UpgradeModal from "@/components/UpgradeModal";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabaseClient";
import { LayoutPreview } from "@/components/LayoutPreview";
import { addSessionActivity } from "@/services/sessionActivity";
import {
  defaultLayoutConfig,
  normalizeLayoutConfig,
  type LayoutConfig,
} from "@/lib/layoutConfig";
import { getTemplates, API_BASE } from "@/services/apiService";
import { Link } from "react-router-dom";

type WorkspaceTemplate = {
  template_id: string;
  file_url: string | null;
  layout_config: Partial<LayoutConfig> | null;
};

type WorkspaceTemplateSource = "workspace" | "gallery" | "none";

type StudentRecord = {
  id: string;
  full_name?: string;
  email?: string;
  external_id?: string;
  certificate_id?: string;
};

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
  const [generatedCerts, setGeneratedCerts] = useState<Array<Record<string, unknown>>>([]);
  const [generateError, setGenerateError] = useState("");
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [creditInfo, setCreditInfo] = useState<{ used?: number; limit?: number }>({});

  const selectedStudentRecords = students.filter((student) => selectedStudentIds.includes(student.id));
  const resolvedLayoutConfig: LayoutConfig = workspaceTemplate?.layout_config
    ? normalizeLayoutConfig(workspaceTemplate.layout_config)
    : normalizeLayoutConfig(defaultLayoutConfig);

  useEffect(() => {
    const loadTemplateContext = async () => {
      try {
        let authHeader = "";
        if (supabase) {
          const { data } = await supabase.auth.getSession();
          const token = data.session?.access_token;
          if (token) authHeader = `Bearer ${token}`;
        }

        const workspace = await axios.get(`${API_BASE}/api/workspace-template`, {
          headers: authHeader ? { Authorization: authHeader } : {},
        });

        if (workspace.data?.template_id) {
          setSelectedTemplate(workspace.data.template_id);
          setWorkspaceTemplate({
            template_id: workspace.data.template_id,
            file_url: workspace.data.file_url ?? workspace.data.template_url ?? null,
            layout_config: workspace.data.layout_config ?? null,
          });
          setWorkspaceTemplateSource("workspace");
          setCurrentStep(2);
          return;
        }

        // COMING SOON - gallery disabled
        // const fallbackTemplates = await getTemplates({ official: true });
        // const fallback = Array.isArray(fallbackTemplates) ? fallbackTemplates[0] : null;
        // if (!fallback?.id) {
        //   return;
        // }
        // setSelectedTemplate(fallback.id);
        // setWorkspaceTemplate({
        //   template_id: fallback.id,
        //   file_url: fallback.file_url ?? fallback.image_url ?? null,
        //   layout_config: fallback.layout_config ?? null,
        // });
        // setWorkspaceTemplateSource("gallery");
        // setCurrentStep(2);
        setWorkspaceTemplateSource("none");
        setCurrentStep(2);
      } catch {
        setWorkspaceTemplateSource("none");
      }
    };

    void loadTemplateContext();
  }, []);

  // Load students on mount from dedicated ready-endpoint
  useEffect(() => {
    const loadStudents = async () => {
      setLoadingData(true);
      try {
        let authHeader = "";
        if (supabase) {
          const { data } = await supabase.auth.getSession();
          const token = data.session?.access_token;
          if (token) authHeader = `Bearer ${token}`;
        }

        const res = await axios.get(`${API_BASE}/api/students-ready`, {
          headers: authHeader ? { Authorization: authHeader } : {},
        });
        setStudents(Array.isArray(res.data) ? res.data : []);
      } catch {
        setStudents([]);
      } finally {
        setLoadingData(false);
      }
    };

    void loadStudents();
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
      setGenerateError("Please select or upload a template.");
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
      // STEP 1: Start the job (returns immediately with a job_id)
      setProgress(5);
      const startRes = selectAllStudents
        ? await axios.post(`${API_BASE}/api/generate-certificates/all`,
            { template_id: selectedTemplate },
            { headers: authHeader ? { Authorization: authHeader } : {}, timeout: 30000 }
          )
        : await axios.post(`${API_BASE}/api/generate-certificates/start`,
            {
              template_id: selectedTemplate,
              students: selectedStudentRecords.map(s => ({
                student_id: s.id,
                student_name: s.full_name || "",
                email: s.email || "",
                external_id: s.external_id || s.certificate_id || "",
              }))
            },
            { headers: authHeader ? { Authorization: authHeader } : {}, timeout: 30000 }
          );

      const jobId = startRes.data.job_id;

      // STEP 2: Poll for status every 2 seconds
      const pollInterval = 2000;
      const maxWait = 15 * 60 * 1000; // 15 minutes
      const startTime = Date.now();

      const result = await new Promise<{ certificates: Array<Record<string, unknown>>; zip_url: string }>((resolve, reject) => {
        const poll = async () => {
          if (Date.now() - startTime > maxWait) {
            reject(new Error("Generation timed out after 15 minutes."));
            return;
          }
          try {
            const statusRes = await axios.get(`${API_BASE}/api/jobs/${jobId}`, {
              headers: authHeader ? { Authorization: authHeader } : {},
              timeout: 10000,
            });
            const job = statusRes.data;

            // Update progress bar
            if (job.total > 0) {
              const pct = Math.min(95, Math.round((job.progress / job.total) * 90) + 5);
              setProgress(pct);
            }

            if (job.status === "done") {
              resolve({ certificates: job.certificates, zip_url: job.zip_url });
            } else if (job.status === "error") {
              reject(new Error(job.error || "Generation failed"));
            } else {
              setTimeout(poll, pollInterval);
            }
          } catch (e) {
            reject(e);
          }
        };
        setTimeout(poll, pollInterval);
      });

      setProgress(100);
      setGeneratedCerts(result.certificates ?? []);
      setZipUrl(result.zip_url ?? "");
      addSessionActivity(
        "certificates_generated",
        `${(result.certificates ?? []).length} certificate(s) generated`,
        {
          count: (result.certificates ?? []).length,
          templateId: selectedTemplate,
        },
      );
    } catch (err: unknown) {
      console.error("Error generating certificate:", err);
      if (axios.isAxiosError(err) && err.code === "ECONNABORTED") {
        setGenerateError(
          "Request timed out. Your certificates are still being processed — " +
          "check the Registry page in a few minutes to download them."
        );
        return;
      }

      const axiosError = err as { response?: { status?: number; data?: { detail?: unknown } } };
      const status = axiosError?.response?.status;
      const detail = axiosError?.response?.data?.detail;

      // Check for 403 credits_exhausted response
      if (status === 403 && typeof detail === "object" && detail !== null && "error" in detail && detail.error === "credits_exhausted") {
        const detailObj = detail as { credits_used?: unknown; credits_limit?: unknown };
        const creditsUsed = typeof detailObj.credits_used === "number" ? detailObj.credits_used : undefined;
        const creditsLimit = typeof detailObj.credits_limit === "number" ? detailObj.credits_limit : undefined;
        setCreditInfo({
          used: creditsUsed,
          limit: creditsLimit,
        });
        setUpgradeModalOpen(true);
        setGenerating(false);
        return;
      }

      const errorMessage =
        typeof detail === "string"
          ? detail
          : err instanceof Error
            ? err.message
            : "Certificate generation failed.";
      setGenerateError(errorMessage);
    } finally {
      setGenerating(false);
    }
  };

  const workspaceTemplateSourceBadge =
    workspaceTemplateSource === "workspace"
      ? { label: "Using workspace template", variant: "outline" as const }
      : workspaceTemplateSource === "gallery"
      ? { label: "Using gallery fallback", variant: "secondary" as const }
      : null;

  return (
    <PageContainer className="space-y-6 animate-fade-in">
      <PageHeader
        title="Generate certificates"
        description="Follow the guided steps to create and download a batch of certificates."
      />

      {/* Step Indicator */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        {steps.map((step, i) => (
          <div key={step.id} className="flex w-full items-center gap-3 sm:w-auto sm:flex-1">
            <div className={`flex flex-1 items-center gap-3 rounded-lg border px-4 py-3 ${currentStep === step.id
              ? "border-accent bg-accent/5"
              : currentStep > step.id
                ? "border-success/40 bg-success/5"
                : "border-border bg-card"
              }`}>
              <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${currentStep > step.id
                ? "bg-success text-success-foreground"
                : currentStep === step.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
                }`}>
                {currentStep > step.id ? <CheckCircle2 className="h-4 w-4" /> : step.id}
              </div>
              <span className={`whitespace-nowrap text-sm font-semibold ${currentStep === step.id ? "text-foreground" : "text-muted-foreground"}`}>
                {step.title}
              </span>
            </div>
            {i < steps.length - 1 && <ArrowRight className="hidden h-5 w-5 shrink-0 text-muted-foreground/30 sm:block" />}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <Card className="min-h-[400px]">
        <CardContent className="p-8">
          {currentStep === 1 && (
            <div className="space-y-6 max-w-2xl">
              <div>
                <h3 className="text-xl font-semibold text-foreground">Select certificate template</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Your certificate template is pre-selected from your workspace.
                </p>
              </div>

{selectedTemplate ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/40 p-4">
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-success" />
                    <div>
                      <p className="font-medium text-foreground">Template loaded from workspace</p>
                      <p className="mt-0.5 font-mono text-xs text-muted-foreground">{workspaceTemplate?.template_id || selectedTemplate}</p>
                    </div>
                    {workspaceTemplateSourceBadge && (
                      <Badge variant={workspaceTemplateSourceBadge.variant} className="ml-auto">
                        {workspaceTemplateSourceBadge.label}
                      </Badge>
                    )}
                  </div>

                  <div className="space-y-3">
                    <p className="text-sm font-medium text-foreground">Workspace Template Preview</p>
                    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px] items-start">
                      <LayoutPreview
                        templateUrl={workspaceTemplate?.file_url ?? null}
                        templateTitle="workspace template"
                        layoutConfig={resolvedLayoutConfig}
                      />
                      <div className="rounded-lg border border-border bg-card p-4 space-y-4">
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
                    <div className="rounded-lg border border-border bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
                      Preview includes placeholder overlays for <strong>student_name</strong>, <strong>certificate_id</strong>, and <strong>qr</strong> using the saved workspace layout.
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-lg border border-warning/40 bg-warning/10 p-4 text-sm text-warning">
                  Please select or upload a template to continue.
                </div>
              )}
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6 max-w-2xl">
              <div>
                <h3 className="text-xl font-semibold text-foreground">Choose students</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Select one student or generate certificates for the full imported list.
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/20 px-4 py-3">
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
                  <div className="max-h-[320px] overflow-y-auto rounded-lg border border-border bg-background/70 divide-y divide-border/60">
                    {students.length > 0 ? (
                      students.map((student) => {
                        const isChecked = selectedStudentIds.includes(student.id);
                        return (
                          <label
                            key={student.id}
                            htmlFor={`student-${student.id}`}
                            className="flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-muted transition-colors"
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
                <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 p-3 text-sm text-muted-foreground">
                  <Users className="h-4 w-4 shrink-0 text-muted-foreground" />
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
              <div className="space-y-2 text-center">
                <h3 className="text-xl font-semibold text-foreground">Review &amp; generate</h3>
                <p className="text-sm text-muted-foreground">
                  Ready to generate {selectedStudentRecords.length} certificate{selectedStudentRecords.length !== 1 ? "s" : ""}.
                </p>
              </div>

              {!generating && progress === 0 && (
                <div className="space-y-8 rounded-lg border border-dashed border-border bg-muted/20 py-8 text-center">
                  <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-muted text-muted-foreground">
                    <Printer className="h-9 w-9" />
                  </div>

                  <div className="space-y-1">
                    <p className="text-lg font-semibold text-foreground">Ready to process</p>
                    <p className="text-sm text-muted-foreground">Estimated time: {Math.max(5, selectedStudentRecords.length * 2)} seconds</p>
                  </div>

                  <div className="flex flex-col justify-center gap-3 px-6 sm:flex-row">
                    <Button
                      variant="outline"
                      size="lg"
                      className="gap-2"
                      onClick={() => setCurrentStep(2)}
                    >
                      <ArrowLeft className="h-5 w-5" /> Back
                    </Button>
                    <Button
                      onClick={handleGenerate}
                      disabled={!selectedTemplate || selectedStudentRecords.length === 0}
                      size="lg"
                      className="gap-2"
                    >
                      <Printer className="h-5 w-5" /> Generate {selectedStudentRecords.length > 1 ? "certificates" : "certificate"}
                    </Button>
                  </div>
                </div>
              )}
              {(generating || progress > 0) && (
                <div className="space-y-6 rounded-lg border border-border bg-card p-6">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">
                      {generating ? "Generating certificates…" : "Generation complete"}
                    </span>
                    <span className="font-mono text-lg font-semibold text-foreground">{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-3 rounded-full bg-muted" />
                  {generating && (
                    <div className="flex items-center gap-3 rounded-lg bg-muted/40 p-3 text-sm text-muted-foreground">
                      <Loader2 className="h-5 w-5 animate-spin text-accent" />
                      Processing certificate…
                    </div>
                  )}
                  {generateError && (
                    <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
                      {generateError}
                    </div>
                  )}
                  {progress === 100 && !generateError && (
                    <div className="flex flex-col gap-4">
                      <div className="flex items-center gap-3 rounded-lg border border-success/20 bg-success/10 p-4 text-sm font-medium text-success">
                        <CheckCircle2 className="h-5 w-5 shrink-0" />
                        {generatedCerts.length} certificate{generatedCerts.length !== 1 ? "s" : ""} generated successfully.
                      </div>
                      {zipUrl && (
                        <div className="flex justify-center pt-2">
                          <a href={zipUrl} download>
                            <Button size="lg" className="gap-2">
                              <Download className="h-5 w-5" /> Download ZIP
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
      <div className="mt-2 flex justify-between">
        <Button
          variant="outline"
          size="lg"
          onClick={() => setCurrentStep((s) => Math.max(1, s - 1))}
          disabled={currentStep === 1 || generating}
          className="gap-2"
        >
          <ArrowLeft className="h-5 w-5" /> Previous
        </Button>
        {currentStep < 3 && (
          <Button
            size="lg"
            onClick={() => setCurrentStep((s) => Math.min(3, s + 1))}
            className="gap-2"
          >
            Next <ArrowRight className="h-5 w-5" />
          </Button>
        )}
      </div>

      <UpgradeModal
        open={upgradeModalOpen}
        onOpenChange={setUpgradeModalOpen}
        creditsUsed={creditInfo.used}
        creditsLimit={creditInfo.limit}
      />
    </PageContainer>
  );
};

export default Generate;
