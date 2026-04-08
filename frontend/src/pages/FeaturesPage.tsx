import { Layers, Sparkles, QrCode, Library, Building2, GraduationCap, Briefcase, User } from "lucide-react";
import { PublicNavbar } from "@/components/landing/PublicNavbar";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { Card, CardContent } from "@/components/ui/card";

const features = [
  {
    title: "Template Library",
    description: "Choose or customize templates for institutional and training certificates.",
    icon: Layers,
  },
  {
    title: "Bulk Generation",
    description: "Generate certificate batches for cohorts and programs in a guided workflow.",
    icon: Sparkles,
  },
  {
    title: "QR Verification",
    description: "Embed verification-friendly QR references for instant authenticity checks.",
    icon: QrCode,
  },
  {
    title: "Certificate Registry",
    description: "Maintain organized records for issued certificates and validation history.",
    icon: Library,
  },
];

const userStories = [
  {
    role: "Institution Admin",
    text: "I want to upload certificate templates so I can automate certificate issuance.",
    icon: Building2,
  },
  {
    role: "Training Company",
    text: "I want bulk certificate generation to save time.",
    icon: GraduationCap,
  },
  {
    role: "Employer",
    text: "I want to verify certificates instantly using QR codes.",
    icon: Briefcase,
  },
  {
    role: "Student",
    text: "I want easy access to my certificates online.",
    icon: User,
  },
];

const FeaturesPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      <PublicNavbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-12 md:py-16 space-y-12">
        <section className="space-y-4">
          <h1 className="text-4xl md:text-5xl font-heading font-bold text-foreground">Platform Features</h1>
          <p className="text-base md:text-lg text-muted-foreground max-w-3xl leading-relaxed">
            Built for production-ready certificate operations with modern SaaS UX and modular frontend architecture.
          </p>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {features.map((feature) => (
            <Card key={feature.title} className="rounded-2xl card-shadow border-border/60 transition-all duration-300 hover:-translate-y-1 hover:card-shadow-lg hover:border-accent/30">
              <CardContent className="p-5 space-y-3">
                <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center transition-colors hover:bg-accent/20">
                  <feature.icon className="w-5 h-5 text-accent" />
                </div>
                <p className="text-lg font-semibold text-foreground">{feature.title}</p>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </section>

        <section className="space-y-5">
          <h2 className="text-2xl md:text-3xl font-heading font-bold text-foreground">User Stories</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {userStories.map((story) => (
              <Card key={story.role} className="rounded-2xl card-shadow border-border/60 hover:card-shadow-lg hover:-translate-y-0.5 transition-all duration-300">
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-center gap-2">
                    <story.icon className="w-4 h-4 text-accent" />
                    <p className="font-semibold text-foreground">{story.role}</p>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    “{story.text}”
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </main>

      <LandingFooter />
    </div>
  );
};

export default FeaturesPage;
