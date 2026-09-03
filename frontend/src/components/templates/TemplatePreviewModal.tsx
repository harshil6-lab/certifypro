import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import type { TemplateItem } from "@/types/template";

interface TemplatePreviewModalProps {
  open: boolean;
  template: TemplateItem | null;
  onOpenChange: (open: boolean) => void;
}

export function TemplatePreviewModal({ open, template, onOpenChange }: TemplatePreviewModalProps) {
  if (!template) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {template.title}
            <Badge variant="outline">{template.category}</Badge>
          </DialogTitle>
          <DialogDescription>{template.description}</DialogDescription>
        </DialogHeader>

        <div className="rounded-lg border border-border p-4 space-y-4">
          <div className="aspect-[1.414/1] rounded-lg bg-muted/40 border border-dashed border-border relative overflow-hidden">
            <div className="absolute inset-0 p-8 flex flex-col justify-between">
              <div className="text-center space-y-2">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Certificate Preview</p>
                <h3 className="text-xl font-heading font-bold text-foreground">{template.title}</h3>
                <p className="text-sm text-muted-foreground">Presented to {"{{STUDENT_NAME}}"}</p>
              </div>
              <div className="flex items-end justify-between">
                <div className="text-xs text-muted-foreground">Date: {"{{DATE}}"}</div>
                <div className="w-16 h-16 rounded border-2 border-dashed border-accent/60 bg-accent/5" />
                <div className="text-xs text-muted-foreground">Issuer Signature</div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {template.placeholders.map((placeholder) => (
              <Badge key={placeholder} variant="secondary" className="text-[11px]">
                {`{{${placeholder}}}`}
              </Badge>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
