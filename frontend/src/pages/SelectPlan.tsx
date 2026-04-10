import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle, Zap, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { supabase } from "@/lib/supabaseClient";
import {
  selectFreePlan,
  createPaymentOrder,
  verifyPayment,
  openRazorpayCheckout,
} from "@/services/subscriptionService";

const SelectPlan = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState<"free" | "pro" | null>(null);
  const [error, setError] = useState("");

  const getUserEmail = async (): Promise<string> => {
    const session = await supabase?.auth.getSession();
    return session?.data?.session?.user?.email ?? "";
  };

  const handleFree = async () => {
    setLoading("free");
    setError("");
    try {
      await selectFreePlan();
      navigate("/dashboard");
    } catch (error) {
      console.error("Free plan selection failed:", error);
      setError("Unable to select free plan. Please try again.");
    } finally {
      setLoading(null);
    }
  };

  const handlePro = async () => {
    setLoading("pro");
    setError("");
    try {
      const orderData = await createPaymentOrder();
      const email = await getUserEmail();

      openRazorpayCheckout(
        orderData,
        email,
        async (paymentData) => {
          try {
            await verifyPayment(paymentData);
            navigate("/dashboard");
          } catch (error) {
            console.error("Payment verification failed:", error);
            setError("Payment completed but verification failed. Please contact support.");
            setLoading(null);
          }
        },
        (errMsg) => {
          console.error("Razorpay checkout error:", errMsg);
          setError(errMsg || "Payment process was cancelled.");
          setLoading(null);
        }
      );
    } catch (error) {
      console.error("Payment initiation failed:", error);
      setError("Could not initiate payment. Please try again.");
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6">
      <div className="w-full max-w-3xl space-y-8">
        <div className="text-center space-y-3">
          <h1 className="text-3xl font-bold font-heading text-foreground">Choose Your Plan</h1>
          <p className="text-muted-foreground text-lg">
            Start free or unlock unlimited certificate generation with Pro.
          </p>
        </div>

        {error && (
          <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-4 text-destructive text-sm text-center">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Free Plan */}
          <Card className="border-border hover:border-accent/50 transition-colors">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-5 h-5 text-muted-foreground" />
                <span className="text-lg font-semibold text-foreground">Free</span>
              </div>
              <p className="text-3xl font-bold text-foreground">₹0</p>
              <p className="text-sm text-muted-foreground">Forever free</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2 text-sm text-muted-foreground">
                {[
                  "12 certificate generations",
                  "All templates available",
                  "QR verification included",
                  "CSV import included",
                ].map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button
                className="w-full"
                variant="outline"
                onClick={handleFree}
                disabled={loading !== null}
              >
                {loading === "free" ? "Processing..." : "Start with Free"}
              </Button>
            </CardContent>
          </Card>

          {/* Pro Plan */}
          <Card className="border-accent/60 shadow-lg shadow-accent/10 relative overflow-hidden">
            <div className="absolute top-3 right-3 bg-accent text-accent-foreground text-xs font-semibold px-2 py-1 rounded-full">
              POPULAR
            </div>
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-5 h-5 text-accent" />
                <span className="text-lg font-semibold text-foreground">Pro</span>
              </div>
              <p className="text-3xl font-bold text-foreground">
                ₹499 <span className="text-base font-normal text-muted-foreground">/ month</span>
              </p>
              <p className="text-sm text-muted-foreground">Billed monthly</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2 text-sm text-muted-foreground">
                {[
                  "Unlimited certificate generations",
                  "All templates available",
                  "QR verification included",
                  "CSV import included",
                  "Priority support",
                ].map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-accent flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button
                className="w-full gold-gradient text-accent-foreground"
                onClick={handlePro}
                disabled={loading !== null}
              >
                {loading === "pro" ? "Opening Payment..." : "Upgrade to Pro — ₹499/mo"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SelectPlan;