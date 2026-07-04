import { calculateCartTotals } from "../src";

describe("checkout totals", () => {
  it("calculates subtotal and free shipping over threshold", () => {
    const totals = calculateCartTotals([{ productId: "p1", variantId: "v1", unitPriceCents: 12000, quantity: 1 }]);
    expect(totals.subtotalCents).toBe(12000);
    expect(totals.shippingCents).toBe(0);
    expect(totals.totalCents).toBe(12000);
  });

  it("applies demo promo and paid shipping below threshold", () => {
    const totals = calculateCartTotals(
      [{ productId: "p1", variantId: "v1", unitPriceCents: 5000, quantity: 2 }],
      "ROBERFIT"
    );
    expect(totals.discountCents).toBe(1000);
    expect(totals.shippingCents).toBe(795);
    expect(totals.totalCents).toBe(9795);
  });
});
