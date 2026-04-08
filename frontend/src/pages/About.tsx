import { Target, Users, Lightbulb, Sparkles } from "lucide-react";
import { PublicNavbar } from "@/components/landing/PublicNavbar";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { Card, CardContent } from "@/components/ui/card";
import certifyProLogo from "@/assets/certifypro_logowithtext.png";

const teamMembers = [
  {
    name: "Harshil Kalsariya",
    description:
      "Product lead with strong backend and frontend understanding. Experienced with authentication flows, routing, FastAPI backend logic, and product strategy. Focused on turning ideas into scalable solutions.",
  },
  {
    name: "Shreya Loriya",
    description:
      "Communication and outreach specialist with Scrum leadership. Contributes to UI/UX design, documentation, and project coordination.",
  },
  {
    name: "Rena Naik",
    description:
      "Supports communication, UI/UX design thinking, and database fundamentals with strong collaborative skills.",
  },
  {
    name: "Ronit Padia",
    description:
      "Backend and database architecture contributor, focused on system logic and technical implementation.",
  },
];

const About = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      <PublicNavbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-12 md:py-16 space-y-12">
        <section className="space-y-5">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/70 px-3 py-1 text-xs text-muted-foreground">
            <Sparkles className="w-3.5 h-3.5 text-accent" />
            Product Story
          </div>

          <div className="space-y-4 max-w-4xl">
            <img src={certifyProLogo} alt="CertifyPro Logo" className="h-12 md:h-14 w-auto object-contain" />
            <h1 className="text-4xl md:text-5xl font-heading font-bold text-foreground leading-tight">About CertifyPro</h1>
            <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
              CertifyPro is a certificate automation and verification platform designed to help institutions issue secure digital certificates, manage credential registries, and enable instant public verification.
            </p>
            <p className="text-base text-muted-foreground leading-relaxed">
              We focus on trust, automation, and modern digital workflows so organizations can move from manual paperwork to reliable, scalable credential operations.
            </p>
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="rounded-2xl card-shadow border-border/60 hover:card-shadow-lg hover:-translate-y-1 transition-all duration-300">
            <CardContent className="p-5 space-y-3">
              <Target className="w-5 h-5 text-accent" />
              <p className="font-semibold text-foreground">Mission</p>
              <p className="text-sm text-muted-foreground">Build trustworthy, scalable certificate experiences for institutions and learners.</p>
            </CardContent>
          </Card>
          <Card className="rounded-2xl card-shadow border-border/60 hover:card-shadow-lg hover:-translate-y-1 transition-all duration-300">
            <CardContent className="p-5 space-y-3">
              <Users className="w-5 h-5 text-accent" />
              <p className="font-semibold text-foreground">Audience</p>
              <p className="text-sm text-muted-foreground">Universities, training companies, employers, and students needing reliable verification workflows.</p>
            </CardContent>
          </Card>
          <Card className="rounded-2xl card-shadow border-border/60 hover:card-shadow-lg hover:-translate-y-1 transition-all duration-300">
            <CardContent className="p-5 space-y-3">
              <Lightbulb className="w-5 h-5 text-accent" />
              <p className="font-semibold text-foreground">Approach</p>
              <p className="text-sm text-muted-foreground">Modern frontend architecture ready for future backend integration and enterprise scale.</p>
            </CardContent>
          </Card>
        </section>

        <section className="space-y-6 pt-2">
          <div className="space-y-3 max-w-4xl">
            <h2 className="text-2xl md:text-3xl font-heading font-bold text-foreground">
              Meet Team <span className="text-accent">ElevateX</span>
            </h2>
            <p className="text-base text-muted-foreground leading-relaxed">
              Team ElevateX is a multidisciplinary group combining product vision, design thinking, communication, and technical development to build CertifyPro as a reliable certificate automation platform.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            {teamMembers.map((member, index) => (
              <div key={member.name} className="space-y-2.5">
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-accent/12 text-xs font-semibold text-accent">
                    {index + 1}
                  </span>
                  <p className="text-lg font-semibold text-foreground">{member.name}</p>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed pl-8">
                  {member.description}
                </p>
              </div>
            ))}
          </div>

          <div className="rounded-xl bg-accent/8 border border-accent/20 px-4 py-3">
            <p className="text-sm text-foreground/90 leading-relaxed">
              While each member has primary strengths, the entire team collaborates across design, development, communication, and product strategy.
            </p>
          </div>
        </section>
      </main>

      <LandingFooter />
    </div>
  );
};

export default About;
