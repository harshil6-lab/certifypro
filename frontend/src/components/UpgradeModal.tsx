import { useNavigate } from "react-router-dom";
import { Zap, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import {
  createPaymentOrder,
  verifyPayment,
  openRazorpayCheckout,
} from "@/services/subscriptionService";

interface UpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  creditsUsed?: number;
  creditsLimit?: number;
}

const UpgradeModal = ({ open, onOpenChange, creditsUsed = 12, creditsLimit = 12 }: UpgradeModalProps) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleUpgrade = async () => {
    setLoading(true);
    setError("");
    try {
      const orderData = await createPaymentOrder();
      const session = await supabase?.auth.getSession();
      const email = session?.data?.session?.user?.email ?? "";

      openRazorpayCheckout(
        orderData,
        email,
        async (paymentData) => {
          try {
            await verifyPayment(paymentData);
            onOpenChange(false);
            navigate(0); // reload to refresh subscription state
          } catch {
            setError("Payment verified but upgrade failed. Contact support.");
            setLoading(false);
          }
        },
        (errMsg) => {
          setError(errMsg);
          setLoading(false);
        }
      );
    } catch {
      setError("Could not initiate payment. Try again.");
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <Zap className="w-5 h-5 text-accent" />
            Credits Exhausted
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 text-sm text-muted-foreground">
          <p>
            You have used all <strong className="text-foreground">{creditsUsed}/{creditsLimit}</strong> free credits.
            Upgrade to Pro for unlimited certificate generation.
          </p>
          {error && (
            <p className="text-destructive text-xs">{error}</p>
          )}
          <div className="space-y-2">
            <Button
              className="w-full gold-gradient text-accent-foreground"
              onClick={handleUpgrade}
              disabled={loading}
            >
              {loading ? "Processing..." : "Upgrade to Pro — ₹499/mo"}
            </Button>
            <Button
              variant="ghost"
              className="w-full"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Maybe Later
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UpgradeModal;