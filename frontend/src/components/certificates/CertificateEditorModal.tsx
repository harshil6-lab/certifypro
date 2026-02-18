import { ChangeEvent, Component, ReactNode, useEffect, useState } from "react";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CertificateTemplate } from "@/components/certificates/CertificateTemplate";
import { CertificateDraft, CertificateTemplateMeta } from "@/components/certificates/types";

interface CertificateEditorModalProps {
  open: boolean;
  template: CertificateTemplateMeta | null;
  draft: CertificateDraft;
  onOpenChange: (open: boolean) => void;
  onUpdateField: (field: keyof CertificateDraft, value: string) => void;
  onSave: () => void;
}

class PreviewErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidUpdate(prevProps: { children: ReactNode }) {
    if (prevProps.children !== this.props.children && this.state.hasError) {
      this.setState({ hasError: false });
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[420px] rounded-xl border border-slate-200 bg-white p-6 flex items-center justify-center text-sm text-slate-600">
          Preview temporarily unavailable. Please close and reopen this template.
        </div>
      );
    }

    return this.props.children;
  }
}

export function CertificateEditorModal({
  open,
  template,
  draft,
  onOpenChange,
  onUpdateField,
  onSave,
}: CertificateEditorModalProps) {
  const [mode, setMode] = useState<"preview" | "edit">("edit");

  const safeTemplate = template;
  const safeDraft: CertificateDraft = {
    recipientName: String(draft.recipientName ?? ""),
    certificateTitle: String(draft.certificateTitle ?? "Certificate"),
    description: String(draft.description ?? ""),
    issuerName: String(draft.issuerName ?? ""),
    authorityName: String(draft.authorityName ?? ""),
    issuedDate: String(draft.issuedDate ?? ""),
    logoName: String(draft.logoName ?? ""),
    logoPreviewUrl: draft.logoPreviewUrl ? String(draft.logoPreviewUrl) : "",
  };

  useEffect(() => {
    if (!open) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onOpenChange(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onOpenChange]);

  const onLogoUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const previewUrl = typeof reader.result === "string" ? reader.result : "";
      onUpdateField("logoPreviewUrl", previewUrl);
      onUpdateField("logoName", file.name);
    };
    reader.readAsDataURL(file);
  };

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6" role="dialog" aria-modal="true">
      <div className="fixed inset-0 z-40 bg-black/80" onClick={() => onOpenChange(false)} />

      <div className="relative z-50 w-full max-w-6xl max-h-[92vh] overflow-y-auto rounded-lg border bg-background shadow-lg">
        <div className="px-6 pt-6 pb-2 sm:px-7">
          <h2 className="font-semibold tracking-tight text-xl">Preview Certificate</h2>
          <p className="text-sm text-muted-foreground">
            Edit the allowed fields and review the live certificate preview before saving.
          </p>
        </div>

        <div className="px-6 sm:px-7 pb-2">
          <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1">
            <button
              type="button"
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${mode === "preview" ? "bg-white text-foreground" : "text-slate-600 hover:text-foreground"}`}
              onClick={() => setMode("preview")}
            >
              Preview Mode
            </button>
            <button
              type="button"
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${mode === "edit" ? "bg-white text-foreground" : "text-slate-600 hover:text-foreground"}`}
              onClick={() => setMode("edit")}
            >
              Edit Mode
            </button>
          </div>
          <p className="mt-2 text-xs text-slate-500">Content editable only — Design locked for brand consistency.</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-0 max-h-[calc(92vh-120px)] overflow-y-auto">
          <div className="flex-1 min-w-0 px-6 pb-6 pt-3 sm:px-7 lg:pr-4">
            <div className="rounded-xl border border-slate-200 bg-white shadow-xl p-5 overflow-auto max-h-[80vh]">
              <div className="mx-auto w-[900px] max-w-none origin-top scale-[0.5] sm:scale-[0.62] md:scale-[0.75] lg:scale-[0.88] xl:scale-100">
                <PreviewErrorBoundary>
                  {safeTemplate ? (
                    <CertificateTemplate
                      styleType={safeTemplate.styleType}
                      draft={safeDraft}
                      organizationName={safeTemplate.category === "Corporate" ? "CertifyPro Corporate" : "CertifyPro Institution"}
                      previewScale="md"
                      highlightEditableZones={mode === "edit"}
                      onInlineEdit={onUpdateField}
                    />
                  ) : (
                    <div className="min-h-[420px] rounded-xl border border-slate-200 bg-white p-6 flex items-center justify-center text-sm text-slate-600">
                      Loading preview...
                    </div>
                  )}
                </PreviewErrorBoundary>
              </div>
            </div>
          </div>

          {mode === "edit" && (
          <div className="px-6 pb-6 pt-3 sm:px-7 lg:pl-4 lg:border-l lg:border-slate-200 bg-white/80 lg:w-[320px] lg:min-w-[320px]">
            <div className="space-y-5">
              <div className="space-y-1">
                <h4 className="text-base font-semibold tracking-tight text-foreground">Editable Fields</h4>
                <p className="text-sm text-slate-600">Update content only. Layout, colors, and typography remain locked.</p>
              </div>

              {!safeTemplate && (
                <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
                  Template data unavailable. Please close and reopen preview.
                </p>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Recipient Name</label>
                  <Input
                    value={safeDraft.recipientName}
                    onChange={(event) => onUpdateField("recipientName", event.target.value)}
                    placeholder="Enter recipient name"
                    className="focus-visible:ring-accent/30"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Issuer Signature Name</label>
                  <Input
                    value={safeDraft.issuerName}
                    onChange={(event) => onUpdateField("issuerName", event.target.value)}
                    placeholder="Enter issuer name"
                    className="focus-visible:ring-accent/30"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Authority Signature Name</label>
                  <Input
                    value={safeDraft.authorityName}
                    onChange={(event) => onUpdateField("authorityName", event.target.value)}
                    placeholder="Enter authority name"
                    className="focus-visible:ring-accent/30"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Date / Day Issued</label>
                  <Input
                    value={safeDraft.issuedDate}
                    onChange={(event) => onUpdateField("issuedDate", event.target.value)}
                    placeholder="Enter issued date"
                    className="focus-visible:ring-accent/30"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Certificate Title</label>
                <Input
                  value={safeDraft.certificateTitle}
                  onChange={(event) => onUpdateField("certificateTitle", event.target.value)}
                  placeholder="Enter certificate title"
                  className="focus-visible:ring-accent/30"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Description</label>
                <Textarea
                  value={safeDraft.description}
                  onChange={(event) => onUpdateField("description", event.target.value)}
                  rows={4}
                  placeholder="Enter certificate description"
                  className="focus-visible:ring-accent/30"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Logo Upload</label>
                <div className="flex items-center gap-2">
                  <Input type="file" accept="image/*" className="h-10 focus-visible:ring-accent/30" onChange={onLogoUpload} />
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-slate-500">
                    <Upload className="h-4 w-4" />
                  </div>
                </div>
                {safeDraft.logoPreviewUrl && (
                  <div className="mt-2 inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-2 py-1">
                    <img src={safeDraft.logoPreviewUrl} alt="Logo preview" className="h-6 w-auto max-w-20 object-contain" />
                    <span className="text-xs text-slate-600 line-clamp-1">{safeDraft.logoName}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          )}
        </div>

        <div className="px-6 pb-6 pt-0 sm:px-7 flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button onClick={onSave}>Save Preview</Button>
        </div>
      </div>
    </div>
  );
}
