import { safeAuthRedirect } from "./redirect";

describe("safe auth redirects", () => {
  it("accepts local application paths", () => {
    expect(safeAuthRedirect("/matches?fit=straight")).toBe(
      "/matches?fit=straight",
    );
  });

  it("rejects external and protocol-relative redirects", () => {
    expect(safeAuthRedirect("https://example.com")).toBe("/account");
    expect(safeAuthRedirect("//example.com")).toBe("/account");
  });
});
