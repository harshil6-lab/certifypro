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
        <section className="space-y-4 max-w-4xl">
          <h1 className="text-4xl md:text-5xl font-heading font-bold text-foreground">Contact Team ElevateX</h1>
          <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
            Whether you have product questions, collaboration ideas, or verification-related queries, our team is here to help. We aim to respond quickly and support institutions, organizations, and learners worldwide.
          </p>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <Card className="rounded-2xl card-shadow border-border/60 bg-card/80 hover:card-shadow-lg transition-all duration-300">
            <CardContent className="p-6 space-y-4">
              <p className="text-lg font-semibold text-foreground">Email Contacts</p>
              <p className="text-sm text-muted-foreground">Connect directly with our team via the following addresses:</p>
              <div className="flex flex-wrap gap-2.5 pt-1">
                {emails.map((email) => (
                  <a
                    key={email}
                    href={`mailto:${email}`}
                    className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background px-3 py-1.5 text-xs sm:text-sm text-foreground hover:border-accent/40 hover:bg-accent/5 transition-all duration-200 hover:shadow-sm"
                  >
                    <Mail className="w-4 h-4 text-accent" />
                    {email}
                  </a>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl card-shadow border-border/60 bg-card/80 hover:card-shadow-lg transition-all duration-300">
            <CardContent className="p-6 space-y-4">
              <p className="text-lg font-semibold text-foreground">Send a Message</p>
              <div className="space-y-3">
                <Input placeholder="Name" className="focus:ring-2 focus:ring-accent/20 transition-shadow" />
                <Input placeholder="Email" type="email" className="focus:ring-2 focus:ring-accent/20 transition-shadow" />
                <Textarea placeholder="Message" className="min-h-32 focus:ring-2 focus:ring-accent/20 transition-shadow" />
                <Button className="w-full gold-gradient text-accent-foreground gap-2 hover:opacity-90 transition-opacity shadow-md">
                  <Send className="w-4 h-4" /> Send Message
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">Frontend preview only — backend integration coming soon.</p>
            </CardContent>
          </Card>
        </section>
      </main>

      <LandingFooter />
    </div>
  );
};

export default Contact;
