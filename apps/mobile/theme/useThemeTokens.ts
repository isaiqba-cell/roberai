import { useThemePreference } from "./ThemeProvider";
import { darkTheme, lightTheme } from "./tokens";

export function useThemeTokens() {
  const { colorScheme } = useThemePreference();
  return colorScheme === "dark" ? darkTheme : lightTheme;
}
