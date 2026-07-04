import { CartTotals } from "@rober/api-client";

export type DemoPaymentResult = {
  status: "succeeded" | "failed";
  paymentIntentId: string;
  message: string;
};

export async function presentDemoPaymentSheet(totals: CartTotals): Promise<DemoPaymentResult> {
  await new Promise((resolve) => setTimeout(resolve, 350));
  return {
    status: "succeeded",
    paymentIntentId: `pi_demo_${totals.totalCents}_${Date.now()}`,
    message: "Stripe test-mode fallback approved. Use card 4242 4242 4242 4242 when real test keys are configured."
  };
}
