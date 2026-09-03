import { GraduationCap, Building2, Briefcase, CalendarDays, ShieldCheck, BookOpen, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CertificatePreview } from "@/components/landing/CertificatePreview";
import type { CertificateStyleType } from "@/components/certificates/types";

// Real certificate styles surfaced as a library preview. These map to the same
// built-in styles available inside the product (see data/builtinTemplates.ts).
const showcase: Array<{
  title: string;
  category: string;
  styleType: CertificateStyleType;
  organizationName: string;
}> = [
  { title: "Academic Classic", category: "Academic", styleType: "academicFormal", organizationName: "CertifyPro Institution" },
  { title: "Corporate Minimal", category: "Corporate", styleType: "corporateMinimal", organizationName: "CertifyPro Corporate" },
  { title: "Event Elegant", category: "Event", styleType: "elegantClassic", organizationName: "CertifyPro Institution" },
];

const categories = [
  { label: "Academic", icon: GraduationCap },
  { label: "Corporate", icon: Building2 },
  { label: "Internship", icon: Briefcase },
  { label: "Event", icon: CalendarDays },
  { label: "Compliance", icon: ShieldCheck },
  { label: "Training", icon: BookOpen },
];

export function CertificateGallerySection() {
  return (
    <section className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl space-y-2">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
            See the certificates you&apos;ll issue
          </h2>
          <p className="leading-relaxed text-muted-foreground">
            Professionally designed templates for academic, corporate, and training programs — ready to
            customize and generate in bulk.
          </p>
        </div>
        <Link to="/login?reason=templates" className="shrink-0">
          <Button variant="outline" className="gap-2">
            Explore certificate templates <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>

      {/* Real certificate previews — genuine product output, not mockups */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {showcase.map((item) => (
          <Link
            key={item.title}
            to="/login?reason=templates"
            className="group overflow-hidden rounded-lg border border-border bg-card transition-colors hover:border-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <div className="border-b border-border">
              <CertificatePreview styleType={item.styleType} organizationName={item.organizationName} />
            </div>
            <div className="flex items-center justify-between gap-2 p-4">
              <span className="text-sm font-semibold text-foreground">{item.title}</span>
              <Badge variant="secondary">{item.category}</Badge>
            </div>
          </Link>
        ))}
      </div>

      {/* Every category is represented as a lighter secondary row */}
      <div className="flex flex-wrap gap-2.5">
        {categories.map((category) => (
          <Link
            key={category.label}
            to="/login?reason=templates"
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-1.5 text-sm text-muted-foreground transition-colors hover:border-accent/40 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <category.icon className="h-4 w-4 text-accent" />
            {category.label}
          </Link>
        ))}
      </div>
    </section>
  );
}
