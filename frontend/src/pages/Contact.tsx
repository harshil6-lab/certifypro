import { Mail, Send } from "lucide-react";
import { PublicNavbar } from "@/components/landing/PublicNavbar";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

const emails = [
  "24ce049@charusat.edu.in",
  "24ce066@charusat.edu.in",
  "24ce061@charusat.edu.in",
  "24ce069@charusat.edu.in",
];

const Contact = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      <PublicNavbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-12 md:py-16 space-y-10">
        <section className="space-y-4">
          <h1 className="text-4xl md:text-5xl font-heading font-bold text-foreground">Contact Us</h1>
          <p className="text-base md:text-lg text-muted-foreground max-w-3xl leading-relaxed">
            Reach out to Team ElevateX for product queries, collaboration, and platform feedback.
          </p>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <Card className="rounded-2xl card-shadow border-border/60">
            <CardContent className="p-6 space-y-4">
              <p className="text-lg font-semibold text-foreground">Email Contacts</p>
              <div className="space-y-3">
                {emails.map((email) => (
                  <a
                    key={email}
                    href={`mailto:${email}`}
                    className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground hover:border-accent/40 hover:bg-accent/5 transition-colors"
                  >
                    <Mail className="w-4 h-4 text-accent" />
                    {email}
                  </a>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl card-shadow border-border/60">
            <CardContent className="p-6 space-y-4">
              <p className="text-lg font-semibold text-foreground">Quick Message (UI only)</p>
              <div className="space-y-3">
                <Input placeholder="Your name" />
                <Input placeholder="Your email" type="email" />
                <Textarea placeholder="Your message" className="min-h-32" />
                <Button className="w-full gold-gradient text-accent-foreground gap-2">
                  <Send className="w-4 h-4" /> Send Message
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">Frontend preview only. No backend submission is connected.</p>
            </CardContent>
          </Card>
        </section>
      </main>

      <LandingFooter />
    </div>
  );
};

export default Contact;
