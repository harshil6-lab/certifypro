import { useCallback, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import type { CertificateTemplateMeta, GalleryCategory } from "@/components/certificates/types";
import { openAdobeTemplateEditor, initAdobeSDK, type AdobeExportedTemplate } from "@/services/adobeExpress";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type AdobeTemplateGalleryProps = {
  onSelectTemplate: (template: CertificateTemplateMeta) => void;
  selectedId?: string;
  category?: GalleryCategory;
};

const EDITABLE_FIELDS: CertificateTemplateMeta["editableFields"] = [
  "recipientName",
  "certificateTitle",
  "description",
  "issuerName",
  "authorityName",
  "issuedDate",
];

export function AdobeTemplateGallery({ onSelectTemplate, selectedId, category }: AdobeTemplateGalleryProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const effectiveCategory: GalleryCategory = category ?? "Academic";

  const placeholders = useMemo(() => Array.from({ length: 6 }, (_, i) => `adobe-placeholder-${i}`), []);

  const handleComplete = useCallback(
    (asset: AdobeExportedTemplate) => {
      const template: CertificateTemplateMeta = {
        id: `adobe-${Date.now()}`,
        category: effectiveCategory,
        title: asset.title || "My Adobe Certificate",
        styleType: "academicFormal",
        editableFields: EDITABLE_FIELDS,
        image_url: asset.imageUrl,
        isBuiltin: false,
      };
      onSelectTemplate(template);
    },
    [effectiveCategory, onSelectTemplate],
  );

  const onOpen = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      // Pre-init for better UX and explicit error state.
      await initAdobeSDK();

      await openAdobeTemplateEditor({
        category: effectiveCategory,
        onComplete: handleComplete,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load Adobe Express.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [effectiveCategory, handleComplete]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold text-foreground">Design with Adobe Express</h3>
          <p className="text-sm text-muted-foreground">
            Open Adobe Express to browse thousands of professional certificate templates, customize them, and import directly into CertifyPro.
          </p>
          <div className="pt-1">
            <Badge variant="outline">Category: {effectiveCategory}</Badge>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            className="gold-gradient text-accent-foreground"
            onClick={onOpen}
            disabled={loading}
          >
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading…
              </span>
            ) : (
              "Open Adobe Express"
            )}
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="grid grid-cols-3 gap-3">
        {placeholders.map((key) => {
          const isSelected = Boolean(selectedId && key === selectedId);
          return (
            <Card key={key} className={`card-shadow overflow-hidden ${isSelected ? "ring-2 ring-accent" : ""}`}>
              <CardContent className="p-4">
                <div className="h-[90px] rounded-md border border-border bg-muted/20 flex items-center justify-center text-sm text-muted-foreground">
                  Browse Adobe Templates →
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

