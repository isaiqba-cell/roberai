import { roberTokens } from "@rober/ui";

export const lightTheme = {
  ...roberTokens.colors,
  bgCanvas: "#FFFFFF",
  bgWarm: "#FBEEE8",
  ink: "#101013",
  inkMuted: "#6B6660",
  border: "#E7E1DA",
  accent: "#E1553A",
  accentPress: "#C2432B",
  surface: "#FFFFFF",
  surfaceWarm: "#FBEEE8",
  surfaceRaised: "#FFF9F5",
  text: "#101013",
  textMuted: "#6B6660",
  tabBar: "rgba(255, 255, 255, 0.94)",
  tabText: "#101013",
} as const;

export const darkTheme = {
  ...roberTokens.colors,
  bgCanvas: "#101827",
  bgWarm: "#163328",
  surface: "#151D2B",
  surfaceWarm: "#14263A",
  surfaceRaised: "#1D2B3D",
  border: "#31445E",
  accent: "#F1745F",
  accentPress: "#D85E48",
  text: "#FAF7F3",
  textMuted: "#B8C3D7",
  tabBar: "rgba(250, 247, 243, 0.94)",
  tabText: "#101013",
} as const;

export type AppTheme = typeof lightTheme;

export const categoryGradients = {
  men: ["#B9C7D8", "#8FA6C2"],
  women: ["#E3C3CE", "#C99AAC"],
  kids: ["#E9D6AE", "#D8BC80"],
  access: ["#C3D3BC", "#A2BB97"],
} as const;
