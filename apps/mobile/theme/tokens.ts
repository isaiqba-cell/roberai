import { roberTokens } from "@rober/ui";

export const lightTheme = {
  ...roberTokens.colors,
  surface: "#FFFFFF",
  surfaceWarm: roberTokens.colors.bgWarm,
  surfaceRaised: "#FFF9F5",
  text: roberTokens.colors.ink,
  textMuted: roberTokens.colors.inkMuted,
  tabBar: "rgba(16, 16, 19, 0.92)",
  tabText: "#FFFFFF"
} as const;

export const darkTheme = {
  ...roberTokens.colors,
  bgCanvas: "#101013",
  bgWarm: "#201A18",
  surface: "#151517",
  surfaceWarm: "#241A17",
  surfaceRaised: "#1E1E22",
  border: "#38312D",
  text: "#FAF7F3",
  textMuted: "#C9BFB7",
  tabBar: "rgba(250, 247, 243, 0.94)",
  tabText: "#101013"
} as const;

export type AppTheme = typeof lightTheme;

export const categoryGradients = {
  men: ["#B9C7D8", "#8FA6C2"],
  women: ["#E3C3CE", "#C99AAC"],
  kids: ["#E9D6AE", "#D8BC80"],
  access: ["#C3D3BC", "#A2BB97"]
} as const;
