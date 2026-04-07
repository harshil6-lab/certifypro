import { useState } from "react";
import { Mail, Send, Sparkles } from "lucide-react";
import { PublicNavbar } from "@/components/landing/PublicNavbar";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const API_BASE = "";
const supportDestination = {
  label: "ElevateX Support Desk",
  email: "certifyprocare@gmail.com",
};
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const Contact = () => {
  const { toast } = useToast();
  const [form, setForm] = useState({
    name: "",
    email: "",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const updateField = (field: "name" | "email" | "message", value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (submitError) {
      setSubmitError("");
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitError("");
    setSubmitted(false);

    const trimmedName = form.name.trim();
    const trimmedEmail = form.email.trim();
    const trimmedMessage = form.message.trim();

    if (!trimmedName || !trimmedEmail || !trimmedMessage) {
      setSubmitError("Name, email, and message are required.");
      return;
    }
    if (trimmedName.length < 2) {
      setSubmitError("Please enter a valid name with at least 2 characters.");
      return;
    }
    if (!EMAIL_REGEX.test(trimmedEmail)) {
      setSubmitError("Please enter a valid email address.");
      return;
    }
    if (trimmedMessage.length < 10) {
      setSubmitError("Please enter a message with at least 10 characters.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`${API_BASE}/api/contact`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: trimmedName,
          email: trimmedEmail,
          message: trimmedMessage,
        }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        const detail = payload?.detail;
        const validationMessage = Array.isArray(detail)
          ? detail
              .map((issue: { loc?: string[]; msg?: string }) => issue?.msg)
              .filter(Boolean)
              .join(" ")
          : undefined;
        throw new Error(validationMessage || detail || payload?.message || "Unable to send your message.");
      }

      setForm({ name: "", email: "", message: "" });
      setSubmitted(true);
      toast({
        title: "Message sent",
        description: `Delivered to ${supportDestination.label}.`,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to send your message.";
      setSubmitError(message);
      toast({
        title: "Message failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      <PublicNavbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-12 md:py-16 space-y-10">
        <section className="space-y-4 max-w-4xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-accent">
            <Sparkles className="w-3.5 h-3.5" /> ElevateX Concierge
          </div>
          <h1 className="text-4xl md:text-5xl font-heading font-bold text-foreground">Contact ElevateX Support</h1>
          <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
            Whether you have product questions, collaboration ideas, or verification-related queries, the ElevateX desk routes every message directly to the CertifyPro support inbox for follow-up.
          </p>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <Card className="rounded-2xl card-shadow border-border/60 bg-card/80 hover:card-shadow-lg transition-all duration-300">
            <CardContent className="p-6 space-y-4">
              <p className="text-lg font-semibold text-foreground">Email Contacts</p>
              <p className="text-sm text-muted-foreground">Primary destination for all contact requests:</p>
              <div className="flex flex-wrap gap-2.5 pt-1">
                <a
                  href={`mailto:${supportDestination.email}`}
                  className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background px-3 py-1.5 text-xs sm:text-sm text-foreground hover:border-accent/40 hover:bg-accent/5 transition-all duration-200 hover:shadow-sm"
                >
                  <Mail className="w-4 h-4 text-accent" />
                  {supportDestination.email}
                </a>
              </div>
              <div className="rounded-2xl border border-border/60 bg-muted/20 p-4">
                <p className="text-sm font-semibold text-foreground">{supportDestination.label}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Messages from this page are styled and delivered as ElevateX contact requests while routing to the CertifyPro care inbox.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl card-shadow border-border/60 bg-card/80 hover:card-shadow-lg transition-all duration-300">
            <CardContent className="p-6 space-y-4">
              <p className="text-lg font-semibold text-foreground">Send a Message</p>
              <form className="space-y-3" onSubmit={handleSubmit}>
                <Input
                  placeholder="Name"
                  value={form.name}
                  onChange={(event) => updateField("name", event.target.value)}
                  className="focus:ring-2 focus:ring-accent/20 transition-shadow"
                />
                <Input
                  placeholder="Email"
                  type="email"
                  value={form.email}
                  onChange={(event) => updateField("email", event.target.value)}
                  className="focus:ring-2 focus:ring-accent/20 transition-shadow"
                />
                <Textarea
                  placeholder="Message"
                  value={form.message}
                  onChange={(event) => updateField("message", event.target.value)}
                  className="min-h-32 focus:ring-2 focus:ring-accent/20 transition-shadow"
                />
                {submitError ? (
                  <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                    {submitError}
                  </div>
                ) : null}
                {submitted ? (
                  <div className="rounded-md border border-emerald-300 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
                    Your message has been delivered to {supportDestination.label}.
                  </div>
                ) : null}
                <Button
                  type="submit"
                  disabled={submitting}
                  className="w-full gold-gradient text-accent-foreground gap-2 hover:opacity-90 transition-opacity shadow-md"
                >
                  <Send className="w-4 h-4" /> {submitting ? "Sending..." : "Send Message"}
                </Button>
              </form>
              <p className="text-xs text-muted-foreground">Live backend delivery to {supportDestination.email}.</p>
            </CardContent>
          </Card>
        </section>
      </main>

      <LandingFooter />
    </div>
  );
};

export default Contact;
