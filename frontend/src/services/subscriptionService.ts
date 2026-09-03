import { API_BASE } from "./apiService";
import { getAccessToken } from "@/utils/getAccessToken";

async function getAuthHeaders(): Promise<HeadersInit> {
  const token = await getAccessToken();

  if (!token) {
    throw new Error("User not authenticated");
  }

  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}


export interface SubscriptionInfo {
  plan: "free" | "pro";
  plan_selected: boolean;
  credits_used: number;
  credits_limit: number | null;
  credits_remaining: number | null;
}

export async function getMySubscription(): Promise<SubscriptionInfo> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE}/subscription/me`, { headers });
  if (!res.ok) throw new Error("Failed to fetch subscription");
  return res.json();
}

export async function selectFreePlan(): Promise<void> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE}/subscription/select-free`, {
    method: "POST",
    headers,
  });
  if (!res.ok) throw new Error("Failed to select free plan");
}

export async function createPaymentOrder(): Promise<{
  order_id: string;
  amount: number;
  currency: string;
  key_id: string;
}> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE}/subscription/create-order`, {
    method: "POST",
    headers,
  });
  if (!res.ok) throw new Error("Failed to create payment order");
  return res.json();
}

export async function verifyPayment(data: {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}): Promise<{ success: boolean; plan: string }> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE}/subscription/verify`, {
    method: "POST",
    headers,
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Payment verification failed");
  }
  return res.json();
}

export function openRazorpayCheckout(
  orderData: { order_id: string; amount: number; currency: string; key_id: string },
  userEmail: string,
  onSuccess: (data: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => void,
  onFailure: (error: string) => void
): void {
  const options = {
    key: orderData.key_id,
    amount: orderData.amount,
    currency: orderData.currency,
    name: "CertifyPro",
    description: "Pro Plan — Unlimited Certificate Generation",
    order_id: orderData.order_id,
    prefill: {
      email: userEmail,
    },
    theme: {
      color: "#1a365d",
    },
    handler: (response: {
      razorpay_order_id: string;
      razorpay_payment_id: string;
      razorpay_signature: string;
    }) => {
      onSuccess(response);
    },
    modal: {
      ondismiss: () => {
        onFailure("Payment cancelled by user.");
      },
    },
  };

  const rzp = new window.Razorpay(options);
  rzp.on("payment.failed", (response: { error: { description: string } }) => {
    onFailure(response.error?.description || "Payment failed.");
  });
  rzp.open();
}