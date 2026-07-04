module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./features/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        canvas: "#FFFFFF",
        warm: "#FBEEE8",
        ink: "#101013",
        muted: "#6B6660",
        border: "#E7E1DA",
        accent: "#E1553A",
        "accent-press": "#C2432B",
        "fit-high": "#2F9E64",
        "fit-medium": "#E0A526",
        "fit-low": "#D94F4F"
      },
      borderRadius: {
        card: "12px",
        sheet: "24px",
        pill: "999px"
      }
    }
  }
};
