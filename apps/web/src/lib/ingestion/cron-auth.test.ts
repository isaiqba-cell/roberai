import { isCronAuthorized } from "./cron-auth";

describe("ingestion cron authorization", () => {
  it("accepts only the exact bearer secret", () => {
    expect(isCronAuthorized("Bearer correct-secret", "correct-secret")).toBe(
      true,
    );
    expect(isCronAuthorized("Bearer wrong-secret", "correct-secret")).toBe(
      false,
    );
    expect(isCronAuthorized(null, "correct-secret")).toBe(false);
    expect(isCronAuthorized("Bearer correct-secret", undefined)).toBe(false);
  });
});
