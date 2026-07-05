export type PersonPresenceCheckResult = { passed: boolean; reason?: string };

// MVP-level automated check: this is intentionally not a full moderation
// pipeline, just a guard against blindly forwarding arbitrary uploads (a
// screenshot, a document scan, a corrupt file) to a generative model. It
// rejects images whose dimensions are missing or whose aspect ratio doesn't
// plausibly frame a person. Swap the body of this function for a real
// face/person-detection call (e.g. a lightweight on-device or hosted vision
// check) behind this same signature when one is available — every caller
// already treats this as async and failable.
export async function checkPersonPresence(asset: {
  width?: number;
  height?: number;
}): Promise<PersonPresenceCheckResult> {
  if (!asset.width || !asset.height) {
    return { passed: false, reason: "Could not read this image. Try a different photo." };
  }
  const aspectRatio = asset.width / asset.height;
  if (aspectRatio > 2.4 || aspectRatio < 0.3) {
    return {
      passed: false,
      reason:
        "This doesn't look like a photo of a person. Try a clear, full-length or upper-body photo of yourself.",
    };
  }
  return { passed: true };
}
