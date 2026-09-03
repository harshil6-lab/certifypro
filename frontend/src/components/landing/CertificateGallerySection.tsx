import { GraduationCap, Building2, Briefcase, CalendarDays, ShieldCheck, BookOpen, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

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
            Templates for every program
          </h2>
          <p className="leading-relaxed text-muted-foreground">
            Professional certificate templates for academic, corporate, and training programs.
          </p>
        </div>
        <Link to="/login?reason=templates" className="shrink-0">
          <Button variant="outline" className="gap-2">
            Browse templates <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {categories.map((category) => (
          <Link
            key={category.label}
            to="/login?reason=templates"
            className="group flex flex-col items-center gap-3 rounded-lg border border-border bg-card p-5 text-center transition-colors hover:border-accent/40 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-accent/10 text-accent">
              <category.icon className="h-5 w-5" />
            </div>
            <span className="text-sm font-medium text-foreground">{category.label}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
