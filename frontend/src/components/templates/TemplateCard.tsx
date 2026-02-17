import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Heart, Eye, CheckCircle2 } from "lucide-react";
import type { TemplateItem } from "@/types/template";

interface TemplateCardProps {
  template: TemplateItem;
  selectedId?: string;
  onPreview: (template: TemplateItem) => void;
  onSelect: (template: TemplateItem) => void;
  onFavorite: (templateId: string) => void;
}

export function TemplateCard({ template, selectedId, onPreview, onSelect, onFavorite }: TemplateCardProps) {
  const isSelected = selectedId === template.id;

  return (
    <div className={`rounded-xl border p-4 space-y-4 transition-all ${isSelected ? "border-accent bg-accent/5" : "border-border bg-card hover:border-accent/40"}`}>
      <div className="aspect-[1.414/1] rounded-lg border border-dashed border-border bg-muted/40 p-4 flex items-center justify-center text-center relative overflow-hidden">
        <div className="absolute inset-0 seal-pattern" />
        <div className="relative z-10 space-y-2">
          <p className="text-sm font-semibold text-foreground">{template.title}</p>
          <p className="text-xs text-muted-foreground">{template.previewLabel} • {template.aspectRatio}</p>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-semibold text-foreground">{template.title}</p>
          <Badge variant="outline" className="text-[10px]">{template.category}</Badge>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">{template.description}</p>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" className="gap-1.5" onClick={() => onPreview(template)}>
          <Eye className="w-3.5 h-3.5" /> Preview
        </Button>
        <Button size="sm" className="gap-1.5" onClick={() => onSelect(template)}>
          <CheckCircle2 className="w-3.5 h-3.5" /> {isSelected ? "Selected" : "Select"}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="ml-auto"
          onClick={() => onFavorite(template.id)}
          aria-label="Toggle favorite"
        >
          <Heart className={`w-4 h-4 ${template.isFavorite ? "fill-accent text-accent" : "text-muted-foreground"}`} />
        </Button>
      </div>
    </div>
  );
}
