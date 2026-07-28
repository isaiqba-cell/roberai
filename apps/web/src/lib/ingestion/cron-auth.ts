import { timingSafeEqual } from "node:crypto";

export function isCronAuthorized(
  authorization: string | null,
  expectedSecret: string | undefined,
) {
  if (!expectedSecret || !authorization?.startsWith("Bearer ")) return false;
  const supplied = Buffer.from(authorization.slice("Bearer ".length), "utf8");
  const expected = Buffer.from(expectedSecret, "utf8");
  return (
    supplied.length === expected.length && timingSafeEqual(supplied, expected)
  );
}
