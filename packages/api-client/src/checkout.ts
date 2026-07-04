export type CheckoutLineItem = {
  productId: string;
  variantId: string;
  unitPriceCents: number;
  quantity: number;
};

export type CartTotals = {
  subtotalCents: number;
  discountCents: number;
  shippingCents: number;
  feesCents: number;
  totalCents: number;
  currency: "USD";
};

export function calculateCartTotals(items: CheckoutLineItem[], promoCode?: string): CartTotals {
  const subtotalCents = items.reduce((total, item) => total + item.unitPriceCents * item.quantity, 0);
  const discountCents = promoCode?.toUpperCase() === "ROBERFIT" ? Math.round(subtotalCents * 0.1) : 0;
  const shippingCents = subtotalCents - discountCents >= 10000 || subtotalCents === 0 ? 0 : 795;
  const feesCents = 0;
  const totalCents = Math.max(0, subtotalCents - discountCents + shippingCents + feesCents);

  return {
    subtotalCents,
    discountCents,
    shippingCents,
    feesCents,
    totalCents,
    currency: "USD"
  };
}

export function formatCurrency(cents: number) {
  return new Intl.NumberFormat("en-US", { currency: "USD", style: "currency" }).format(cents / 100);
}
