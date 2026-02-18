import { ChangeEvent } from "react";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

export function CertificateEditorModal({
  open,
  template,
  draft,
  onOpenChange,
  onUpdateField,
  onSave,
}: CertificateEditorModalProps) {
  if (!template) {
    return null;
  }

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-2 sm:px-7">
          <DialogTitle className="font-semibold tracking-tight text-xl">Preview Certificate</DialogTitle>
          <DialogDescription>
            Edit the allowed fields and review the live certificate preview before saving.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr] gap-0">
          <div className="px-6 pb-6 pt-3 sm:px-7 lg:pr-4">
            <div className="rounded-xl border border-slate-200 bg-[#f8fafc] p-4 sm:p-5 shadow-sm animate-in fade-in duration-300">
            <CertificateTemplate
              styleType={template.styleType}
              draft={draft}
              organizationName={template.category === "Corporate" ? "CertifyPro Corporate" : "CertifyPro Institution"}
              previewScale="md"
              highlightEditableZones
            />
            </div>
          </div>

          <div className="px-6 pb-6 pt-3 sm:px-7 lg:pl-4 lg:border-l lg:border-slate-200 bg-white/80">
            <div className="space-y-5">
              <div className="space-y-1">
                <h4 className="text-base font-semibold tracking-tight text-foreground">Editable Fields</h4>
                <p className="text-sm text-slate-600">Update content only. Layout, colors, and typography remain locked.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Recipient Name</label>
                  <Input
                    value={draft.recipientName}
                    onChange={(event) => onUpdateField("recipientName", event.target.value)}
                    placeholder="Enter recipient name"
                    className="focus-visible:ring-accent/30"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Issuer Signature Name</label>
                  <Input
                    value={draft.issuerName}
                    onChange={(event) => onUpdateField("issuerName", event.target.value)}
                    placeholder="Enter issuer name"
                    className="focus-visible:ring-accent/30"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Certificate Title</label>
                <Input
                  value={draft.certificateTitle}
                  onChange={(event) => onUpdateField("certificateTitle", event.target.value)}
                  placeholder="Enter certificate title"
                  className="focus-visible:ring-accent/30"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Description</label>
                <Textarea
                  value={draft.description}
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
                {draft.logoPreviewUrl && (
                  <div className="mt-2 inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-2 py-1">
                    <img src={draft.logoPreviewUrl} alt="Logo preview" className="h-6 w-auto max-w-20 object-contain" />
                    <span className="text-xs text-slate-600 line-clamp-1">{draft.logoName}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="px-6 pb-6 pt-0 sm:px-7">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button onClick={onSave}>Save Preview</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
