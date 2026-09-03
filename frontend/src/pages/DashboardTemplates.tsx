import { useEffect, useMemo, useState } from "react";
import { Eye, ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CertificateTemplate } from "@/components/certificates/CertificateTemplate";
import { CertificateTemplateMeta, GalleryCategory } from "@/components/certificates/types";
import { getTemplates } from "@/services/apiService";

const categories: Array<"All" | GalleryCategory> = [
  "All",
  "Academic",
  "Corporate",
  "Internship",
  "Event",
  "Compliance",
  "Training",
];

const DashboardTemplates = () => {
  const [templates, setTemplates] = useState<CertificateTemplateMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<"All" | GalleryCategory>("All");
  const [currentPage, setCurrentPage] = useState(1);
  const templatesPerPage = 12;

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await getTemplates({ official: true });
        if (!mounted) return;
        setTemplates(Array.isArray(result) ? result : []);
        console.log("Dashboard templates loaded:", Array.isArray(result) ? result.length : 0);
      } catch (err) {
        if (!mounted) return;
        setError(String(err));
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();

    return () => {
      mounted = false;
    };
  }, []);

  const filteredTemplates = useMemo(() => {
    if (activeCategory === "All") {
      return templates;
    }
    return templates.filter((template) => template.category === activeCategory);
  }, [activeCategory, templates]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeCategory]);

  const totalPages = Math.max(1, Math.ceil(filteredTemplates.length / templatesPerPage));
  const pageTemplates = filteredTemplates.slice((currentPage - 1) * templatesPerPage, currentPage * templatesPerPage);

  const groupedByCategory = useMemo(() => {
    return categories.reduce((map, category) => {
      if (category === "All") return map;
      map[category] = templates.filter((template) => template.category === category);
      return map;
    }, {} as Record<GalleryCategory, CertificateTemplateMeta[]>);
  }, [templates]);

  return (
    <div className="p-8 max-w-[1240px] mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold">Dashboard Template Gallery</h1>
          <p className="text-muted-foreground">Official templates available for generation and workflow preview.</p>
        </div>
        <Badge>Official Only</Badge>
      </div>

      <div className="flex flex-wrap gap-2">
        {categories.map((category) => (
          <Button
            key={category}
            size="sm"
            variant={activeCategory === category ? "default" : "outline"}
            onClick={() => setActiveCategory(category)}
          >
            {category}
          </Button>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Template Collection</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="h-64 flex items-center justify-center text-muted-foreground">Loading templates...</div>
          ) : error ? (
            <div className="h-64 flex items-center justify-center text-red-500">{error}</div>
          ) : (
            <>
              <p className="text-sm text-muted-foreground mb-3">
                Showing {pageTemplates.length} of {filteredTemplates.length} templates (total {templates.length})
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {pageTemplates.map((template) => (
                  <article key={template.id} className="rounded-xl border border-border p-3 bg-card">
                    <div className="aspect-[1.414/1] rounded-lg border border-border overflow-hidden mb-3">
                      <CertificateTemplate
                        styleType={template.styleType}
                        draft={{
                          recipientName: "Your Name",
                          certificateTitle: template.title,
                          description: "Awarded for achievement",
                          issuerName: "CertifyPro",
                          authorityName: "CertifyPro Authority",
                          issuedDate: new Date().toLocaleDateString(),
                          logoName: "",
                          logoPreviewUrl: "",
                        }}
                        organizationName={template.category === "Corporate" ? "CertifyPro Corporate" : "CertifyPro Institution"}
                        previewScale="sm"
                      />
                    </div>
                    <h3 className="text-sm font-semibold line-clamp-1">{template.title}</h3>
                    <p className="text-xs text-muted-foreground mt-1">{template.category}</p>
                  </article>
                ))}
              </div>

              <div className="flex items-center justify-between mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="w-4 h-4" /> Previous
                </Button>
                <span className="text-sm">Page {currentPage} of {totalPages}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <div className="rounded-xl border border-border p-4 bg-background">
        <h2 className="font-semibold mb-2">Category totals</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {Object.entries(groupedByCategory).map(([category, items]) => (
            <div key={category} className="rounded-lg border border-border p-2">
              <p className="text-xs text-muted-foreground">{category}</p>
              <p className="font-bold">{items.length} templates</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DashboardTemplates;
