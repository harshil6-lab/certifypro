import { BookOpen, FileText, Upload, Printer, Search, Shield } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { PageContainer, PageToolbar } from "@/components/layout/PageContainer";

const sections = [
  {
    icon: FileText,
    title: "Template Management",
    desc: "Upload certificate templates in PDF, PNG, or DOCX format. Use placeholders like {{STUDENT_NAME}}, {{COURSE}}, and {{DATE}} for dynamic fields. Recommended resolution is 300 DPI at A4 size.",
  },
  {
    icon: Upload,
    title: "Student Data Import",
    desc: "Prepare an Excel file with columns: Name, Email, Course, and Date. Upload via drag-and-drop. The system validates records and highlights errors and duplicates before import.",
  },
  {
    icon: Printer,
    title: "Certificate Generation",
    desc: "Follow the 4-step wizard: select template, choose student batch, configure QR code placement and size, then generate. You can preview a sample before batch processing.",
  },
  {
    icon: Search,
    title: "Verification Portal",
    desc: "Each certificate gets a unique ID and QR code linking to the public verification page. Anyone can verify by entering the ID or scanning the QR code.",
  },
  {
    icon: Shield,
    title: "Access Control",
    desc: "Invite administrators via email. Assign roles: Admin for standard access or Super Admin for full control including user management.",
  },
];

const Help = () => {
  return (
    <PageContainer className="space-y-6 animate-fade-in">
      <PageToolbar
        crumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "User manual" }]}
        title={
          <span className="flex items-center gap-3 font-heading">
            <BookOpen className="h-8 w-8 text-accent" aria-hidden="true" />
            User Manual
          </span>
        }
        description="Everything you need to know to manage certificates with CertifyPro."
      />

      <div className="space-y-4">
        {sections.map((section) => (
          <Card key={section.title}>
            <CardContent className="p-5">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center shrink-0 mt-0.5 transition-colors">
                  <section.icon className="w-5 h-5 text-accent" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="font-heading font-semibold text-foreground mb-1">{section.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{section.desc}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </PageContainer>
  );
};

export default Help;
