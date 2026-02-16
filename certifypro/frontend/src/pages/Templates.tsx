import { useState } from "react";
import { Upload, Eye, QrCode, FileImage, Info, X, Move } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const Templates = () => {
  const [hasTemplate, setHasTemplate] = useState(true);

  return (
    <div className="p-8 max-w-[1200px] mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-heading font-bold text-foreground">Template Workspace</h1>
        <p className="text-muted-foreground mt-1">Upload and configure your certificate template</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Preview area */}
        <div className="lg:col-span-2">
          <Card className="card-shadow overflow-hidden">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-base font-heading">Certificate Preview</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="gap-2">
                  <Eye className="w-4 h-4" /> Preview
                </Button>
                <Button variant="outline" size="sm" className="gap-2">
                  <QrCode className="w-4 h-4" /> Place QR
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="aspect-[1.414/1] bg-muted/50 rounded-lg border-2 border-dashed border-border relative flex items-center justify-center seal-pattern">
                {hasTemplate ? (
                  <div className="w-full h-full p-8 flex flex-col items-center justify-center">
                    {/* Simulated certificate preview */}
                    <div className="w-full max-w-lg bg-card rounded-lg p-8 card-shadow-lg border text-center space-y-4">
                      <div className="w-16 h-16 mx-auto rounded-full gold-gradient flex items-center justify-center">
                        <FileImage className="w-8 h-8 text-accent-foreground" />
                      </div>
                      <h3 className="text-xl font-heading font-bold text-foreground">Certificate of Achievement</h3>
                      <p className="text-sm text-muted-foreground">This is to certify that</p>
                      <p className="text-lg font-heading font-semibold text-foreground">{"{{STUDENT_NAME}}"}</p>
                      <p className="text-sm text-muted-foreground">
                        has successfully completed the requirements for
                      </p>
                      <p className="font-medium text-foreground">{"{{COURSE_NAME}}"}</p>
                      <div className="pt-4 flex items-center justify-between">
                        <div className="text-left">
                          <p className="text-xs text-muted-foreground">Date</p>
                          <p className="text-sm font-medium">{"{{DATE}}"}</p>
                        </div>
                        {/* QR overlay indicator */}
                        <div className="w-16 h-16 border-2 border-dashed border-accent rounded-lg flex items-center justify-center bg-accent/5 relative group cursor-move">
                          <QrCode className="w-8 h-8 text-accent/60" />
                          <div className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-accent flex items-center justify-center">
                            <Move className="w-3 h-3 text-accent-foreground" />
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">Signature</p>
                          <p className="text-sm font-medium italic">Registrar</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center space-y-3">
                    <Upload className="w-12 h-12 text-muted-foreground/40 mx-auto" />
                    <p className="text-muted-foreground text-sm">Drop your template here or click to upload</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Controls */}
        <div className="space-y-4">
          <Card className="card-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-heading">Upload Template</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-accent/50 transition-colors cursor-pointer">
                <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm font-medium text-foreground">Click to upload</p>
                <p className="text-xs text-muted-foreground mt-1">PDF, PNG, or DOCX</p>
              </div>
              <Button className="w-full gold-gradient text-accent-foreground hover:opacity-90">
                Upload Template
              </Button>
              <Button variant="outline" className="w-full">
                Replace Current
              </Button>
            </CardContent>
          </Card>

          <Card className="card-shadow">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Info className="w-4 h-4 text-accent mt-0.5 shrink-0" />
                <div className="text-xs text-muted-foreground space-y-1">
                  <p className="font-medium text-foreground">Template Guidelines</p>
                  <ul className="space-y-1 list-disc list-inside">
                    <li>Recommended size: A4 (210×297mm)</li>
                    <li>Resolution: 300 DPI minimum</li>
                    <li>Use placeholders: {"{{STUDENT_NAME}}"}, {"{{COURSE}}"}, {"{{DATE}}"}</li>
                    <li>Leave space for QR code placement</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Templates;
