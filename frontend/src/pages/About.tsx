import { Target, Users, Lightbulb } from "lucide-react";
import { PublicNavbar } from "@/components/landing/PublicNavbar";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { Card, CardContent } from "@/components/ui/card";

const teamMembers = [
  {
    name: "Harshil Kalsariya",
    points: [
      "Product Manager",
      "Authentication & routing knowledge",
      "Light backend understanding",
      "Product strategy & technical vision",
    ],
  },
  {
    name: "Shreya Loriya",
    points: [
      "Communication outreach",
      "Scrum master",
      "UI/UX knowledge",
      "Documentation support",
    ],
  },
  {
    name: "Rena Naik",
    points: [
      "Communication outreach",
      "UI/UX design",
      "Basic database understanding",
    ],
  },
  {
    name: "Ronit Padia",
    points: [
      "Backend logic",
      "Database architecture",
    ],
  },
];

const About = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      <PublicNavbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-12 md:py-16 space-y-12">
        <section className="space-y-4">
          <h1 className="text-4xl md:text-5xl font-heading font-bold text-foreground">About CertifyPro</h1>
          <p className="text-base md:text-lg text-muted-foreground max-w-3xl leading-relaxed">
            CertifyPro is a certificate automation and verification platform helping institutions issue secure digital certificates, manage registry records, and enable instant verification.
          </p>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="rounded-2xl card-shadow border-border/60">
            <CardContent className="p-5 space-y-3">
              <Target className="w-5 h-5 text-accent" />
              <p className="font-semibold text-foreground">Mission</p>
              <p className="text-sm text-muted-foreground">Build trustworthy, scalable certificate experiences for institutions and learners.</p>
            </CardContent>
          </Card>
          <Card className="rounded-2xl card-shadow border-border/60">
            <CardContent className="p-5 space-y-3">
              <Users className="w-5 h-5 text-accent" />
              <p className="font-semibold text-foreground">Audience</p>
              <p className="text-sm text-muted-foreground">Universities, training companies, employers, and students needing reliable verification workflows.</p>
            </CardContent>
          </Card>
          <Card className="rounded-2xl card-shadow border-border/60">
            <CardContent className="p-5 space-y-3">
              <Lightbulb className="w-5 h-5 text-accent" />
              <p className="font-semibold text-foreground">Approach</p>
              <p className="text-sm text-muted-foreground">Modern frontend architecture ready for future backend integration and enterprise scale.</p>
            </CardContent>
          </Card>
        </section>

        <section className="space-y-5">
          <h2 className="text-2xl md:text-3xl font-heading font-bold text-foreground">Team ElevateX</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {teamMembers.map((member) => (
              <Card key={member.name} className="rounded-2xl card-shadow border-border/60">
                <CardContent className="p-5 space-y-3">
                  <p className="text-lg font-semibold text-foreground">{member.name}</p>
                  <ul className="space-y-1.5 text-sm text-muted-foreground list-disc list-inside">
                    {member.points.map((point) => (
                      <li key={point}>{point}</li>
                    ))}
                  </ul>
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

export default About;
