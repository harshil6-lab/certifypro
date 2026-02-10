import { useState } from "react";
import {
  CheckCircle2,
  FileText,
  Users,
  Printer,
  QrCode,
  Eye,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const steps = [
  { id: 1, title: "Select Template", icon: FileText },
  { id: 2, title: "Choose Students", icon: Users },
  { id: 3, title: "Configure QR", icon: QrCode },
  { id: 4, title: "Generate", icon: Printer },
];

const Generate = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleGenerate = () => {
    setGenerating(true);
    setProgress(0);
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(interval);
          setGenerating(false);
          return 100;
        }
        return p + 2;
      });
    }, 80);
  };

  return (
    <div className="p-8 max-w-[1200px] mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-heading font-bold text-foreground">Generate Certificates</h1>
        <p className="text-muted-foreground mt-1">Follow the wizard to batch‑generate certificates</p>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center gap-2 py-4">
        {steps.map((step, i) => (
          <div key={step.id} className="flex items-center gap-2 flex-1">
            <div className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 transition-all flex-1 ${
              currentStep === step.id
                ? "border-accent bg-accent/5"
                : currentStep > step.id
                ? "border-success/30 bg-success/5"
                : "border-border"
            }`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                currentStep > step.id
                  ? "bg-success text-success-foreground"
                  : currentStep === step.id
                  ? "gold-gradient text-accent-foreground"
                  : "bg-muted text-muted-foreground"
              }`}>
                {currentStep > step.id ? <CheckCircle2 className="w-4 h-4" /> : step.id}
              </div>
              <span className="text-sm font-medium text-foreground whitespace-nowrap">{step.title}</span>
            </div>
            {i < steps.length - 1 && <ArrowRight className="w-4 h-4 text-muted-foreground/40 shrink-0" />}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <Card className="card-shadow">
        <CardContent className="p-6">
          {currentStep === 1 && (
            <div className="space-y-4">
              <h3 className="text-lg font-heading font-semibold">Select Certificate Template</h3>
              <Select>
                <SelectTrigger className="w-full max-w-md">
                  <SelectValue placeholder="Choose a template..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bsc">B.Sc. Computer Science – 2024</SelectItem>
                  <SelectItem value="mba">M.B.A. – 2024</SelectItem>
                  <SelectItem value="phd">Ph.D. Research – 2024</SelectItem>
                  <SelectItem value="workshop">Workshop Completion</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" className="gap-2">
                <Eye className="w-4 h-4" /> Preview Template
              </Button>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-4">
              <h3 className="text-lg font-heading font-semibold">Choose Student Batch</h3>
              <Select>
                <SelectTrigger className="w-full max-w-md">
                  <SelectValue placeholder="Select imported batch..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="batch1">Batch 2024-A – 250 students</SelectItem>
                  <SelectItem value="batch2">Batch 2024-B – 180 students</SelectItem>
                  <SelectItem value="batch3">Workshop Mar 2024 – 45 students</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">250 students will receive certificates</p>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-4">
              <h3 className="text-lg font-heading font-semibold">QR Code Configuration</h3>
              <div className="grid grid-cols-2 gap-4 max-w-md">
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">QR Size</label>
                  <Select defaultValue="medium">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="small">Small (1cm)</SelectItem>
                      <SelectItem value="medium">Medium (2cm)</SelectItem>
                      <SelectItem value="large">Large (3cm)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">Position</label>
                  <Select defaultValue="bottom-right">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bottom-right">Bottom Right</SelectItem>
                      <SelectItem value="bottom-left">Bottom Left</SelectItem>
                      <SelectItem value="bottom-center">Bottom Center</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                QR codes will link to the public verification page for each certificate.
              </p>
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-6">
              <h3 className="text-lg font-heading font-semibold">Generate Certificates</h3>
              {!generating && progress === 0 && (
                <div className="text-center py-8 space-y-4">
                  <div className="w-16 h-16 mx-auto rounded-xl bg-accent/10 flex items-center justify-center">
                    <Printer className="w-8 h-8 text-accent" />
                  </div>
                  <p className="text-muted-foreground">Ready to generate <strong>250 certificates</strong></p>
                  <div className="flex gap-3 justify-center">
                    <Button variant="outline" className="gap-2">
                      <Eye className="w-4 h-4" /> Preview Sample
                    </Button>
                    <Button onClick={handleGenerate} className="gold-gradient text-accent-foreground hover:opacity-90 gap-2">
                      <Printer className="w-4 h-4" /> Start Generation
                    </Button>
                  </div>
                </div>
              )}
              {(generating || progress > 0) && (
                <div className="space-y-4 max-w-md mx-auto">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {generating ? "Generating..." : "Complete!"}
                    </span>
                    <span className="font-mono font-medium text-foreground">{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-3" />
                  {generating && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Processing certificate {Math.floor(progress * 2.5)} of 250
                    </div>
                  )}
                  {progress === 100 && (
                    <div className="flex items-center gap-2 text-sm text-success">
                      <CheckCircle2 className="w-4 h-4" />
                      All 250 certificates generated successfully!
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => setCurrentStep((s) => Math.max(1, s - 1))}
          disabled={currentStep === 1}
        >
          Back
        </Button>
        {currentStep < 4 && (
          <Button
            onClick={() => setCurrentStep((s) => Math.min(4, s + 1))}
            className="gap-2"
          >
            Next <ArrowRight className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
};

export default Generate;
