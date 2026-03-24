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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { getStudents } from "@/services/apiService";

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
  const [students, setStudents] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [selectedStudent, setSelectedStudent] = useState("");
  const [zipUrl, setZipUrl] = useState("");
  const [generatedCerts, setGeneratedCerts] = useState<any[]>([]);
  const [generateError, setGenerateError] = useState("");

  // Load students on mount; auto-select template from localStorage
  useEffect(() => {
    const loadData = async () => {
      setLoadingData(true);
      try {
        const studentData = await getStudents().catch(() => []);
        setStudents(Array.isArray(studentData) ? studentData : []);
      } catch (err) {
        console.error("Error loading data:", err);
      } finally {
        setLoadingData(false);
      }
    };

    const templateId = localStorage.getItem("certifypro_selected_template");
    if (templateId) setSelectedTemplate(templateId);

    loadData();
  }, []);

  const handleGenerate = async () => {
    if (!selectedTemplate) {
      setGenerateError("No template selected. Go to Templates → Workspace and save a layout first.");
      return;
    }
    if (!selectedStudent) {
      setGenerateError("Please select a student.");
      return;
    }

    setGenerating(true);
    setProgress(0);
    setZipUrl("");
    setGeneratedCerts([]);
    setGenerateError("");

    // Find full student object so we can send name + email
    const studentObj = students.find((s: any) => s.id === selectedStudent);
    const payload = {
      template_id: selectedTemplate,
      students: [
        {
          student_name: studentObj?.full_name || studentObj?.name || "",
          email: studentObj?.email || "",
          certificate_id: studentObj?.certificate_id || "",
        },
      ],
    };

    try {
      setProgress(30);
      const { data } = await axios.post(
        "http://127.0.0.1:8000/api/generate-certificates",
        payload,
      );
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
                <div className="rounded-xl border border-accent/30 bg-accent/5 p-4 flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-accent shrink-0" />
                  <div>
                    <p className="font-medium text-foreground">Template loaded from workspace</p>
                    <p className="text-xs text-muted-foreground font-mono mt-0.5">{selectedTemplate}</p>
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
                  Select the student who will receive this certificate.
                </p>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-medium text-foreground px-1">Available Students</label>
                {loadingData ? (
                  <div className="flex items-center gap-2 p-3 text-sm text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Loading students...
                  </div>
                ) : (
                  <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                    <SelectTrigger className="w-full h-12 text-base px-4 border-input/60 bg-background/50 focus:ring-2 focus:ring-accent/20">
                      <SelectValue placeholder="Select a student..." />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                      {students.length > 0 ? (
                        students.map((student: any) => (
                          <SelectItem key={student.id} value={student.id} className="py-3 text-base">
                            {student.full_name || student.email || `Student ${student.id.slice(0, 8)}`}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="none" disabled>
                          No students available
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                )}
                <div className="flex items-center gap-2 px-1 text-sm text-muted-foreground bg-muted/30 p-3 rounded-lg border border-border/50">
                  <Users className="w-4 h-4 text-accent" />
                  <span>The selected student will receive a certificate with the chosen template.</span>
                </div>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-8 max-w-2xl mx-auto py-4">
              <div className="text-center space-y-2">
                <h3 className="text-2xl font-heading font-bold text-foreground">Review & Generate</h3>
                <p className="text-base text-muted-foreground">Ready to generate certificate for the selected student.</p>
              </div>

              {!generating && progress === 0 && (
                <div className="text-center py-6 space-y-8 border-2 border-dashed border-border/60 rounded-xl bg-muted/20">
                  <div className="w-24 h-24 mx-auto rounded-full bg-accent/10 flex items-center justify-center animate-pulse">
                    <Printer className="w-10 h-10 text-accent" />
                  </div>

                  <div className="space-y-1">
                    <p className="text-xl font-medium text-foreground">Ready to process</p>
                    <p className="text-base text-muted-foreground">Estimated time: 5 seconds</p>
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
                      disabled={!selectedTemplate || !selectedStudent}
                      size="lg"
                      className="gold-gradient text-accent-foreground font-bold h-12 text-base px-8 shadow-md hover:shadow-lg hover:brightness-110 transition-all disabled:opacity-50"
                    >
                      <Printer className="w-5 h-5" /> Generate Certificate
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
