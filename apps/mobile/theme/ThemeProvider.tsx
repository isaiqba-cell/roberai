import {
  createContext,
  PropsWithChildren,
  useContext,
  useMemo,
  useState,
} from "react";
import { ColorSchemeName, useColorScheme } from "react-native";

type ThemeMode = "system" | "light" | "dark";

type ThemeContextValue = {
  mode: ThemeMode;
  colorScheme: Exclude<ColorSchemeName, null | undefined>;
  setMode: (mode: ThemeMode) => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: PropsWithChildren) {
  const systemScheme = useColorScheme() ?? "light";
  const [mode, setMode] = useState<ThemeMode>("light");
  const colorScheme = mode === "system" ? systemScheme : mode;

  const value = useMemo(
    () => ({ mode, colorScheme, setMode }),
    [colorScheme, mode],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useThemePreference() {
  const value = useContext(ThemeContext);
  if (!value) {
    throw new Error("useThemePreference must be used inside ThemeProvider");
  }
  return value;
}
