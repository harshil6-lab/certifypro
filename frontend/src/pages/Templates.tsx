import { useEffect, useMemo, useState, type DragEvent } from "react";
import { Upload, QrCode, Info, Move, Loader2, Sparkles, Star, WandSparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { mockTemplateApi } from "@/lib/mockTemplateApi";
import { TemplateCard } from "@/components/templates/TemplateCard";
import { TemplatePreviewModal } from "@/components/templates/TemplatePreviewModal";
import type { TemplateCategory, TemplateItem } from "@/types/template";

const categories: Array<"All" | TemplateCategory> = ["All", "Academic", "Corporate", "Event", "Compliance", "Training"];

const Templates = () => {
  const [templates, setTemplates] = useState<TemplateItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<"All" | TemplateCategory>("All");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [previewTemplate, setPreviewTemplate] = useState<TemplateItem | null>(null);
  const [loading, setLoading] = useState(true);

  const [dragActive, setDragActive] = useState(false);
  const [uploadedTemplateName, setUploadedTemplateName] = useState("sample-certificate-layout.pdf");
  const [placeholderField, setPlaceholderField] = useState("STUDENT_NAME");
  const [placeholderX, setPlaceholderX] = useState(40);
  const [placeholderY, setPlaceholderY] = useState(36);
  const [qrX, setQrX] = useState(82);
  const [qrY, setQrY] = useState(76);

  useEffect(() => {
    const loadTemplates = async () => {
      setLoading(true);
      const result = await mockTemplateApi.getTemplates();
      setTemplates(result);
      setSelectedTemplateId(result[0]?.id ?? "");
      setLoading(false);
    };

    loadTemplates();
  }, []);

  const filteredTemplates = useMemo(() => {
    if (selectedCategory === "All") {
      return templates;
    }
    return templates.filter((template) => template.category === selectedCategory);
  }, [selectedCategory, templates]);

  const selectedTemplate = useMemo(
    () => templates.find((template) => template.id === selectedTemplateId) ?? null,
    [selectedTemplateId, templates],
  );

  const handleFavorite = async (templateId: string) => {
    const updated = await mockTemplateApi.toggleFavorite(templateId);
    setTemplates(updated);
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
          <p className="text-muted-foreground mt-1">Browse, preview, favorite, and configure certificate templates with frontend-only mock flows</p>
        </div>
        <Badge variant="secondary" className="text-xs">Mock API Mode • Backend-ready</Badge>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        <div className="xl:col-span-3 space-y-4">
          <Card className="card-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-heading flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-accent" />
                Certificate Template Gallery
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <Button
                    key={category}
                    variant={selectedCategory === category ? "default" : "outline"}
                    size="sm"
                    className={selectedCategory === category ? "gold-gradient text-accent-foreground" : ""}
                    onClick={() => setSelectedCategory(category)}
                  >
                    {category}
                  </Button>
                ))}
              </div>

              {loading ? (
                <div className="h-48 rounded-lg border border-dashed border-border flex items-center justify-center text-muted-foreground text-sm">
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Loading template library...
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredTemplates.map((template) => (
                    <TemplateCard
                      key={template.id}
                      template={template}
                      selectedId={selectedTemplateId}
                      onPreview={setPreviewTemplate}
                      onSelect={(selected) => setSelectedTemplateId(selected.id)}
                      onFavorite={handleFavorite}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="xl:col-span-2 space-y-4">
          <Card className="card-shadow overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-heading">Template Upload & Live Preview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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

                  <div className="absolute" style={{ left: `${placeholderX}%`, top: `${placeholderY}%`, transform: "translate(-50%, -50%)" }}>
                    <span className="text-[10px] px-2 py-1 rounded bg-primary text-primary-foreground shadow">
                      {`{{${placeholderField || "FIELD"}}}`}
                    </span>
                  </div>

                  <div
                    className="absolute w-14 h-14 rounded-md border-2 border-dashed border-accent bg-accent/10 flex items-center justify-center"
                    style={{ left: `${qrX}%`, top: `${qrY}%`, transform: "translate(-50%, -50%)" }}
                  >
                    <QrCode className="w-7 h-7 text-accent" />
                    <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-accent flex items-center justify-center">
                      <Move className="w-3 h-3 text-accent-foreground" />
                    </span>
                  </div>

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
                <Button variant="outline" className="flex-1 gap-2">
                  <Star className="w-4 h-4" /> Save as Favorite
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
                    <li>Template library uses modular mock API placeholders.</li>
                    <li>Category filtering, favorites, and select actions are frontend-only.</li>
                    <li>Drag-drop, placeholder and QR positioning are UI simulation only.</li>
                    <li>Ready for future backend connection without routing changes.</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <TemplatePreviewModal
        open={Boolean(previewTemplate)}
        template={previewTemplate}
        onOpenChange={(open) => {
          if (!open) {
            setPreviewTemplate(null);
          }
        }}
      />
    </div>
  );
};

export default Templates;
